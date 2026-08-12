import type { ReactNode } from "react";
import type { RuleId } from "@/content/tajweed";
import type { GameData } from "@/games/derive";

/**
 * A game registry, so the set of drills a lesson shows is data rather than a
 * hardcoded array.
 *
 * `GamePanel.tsx` currently holds a literal list of six letter-shaped tabs
 * (`GamePanel.tsx:24-47`), each gated by a predicate over letter-shaped
 * `GameData`. That is fine for Phase 1, where every lesson wants the same six,
 * but tajweed lessons each want a different subset — 3-23 wants the rule
 * identifier and the family sorter, 3-30 wants the madd counter.
 *
 * Registering here decouples "which drills exist" from "which drills this
 * lesson shows". Swapping `GamePanel`'s literal for `getGames(lesson.games)` is
 * a separate change, deliberately not made yet: that file is being actively
 * worked on elsewhere, and this module is additive so both can proceed.
 */

/** What a drill reports when the learner answers. */
export type GameResult = {
  gameId: string;
  /** The rule being drilled, when the drill is rule-specific. */
  ruleId?: RuleId;
  /**
   * `null` = ungradeable or skipped. **Never `false` for "no verdict"** — a
   * fabricated `false` is a *claim* of failure made by a drill that did not
   * grade, and downstream it would break a streak and move a mastery band on
   * evidence that does not exist.
   */
  correct: boolean | null;
  /** Epoch ms, supplied by the caller so this module stays pure. */
  at: number;
  /**
   * The raw measurement, for drills that grade a *held duration*.
   *
   * Kept because `correct` is a lossy derivation of it: the tolerance is a
   * tuning constant, and once only the verdict is stored, retuning it can never
   * be applied to past attempts. `msPerHarakah` travels with the count because
   * a ḥarakah has no fixed length — it is the learner's own calibration, and
   * without it `measuredHarakat` is uninterpretable and unreproducible later.
   *
   * Absent unless the drill actually timed something. A drill that asks the
   * learner to *name* a length has no duration to report and must not invent
   * one — see `choice`.
   */
  measure?: {
    heldMs: number;
    msPerHarakah: number;
    targetHarakat: number;
    measuredHarakat: number;
  };
  /**
   * The answer, for drills where the learner *selects* a length rather than
   * holding one.
   *
   * Separate from `measure` on purpose. Nothing is timed, so there is no
   * `heldMs` and no calibration; filling those with zeros would assert a
   * measurement that never happened. `acceptedHarakat` is a set rather than a
   * single target because madd ʿāriḍ lis-sukūn is genuinely transmitted at 2,
   * 4 *or* 6 — collapsing it to one number would record a falsehood.
   */
  choice?: {
    chosenHarakat: number;
    acceptedHarakat: number[];
  };
};

/**
 * One question a drill can ask, named so a session can plan it and a ledger row
 * can claim it truthfully.
 *
 * `conceptId` is what the scheduler folds on — a `RuleId` or a letter — and
 * `itemKey` is a *sample* of it (ADR-008). The learning object is the rule, not
 * the exemplar, so the same concept is asked through a different exemplar each
 * time it comes up; that is also what makes the wrong-answer tail a second
 * retrieval rather than the same card twice.
 *
 * **The key format belongs to the drill.** Nothing outside parses it. The one
 * rule is that it is prefixed with the drill's own id, so two drills' exemplars
 * of one letter — `letter-quiz/ب` and `form-swap/ب` — never collide in
 * `planSession`'s used-item set.
 *
 * `PoolItem` and `PlannedItem` in `@/practice/session` are structurally this
 * plus a `gameId`, so either can be handed straight to `render`. The type is
 * declared here rather than imported from there deliberately: the drills are the
 * authority on what exemplars exist, and they must not depend on the practice
 * engine to say so.
 */
export type Exemplar = {
  conceptId: string;
  itemKey: string;
};

