"use client";
import { useState } from "react";
import type { WordEntry } from "@/games/derive";
import { baseLetters } from "@/games/arabic";
import { registerGame, type GameResult } from "./GameRegistry";
import { useBuildPuzzle } from "./useBuildPuzzle";

/** Declared here rather than beside `registerGame` so the drill can report under it. */
const GAME_ID = "word-builder";

/**
 * **One attempt per completed fill.**
 *
 * Alone among these drills, nothing here grades a single placement: a tile in
 * slot 2 with slot 3 still empty is neither right nor wrong, and the board says
 * nothing about it. The verdict arrives when the last slot fills and the whole
 * word is checked at once, which makes completion the only moment a real
 * observation exists. That is the shape `span-tapper` already has — one verdict
 * per round — and a take-back reports nothing, because undoing a move is not an
 * answer to anything.
 */
export function WordBuilder({
  words,
  onResult,
  now = () => Date.now(),
}: {
  words: WordEntry[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const word = words[round % words.length];
  const p = useBuildPuzzle(words, round, (correct) =>
    onResult?.({ gameId: GAME_ID, correct, at: now() }),
  );

  if (!p.bank) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Arrange the letters to build <span className="font-semibold">{word.translit}</span> (“{word.meaning}”).
      </p>
      <p className="mb-4 text-xs text-white/50">
        Tap letters to fill the word — it reads right to left. Tap a filled box to take a letter back.
        {p.decoyCount > 0 && " Watch out: some letters don't belong."}
      </p>
      <div dir="rtl" className="mb-4 flex flex-wrap justify-center gap-3">
        {p.letters.map((expected, slot) => {
          const bankIdx = p.slots[slot];
          const filled = bankIdx !== null;
          const correct = filled && p.bank![bankIdx] === expected;
          const shaking = p.shake?.slots.includes(slot) ?? false;
          return (
            <button
              key={`${slot}-${shaking ? p.shake!.n : 0}`}
              type="button"
              aria-label={`slot ${slot + 1}`}
              onClick={() => p.removeFromSlot(slot)}
              disabled={!filled}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                correct ? "game-correct" : filled ? "border-sky-300/70 bg-sky-400/10" : "border-dashed border-white/20 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              {filled ? p.bank![bankIdx] : ""}
            </button>
          );
        })}
      </div>
      <div dir="rtl" className="flex flex-wrap justify-center gap-3">
        {p.bank.map((glyph, idx) => {
          const used = p.slots.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              aria-label={`bank letter ${glyph} ${idx + 1}`}
              onClick={() => p.placeFromBank(idx)}
              disabled={used}
              className={`arabic min-w-16 rounded-2xl border px-4 py-3 text-4xl transition ${
                used ? "border-white/5 bg-white/0 text-transparent" : "border-white/15 bg-white/5 text-white"
              }`}
            >
              {used ? "" : glyph}
            </button>
          );
        })}
      </div>
      {p.solved && (
        <div className="mt-4">
          <p className="arabic text-5xl text-white">{word.arabic}</p>
          <p className="mt-1 text-green-300">✓ {word.translit} — {word.meaning}</p>
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
 * Words this drill can build: long enough to be a puzzle, short enough to fit
 * a row, and with at least two distinct letters so the board is not one glyph
 * repeated. Exported so `GamePanel`'s tab gate and this drill's own gate stay
 * one definition rather than two that can drift.
 */
export function buildableWords(words: WordEntry[]): WordEntry[] {
  return words.filter((w) => {
    const l = baseLetters(w.arabic);
    return l.length >= 2 && l.length <= 6 && new Set(l).size >= 2;
  });
}

/**
 * **Production.** Nothing on the board is the answer — the answer is the
 * sequence the learner assembles, and the bank carries decoys that belong to no
 * slot at all. This is the only letter drill where a wrong answer can be
 * *constructed* rather than merely selected, which is what puts it at the top of
 * the ramp alongside `condition-builder`.
 *
 * It is **not** timed. Nothing here holds a duration; the second slot is what a
 * ḥarakāt hold costs, and charging it for a tapping puzzle would spend a slot
 * the learner never uses.
 *
 * `GAME_ID` is declared at the top of the file — the drill reports under it.
 */
registerGame({
  id: GAME_ID,
  label: "🧩 Build a word",
  render: ({ data, onResult }) => {
    const words = data ? buildableWords(data.wordPool) : [];
    return words.length > 0 ? (
      <WordBuilder words={words} onResult={onResult} />
    ) : (
      <p className="text-white/50">No words to build yet.</p>
    );
  },
});
