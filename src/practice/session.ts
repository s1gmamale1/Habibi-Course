import { TAJWEED_RULES } from "@/content/tajweed";

import { isResolved, isWeak, orderedAttempts, type ConceptState } from "./derive";
import {
  dueConcepts,
  gradeOf,
  newSchedule,
  reviewConcept,
  type ConceptSchedule,
  type ReviewOptions,
} from "./schedule";
import type { Attempt } from "./types";

/**
 * What the learner is asked to do next: the ledger replayed into schedules, and
 * a single session assembled out of what that leaves due.
 *
 * **Pure**, like `derive.ts` and `schedule.ts` and for the same reason: `now` is
 * an argument, there is no clock, no IO, and no import from `ledger.ts`. All
 * three have to run unchanged on a server when ADR-007 lands.
 *
 * The two jobs here are separate on purpose. `schedulesFromLedger` is the fold
 * nothing else could do — `derive()` produces `ConceptState`, `dueConcepts()`
 * wants `ConceptSchedule`, and the missing step between them needs the **concept
 * roster**, which is a content question rather than a scheduling one. That is
 * why it lives here and not in `schedule.ts`.
 */

/**
 * How a drill asks for the answer. This — not the rule being drilled — is what
 * the session ramps along.
 *
 * Recognising idghām in a highlighted span and building its condition sentence
 * are the same content at two very different costs, and a session that opened
 * with the second one would be asking for production before recall. Ordering by
 * *content* difficulty instead would put "hard rule, easy question" before "easy
 * rule, hard question", which is the wrong axis.
 */
export type ResponseMode = "recognition" | "discrimination" | "production";

/** Ramp order. The index is the rank, so the list is the ordering. */
const MODE_ORDER: readonly ResponseMode[] = ["recognition", "discrimination", "production"];

const rank = (mode: ResponseMode) => MODE_ORDER.indexOf(mode);

/**
 * The session budget, in slots rather than items.
 *
 * A ḥarakāt hold takes far longer than a multiple choice — the learner has to
 * calibrate against three reference holds before the drill can measure anything
 * — so counting items would make one session twice the length of another with
 * the same count. Fourteen slots is roughly a 10-15 minute sitting.
 */
export const SESSION_SLOTS = 14;

/**
 * The drills that grade a *held duration*, and the only ones that cost two slots.
 *
 * `MaddCounter` is deliberately not here. It looks like its neighbour, but its
 * `held` is a prop, nothing is timed, and there is no calibration step — it asks
 * the learner to *name* a length, which takes about as long as any other
 * selection. Calling it timed would cost a slot the learner never spends.
 */
export const TIMED_GAME_IDS: ReadonlySet<string> = new Set(["ghunnah-timer"]);

/**
 * Which response mode each shipped drill asks for.
 *
 * A gameId belongs to exactly one mode, which is what lets the ramp be enforced
 * by sorting: modes never interleave within a drill.
 *
 * The six letter drills in `GamePanel` are absent because they are rendered from
 * a literal list of tabs and carry no id at all — nothing can key a shape off a
 * name that does not exist. Until they are registered they fall to the default
 * below, which is the honest reading of an unknown drill: one slot, and asked
 * early. Task 7 should register them and add them here.
 */
const DRILL_MODES: Readonly<Record<string, ResponseMode>> = {
  "rule-identifier": "recognition",
  "listen-identify": "recognition",
  "span-tapper": "discrimination",
  "family-sorter": "discrimination",
  "madd-counter": "production",
  "condition-builder": "production",
  "ghunnah-timer": "production",
};

export type DrillShape = {
  mode: ResponseMode;
  /** What the drill costs against `SESSION_SLOTS`. */
  slots: number;
};

/** An unknown drill is assumed to be the cheapest thing it could be — see `DRILL_MODES`. */
export function shapeOf(gameId: string): DrillShape {
  return {
    mode: DRILL_MODES[gameId] ?? "recognition",
    slots: TIMED_GAME_IDS.has(gameId) ? 2 : 1,
  };
}

