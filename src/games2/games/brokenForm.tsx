"use client";
import { useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "broken-form";

export type BrokenFormPayload = {
  word: string;
  meaning: string;
  /** Per-letter glyphs as displayed, one already swapped to the wrong form. */
  glyphs: string[];
  brokenIndex: number;
  letter: string;
};

/** Which positional form a letter at index `i` of `n` should take. */
function correctForm(i: number, n: number): "isolated" | "initial" | "medial" | "final" {
  if (n === 1) return "isolated";
  if (i === 0) return "initial";
  if (i === n - 1) return "final";
  return "medial";
}

/**
 * One question per (word, letter) pair the course has taught full forms for.
 *
 * The broken glyph is always another REAL form of the same letter. Substituting
 * a random glyph would turn this into spot-the-garbage; the teaching point is
 * that تـ and ـت are both correct Arabic and only one of them belongs at the
 * end of a word.
 */
export function brokenFormQuestions(set: StudySet): Question[] {
  const out: Question[] = [];
  const byLetter = new Map(set.forms.map((f) => [f.item.arabic, f]));

  for (const word of set.words) {
    const letters = displayLetters(word.arabic);
    if (letters.length < 2) continue;
    for (let i = 0; i < letters.length; i += 1) {
      const entry = byLetter.get(letters[i]);
      if (!entry) continue;
      const want = correctForm(i, letters.length);
      const right = entry.forms[want];
      const wrong = (Object.entries(entry.forms) as [string, string][])
        .filter(([k, v]) => k !== want && v && v !== right)
        .map(([, v]) => v)[0];
      if (!right || !wrong) continue;

      const glyphs = letters.map((l, j) => {
        const e = byLetter.get(l);
        return e?.forms[correctForm(j, letters.length)] ?? l;
      });
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
