import { TAJWEED_RULES } from "@/content/tajweed";
import { allGames, getGame } from "@/games2/registry";
import { MODE_RANK, type Question, type ResponseMode } from "@/games2/types";

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
 * three have to run unchanged on a server when ADR-007 lands. `getGame` is a
 * lookup against a registry populated by module-scope side effects elsewhere
 * (`games2/games/index.ts`), not by this file, so importing it costs this
 * module nothing it did not already have.
 *
 * The two jobs here are separate on purpose. `schedulesFromLedger` is the fold
 * nothing else could do — `derive()` produces `ConceptState`, `dueConcepts()`
 * wants `ConceptSchedule`, and the missing step between them needs the **concept
 * roster**, which is a content question rather than a scheduling one. That is
 * why it lives here and not in `schedule.ts`.
 */

/**
 * Ramp order, derived from `MODE_RANK` rather than restated: the index a mode
 * sorts to *is* its rank, so keeping a second literal in sync by hand is a
 * drift waiting to happen the day a fourth mode is added.
 */
const MODE_ORDER: readonly ResponseMode[] = (Object.keys(MODE_RANK) as ResponseMode[]).sort(
  (a, b) => MODE_RANK[a] - MODE_RANK[b],
);

const rank = (mode: ResponseMode) => MODE_RANK[mode];

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
 * What a registered drill costs to plan: its response mode and its slot cost.
 *
 * `mode`, `cost` and `graded` used to live in three module-scope tables here —
 * `DRILL_MODES`, an implicit "everything costs one slot but `TIMED_GAME_IDS`",
 * and `UNGRADED_GAME_IDS`. All three were a second, hand-maintained opinion
 * about facts every `GameSpec` already declares about itself, and the letter
 * drills are the proof of what that costs: while they carried no id in
 * `DRILL_MODES` at all, an unclassified id fell to `recognition`/one slot by
 * default, so **29 of the 47 concepts** — 62% of the roster — planned as
 * fourteen recognition items with no ramp in them. A table can go stale in a
 * way a lookup against the registry cannot.
 *
 * `null` covers two cases on purpose, and both mean the same thing to a plan: a
 * question whose game is not registered cannot render, and a question whose
 * game is registered but `graded: false` — the two flashcard decks — has no
 * verdict to report. Either way it is not a question a session may draw:
 * `SessionRunner`'s continue button is gated on `runner.verdict !== undefined`,
 * so planning an ungraded question would stall the learner on one there is no
 * way to answer, with only the ✕ available.
 */
export type DrillShape = {
  mode: ResponseMode;
  /** What the question costs against `SESSION_SLOTS`. */
  slots: number;
};

export function shapeOfQuestion(q: Question): DrillShape | null {
  const spec = getGame(q.gameId);
  if (!spec || !spec.graded) return null;
  return { mode: spec.mode, slots: spec.cost };
}