/**
 * One exemplar the session could draw.
 *
 * The scheduling key is `conceptId`; `itemKey` is a *sample* of it (ADR-008). A
 * learner does not need to remember that `مِنْ رَبِّهِمْ` is idghām — they need
 * to recognise idghām anywhere — so the same concept is drilled through a
 * different exemplar each time it comes up.
 */
export type PoolItem = {
  conceptId: string;
  itemKey: string;
  gameId: string;
};

export type PlannedItem = PoolItem & {
  mode: ResponseMode;
  slots: number;
  /**
   * A review of a concept other than the focus. Recorded rather than inferred
   * because interleaved items double as the retention instrument: they are the
   * only measurement of whether a concept survived being left alone, so Task 6
   * has to write this onto the attempt.
   */
  isInterleaved: boolean;
};

export type SessionPlan = {
  /** The most overdue concept the pool can actually draw for, or `null` for nothing to do. */
  focusConceptId: string | null;
  items: PlannedItem[];
  /** Total cost of `items`. At most `SESSION_SLOTS`. */
  slots: number;
};

export type PlanOptions = {
  /**
   * Which exemplar to draw when a concept has several for the same drill.
   *
   * Seeded and passed in, never `Math.random()`. The plan is not stored — it is
   * rebuilt from the ledger on every load — so an unseeded draw would reshuffle
   * the session under a learner who merely refreshed the page, and would make
   * every assertion in the test file a coin toss. Absent means "the first
   * exemplar", which is as deterministic as it gets.
   */
  seed?: number;
};

/** Nothing due, or nothing drawable. A fresh object each time: the caller owns what it is handed. */
const emptyPlan = (): SessionPlan => ({ focusConceptId: null, items: [], slots: 0 });

/** No interleaved item in the first two or the last two positions. */
const EDGE = 2;

/** Consecutive items of one drill shape. Three in a row stops being practice and starts being a form. */
const MAX_RUN = 2;

/** ~25% of the session, drawn from this many other due concepts. */
const INTERLEAVE_TARGET = 3;

/**
 * Two held drills is 4 of 14 slots; a third would make the session a ghunnah drill.
 *
 * **Today this guard changes nothing, and that is worth saying rather than
 * hiding.** `ghunnah-timer` is the only held drill, so every timed item shares
 * one `gameId` and `MAX_RUN` already caps it at two — mutating this to 9 leaves
 * every plan byte-identical, which is why no test can see it. It stops being
 * redundant the moment a second held drill registers, at which point two
 * different timed shapes could take four slots each without ever repeating.
 */
const MAX_TIMED = 2;

/**
 * Every concept the engine schedules: the 18 tajweed rules, plus every concept
 * the pool carries an exemplar for.
 *
 * The two halves are reached differently because they *are* different. The rules
 * are a closed syllabus — `TAJWEED_RULES` is the authority and it is a plain
 * constant, so they are here whether or not anything has been authored for them
 * yet. The 29 letters are content: they exist only as `kind: "letter"` slides in
 * `content/lessons/*.json`, which is read through `node:fs` and therefore
 * unreachable from a module that has to run in a browser. So they arrive with
 * the pool, which the caller builds from that content. `session.test.ts` builds
 * one from the real lesson files and pins the total at 47.
 *
 * Seeding all of them is the point. `dueConcepts` can only return a concept that
 * *has* a schedule, so a learner with an empty ledger would otherwise be offered
 * an empty queue and nothing at all to practise.
 */
export function conceptRoster(pool: readonly PoolItem[]): string[] {
  return [...new Set<string>([...TAJWEED_RULES, ...pool.map((i) => i.conceptId)])].sort();
}

