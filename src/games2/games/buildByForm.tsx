"use client";
import { useState } from "react";
import { baseLetters, contextualGlyphs, displayLetters } from "@/games/arabic";
import type { FormKey } from "@/games/derive";
import { stableIndex } from "./brokenForm";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "build-by-form";
const ZWJ = "\u200D";

export type BuildByFormPayload = {
  word: string;
  slots: FormKey[];
  tiles: string[];
  answer: string[];
};

/**
 * Which positional form a shaped glyph represents, read back off the ZWJ
 * padding `contextualGlyphs` wrapped it in. Duplicated from `brokenForm.tsx`
 * rather than imported — that file is Task 6's, not to be modified here, and
 * this is the same few lines its own docstring explains: reading the joining
 * decision off the glyph itself instead of re-deriving it from index
 * arithmetic, which breaks on the six non-connectors and hamza-carriers.
 */
function formKeyOf(shapedGlyph: string): FormKey {
  const joinsPrev = shapedGlyph.charAt(0) === ZWJ;
  const joinsNext = shapedGlyph.charAt(shapedGlyph.length - 1) === ZWJ;
  if (joinsPrev && joinsNext) return "medial";
  if (joinsPrev) return "final";
  if (joinsNext) return "initial";
  return "isolated";
}

/**
 * A deterministic permutation of `glyphs` — Fisher-Yates seeded by
 * `stableIndex`, never `Math.random()`. Questions must be reproducible from
 * the ledger, and the order is computed once here (not at render time), so
 * the shuffled tile order is baked into the payload and never mismatches the
 * SSR markup.
 */
function shuffleGlyphs(glyphs: string[], seed: string): string[] {
  const arr = [...glyphs];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = stableIndex(`${seed}:shuffle:${i}`, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * One question per word: reconstruct it from its own positional-form tiles.
 *
 * Every tile — in the bank and in the answer alike — is a glyph built by
 * `contextualGlyphs`, the same single mechanism `brokenForm` uses for the
 * same reason: a tile whose shape differs for an incidental reason (a
 * tatweel, an extra ZWJ) is a tell a learner can exploit without knowing any
 * joining rule. There is no distractor here — every tile belongs in the
 * answer, at exactly one position — so this game tests only whether the
 * learner can read the shapes back into reading order, never meaning or
 * transliteration.
 */
export function buildByFormQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  for (const word of set.words) {
    const letters = displayLetters(word.arabic);
    if (letters.length < 2) continue;
    const concept = baseLetters(word.arabic)[0];
    if (!concept) continue;

    const answer = contextualGlyphs(word.arabic);
    const slots = answer.map((g) => formKeyOf(g));
    const tiles = shuffleGlyphs(answer, word.arabic);

    out.push({
      conceptId: concept,
      itemKey: `${GAME_ID}/${word.arabic}`,
      gameId: GAME_ID,
      payload: { word: word.arabic, slots, tiles, answer } satisfies BuildByFormPayload,
    });
  }
  return out;
}

/**
 * One verdict per COMPLETED word, never per tile.
 *
 * A tile placed while the word is unfinished is not right or wrong yet, and
 * grading it would put a claim in an append-only ledger that no observation
 * supports — the same shape `word-bank` (deleted) and `brokenForm` already
 * have.
 */
export function BuildByForm({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as BuildByFormPayload;
  const [bank, setBank] = useState<string[]>(p.tiles);
  const [built, setBuilt] = useState<string[]>([]);
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const done = verdict !== null;

  function place(i: number) {
    if (done) return;
    const tile = bank[i];
    const nextBank = bank.filter((_, j) => j !== i);
    const nextBuilt = [...built, tile];
    setBank(nextBank);
    setBuilt(nextBuilt);
    if (nextBuilt.length === p.answer.length) {
      const ok = nextBuilt.join("") === p.answer.join("");
      setVerdict(ok);
      api.answer(ok);
    }
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">Place the letters in reading order, right to left.</p>
      <div
        dir="rtl"
        className="mb-4 flex min-h-16 flex-wrap items-center justify-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2"
      >
        {p.slots.map((_, i) => (
          <span
            key={i}
            className="arabic flex h-14 w-12 items-center justify-center rounded-lg border border-dashed border-white/20 text-4xl text-white"
          >
            {built[i] ?? ""}
          </span>
        ))}
      </div>

      <div dir="rtl" className="flex flex-wrap justify-center gap-2">
        {bank.map((t, i) => (
          <button
            key={`${t}-${i}`}
            type="button"
            data-testid={`tile-${i}`}
            onClick={() => place(i)}
            className="arabic rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-4xl text-white"
          >
            {t}
          </button>
        ))}
      </div>

      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : verdict ? "✓ correct order" : `✗ the correct order spells ${p.word}`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "🧱 Build by form",
  mode: "production",
  cost: 1,
  graded: true,
  questions: buildByFormQuestions,
  render: (q, api) => <BuildByForm q={q} api={api} />,
});