export type PlannedQuestion = Question & {
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
  items: PlannedQuestion[];
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

/**
 * Games that are the only graded entrant at their response mode, derived from
 * the registry rather than hardcoded — so a second game registering at a mode
 * automatically restores the limit there.
 *
 * `MAX_RUN` exists to stop a session reading as a monotonous form when there
 * *was* a choice not to repeat a shape. When a mode has exactly one graded
 * game — `match` at recognition and `broken-form` at discrimination, in this
 * slice — there is no choice: every question at that mode is that game, so a
 * run of it is unavoidable rather than monotonous. Enforcing the cap there
 * anyway does not buy variety; measured on real content it silently deleted
 * every interleaved item and 43% of the session budget on every one of 74
 * lessons (C2), because `tryPlace` could never insert a review at the one mode
 * its own gameId already occupied on both sides.
 */
function soleGradedGamesByMode(): ReadonlySet<string> {
  const idsByMode = new Map<ResponseMode, string[]>();
  for (const g of allGames()) {
    if (!g.graded) continue;
    const ids = idsByMode.get(g.mode);
    if (ids) ids.push(g.id);
    else idsByMode.set(g.mode, [g.id]);
  }
  const out = new Set<string>();
  for (const ids of idsByMode.values()) {
    if (ids.length === 1) out.add(ids[0]);
  }
  return out;
}

/** ~25% of the session, drawn from this many other due concepts. */
const INTERLEAVE_TARGET = 3;

/**
 * Two two-slot questions is 4 of 14 slots; a third would make the session one
 * expensive drill.
 *
 * A "timed" drill used to be named by a fixed set of ids; now it is simply any
 * `GameSpec` whose `cost` is more than one slot — `shapeOfQuestion(q).slots >
 * 1` — so this guard generalises to whatever registers that shape rather than
 * only to the one drill that has one today.
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
export function conceptRoster(questions: readonly Question[]): string[] {
  return [...new Set<string>([...TAJWEED_RULES, ...questions.map((q) => q.conceptId)])].sort();
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
 * How many distinct response modes a concept's pool can actually draw for,
 * counting only exemplars a session could plan — `shapeOfQuestion` returns
 * `null` for an unregistered or ungraded game exactly as `options()` filters
 * them below, so this asks the same question `planSession` will.
 *
 * At most `MODE_ORDER.length` (three, today).
 */
function modeCoverage(conceptId: string, byConcept: ReadonlyMap<string, readonly Question[]>): number {
  const modes = new Set<ResponseMode>();
  for (const q of byConcept.get(conceptId) ?? []) {
    const shape = shapeOfQuestion(q);
    if (shape) modes.add(shape.mode);
  }
  return modes.size;
}

/**
 * Due concepts, most overdue first, with weakness and then mode coverage
 * breaking a tie.
 *
 * `dueConcepts` already orders by due date and then by id. The id is a fine
 * tiebreak for reproducibility and a poor one for teaching, and on day one it
 * decides everything: every concept was seeded at the same millisecond, so all
 * 47 are tied. A concept `derive()` still calls weak is the better answer, and a
 * resolved one — three clean reps in a row — is the worse.
 *
 * A concept with no state has none because it has no *graded* attempt; it sits
 * between the two, which is exactly what "nothing is known yet" should rank as.
 *
 * **Mode coverage is the tiebreak below weakness, above the id.** Without it
 * the id decided the focus outright on day one — plain codepoint order — and
 * `ا` (alif, U+0627) has the lowest codepoint of any taught letter, so it won
 * the focus in 63 of 68 lessons on an empty ledger. Alif is a non-connector:
 * it is never written medial or initial, so it never earns the three authored
 * positional forms `deriveGameData` requires before a letter enters
 * `set.forms`, and `broken-form` — the one drill testing `discrimination` in
 * this slice — can never ask about it. The backbone draws almost entirely
 * from the focus concept (`fillFocus`, above), so a focus with no
 * discrimination candidate produces a backbone with no discrimination item,
 * however large the rest of the pool is. Preferring the concept whose pool
 * spans the most response modes when the more important signals cannot
 * decide is not a special case for alif — it is what "build a session, not a
 * form" already meant; it had just never been asked at the one point that
 * actually chooses what the backbone is built from.
 */
function orderDue(
  schedules: ReadonlyMap<string, ConceptSchedule>,
  states: ReadonlyMap<string, ConceptState>,
  now: number,
  byConcept: ReadonlyMap<string, readonly Question[]>,
): string[] {
  const urgency = (conceptId: string): number => {
    const s = states.get(conceptId);
    if (!s) return 1;
    if (isWeak(s)) return 0;
    return isResolved(s) ? 2 : 1;
  };
  const dueAt = (conceptId: string) => schedules.get(conceptId)?.due.getTime() ?? 0;
  const coverage = (conceptId: string) => modeCoverage(conceptId, byConcept);

  return dueConcepts(schedules, now).sort(
    (x, y) =>
      dueAt(x) - dueAt(y) ||
      urgency(x) - urgency(y) ||
      coverage(y) - coverage(x) ||
      (x < y ? -1 : x > y ? 1 : 0),
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
  questions: readonly Question[],
  now: number,
  opts: PlanOptions = {},
): SessionPlan {
  const byConcept = new Map<string, Question[]>();
  for (const q of questions) {
    const list = byConcept.get(q.conceptId);
    if (list) list.push(q);
    else byConcept.set(q.conceptId, [q]);
  }
  // So the plan depends on the pool's *contents* and not on the order the caller
  // happened to assemble it in.
  for (const list of byConcept.values()) {
    list.sort((a, b) => (a.itemKey < b.itemKey ? -1 : a.itemKey > b.itemKey ? 1 : 0));
  }

  // A due concept with no exemplar is a due concept the learner cannot be shown
  // anything for, so it is not a session.
  const due = orderDue(schedules, states, now, byConcept).filter((id) => byConcept.has(id));
  const focusConceptId = due[0];
  if (focusConceptId === undefined) return emptyPlan();

  const rand = opts.seed === undefined ? () => 0 : mulberry32(opts.seed);
  const used = new Set<string>();
  const drawnByGame = new Map<string, number>();
  let timedDrawn = 0;
  const soleGames = soleGradedGamesByMode();

  /** Turn a question into a planned one, and record what that spends. */
  function commit(q: Question, isInterleaved: boolean): PlannedQuestion {
    // Only ever called with a question `options()` already vetted, so the shape
    // is known to exist.
    const shape = shapeOfQuestion(q)!;
    used.add(q.itemKey);
    drawnByGame.set(q.gameId, (drawnByGame.get(q.gameId) ?? 0) + 1);
    if (shape.slots > 1) timedDrawn += 1;
    return { ...q, mode: shape.mode, slots: shape.slots, isInterleaved };
  }

  function options(conceptId: string, maxSlots: number, mode?: ResponseMode): Question[] {
    return (byConcept.get(conceptId) ?? []).filter((q) => {
      if (used.has(q.itemKey)) return false;
      const shape = shapeOfQuestion(q);
      if (!shape) return false;
      if (mode !== undefined && shape.mode !== mode) return false;
      if (shape.slots > maxSlots) return false;
      return !(shape.slots > 1 && timedDrawn >= MAX_TIMED);
    });
  }

  /**
   * Draw one exemplar, spreading across the drills a concept has rather than
   * doing the same one eight times. The *shape* is chosen by what has been used
   * least so far; only the exemplar within it is left to the seed.
   */
  function draw(candidates: Question[], isInterleaved: boolean): PlannedQuestion | null {
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
  // `closingPool` is already filtered through `options()`, so every candidate's
  // shape is known to resolve.
  const closingPool = options(focusConceptId, SESSION_SLOTS);
  const hardest = closingPool.reduce<Question | null>((best, q) => {
    if (!best) return q;
    const a = shapeOfQuestion(q)!;
    const b = shapeOfQuestion(best)!;
    if (rank(a.mode) !== rank(b.mode)) return rank(a.mode) > rank(b.mode) ? q : best;
    return a.slots > b.slots ? q : best;
  }, null);
  const closing = hardest
    ? draw(
        closingPool.filter((q) => {
          const s = shapeOfQuestion(q)!;
          const h = shapeOfQuestion(hardest)!;
          return s.mode === h.mode && s.slots === h.slots;
        }),
        false,
      )
    : null;
  if (!closing) return emptyPlan();

  // ---- the focus backbone ---------------------------------------------------
  const interleaveIds = pickInterleaveConcepts(due, states);
  const reserve = Math.min(INTERLEAVE_TARGET, interleaveIds.length);

  const focusItems: PlannedQuestion[] = [];
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
  const interleaved: PlannedQuestion[] = [];
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
  const ordered = arrange(focusItems, soleGames);
  while (ordered.length > 0 && hasRun([...ordered, closing], soleGames)) ordered.pop();
  const backbone = [...ordered, closing];
  const items = place(backbone, interleaved, soleGames);
  return { focusConceptId, items, slots: items.reduce((n, i) => n + i.slots, 0) };
}

/**
 * Two or three other due concepts: the ones the learner missed and did not
 * repair first, then the rest of what they have answered before, then the
 * unseen.
 *
 * Interleaving a concept that has never been seen is not a review of anything —
 * it is a first encounter, dropped into the middle of someone else's session.
 * Unseen concepts are still used as a fallback, because on day one there is
 * nothing else and an empty middle would be worse.
 *
 * **A flag outranks the due date here, and only here.** `useSession` ends a
 * sitting knowing which concepts were missed and never repaired — the tail was
 * full, the retries were spent, or the pool had nothing left to ask with — and
 * that is the strongest single piece of evidence the engine has about what to
 * put back in front of the learner. Until now it was minted at the end of a
 * session and dropped there, which made the claim that a repeated failure
 * "converts a failure into scheduling information" half true.
 *
 * It is read off `ConceptState`, so it is **derived from the ledger** rather
 * than threaded through React state: it costs no storage, and it survives the
 * reload that would silently lose a value held in a hook.
 *
 * This is deliberately the *only* place it is read. `orderDue` decides the
 * focus, and a flag that reached it would let one bad answer at the end of
 * yesterday's session take over today's — a concept is the focus because it is
 * the most overdue thing the learner can be shown, and being missed recently is
 * a reason to review it, not a reason to spend a sitting on it. `due` is also
 * already filtered to what FSRS has called back, so a flag reorders the
 * candidates and never invents one.
 */
function pickInterleaveConcepts(
  due: readonly string[],
  states: ReadonlyMap<string, ConceptState>,
): string[] {
  const others = due.slice(1);
  const seen = others.filter((id) => (states.get(id)?.attempts ?? 0) > 0);
  const unseen = others.filter((id) => (states.get(id)?.attempts ?? 0) === 0);
  // A flagged concept has attempts by definition — the flag is set by one — so
  // this partitions `seen` and cannot pull anything out of `unseen`. Each half
  // keeps the order `orderDue` gave it, so the due date still decides between
  // two concepts the flag cannot separate.
  const flagged = seen.filter((id) => states.get(id)?.flagged === true);
  const rest = seen.filter((id) => states.get(id)?.flagged !== true);
  return [...flagged, ...rest, ...unseen].slice(0, INTERLEAVE_TARGET);
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
function chooseInterleaveMode(backbone: readonly PlannedQuestion[], count: number): ResponseMode {
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
function arrange(items: readonly PlannedQuestion[], soleGames: ReadonlySet<string>): PlannedQuestion[] {
  const out: PlannedQuestion[] = [];
  for (const mode of MODE_ORDER) {
    let remaining = items.filter((i) => i.mode === mode);
    while (remaining.length > 0) {
      const tail = out.slice(-MAX_RUN);
      const blocked =
        tail.length === MAX_RUN &&
        new Set(tail.map((i) => i.gameId)).size === 1 &&
        !soleGames.has(tail[0].gameId)
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

/**
 * Three of one shape in a row, anywhere in the sequence.
 *
 * A run of a game that is the only graded entrant at its mode does not count
 * — see `soleGradedGamesByMode` — because there was no alternative shape to
 * spread it across.
 */
function hasRun(items: readonly PlannedQuestion[], soleGames: ReadonlySet<string>): boolean {
  for (let i = MAX_RUN; i < items.length; i += 1) {
    const window = items.slice(i - MAX_RUN, i + 1);
    const ids = new Set(window.map((it) => it.gameId));
    if (ids.size !== 1) continue;
    const [gameId] = ids;
    if (soleGames.has(gameId)) continue;
    return true;
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
function place(
  backbone: PlannedQuestion[],
  interleaved: readonly PlannedQuestion[],
  soleGames: ReadonlySet<string>,
): PlannedQuestion[] {
  for (let count = interleaved.length; count > 0; count -= 1) {
    const attempt = tryPlace(backbone, interleaved.slice(0, count), soleGames);
    if (attempt) return attempt;
  }
  return backbone;
}

function tryPlace(
  backbone: readonly PlannedQuestion[],
  interleaved: readonly PlannedQuestion[],
  soleGames: ReadonlySet<string>,
): PlannedQuestion[] | null {
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
        if (hasRun(trial.slice(Math.max(0, i - MAX_RUN), i + MAX_RUN + 1), soleGames)) continue;
        out.splice(i, 0, item);
        placed = i;
      }
      if (placed !== -1) break;
    }
    if (placed === -1) return null;
    cursor = placed;
  }

  return hasRun(out, soleGames) ? null : out;
}
