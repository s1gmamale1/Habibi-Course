"use client";
import { useState } from "react";
import { contextualGlyphs, displayLetters } from "@/games/arabic";
import type { FormKey } from "@/games/derive";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "broken-form";
const ZWJ = "\u200D";

export type BrokenFormPayload = {
  word: string;
  meaning: string;
  /** Per-letter glyphs as displayed, one already swapped to the wrong form. */
  glyphs: string[];
  brokenIndex: number;
  letter: string;
};

/**
 * Which positional form a CORRECTLY shaped glyph actually represents.
 *
 * Reads the joining decision back off `contextualGlyphs`' ZWJ padding instead
 * of re-deriving it from index arithmetic ("first letter = initial, last =
 * final"). That arithmetic is wrong the moment a non-connector (ا د ذ ر ز و)
 * or a non-forward-joining hamza-carrier sits before the letter in question —
 * contextualGlyphs already knows those rules, so this reuses its answer
 * rather than re-encoding it.
 */
function formKeyOf(shapedGlyph: string): FormKey {
  const joinsPrev = shapedGlyph.charAt(0) === ZWJ;
  const joinsNext = shapedGlyph.charAt(shapedGlyph.length - 1) === ZWJ;
  if (joinsPrev && joinsNext) return "medial";
  if (joinsPrev) return "final";
  if (joinsNext) return "initial";
  return "isolated";
}

/** Deterministic (non-random) index into [0, mod) — questions must be reproducible from the ledger. */
function stableIndex(seed: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % mod;
}

/**
 * One question per (word, letter) pair the course has taught full forms for.
 *
 * The broken glyph is always another REAL form of the same letter, chosen
 * deterministically rather than always the first candidate (which, in
 * authoring order, is always "isolated" — that made every shipped question
 * spot-the-disconnected-letter instead of testing the actual positional
 * confusion). Substituting a random glyph would turn this into
 * spot-the-garbage; the teaching point is that تـ and ـت are both correct
 * Arabic and only one of them belongs at the end.
 *
 * Bystander letters are rendered through `contextualGlyphs` — the same
 * machinery the rest of the games use — so a non-connector or a letter that
 * has no taught FormEntry (only ≥3-form letters get one) still renders in its
 * true shape instead of falling back to a bare, unshaped glyph.
 */
export function brokenFormQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  const byLetter = new Map(set.forms.map((f) => [f.item.arabic, f]));

  for (const word of set.words) {
    const letters = displayLetters(word.arabic);
    if (letters.length < 2) continue;
    const shaped = contextualGlyphs(word.arabic);

    for (let i = 0; i < letters.length; i += 1) {
      const entry = byLetter.get(letters[i]);
      if (!entry) continue;
      const want = formKeyOf(shaped[i]);
      const right = entry.forms[want];
      const candidates = (Object.entries(entry.forms) as [FormKey, string][])
        .filter(([k, v]) => k !== want && v && v !== right)
        .map(([, v]) => v);
      if (!right || candidates.length === 0) continue;
      const wrong = candidates[stableIndex(`${word.arabic}:${i}`, candidates.length)];

      const glyphs = [...shaped];
      glyphs[i] = wrong;

      out.push({
        conceptId: letters[i],
        itemKey: `${GAME_ID}/${word.arabic}/${i}`,
        gameId: GAME_ID,
        payload: { word: word.arabic, meaning: word.meaning, glyphs, brokenIndex: i, letter: letters[i] } satisfies BrokenFormPayload,
      });
    }
  }
  return out;
}

export function BrokenForm({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as BrokenFormPayload;
  const [picked, setPicked] = useState<number | null>(null);
  const done = picked !== null;

  function tap(i: number) {
    if (done) return;
    setPicked(i);
    api.answer(i === p.brokenIndex);
  }

  return (
    <div className="text-center">
      <p className="mb-1 text-white/80">
        One letter is in the wrong form. Tap it.
      </p>
      <p className="mb-4 text-xs text-white/50">
        “{p.meaning}” — {p.word}
      </p>
      <div dir="rtl" className="flex flex-wrap justify-center gap-1">
        {p.glyphs.map((g, i) => (
          <button
            key={i}
            type="button"
            data-testid={`glyph-${i}`}
            aria-disabled={done}
            onClick={() => tap(i)}
            className={`arabic rounded-xl border px-3 py-2 text-5xl text-white ${
              done && i === p.brokenIndex
                ? "game-correct"
                : done && i === picked
                  ? "border-red-400/70 bg-red-500/15"
                  : "border-white/10 bg-white/5"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done
          ? ""
          : picked === p.brokenIndex
            ? `✓ ${p.letter} — that form does not belong in this position.`
            : `✗ The broken one is ${p.letter}: it is in the wrong position-form for where it sits in ${p.word}.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "🔧 Broken form",
  mode: "discrimination",
  cost: 1,
  graded: true,
  questions: brokenFormQuestions,
  render: (q, api) => <BrokenForm q={q} api={api} />,
});
