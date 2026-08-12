"use client";
import { useState } from "react";
import type { FormEntry, FormKey } from "@/games/derive";
import { registerGame, type GameResult } from "./GameRegistry";
import { isCorrect, useSwapPuzzle } from "./useSwapPuzzle";

/** Declared here rather than beside `registerGame` so the drill can report under it. */
const GAME_ID = "form-swap";

// Keyed by FormKey so adding a form to derive.ts fails here until it gets a label,
// rather than this file quietly defining its own parallel notion of what a form is.
const FORM_LABELS: Record<FormKey, string> = {
  isolated: "Alone",
  initial: "Start",
  medial: "Middle",
  final: "End",
};

/**
 * **One attempt per completed swap.**
 *
 * A swap is this drill's graded move — the board renders a verdict for it, green-
 * locking a tile that landed or shaking one that did not — so it is the unit
 * `FamilySorter` and `ConditionBuilder` would each call one placement.
 *
 * Selecting the first tile of a pair is *half* a move and carries no verdict at
 * all, so it reports nothing rather than `correct: null`. `null` is for a round
 * the drill genuinely could not grade; a null row per tile-select would be pure
 * volume in an append-only ledger, and `derive()` would skip every one of them.
 */
export function FormSwap({
  entries,
  onResult,
  now = () => Date.now(),
}: {
  entries: FormEntry[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const entry = entries[round % entries.length];
  const keys = (Object.keys(FORM_LABELS) as FormKey[]).filter((k) => entry.forms[k]);
  const values = keys.map((k) => entry.forms[k]!);
  const p = useSwapPuzzle(values, round, (correct) =>
    onResult?.({ gameId: GAME_ID, correct, at: now() }),
  );

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
          const correct = isCorrect(values, p.order!, slot);
          const shaking = p.shake?.slot === slot;
          return (
            <div key={k} className="text-center">
              <button
                key={shaking ? `s${p.shake!.n}` : "s"}
                type="button"
                aria-label={`${FORM_LABELS[k]} slot`}
                // Locked-correct tiles and a finished puzzle both ignore clicks. aria-disabled
                // rather than `disabled` so they stay reachable for review without reading as
                // actionable — the board is the answer once solved.
                aria-disabled={correct || p.solved}
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

/* ---------- registration ---------------------------------------------- */

/**
 * **Discrimination.** Four glyphs of one letter are on the board and the task is
 * to tell them apart — which of these is the *medial* sīn — not to recall or
 * produce anything. Every candidate is visible; what is being trained is the
 * difference between them. That is the same task `family-sorter` sets, and it
 * is classified the same way: an assignment of given items to given slots.
 *
 * Gated on `formsTaught` as well as on having entries: forms are introduced in
 * lesson 1-07, and `deriveGameData` carries the flag precisely so this drill
 * does not appear before the course has explained what a form is.
 *
 * `GAME_ID` is declared at the top of the file — the drill reports under it.
 */
registerGame({
  id: GAME_ID,
  label: "🔀 Forms",
  render: ({ data, onResult }) =>
    data && data.formsTaught && data.formEntries.length > 0 ? (
      <FormSwap entries={data.formEntries} onResult={onResult} />
    ) : (
      <p className="text-white/50">No letter forms to arrange yet.</p>
    ),
});
