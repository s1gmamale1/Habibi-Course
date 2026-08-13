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

/**
 * Drop any word whose normalised transliteration collides with another
 * word's in the same set — computed from `set.words`, not a global list, so
 * it stays correct as content grows.
 *
 * `normaliseTranslit` is deliberately lenient (a learner on an English
 * keyboard cannot type ā, ḍ or ʿ), and that leniency is correct — but it
 * means two genuinely different words can fold to the same normalised form:
 * on lesson 2-08, `dafʿ` (payment) and `ḍaʿf` (weakness) both become `"daf"`.
 * Asking either would grade the learner correct no matter which word they
 * were shown, and the ledger would record a concept they may not know. A
 * question the game cannot grade fairly should not be asked, so the pair is
 * excluded rather than the matcher tightened.
 */
export function typeItQuestions(set: StudySet): Question[] {
  const counts = new Map<string, number>();
  for (const w of set.words) {
    const key = normaliseTranslit(w.translit);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return set.words.flatMap((w) => {
    const conceptId = displayLetters(w.arabic)[0];
    if (!conceptId) return [];
    if ((counts.get(normaliseTranslit(w.translit)) ?? 0) > 1) return [];
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
