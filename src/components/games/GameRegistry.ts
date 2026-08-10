import type { ReactNode } from "react";
import type { RuleId } from "@/content/tajweed";

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
  correct: boolean;
  /** Epoch ms, supplied by the caller so this module stays pure. */
  at: number;
};

export type GameEntry = {
  id: string;
  label: string;
  render: (props: { onResult?: (r: GameResult) => void }) => ReactNode;
};

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
