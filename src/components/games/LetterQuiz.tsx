"use client";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { ArabicItem } from "@/content/schema";
import type { FormEntry, FormKey } from "@/games/derive";
import { pickExemplar, registerGame, type GameResult } from "./GameRegistry";
import { shuffled } from "./useSwapPuzzle";

/** Declared here rather than beside `registerGame` so the drill can report under it. */
const GAME_ID = "letter-quiz";

const FORM_KEYS: FormKey[] = ["isolated", "initial", "medial", "final"];
const FORM_LABELS: Record<FormKey, string> = { isolated: "Alone", initial: "Start", medial: "Middle", final: "End" };

type Flavor = "letter" | "pick-form" | "cross-letter";
// Identity beyond the raw glyph string: pick-form keys by form-slot, cross-letter keys by letter.
type Choice = { key: string; glyph: string; correct: boolean };
type Question = { prompt: ReactNode; choices: Choice[] };

function presentForms(entry: FormEntry): FormKey[] {
  return FORM_KEYS.filter((k) => entry.forms[k]);
}

/**
 * `focus` is the letter a session planned, and it decides the **answer** rather
 * than merely appearing among the choices.
 *
 * Without it the drill picked its own letter, so the attempt row said the
 * learner had practised ب when they had been asked about ت — a `conceptId` that
 * never happened, which is worse than a wrong `itemKey` because the scheduler
 * folds on it. A `focus` the content cannot honour is ignored, and the drill
 * chooses for itself as before.
 */
function buildLetterQuestion(pool: ArabicItem[], focus?: string): Question {
  const target = pool.find((it) => it.arabic === focus);
  const opts = target
    ? [target, ...shuffled(pool.filter((it) => it.arabic !== focus)).slice(0, 3)]
    : shuffled(pool).slice(0, 4);
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
function buildPickFormQuestion(entries: FormEntry[], focus?: string): Question {
  const eligible = entries.filter((e) => presentForms(e).length >= 3);
  const entry =
    eligible.find((e) => e.item.arabic === focus) ??
    eligible[Math.floor(Math.random() * eligible.length)];
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
function buildCrossLetterQuestion(
  entries: FormEntry[],
  commonKeys: FormKey[],
  focus?: string,
): Question {
  const formKey = commonKeys[Math.floor(Math.random() * commonKeys.length)];
  const candidates = entries.filter((e) => e.forms[formKey]);
  const wanted = candidates.find((e) => e.item.arabic === focus);
  const picked = wanted
    ? [wanted, ...shuffled(candidates.filter((e) => e !== wanted)).slice(0, 3)]
    : shuffled(candidates).slice(0, 4);
  const answer = wanted ?? picked[Math.floor(Math.random() * picked.length)];
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

function buildQuestion(
  pool: ArabicItem[],
  entries: FormEntry[],
  formsTaught: boolean,
  focus?: string,
): Question {
  // A flavour that cannot ask about `focus` is not offered at all — otherwise a
  // planned letter would be honoured or not depending on a coin toss, which is
  // the same unreliable claim as not honouring it.
  const asks = (e: FormEntry) => focus === undefined || e.item.arabic === focus;
  const canPickForm =
    formsTaught && entries.some((e) => presentForms(e).length >= 3 && asks(e));
  const commonKeys = formsTaught
    ? FORM_KEYS.filter(
        (k) => entries.filter((e) => e.forms[k]).length >= 4 && entries.some((e) => e.forms[k] && asks(e)),
      )
    : [];
  const canAskLetter = focus === undefined || pool.some((it) => it.arabic === focus);

  const available: Flavor[] = canAskLetter ? ["letter"] : [];
  if (canPickForm) available.push("pick-form");
  if (commonKeys.length > 0) available.push("cross-letter");
  // Nothing can honour it — a key from a pool built against other content — so
  // the drill falls back to choosing for itself rather than showing nothing.
  if (available.length === 0) return buildQuestion(pool, entries, formsTaught);
  const flavor = available[Math.floor(Math.random() * available.length)];

  if (flavor === "pick-form") return buildPickFormQuestion(entries, focus);
  if (flavor === "cross-letter") return buildCrossLetterQuestion(entries, commonKeys, focus);
  return buildLetterQuestion(pool, focus);
}

/**
 * **One attempt per graded tap**, which is the answer `RuleIdentifier` and
 * `FamilySorter` already give: a drill reports once per discrete graded move,
 * and "first try" survives only as the score line below the board. Reporting the
 * first try alone would drop every miss — the rows the scheduler learns most
 * from — and 29 of the 47 concepts are letters, so this drill is a large part of
 * how the engine ever sees anything at all.
 *
 * A tap on an answered round is inert and reports nothing: there is no second
 * verdict to give, and inventing one would put a row in an append-only ledger
 * that describes nothing the learner did.
 */
export function LetterQuiz({
  pool,
  entries,
  formsTaught,
  focus,
  onResult,
  now = () => Date.now(),
}: {
  pool: ArabicItem[];
  entries: FormEntry[];
  formsTaught: boolean;
  /**
   * The letter the session planned, for the **first** question. Later rounds
   * are the drill's own again: the session showed the learner one question and
   * has already moved on by the time they press "Next".
   */
  focus?: string;
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [question, setQuestion] = useState<Question | null>(null);
  const [gotIt, setGotIt] = useState(false);
  const [missed, setMissed] = useState(false);
  const [shake, setShake] = useState<{ key: string; n: number } | null>(null);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  useEffect(() => {
    const q = buildQuestion(pool, entries, formsTaught, round === 0 ? focus : undefined);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- round-keyed effect with mount-time random pick must run client-side only; render-time pick would mismatch SSR HTML
    setQuestion(q);
    setGotIt(false);
    setMissed(false);
    setShake(null);
  }, [round, pool, entries, formsTaught, focus]);

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
                onResult?.({ gameId: GAME_ID, correct: c.correct, at: now() });
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
 *
 * `GAME_ID` is declared at the top of the file — the drill reports under it.
 */
/**
 * One exemplar per letter: the question this drill asks about a letter is
 * always "which glyph is this one", however the flavour dresses it. A tail
 * retry of a letter therefore has to come from another drill — which is what
 * `useSession.drawRetry` prefers anyway.
 */
const quizKey = (arabic: string) => `${GAME_ID}/${arabic}`;

registerGame({
  id: GAME_ID,
  label: "❓ Quiz",
  exemplars: (data) =>
    (data && quizzableLetters(data.letterPool).length >= QUIZ_MIN_LETTERS
      ? quizzableLetters(data.letterPool)
      : []
    ).map((it) => ({ conceptId: it.arabic, itemKey: quizKey(it.arabic) })),
  render: ({ data, onResult, item }) => {
    const pool = data ? quizzableLetters(data.letterPool) : [];
    if (!data || pool.length < QUIZ_MIN_LETTERS) {
      return <p className="text-white/50">Not enough named letters to quiz yet.</p>;
    }
    return (
      <LetterQuiz
        pool={pool}
        entries={data.formEntries}
        formsTaught={data.formsTaught}
        focus={pickExemplar(pool, (it) => quizKey(it.arabic), item?.itemKey)?.arabic}
        onResult={onResult}
      />
    );
  },
});
