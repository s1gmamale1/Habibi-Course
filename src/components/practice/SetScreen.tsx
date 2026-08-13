"use client";
import { useMemo, useState } from "react";
import { getGame, questionsFor } from "@/games2/registry";
import { SLICE_GAME_IDS } from "@/games2/games";
import type { Question, StudySet } from "@/games2/types";
import { appendAttempt } from "@/practice/ledger";

/**
 * Wall clock, factored out of the component.
 *
 * `Date.now()` called directly inside `SetScreen`'s body trips
 * `react-hooks/purity` even when it is nested inside a callback that only
 * ever runs from a child's click handler — the rule cannot see that the
 * callback's execution is deferred, only that the call is lexically inside
 * the component. A module-level function sidesteps that: the impure call
 * lives outside any component or hook body, which is exactly what the rule
 * checks for.
 */
function clockNow(): number {
  return Date.now();
}

/**
 * The Quizlet surface: pick a set, pick a mode, play it.
 *
 * Learner-initiated and unscheduled — nothing here consults FSRS. It still
 * records, because a `Question` carries its own `conceptId`; that is the whole
 * reason free practice can finally feed the scheduler instead of being thrown
 * away.
 *
 * Takes an already-built `set` as a prop rather than calling `lessonSet`
 * itself: `studySet.ts` transitively imports `node:fs` via `@/content/load`,
 * and a `"use client"` component must never pull that in. The server page
 * builds the set and hands it down.
 */
export function SetScreen({ set }: { set: StudySet }) {
  const [mode, setMode] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [sessionId] = useState(() => `set:${set.id}:${crypto.randomUUID()}`);

  const questions = useMemo(
    () => (mode ? questionsFor([mode], set, { gradedOnly: true }) : []),
    [mode, set],
  );
  const spec = mode ? getGame(mode) : undefined;
  const current: Question | undefined = questions[index];

  function record(q: Question, correct: boolean | null) {
    void appendAttempt({
      id: crypto.randomUUID(),
      at: clockNow(),
      conceptId: q.conceptId,
      itemKey: q.itemKey,
      gameId: q.gameId,
      correct,
      sessionId,
      isInterleaved: false,
    }).catch(() => {
      // A lost row beats a lost turn — the same failure mode `useSession` takes.
      // Never fabricate a concept to dodge the ledger's guard; a malformed id
      // is a bug in the game that produced the question, not something to paper
      // over here.
    });
    setIndex((i) => i + 1);
  }

  if (!mode || !spec) {
    return (
      <section className="glass rounded-2xl p-4 sm:p-5">
        <h2 className="mb-1 text-xl font-semibold text-white/90">{set.title}</h2>
        <p className="mb-4 text-sm text-white/60">Pick a way to drill this lesson.</p>
        <div className="flex flex-wrap gap-2">
          {SLICE_GAME_IDS.map((id) => {
            const g = getGame(id);
            if (!g || !g.graded) return null;
            const n = questionsFor([id], set, { gradedOnly: true }).length;
            if (n === 0) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => { setMode(id); setIndex(0); }}
                className="cta-secondary rounded-full px-4 py-2 text-sm"
              >
                {g.label} <span className="text-white/40">({n})</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  return (
    <section className="glass rounded-2xl p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm text-white/60">
          {spec.label} · <bdi dir="ltr">{Math.min(index + 1, questions.length)}/{questions.length}</bdi>
        </span>
        <button type="button" onClick={() => setMode(null)} className="cta-secondary rounded-full px-3 py-1 text-sm">
          Done
        </button>
      </div>
      <div data-testid="set-drill">
        {current ? (
          <div key={current.itemKey}>
            {spec.render(current, {
              answer: (correct) => record(current, correct),
              now: clockNow,
            })}
          </div>
        ) : (
          <p className="text-white/80">Set complete.</p>
        )}
      </div>
    </section>
  );
}
