"use client";
import { useEffect, useState } from "react";
import type { WordEntry } from "@/games/derive";
import { displayLetters } from "@/games/arabic";
import { shuffled } from "./useSwapPuzzle";

const MAX_DECOYS = 2;

// Decoy candidates: written letters from every OTHER word's arabic (by index,
// excluding `targetIndex`), minus letters already in the target word, deduped
// (Set) and shuffled before slicing so the same decoys aren't picked every
// round. Empty when only one word is supplied (early lessons) — 0 is fine.
export function pickDecoys(letters: string[], arabics: string[], targetIndex: number): string[] {
  const own = new Set(letters);
  const pool = new Set<string>();
  arabics.forEach((arabic, i) => {
    if (i === targetIndex) return;
    for (const l of displayLetters(arabic)) if (!own.has(l)) pool.add(l);
  });
  return shuffled([...pool]).slice(0, MAX_DECOYS);
}

export type BuildPuzzle = {
  letters: string[];
  bank: string[] | null;
  slots: (number | null)[];
  shake: { slots: number[]; n: number } | null;
  solved: boolean;
  decoyCount: number;
  placeFromBank: (bankIdx: number) => void;
  removeFromSlot: (slotIdx: number) => void;
};

// Slot-and-bank builder for `words[round % words.length]`. Bank = the word's
// letters as written (displayLetters, so a hamza-carrier tile reads أ and not
// ا) plus up to two decoys pulled from the other words. Bank tiles
// are matched to slots by index and checked by value, so duplicate letters
// resolve positionally (mirrors useSwapPuzzle's value-equality locking).
// `round` forces a reshuffle; the shuffle itself runs in an effect so SSR
// markup stays stable.
//
// `onFill` fires once per COMPLETED board, with the verdict computed below. It
// is deliberately not per placement: this puzzle does not grade a single tile —
// a letter dropped into slot 2 while slot 3 is empty is neither right nor wrong,
// and the board says nothing about it — so completion is the only moment a real
// observation exists. Reporting per tap would mean inventing verdicts for moves
// nothing ever graded, and a partial board reported `false` would be the
// fabricated failure the ledger must never carry.
export function useBuildPuzzle(
  words: WordEntry[],
  round: number,
  onFill?: (correct: boolean) => void,
): BuildPuzzle {
  const [bank, setBank] = useState<string[] | null>(null);
  const [decoyCount, setDecoyCount] = useState(0);
  const [slots, setSlots] = useState<(number | null)[]>([]);
  const [shake, setShake] = useState<{ slots: number[]; n: number } | null>(null);
  const [solved, setSolved] = useState(false);

  const targetIndex = round % words.length;
  const letters = displayLetters(words[targetIndex].arabic);
  // Joined-string key, not the array itself — an inline `words` literal from
  // the caller gets a new reference every render, which would otherwise
  // reshuffle (and thus setState) on every render. See useSwapPuzzle's
  // `valueKey` for the same trick.
  const arabicsKey = words.map((w) => w.arabic).join("");

  useEffect(() => {
    const arabics = arabicsKey.split("");
    const idx = round % arabics.length;
    const wordLetters = displayLetters(arabics[idx]);
    const decoys = pickDecoys(wordLetters, arabics, idx);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- round-keyed shuffle must run client-side only; render-time shuffle would mismatch SSR HTML
    setBank(shuffled([...wordLetters, ...decoys]));
    setDecoyCount(decoys.length);
    setSlots(wordLetters.map(() => null));
    setShake(null);
    setSolved(false);
  }, [round, arabicsKey]);

  function placeFromBank(bankIdx: number) {
    if (!bank || solved) return;
    if (slots.includes(bankIdx)) return; // already placed
    const target = slots.findIndex((s) => s === null);
    if (target === -1) return;
    const next = [...slots];
    next[target] = bankIdx;
    if (!next.every((s) => s !== null)) {
      setSlots(next);
      return;
    }
    const filled = next as number[];
    const wrong = filled.reduce<number[]>((acc, bIdx, i) => (bank[bIdx] === letters[i] ? acc : [...acc, i]), []);
    // The board is full, so there is finally something to grade. One report per
    // completed fill, whichever way it went.
    onFill?.(wrong.length === 0);
    if (wrong.length === 0) {
      setSlots(next);
      setSolved(true);
      setShake(null);
    } else {
      setSlots(next.map((bIdx, i) => (wrong.includes(i) ? null : bIdx)));
      setShake({ slots: wrong, n: (shake?.n ?? 0) + 1 });
    }
  }

  function removeFromSlot(slotIdx: number) {
    if (!bank || solved) return;
    const bIdx = slots[slotIdx];
    if (bIdx === null) return;
    if (bank[bIdx] === letters[slotIdx]) return; // locked correct — no take-back
    const next = [...slots];
    next[slotIdx] = null;
    setSlots(next);
  }

  return { letters, bank, slots, shake, solved, decoyCount, placeFromBank, removeFromSlot };
}
