import type { ReactNode } from "react";
import type { ArabicItem } from "@/content/schema";
import type { FormEntry, WordEntry } from "@/games/derive";
import { isConceptId } from "@/practice/concepts";

export type ResponseMode = "recognition" | "discrimination" | "production";

/** The ramp. Ordering lives here so nothing re-derives it from a string. */
export const MODE_RANK: Readonly<Record<ResponseMode, number>> = {
  recognition: 0,
  discrimination: 1,
  production: 2,
};

/**
 * One question a game can ask.
 *
 * `conceptId` rides on the question, not on a plan. That is the change the
 * whole rebuild turns on: a game answered on the set screen — where nothing
 * planned anything — still knows what concept it was about, so it can write a
 * truthful ledger row. Before this, `GameResult` carried no concept, and
 * inventing one is exactly what the ledger's honesty rules forbid.
 */
export type Question = {
  conceptId: string;
  /** Prefixed with the owning game's id, so two games never collide. */
  itemKey: string;
  gameId: string;
  /** Whatever this game needs to render. Opaque to everything else. */
  payload: unknown;
};

export function isQuestion(q: Question): boolean {
  if (!isConceptId(q.conceptId)) return false;
  if (!q.gameId || !q.itemKey) return false;
  return q.itemKey.startsWith(`${q.gameId}/`);
}

/** Extra observations a verdict may carry. Never elapsed time — see constraints. */
export type AnswerDetail = {
  measuredHarakat?: number;
  targetHarakat?: number;
  acceptedHarakat?: number[];
  msPerHarakah?: number;
};

export type GameApi = {
  /** `null` = ungradeable. NEVER `false` for "no verdict". */
  answer: (correct: boolean | null, detail?: AnswerDetail) => void;
  /** Injected clock. No game calls Date.now() directly. */
  now: () => number;
};

/** The material a game draws questions from. */
export type StudySet = {
  id: string;
  title: string;
  letters: ArabicItem[];
  words: WordEntry[];
  forms: FormEntry[];
  /**
   * What this set is *about* — every concept id (rule or letter) the lesson
   * behind it teaches, as `lessonConcepts` reports them. `rules` below is
   * this list narrowed to the ones in `RULE_CONCEPTS`; nothing else in this
   * type currently narrows it to letters, because `letters` above already
   * carries the full `ArabicItem`s, not bare concept ids.
   */
  concepts: string[];
  /**
   * The lesson's tajweed rule concepts, e.g. `"iqlab"`. **Not** `RuleId` from
   * `@/content/tajweed` — that type names the 18-entry span-colour palette,
   * a different and smaller id space (compare `"ikhfa"` there to
   * `"ikhfa_haqiqi"`/`"ikhfa_shafawi"` here). Conflating the two is exactly
   * the bug this field replaces: a hardcoded `[]` that made every tajweed
   * concept invisible to every game.
   */
  rules: string[];
};

export type GameSpec = {
  id: string;
  label: string;
  /** Declared here, not in a table elsewhere — that table's fallback hid bugs. */
  mode: ResponseMode;
  cost: number;
  /** False for the flashcard decks: a self-claim is not a measurement. */
  graded: boolean;
  questions: (set: StudySet) => Question[];
  render: (q: Question, api: GameApi) => ReactNode;
};