/**
 * What a registered drill is handed when it is mounted.
 *
 * `data` is optional because the two halves of the registry need different
 * things. A tajweed drill bundles its own items — `@/generated/verses/*.json`
 * is a static import, so `RuleIdentifier` can build a default round at module
 * scope and ignore this entirely. A letter drill cannot: its pool is *every
 * letter taught up to this lesson*, which `deriveGameData` computes per lesson
 * from `content/lessons/*.json` behind `node:fs`. There is nothing for it to
 * bundle, so the caller has to pass the lesson's data in.
 *
 * A drill that is handed nothing it can use renders a note saying so, the way
 * `RuleIdentifier` already does for an empty item list — never a blank panel.
 */
export type GameRenderProps = {
  onResult?: (r: GameResult) => void;
  /** The lesson's derived pools, for drills whose content is lesson-scoped. */
  data?: GameData;
  /**
   * The exemplar the session planned, when a session mounted this drill.
   *
   * **Honour it when given; choose for yourself when not.** Absent is the
   * ordinary case — `GamePanel`'s tab list mounts every drill with no plan
   * behind it — so a drill that required one would render a blank tab there.
   * An `itemKey` the drill does not recognise is treated the same as absent: a
   * pool assembled against an older build must cost the learner a guarantee,
   * never the slot.
   *
   * Honouring it is not decoration. `useSession` writes this `itemKey` onto the
   * attempt, so a drill that ignores it makes the ledger claim something was
   * shown that was not; and the wrong-answer tail draws a *different* exemplar
   * of the missed concept precisely so the second ask is a second retrieval
   * rather than the question the learner just read the correction to.
   */
  item?: Exemplar;
};

export type GameEntry = {
  id: string;
  label: string;
  render: (props: GameRenderProps) => ReactNode;
  /**
   * Every question this drill can be asked for, given a lesson's data.
   *
   * The drill is the only thing that knows its own content, so this is where a
   * session's item pool has to come from — without it an `itemKey` could never
   * be minted, and `render`'s `item` would be a parameter nothing could supply.
   *
   * Returns `[]` rather than throwing when the data it needs is absent: a
   * letter drill handed no `GameData` has no exemplars, which is a true and
   * useful answer.
   *
   * An exemplar advertised here must be one `render` can actually honour, and
   * `exemplars.test.tsx` checks that by rendering them.
   */
  exemplars?: (data?: GameData) => Exemplar[];
};

/**
 * The one exemplar `itemKey` names, or `undefined` when it names none — no key
 * given, or a key from a pool built against a build that had different content.
 *
 * Returning `undefined` rather than the first item is the whole point: a drill
 * asks for its planned exemplar and falls back *deliberately*, rather than
 * silently drilling something else while believing it was told to.
 */
export function pickExemplar<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  itemKey?: string,
): T | undefined {
  return itemKey === undefined ? undefined : items.find((item) => keyOf(item) === itemKey);
}

/**
 * Put the planned exemplar first, leaving the rest of the drill's own order
 * intact.
 *
 * Rotation rather than filtering, because a drill's "next question" button has
 * to keep working after the planned one is answered — a session shows one
 * question per mount, but the same component is mounted from `GamePanel` with
 * no plan at all and goes on cycling. An `itemKey` that is absent or unknown
 * leaves the list exactly as it was, which is the fallback every drill owes the
 * tab list.
 */
export function startWith<T>(
  items: readonly T[],
  keyOf: (item: T) => string,
  itemKey?: string,
): T[] {
  if (itemKey === undefined) return [...items];
  const at = items.findIndex((item) => keyOf(item) === itemKey);
  return at <= 0 ? [...items] : [...items.slice(at), ...items.slice(0, at)];
}

const REGISTRY = new Map<string, GameEntry>();

/** Register a drill. Re-registering the same id replaces it. */
export function registerGame(entry: GameEntry): void {
  REGISTRY.set(entry.id, entry);
}

/**
 * Resolve ids to entries, in the order requested. Unknown ids are dropped
 * rather than throwing — a lesson naming a drill that has not shipped yet
 * should degrade to showing the drills that do exist, not break the page.
 */
export function getGames(ids: string[]): GameEntry[] {
  return ids
    .map((id) => REGISTRY.get(id))
    .filter((e): e is GameEntry => Boolean(e));
}

/** Test seam. */
export function clearGames(): void {
  REGISTRY.clear();
}