/**
 * The ledger replayed into one FSRS schedule per concept, as of `now`.
 *
 * Every concept in `roster` is seeded with `newSchedule` first — a fresh
 * schedule is due the moment it exists — and the graded attempts are then folded
 * over the top. Nothing is stored: a change to the grading or to the difficulty
 * prior takes effect on the whole history rather than only on what happens next.
 *
 * An **ungraded attempt is skipped**, never coerced to `Again`. `gradeOf`
 * returns `null` for it, and folding that as a failure would pull a concept
 * forward on the strength of a miss the learner never had. `derive()` refuses to
 * make the same claim.
 *
 * A concept that appears in the ledger but not in the roster is still scheduled.
 * A rule retired from the syllabus was still answered, and dropping the row
 * would quietly lose history the ledger exists to keep.
 */
export function schedulesFromLedger(
  attempts: readonly Attempt[],
  roster: readonly string[],
  now: number,
  opts: ReviewOptions = {},
): Map<string, ConceptSchedule> {
  const schedules = new Map<string, ConceptSchedule>();
  for (const conceptId of roster) schedules.set(conceptId, newSchedule(conceptId, now));

  // `orderedAttempts` rather than a second sort: it carries the `at`-then-`id`
  // tiebreak that keeps two rows written in the same millisecond from folding
  // differently on consecutive page loads, and the `at <= now` cut that makes
  // `now` mean "the schedule as it stood then".
  for (const a of orderedAttempts(attempts, now)) {
    const grade = gradeOf(a);
    if (grade === null) continue;
    const current = schedules.get(a.conceptId) ?? newSchedule(a.conceptId, now);
    schedules.set(a.conceptId, reviewConcept(current, grade, a.at, opts));
  }

  return schedules;
}

/** Deterministic, seeded, and small. The plan must be reproducible from its inputs alone. */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Due concepts, most overdue first, with weakness breaking a tie.
 *
 * `dueConcepts` already orders by due date and then by id. The id is a fine
 * tiebreak for reproducibility and a poor one for teaching, and on day one it
 * decides everything: every concept was seeded at the same millisecond, so all
 * 47 are tied. A concept `derive()` still calls weak is the better answer, and a
 * resolved one — three clean reps in a row — is the worse.
 *
 * A concept with no state has none because it has no *graded* attempt; it sits
 * between the two, which is exactly what "nothing is known yet" should rank as.
 */
function orderDue(
  schedules: ReadonlyMap<string, ConceptSchedule>,
  states: ReadonlyMap<string, ConceptState>,
  now: number,
): string[] {
  const urgency = (conceptId: string): number => {
    const s = states.get(conceptId);
    if (!s) return 1;
    if (isWeak(s)) return 0;
    return isResolved(s) ? 2 : 1;
  };
  const dueAt = (conceptId: string) => schedules.get(conceptId)?.due.getTime() ?? 0;

  return dueConcepts(schedules, now).sort(
    (x, y) =>
      dueAt(x) - dueAt(y) || urgency(x) - urgency(y) || (x < y ? -1 : x > y ? 1 : 0),
  );
}

/**
 * Assemble one session: ~70% the focus concept, ~25% interleaved review of two
 * or three others, and one deliberately harder item last.
 *
 * The shape of the result is as load-bearing as its contents:
 *
 * - **Slots, not items.** See `SESSION_SLOTS`.
 * - **Interleaved items never sit in the first two or last two positions** —
 *   Duolingo's documented Review Exercise placement rule. The opening should be
 *   what the learner came for and the close should be the concept they are being
 *   pushed on, not a visitor from another rule.
 * - **Never more than two consecutive items of one drill shape**, so a session
 *   does not turn into a form to be filled in.
 * - **The response mode ramps**, never the reverse. See `ResponseMode`.
 */
