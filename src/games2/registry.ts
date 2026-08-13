import { isQuestion, type GameSpec, type Question, type StudySet } from "./types";

const REGISTRY = new Map<string, GameSpec>();

export function registerGame(spec: GameSpec): void {
  REGISTRY.set(spec.id, spec);
}

export function getGame(id: string): GameSpec | undefined {
  return REGISTRY.get(id);
}

export function allGames(): GameSpec[] {
  return [...REGISTRY.values()];
}

/** Test seam. */
export function clearGames(): void {
  REGISTRY.clear();
}

/**
 * Every question the named games can ask of this set.
 *
 * Throws on a malformed question rather than filtering it out. A question with
 * a bad `conceptId` would become a permanent ledger row that the scheduler can
 * never surface, and the append-only store cannot take it back — so the loud
 * failure belongs at the moment the game produced it, where the stack trace
 * still names the game.
 */
export function questionsFor(
  ids: readonly string[],
  set: StudySet,
  opts: { gradedOnly?: boolean } = {},
): Question[] {
  const out: Question[] = [];
  for (const id of ids) {
    const spec = REGISTRY.get(id);
    if (!spec) continue;
    if (opts.gradedOnly && !spec.graded) continue;
    for (const q of spec.questions(set)) {
      if (!isQuestion(q)) {
        throw new Error(`${spec.id}: emitted a malformed question — ${JSON.stringify(q)}`);
      }
      out.push(q);
    }
  }
  return out;
}
