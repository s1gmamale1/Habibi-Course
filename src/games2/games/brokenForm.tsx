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

/**
 * All four positional forms of a bare (ZWJ-free) letter, built the same way
 * `contextualGlyphs` builds them — ZWJ padding around the same base glyph,
 * never a tatweel. Keeping the wrong glyph on this same construction is what
 * makes it indistinguishable from a bystander by rendering style alone: a
 * tatweel-sourced wrong glyph (from `entry.forms`) is a visible tell that
 * lets a learner spot the broken letter without knowing any joining rule.
 */
function positionalGlyphs(base: string): Record<FormKey, string> {
  return {
    isolated: base,
    initial: `${base}${ZWJ}`,
    medial: `${ZWJ}${base}${ZWJ}`,
    final: `${ZWJ}${base}`,
  };
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
 * Every glyph — broken and bystander alike — comes from the same mechanism:
 * a bare letter re-wrapped in one of the four ZWJ join configurations that
 * `contextualGlyphs` itself uses. The wrong form is chosen deterministically
 * (a stable hash of word+index, never `Math.random()` — questions must be
 * reproducible from the ledger) rather than always the first candidate,
 * which in authoring order was always "isolated" and made every shipped
 * question spot-the-disconnected-letter instead of testing the actual
 * positional confusion. Sourcing it from `entry.forms` (the lesson JSON,
 * which authors positional forms with a literal tatweel U+0640) was an
 * earlier version of the same defect via a different tell: a tatweel-sourced
 * glyph is visually distinguishable from a ZWJ-shaped bystander regardless of
 * whether the join is correct, so a learner could just tap the glyph with the
 * dash strokes. `set.forms` (the FormEntry list) still gates ELIGIBILITY — a
 * letter needs ≥3 authored forms for its positional confusion to be a
 * meaningful lesson — it just no longer supplies the glyph text itself.
 */
export function brokenFormQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  const byLetter = new Map(set.forms.map((f) => [f.item.arabic, f]));

  for (const word of set.words) {
    const letters = displayLetters(word.arabic);
    if (letters.length < 2) continue;
    const shaped = contextualGlyphs(word.arabic);

    for (let i = 0; i < letters.length; i += 1) {
      if (!byLetter.has(letters[i])) continue;
      const want = formKeyOf(shaped[i]);
      const base = shaped[i].split(ZWJ).join("");
      const configs = positionalGlyphs(base);
      const candidateKeys = (Object.keys(configs) as FormKey[]).filter((k) => k !== want);
      const wrong = configs[candidateKeys[stableIndex(`${word.arabic}:${i}`, candidateKeys.length)]];

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
