"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { GameData, WordEntry } from "@/games/derive";
import { contextualGlyphs, displayLetters } from "@/games/arabic";
import { pickExemplar, registerGame, startWith, type GameResult } from "./GameRegistry";
import { shuffled } from "./useSwapPuzzle";

/** Declared here rather than beside `registerGame` so the drill can report under it. */
const GAME_ID = "spot-the-letter";

/**
 * **One attempt per tap**, the same answer `LetterQuiz` gives and for the same
 * reason: every tap on a tile is a graded selection with a verdict the board
 * immediately renders, and the misses are the rows the scheduler learns most
 * from. Taps after the letter is found are inert and report nothing.
 */
export function SpotTheLetter({
  words,
  pool,
  focus,
  onResult,
  now = () => Date.now(),
}: {
  words: WordEntry[];
  pool: ArabicItem[];
  /**
   * The letter the session planned, for the **first** word only.
   *
   * The target is otherwise picked at random from the letters of the word, so
   * the attempt row named a concept the learner may never have been asked
   * about. A `focus` the first word does not contain is ignored — the drill
   * cannot hunt a letter that is not there — and the random pick stands.
   */
  focus?: string;
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [target, setTarget] = useState<string | null>(null);
  const [found, setFound] = useState(false);
  const [shake, setShake] = useState<{ idx: number; n: number } | null>(null);
  const word = words[round % words.length];

  useEffect(() => {
    const uniq = [...new Set(displayLetters(words[round % words.length].arabic))];
    // Only ever target a letter we can name in the prompt. derive.ts's wordPool
    // guarantees every letter of a playable word is in `pool`, but we filter
    // defensively rather than fall back to showing the bare Arabic glyph — that's
    // exactly the hint this game must not give away.
    // Targeting the letters AS WRITTEN also keeps the prompt honest for
    // hamza-carrier words: أَحَد renders only أ, which is not a nameable pool
    // entry, so the target falls to ح or د instead of asking for an alif the
    // student can never tap. In ضَوْء the bare ء is nameable and becomes a
    // legitimate target — the point of teaching hamza in Unit 1.4.
    const known = uniq.filter((l) => pool.some((it) => it.arabic === l));
    const planned = round === 0 && focus !== undefined && known.includes(focus) ? focus : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- random target pick must run client-side only; render-time shuffle would mismatch SSR HTML
    setTarget(planned ?? shuffled(known)[0] ?? null);
    setFound(false);
    setShake(null);
  }, [round, words, pool, focus]);

  if (!target) return <p className="text-white/50">Picking a letter…</p>;
  const letters = displayLetters(word.arabic);
  const glyphs = contextualGlyphs(word.arabic);
  const targetItem = pool.find((it) => it.arabic === target);

  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">
        Tap the letter <span className="font-semibold">{targetItem?.name}</span>
        {targetItem?.translit ? ` (${targetItem.translit})` : ""} in this word:
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-1">
        {glyphs.map((g, i) => {
          const shaking = shake?.idx === i;
          return (
            <button
              key={`${i}-${shaking ? shake!.n : 0}`}
              type="button"
              aria-label={`word letter ${i + 1}`}
              onClick={() => {
                if (found) return;
                const hit = letters[i] === target;
                onResult?.({ gameId: GAME_ID, correct: hit, at: now() });
                if (hit) setFound(true);
                else setShake({ idx: i, n: (shake?.n ?? 0) + 1 });
              }}
              className={`arabic rounded-xl border px-2 py-2 text-5xl text-white ${
                found && letters[i] === target ? "game-correct" : "border-white/10 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {g}
            </button>
          );
        })}
      </div>
      {found && (
        <div className="mt-4">
          <p className="text-green-300">
            <span className="arabic text-3xl">{target}</span> — {targetItem?.name}
          </p>
          <p className="text-green-300">✓ Found it! {word.translit} — {word.meaning}</p>
          <button type="button" className="cta-primary mt-2 rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next word →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- registration ---------------------------------------------- */

/**
 * Words this drill can pose: ones with at least two distinct letters *as
 * written*, so there is something to choose between. Normalised the same way
 * the target picker normalises, so the gate and the picker cannot disagree
 * about whether a word is playable. Exported so `GamePanel` uses this
 * definition rather than a second copy of it.
 */
export function spottableWords(words: WordEntry[]): WordEntry[] {
  return words.filter((w) => new Set(displayLetters(w.arabic)).size >= 2);
}

/**
 * **Discrimination.** The target letter is never shown — only named — and it has
 * to be picked out from inside a word where it is ligatured to its neighbours
 * and no longer looks like its isolated form. Finding one thing among competing
 * others in a longer string is exactly what `span-tapper` asks for in an āyah,
 * and it carries the same mode.
 *
 * `GAME_ID` is declared at the top of the file — the drill reports under it.
 */
/**
 * A question here is a **word and a letter to find in it**, so both are in the
 * key: the same letter hunted in two different words is two exemplars of one
 * concept, which is exactly what a tail retry needs, and the same word with two
 * different letters is two different questions about two different concepts.
 *
 * Only letters the pool can *name* are offered, because the prompt names the
 * target rather than showing it — the same filter the target picker applies.
 */
type SpotExemplar = { word: WordEntry; letter: string; itemKey: string };

function spotExemplars(data?: GameData): SpotExemplar[] {
  if (!data) return [];
  return spottableWords(data.wordPool).flatMap((word) =>
    [...new Set(displayLetters(word.arabic))]
      .filter((letter) => data.letterPool.some((it) => it.arabic === letter))
      .map((letter) => ({ word, letter, itemKey: `${GAME_ID}/${word.arabic}/${letter}` })),
  );
}

registerGame({
  id: GAME_ID,
  label: "🔍 Spot the letter",
  exemplars: (data) =>
    spotExemplars(data).map((e) => ({ conceptId: e.letter, itemKey: e.itemKey })),
  render: ({ data, onResult, item }) => {
    const words = data ? spottableWords(data.wordPool) : [];
    const planned = pickExemplar(spotExemplars(data), (e) => e.itemKey, item?.itemKey);
    return data && words.length > 0 ? (
      <SpotTheLetter
        // The planned word first, and the rest of the list behind it, so "Next
        // word →" still walks the lesson's words rather than restarting.
        words={startWith(words, (w) => w.arabic, planned?.word.arabic)}
        pool={data.letterPool}
        focus={planned?.letter}
        onResult={onResult}
      />
    ) : (
      <p className="text-white/50">No words to search yet.</p>
    );
  },
});
