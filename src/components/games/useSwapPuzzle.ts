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

// Permutation of tile indices that is not already value-solved (n >= 2 distinct).
export function shuffledUnsolved(values: readonly string[]): number[] {
  const ids = values.map((_, i) => i);
  if (new Set(values).size < 2) return ids;
  let a = shuffled(ids);
  while (a.every((tile, slot) => values[tile] === values[slot])) a = shuffled(ids);
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
export function useSwapPuzzle(values: string[], round: number): SwapPuzzle {
  const [order, setOrder] = useState<number[] | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [shake, setShake] = useState<{ slot: number; n: number } | null>(null);
  const valueKey = values.join("\u0001");

  useEffect(() => {
    setOrder(shuffledUnsolved(valueKey.split("\u0001")));
    setSelected(null);
    setShake(null);
  }, [valueKey, round]);

  const solved = order !== null && order.every((tile, slot) => values[tile] === values[slot]);

  function select(slot: number) {
    if (!order || solved) return;
    if (values[order[slot]] === values[slot]) return; // locked correct
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
      (values[next[selected]] === values[selected] ? 1 : 0) +
      (values[next[slot]] === values[slot] ? 1 : 0);
    setOrder(next);
    setSelected(null);
    setShake(gained === 0 ? { slot, n: (shake?.n ?? 0) + 1 } : null);
  }

  return { order, selected, shake, solved, select };
}