export function planSession(
  schedules: ReadonlyMap<string, ConceptSchedule>,
  states: ReadonlyMap<string, ConceptState>,
  pool: readonly PoolItem[],
  now: number,
  opts: PlanOptions = {},
): SessionPlan {
  const byConcept = new Map<string, PoolItem[]>();
  for (const item of pool) {
    const list = byConcept.get(item.conceptId);
    if (list) list.push(item);
    else byConcept.set(item.conceptId, [item]);
  }
  // So the plan depends on the pool's *contents* and not on the order the caller
  // happened to assemble it in.
  for (const list of byConcept.values()) {
    list.sort((a, b) => (a.itemKey < b.itemKey ? -1 : a.itemKey > b.itemKey ? 1 : 0));
  }

  // A due concept with no exemplar is a due concept the learner cannot be shown
  // anything for, so it is not a session.
  const due = orderDue(schedules, states, now).filter((id) => byConcept.has(id));
  const focusConceptId = due[0];
  if (focusConceptId === undefined) return emptyPlan();

  const rand = opts.seed === undefined ? () => 0 : mulberry32(opts.seed);
  const used = new Set<string>();
  const drawnByGame = new Map<string, number>();
  let timedDrawn = 0;

  /** Turn a pool item into a planned one, and record what that spends. */
  function commit(item: PoolItem, isInterleaved: boolean): PlannedItem {
    const shape = shapeOf(item.gameId);
    used.add(item.itemKey);
    drawnByGame.set(item.gameId, (drawnByGame.get(item.gameId) ?? 0) + 1);
    if (TIMED_GAME_IDS.has(item.gameId)) timedDrawn += 1;
    return { ...item, mode: shape.mode, slots: shape.slots, isInterleaved };
  }

  function options(conceptId: string, maxSlots: number, mode?: ResponseMode): PoolItem[] {
    return (byConcept.get(conceptId) ?? []).filter((item) => {
      if (used.has(item.itemKey)) return false;
      const shape = shapeOf(item.gameId);
      if (mode !== undefined && shape.mode !== mode) return false;
      if (shape.slots > maxSlots) return false;
      return !(TIMED_GAME_IDS.has(item.gameId) && timedDrawn >= MAX_TIMED);
    });
  }

  /**
   * Draw one exemplar, spreading across the drills a concept has rather than
   * doing the same one eight times. The *shape* is chosen by what has been used
   * least so far; only the exemplar within it is left to the seed.
   */
  function draw(candidates: PoolItem[], isInterleaved: boolean): PlannedItem | null {
    if (candidates.length === 0) return null;
    const games = [...new Set(candidates.map((c) => c.gameId))].sort();
    const gameId = games.reduce((a, b) =>
      (drawnByGame.get(a) ?? 0) <= (drawnByGame.get(b) ?? 0) ? a : b,
    );
    const sameShape = candidates.filter((c) => c.gameId === gameId);
    return commit(sameShape[Math.floor(rand() * sameShape.length)], isInterleaved);
  }

  // ---- the closing item -----------------------------------------------------
  // "Deliberately harder" means the furthest along the response ramp the focus
  // concept can offer, and the held drill ahead of a selection at the same mode.
  // It is drawn first so the rest of the session is built to leave room for it.
  const closingPool = options(focusConceptId, SESSION_SLOTS);
  const hardest = closingPool.reduce<PoolItem | null>((best, item) => {
    if (!best) return item;
    const a = shapeOf(item.gameId);
    const b = shapeOf(best.gameId);
    if (rank(a.mode) !== rank(b.mode)) return rank(a.mode) > rank(b.mode) ? item : best;
    return a.slots > b.slots ? item : best;
  }, null);
  const closing = hardest
    ? draw(
        closingPool.filter(
          (i) =>
            shapeOf(i.gameId).mode === shapeOf(hardest.gameId).mode &&
            shapeOf(i.gameId).slots === shapeOf(hardest.gameId).slots,
        ),
        false,
      )
    : null;
  if (!closing) return emptyPlan();

  // ---- the focus backbone ---------------------------------------------------
  const interleaveIds = pickInterleaveConcepts(due, states);
  const reserve = Math.min(INTERLEAVE_TARGET, interleaveIds.length);

  const focusItems: PlannedItem[] = [];
  let slots = closing.slots;
  const fillFocus = (ceiling: number) => {
    for (let progressed = true; progressed && slots < ceiling; ) {
      progressed = false;
      for (const mode of MODE_ORDER) {
        if (slots >= ceiling) break;
        const item = draw(options(focusConceptId, ceiling - slots, mode), false);
        if (!item) continue;
        focusItems.push(item);
        slots += item.slots;
        progressed = true;
      }
    }
  };
  // One item per mode per pass, so the session spreads along the ramp instead of
  // exhausting recognition and then being all production.
  fillFocus(SESSION_SLOTS - reserve);

  // ---- the interleaved review ----------------------------------------------
  const interleaveMode = chooseInterleaveMode(
    [...focusItems, closing],
    Math.min(reserve, SESSION_SLOTS - slots),
  );
  const interleaved: PlannedItem[] = [];
  for (const conceptId of interleaveIds) {
    if (interleaved.length >= reserve || slots >= SESSION_SLOTS) break;
    // A review of another concept never costs two slots: it is a probe, not the
    // thing being practised.
    const item =
      draw(options(conceptId, 1, interleaveMode), true) ?? draw(options(conceptId, 1), true);
    if (!item) continue;
    interleaved.push(item);
    slots += item.slots;
  }

  // Whatever the interleave reserve did not spend goes back to the focus rather
  // than being left on the table.
  fillFocus(SESSION_SLOTS);

  // The closing item is pinned last rather than arranged, so it is the one place
  // a run can appear after `arrange` has done its work: a concept with a single
  // drill at the top of its ramp ends "…, X, X, X". Dropping back into the
  // arranged items is the same trade `arrange` makes — a shorter session, not a
  // monotonous one.
  const ordered = arrange(focusItems);
  while (ordered.length > 0 && hasRun([...ordered, closing])) ordered.pop();
  const backbone = [...ordered, closing];
  const items = place(backbone, interleaved);
  return { focusConceptId, items, slots: items.reduce((n, i) => n + i.slots, 0) };
}

