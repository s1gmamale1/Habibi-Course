"use client";
import { useState } from "react";
import type { FormEntry } from "@/games/derive";
import { useSwapPuzzle } from "./useSwapPuzzle";

const FORM_LABELS = { isolated: "Alone", initial: "Start", medial: "Middle", final: "End" } as const;
type FormKey = keyof typeof FORM_LABELS;

export function FormSwap({ entries }: { entries: FormEntry[] }) {
  const [round, setRound] = useState(0);
  const entry = entries[round % entries.length];
  const keys = (Object.keys(FORM_LABELS) as FormKey[]).filter((k) => entry.forms[k]);
  const values = keys.map((k) => entry.forms[k]!);
  const p = useSwapPuzzle(values, round);

  if (!p.order) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        Put each form of <span className="arabic text-2xl">{entry.item.arabic}</span>
        {entry.item.name ? ` (${entry.item.name})` : ""} in its correct position.
      </p>
      <p className="mb-4 text-xs text-white/50">Tap two tiles to swap them. Correct tiles lock green.</p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-4">
        {keys.map((k, slot) => {
          const correct = values[p.order![slot]] === values[slot];
          const shaking = p.shake?.slot === slot;
          return (
            <div key={k} className="text-center">
              <button
                key={shaking ? `s${p.shake!.n}` : "s"}
                type="button"
                aria-label={`${FORM_LABELS[k]} slot`}
                onClick={() => p.select(slot)}
                className={`arabic min-w-20 rounded-2xl border px-4 py-3 text-4xl text-white transition ${
                  correct ? "game-correct" : p.selected === slot ? "border-sky-300/70 bg-sky-400/10" : "border-white/15 bg-white/5"
                } ${shaking ? "game-shake" : ""}`}
              >
                {values[p.order![slot]]}
              </button>
              <p className="mt-1 text-xs text-white/50">{FORM_LABELS[k]}</p>
            </div>
          );
        })}
      </div>
      {p.solved && (
        <div className="mt-4">
          <p className="mb-2 text-green-300">✓ All forms in place!</p>
          <button type="button" className="cta-primary rounded-full px-4 py-2" onClick={() => setRound((r) => r + 1)}>
            Next letter →
          </button>
        </div>
      )}
    </div>
  );
}
