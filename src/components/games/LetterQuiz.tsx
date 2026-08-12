"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ArabicItem } from "@/content/schema";
import type { FormEntry, FormKey } from "@/games/derive";
import { registerGame } from "./GameRegistry";
import { shuffled } from "./useSwapPuzzle";

const FORM_KEYS: FormKey[] = ["isolated", "initial", "medial", "final"];
const FORM_LABELS: Record<FormKey, string> = { isolated: "Alone", initial: "Start", medial: "Middle", final: "End" };

type Flavor = "letter" | "pick-form" | "cross-letter";
// Identity beyond the raw glyph string: pick-form keys by form-slot, cross-letter keys by letter.
type Choice = { key: string; glyph: string; correct: boolean };
type Question = { prompt: ReactNode; choices: Choice[] };

function presentForms(entry: FormEntry): FormKey[] {
  return FORM_KEYS.filter((k) => entry.forms[k]);
}

function buildLetterQuestion(pool: ArabicItem[]): Question {
  const opts = shuffled(pool).slice(0, 4);
  const answer = opts[0];
  const choices: Choice[] = shuffled(opts).map((it) => ({
    key: it.arabic,
    glyph: it.arabic,
    correct: it.arabic === answer.arabic,
  }));
  return {
    prompt: (
      <>
        Which letter is <span className="font-semibold">{answer.name}</span>
        {answer.translit ? ` (${answer.translit})` : ""}?
      </>
    ),
    choices,
  };
}

// Options are every present form of ONE letter; the correct option is the asked-for form key.
function buildPickFormQuestion(entries: FormEntry[]): Question {
  const eligible = entries.filter((e) => presentForms(e).length >= 3);
  const entry = eligible[Math.floor(Math.random() * eligible.length)];
  const keys = presentForms(entry);
  const formKey = keys[Math.floor(Math.random() * keys.length)];
  const choices: Choice[] = shuffled(keys).map((k) => ({
    key: k,
    glyph: entry.forms[k]!,
    correct: k === formKey,
  }));
  return {
    prompt: (
      <>
        Tap the <b>{FORM_LABELS[formKey]}</b> form of <b>{entry.item.name ?? entry.item.arabic}</b>
      </>
    ),
    choices,
  };
}

// Options are the SAME form key across 4 different letters; the correct option is one letter's glyph.
function buildCrossLetterQuestion(entries: FormEntry[], commonKeys: FormKey[]): Question {
  const formKey = commonKeys[Math.floor(Math.random() * commonKeys.length)];
  const candidates = entries.filter((e) => e.forms[formKey]);
  const picked = shuffled(candidates).slice(0, 4);
  const answer = picked[Math.floor(Math.random() * picked.length)];
  const choices: Choice[] = shuffled(picked).map((e) => ({
    key: e.item.arabic,
    glyph: e.forms[formKey]!,
    correct: e.item.arabic === answer.item.arabic,
  }));
  return {
    prompt: (
      <>
        Tap the <b>{FORM_LABELS[formKey]}</b> form of <b>{answer.item.name ?? answer.item.arabic}</b>
      </>
    ),
    choices,
  };
}

function buildQuestion(pool: ArabicItem[], entries: FormEntry[], formsTaught: boolean): Question {
  const canPickForm = formsTaught && entries.some((e) => presentForms(e).length >= 3);
  const commonKeys = formsTaught ? FORM_KEYS.filter((k) => entries.filter((e) => e.forms[k]).length >= 4) : [];

  const available: Flavor[] = ["letter"];
  if (canPickForm) available.push("pick-form");
  if (commonKeys.length > 0) available.push("cross-letter");
  const flavor = available[Math.floor(Math.random() * available.length)];

  if (flavor === "pick-form") return buildPickFormQuestion(entries);
  if (flavor === "cross-letter") return buildCrossLetterQuestion(entries, commonKeys);
  return buildLetterQuestion(pool);
}

export function LetterQuiz({
  pool,
  entries,
  formsTaught,
}: {
  pool: ArabicItem[];
  entries: FormEntry[];
  formsTaught: boolean;
}) {
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [gotIt, setGotIt] = useState(false);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<{ key: string; n: number } | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  useEffect(() => {
    const q = buildQuestion(pool, entries, formsTaught);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- round-keyed effect with mount-time random pick must run client-side only; render-time pick would mismatch SSR HTML
    setQuestion(q);
    setGotIt(false);
    setMissed(false);
    setShake(null);
  }, [round, pool, entries, formsTaught]);

  if (!question) return <p className="text-white/50">Preparing…</p>;
  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">{question.prompt}</p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {question.choices.map((c) => {
          const shaking = shake?.key === c.key;
          return (
            <button
              key={`${c.key}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`choice ${c.glyph}`}
              // Answered rounds leave every choice inert. Not `disabled`, which would drop
              // them out of the tab order mid-round and move focus unexpectedly; aria-disabled
              // keeps them reachable while announcing that they no longer do anything.
              aria-disabled={gotIt}
              onClick={() => {
                if (gotIt) return;
                if (c.correct) {
                  setGotIt(true);
                  setScore((s) => ({ right: s.right + (missed ? 0 : 1), asked: s.asked + 1 }));
                  setShake(null); // a wrong guess's shake outlived the guess itself
                } else {
                  setMissed(true);
                  setShake({ key: c.key, n: (shake?.n ?? 0) + 1 });
                }
              }}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                gotIt && c.correct ? "game-correct" : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {c.glyph}
            </button>
          );
        })}
      </div>
      {gotIt && (
        <button type="button" className="cta-primary mt-4 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
          Next question →
        </button>
      )}
      {score.asked > 0 && <p className="mt-3 text-xs text-white/50">First-try score: {score.right} / {score.asked}</p>}
    </div>
  );
}

/* ---------- registration ---------------------------------------------- */

/**
 * The letters this drill can pose a question about: the ones it can *name* in
 * the prompt. `buildLetterQuestion` asks "which letter is <name>?", so a pool
 * entry with no name has no question. Four is the floor because every question
 * shows four choices.
 *
 * Exported so `GamePanel`'s tab gate and this drill's own gate cannot drift
 * apart into two different answers to the same question.
 */
export function quizzableLetters(pool: ArabicItem[]): ArabicItem[] {
  return pool.filter((it) => it.name);
}

export const QUIZ_MIN_LETTERS = 4;

/**
 * **Recognition.** Given a name, pick the glyph out of four — the same shape as
 * `rule-identifier`, which is classified the same way. The learner is choosing
 * between candidates that are all handed to them; nothing is produced and no
 * distinction has to be found inside a longer string.
 */
const GAME_ID = "letter-quiz";

registerGame({
  id: GAME_ID,
  label: "❓ Quiz",
  render: ({ data }) => {
    const pool = data ? quizzableLetters(data.letterPool) : [];
    if (!data || pool.length < QUIZ_MIN_LETTERS) {
      return <p className="text-white/50">Not enough named letters to quiz yet.</p>;
    }
    return <LetterQuiz pool={pool} entries={data.formEntries} formsTaught={data.formsTaught} />;
  },
});