/**
 * Two or three other due concepts, preferring ones the learner has actually
 * answered before.
 *
 * Interleaving a concept that has never been seen is not a review of anything —
 * it is a first encounter, dropped into the middle of someone else's session.
 * Unseen concepts are still used as a fallback, because on day one there is
 * nothing else and an empty middle would be worse.
 */
function pickInterleaveConcepts(
  due: readonly string[],
  states: ReadonlyMap<string, ConceptState>,
): string[] {
  const others = due.slice(1);
  const seen = others.filter((id) => (states.get(id)?.attempts ?? 0) > 0);
  const unseen = others.filter((id) => (states.get(id)?.attempts ?? 0) === 0);
  return [...seen, ...unseen].slice(0, INTERLEAVE_TARGET);
}

/**
 * Which response mode the interleaved items should be drawn at.
 *
 * They have to land inside their own mode's stretch of the session — the ramp is
 * enforced by ordering, so an item cannot sit outside its block — *and* inside
 * the window that keeps them away from both ends. The mode with the most
 * positions satisfying both is the one with room; a tie goes to the earlier
 * mode, because a review belongs in the body of a session rather than among the
 * hardest things in it.
 */
function chooseInterleaveMode(backbone: readonly PlannedItem[], count: number): ResponseMode {
  const total = backbone.length + count;
  let best: ResponseMode = MODE_ORDER[0];
  let bestRoom = -1;
  for (const mode of MODE_ORDER) {
    const lo = backbone.filter((i) => rank(i.mode) < rank(mode)).length;
    const hi = backbone.filter((i) => rank(i.mode) <= rank(mode)).length;
    // `- 1` on the upper bound: the closing item stays last, so nothing may be
    // inserted after it.
    const room =
      Math.min(hi, backbone.length - 1, total - EDGE - 1) - Math.max(lo, EDGE) + 1;
    if (room > bestRoom) {
      best = mode;
      bestRoom = room;
    }
  }
  return best;
}

