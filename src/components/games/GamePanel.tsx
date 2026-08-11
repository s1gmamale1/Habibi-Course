"use client";
import { useMemo, useState } from "react";
import type { GameData } from "@/games/derive";
import { baseLetters, displayLetters } from "@/games/arabic";
import { Flashcards, LetterFlashcards, wordCards } from "./Flashcards";
import { FormSwap } from "./FormSwap";
import { WordBuilder } from "./WordBuilder";
import { SpotTheLetter } from "./SpotTheLetter";
import { LetterQuiz } from "./LetterQuiz";
import { getGames, type GameResult } from "./GameRegistry";

export function GamePanel({
  data,
  heading = "Practice games",
  games = [],
  onResult,
}: {
  data: GameData;
  heading?: string;
  /** Drill ids this lesson wants, resolved through the registry. */
  games?: string[];
  onResult?: (r: GameResult) => void;
}) {
  const [tab, setTab] = useState(0);
  const builderWords = useMemo(
    () =>
      data.wordPool.filter((w) => {
        const l = baseLetters(w.arabic);
        return l.length >= 2 && l.length <= 6 && new Set(l).size >= 2;
      }),
    [data],
  );
  // Normalize the same way SpotTheLetter picks its target (letters as written),
  // so the "has ≥2 distinct letters" gate and the target picker agree.
  const spotWords = useMemo(() => data.wordPool.filter((w) => new Set(displayLetters(w.arabic)).size >= 2), [data]);
  const quizPool = useMemo(() => data.letterPool.filter((it) => it.name), [data]);

  const tabs = [
    {
      label: "🃏 Letter cards",
      show: data.letterPool.length > 0,
      render: () => <LetterFlashcards newLetters={data.newLetters} allLetters={data.letterPool} />,
    },
    {
      label: "❓ Quiz",
      show: quizPool.length >= 4,
      render: () => <LetterQuiz pool={quizPool} entries={data.formEntries} formsTaught={data.formsTaught} />,
    },
    {
      label: "🔀 Forms",
      show: data.formsTaught && data.formEntries.length > 0,
      render: () => <FormSwap entries={data.formEntries} />,
    },
    { label: "🧩 Build a word", show: builderWords.length > 0, render: () => <WordBuilder words={builderWords} /> },
    {
      label: "🔍 Spot the letter",
      show: spotWords.length > 0,
      render: () => <SpotTheLetter words={spotWords} pool={data.letterPool} />,
    },
    { label: "📖 Word cards", show: data.wordPool.length > 0, render: () => <Flashcards cards={wordCards(data.wordPool)} /> },
    // Drills a lesson asks for by id, resolved through the registry. Additive:
    // when `games` is absent — every Phase 1 lesson — this contributes nothing
    // and the panel behaves exactly as before. Unknown ids are dropped by
    // `getGames`, so a lesson naming a drill that has not shipped degrades to
    // the drills that exist rather than breaking the page.
    ...getGames(games).map((g) => ({
      label: g.label,
      show: true,
      render: () => g.render({ onResult }),
    })),
  ].filter((t) => t.show);

  if (tabs.length === 0) return null;
  const active = tabs[Math.min(tab, tabs.length - 1)];

  return (
    <div className="text-center">
      <h2 className="mb-1 text-3xl font-bold text-white">{heading}</h2>
      <p className="mb-4 text-sm text-white/60">
        Self-check games built from the {data.letterPool.length} letter{data.letterPool.length === 1 ? "" : "s"} you&apos;ve
        learned so far.
      </p>
      <div className="mb-5 flex flex-wrap justify-center gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            type="button"
            onClick={() => setTab(i)}
            className={`rounded-full px-3 py-1.5 text-sm ${t === active ? "cta-primary" : "cta-secondary"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {active.render()}
    </div>
  );
}
