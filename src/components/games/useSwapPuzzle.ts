"use client";
import { useEffect, useState } from "react";

export function shuffled<T>(arr: readonly T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Slot `slot` is satisfied when the tile sitting in it carries the value that slot wants.
// Compared by VALUE, not by tile index, so a word with duplicate letters counts every
// arrangement that reads correctly as solved. Every correctness check in this file goes
// through here — they had drifted into four near-identical inline forms.
export function isCorrect(values: readonly string[], order: readonly number[], slot: number): boolean {
  return values[order[slot]] === values[slot];
}

const allCorrect = (values: readonly string[], order: readonly number[]): boolean =>
  order.every((_, slot) => isCorrect(values, order, slot));

// Permutation of tile indices that is not already value-solved (n >= 2 distinct).
export function shuffledUnsolved(values: readonly string[]): number[] {
  const ids = values.map((_, i) => i);
  if (new Set(values).size < 2) return ids;
  let a = shuffled(ids);
  while (allCorrect(values, a)) a = shuffled(ids);
  return a;
}

export type SwapPuzzle = {
  order: number[] | null;
  selected: number | null;
  shake: { slot: number; n: number } | null;
  solved: boolean;
  select: (slot: number) => void;
};

// Tap-two-to-swap puzzle over `values`; slot i wants a tile whose value equals
// values[i] (value equality so duplicate letters in a word all count). `round`
// bumps force a reshuffle. Shuffle runs in an effect — SSR markup stays stable.
//
// `onSwap` fires once per COMPLETED swap, with the verdict this hook already
// computes for the shake. It lives here rather than in the caller because
// `gained` is the one definition of "did that move achieve anything", and a
// second copy in FormSwap would be a fifth near-identical correctness check in a
// file whose comment above already records what happened the last time there
// were four. Selecting or deselecting a tile is half a move and fires nothing:
// there is no verdict to report, and a fabricated one is exactly what the
// ledger's append-only contract cannot survive.
export function useSwapPuzzle(
  values: string[],
  round: number,
  onSwap?: (correct: boolean) => void,
): SwapPuzzle {
  const [order, setOrder] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [shake, setShake] = useState<{ slot: number; n: number } | null>(null);
  const valueKey = values.join("\u0001");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/round-keyed shuffle must run client-side only; render-time shuffle would mismatch SSR HTML
    setOrder(shuffledUnsolved(valueKey.split("\u0001")));
    setSelected(null);
    setShake(null);
  }, [valueKey, round]);

  const solved = order !== null && allCorrect(values, order);

  function select(slot: number) {
    if (!order || solved) return;
    if (isCorrect(values, order, slot)) return; // locked correct
    if (selected === null) {
      setSelected(slot);
      return;
    }
    if (selected === slot) {
      setSelected(null);
      return;
    }
    const next = [...order];
    [next[selected], next[slot]] = [next[slot], next[selected]];
    const gained =
      (isCorrect(values, next, selected) ? 1 : 0) + (isCorrect(values, next, slot) ? 1 : 0);
    onSwap?.(gained > 0);
    setOrder(next);
    setSelected(null);
    setShake(gained === 0 ? { slot, n: (shake?.n ?? 0) + 1 } : null);
  }

  return { order, selected, shake, solved, select };
}