/**
 * Order one concept's items so no drill shape runs more than twice, keeping the
 * mode ramp intact.
 *
 * Greedy, and greedy is enough: at each position take the shape with the most
 * items still waiting that is not already the last two. An item that cannot be
 * placed without making a run of three is **dropped** rather than placed anyway.
 * That is the one case where the session comes up short of 14 slots, and it only
 * happens when a concept has three or more exemplars of a single drill and
 * nothing else at that mode — a thin pool, which should read as a short session
 * rather than a monotonous one.
 */
function arrange(items: readonly PlannedItem[]): PlannedItem[] {
  const out: PlannedItem[] = [];
  for (const mode of MODE_ORDER) {
    let remaining = items.filter((i) => i.mode === mode);
    while (remaining.length > 0) {
      const tail = out.slice(-MAX_RUN);
      const blocked =
        tail.length === MAX_RUN && new Set(tail.map((i) => i.gameId)).size === 1
          ? tail[0].gameId
          : null;
      const allowed = remaining.filter((i) => i.gameId !== blocked);
      if (allowed.length === 0) break; // only the blocked shape is left: stop, do not repeat it
      const counts = new Map<string, number>();
      for (const i of allowed) counts.set(i.gameId, (counts.get(i.gameId) ?? 0) + 1);
      const next = allowed.reduce((a, b) =>
        (counts.get(a.gameId) ?? 0) >= (counts.get(b.gameId) ?? 0) ? a : b,
      );
      out.push(next);
      remaining = remaining.filter((i) => i !== next);
    }
  }
  return out;
}

/** Three of one shape in a row, anywhere in the sequence. */
function hasRun(items: readonly PlannedItem[]): boolean {
  for (let i = MAX_RUN; i < items.length; i += 1) {
    const window = items.slice(i - MAX_RUN, i + 1);
    if (new Set(window.map((it) => it.gameId)).size === 1) return true;
  }
  return false;
}

/**
 * Insert the interleaved items into the backbone.
 *
 * Each has to land inside its own mode's block — otherwise the ramp breaks — and
 * inside `[EDGE, length - EDGE - 1]`. Insertions run left to right, so an item's
 * index is final the moment it is placed and can be checked against the final
 * length directly.
 *
 * If an item cannot be placed, the *last* one is dropped and the whole placement
 * is retried at the shorter length. Dropping is right: a review with nowhere
 * legal to sit is a review in the wrong place, and the constraint it would break
 * is the reason it exists.
 */
function place(backbone: PlannedItem[], interleaved: readonly PlannedItem[]): PlannedItem[] {
  for (let count = interleaved.length; count > 0; count -= 1) {
    const attempt = tryPlace(backbone, interleaved.slice(0, count));
    if (attempt) return attempt;
  }
  return backbone;
}

function tryPlace(
  backbone: readonly PlannedItem[],
  interleaved: readonly PlannedItem[],
): PlannedItem[] | null {
  const total = backbone.length + interleaved.length;
  const out = [...backbone];
  let cursor = EDGE - 1;

  for (const item of interleaved) {
    const lo = out.filter((i) => rank(i.mode) < rank(item.mode)).length;
    const hi = out.filter((i) => rank(i.mode) <= rank(item.mode)).length;
    // Never after the closing item, and never in the last two positions.
    const first = Math.max(lo, EDGE, cursor + 1);
    const last = Math.min(hi, out.length - 1, total - EDGE - 1);

    // A gap ahead of the previous review first, so three of them do not land in
    // a row and read as a detour out of the session. Falling back to the
    // adjacent index matters for a narrow block, where a gap is not on offer and
    // a review placed late is still better than a review dropped.
    let placed = -1;
    for (const from of [Math.max(first, cursor + 2), first]) {
      for (let i = from; i <= last && placed === -1; i += 1) {
        const trial = [...out.slice(0, i), item, ...out.slice(i)];
        if (hasRun(trial.slice(Math.max(0, i - MAX_RUN), i + MAX_RUN + 1))) continue;
        out.splice(i, 0, item);
        placed = i;
      }
      if (placed !== -1) break;
    }
    if (placed === -1) return null;
    cursor = placed;
  }

  return hasRun(out) ? null : out;
}
