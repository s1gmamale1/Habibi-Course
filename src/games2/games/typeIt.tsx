"use client";
import { useState } from "react";
import { displayLetters } from "@/games/arabic";
import { registerGame } from "../registry";
import type { GameApi, Question, StudySet } from "../types";

const GAME_ID = "type-it";

export type TypeItPayload = { arabic: string; translit: string; meaning: string };

/**
 * Fold the transliteration to what the learner is actually being asked to
 * recall: the word, not a diacritic convention. `bāb`, `bab` and `baab` are the
 * same answer; `bayt` is not.
 */
export function normaliseTranslit(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")   // strip macrons and any other marks
    .replace(/([aiu])\1+/g, "$1")       // aa/ii/uu collapse to the short vowel
    .replace(/[^a-z']/g, "");
}

export function typeItQuestions(set: StudySet): Question[] {
  return set.words.flatMap((w) => {
    const conceptId = displayLetters(w.arabic)[0];
    if (!conceptId) return [];
    return [{
      conceptId,
      itemKey: `${GAME_ID}/${w.arabic}`,
      gameId: GAME_ID,
      payload: { arabic: w.arabic, translit: w.translit, meaning: w.meaning } satisfies TypeItPayload,
    }];
  });
}

export function TypeIt({ q, api }: { q: Question; api: GameApi }) {
  const p = q.payload as TypeItPayload;
  const [value, setValue] = useState("");
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const done = verdict !== null;

  function check() {
    if (done || !value.trim()) return;
    const ok = normaliseTranslit(value) === normaliseTranslit(p.translit);
    setVerdict(ok);
    api.answer(ok);
  }

  return (
    <div className="text-center">
      <p className="arabic mb-2 text-5xl text-white">{p.arabic}</p>
      <p className="mb-4 text-sm text-white/60">“{p.meaning}” — type it in English letters</p>
      <input
        aria-label="transliteration"
        dir="ltr"
        value={value}
        disabled={done}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && check()}
        className="rounded-xl border border-white/15 bg-white/5 px-4 py-2 text-center text-white"
      />
      <div className="mt-3">
        <button
          type="button"
          disabled={done || !value.trim()}
          onClick={check}
          className="cta-primary rounded-full px-4 py-2 disabled:opacity-40"
        >
          Check
        </button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 text-sm text-white/80">
        {!done ? "" : verdict ? `✓ ${p.translit}` : `✗ ${p.arabic} is written “${p.translit}”.`}
      </p>
    </div>
  );
}

registerGame({
  id: GAME_ID,
  label: "⌨️ Type it",
  mode: "production",
  cost: 1,
  graded: true,
  questions: typeItQuestions,
  render: (q, api) => <TypeIt q={q} api={api} />,
});
