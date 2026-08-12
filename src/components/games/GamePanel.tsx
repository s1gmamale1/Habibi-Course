"use client";
import { useMemo, useState } from "react";
import type { GameData } from "@/games/derive";
import { Flashcards, LetterFlashcards, wordCards } from "./Flashcards";
import { FormSwap } from "./FormSwap";
import { WordBuilder, buildableWords } from "./WordBuilder";
import { SpotTheLetter, spottableWords } from "./SpotTheLetter";
import { LetterQuiz, QUIZ_MIN_LETTERS, quizzableLetters } from "./LetterQuiz";
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
  // Each gate lives beside the drill it gates, so this panel and the drill's own
  // registry entry cannot end up with two different answers to "is this playable".
  // `spottableWords` normalizes the same way SpotTheLetter picks its target
  // (letters as written), so the gate and the target picker agree.
  const builderWords = useMemo(() => buildableWords(data.wordPool), [data]);
  const spotWords = useMemo(() => spottableWords(data.wordPool), [data]);
  const quizPool = useMemo(() => quizzableLetters(data.letterPool), [data]);

  /**
   * `onResult` reaches the four objective letter drills below, and deliberately
   * not the two flashcard decks.
   *
   * It used to reach only the registry-mounted drills at the bottom of this
   * list, so after Task 6d the letter drills *could* report and in the app still
   * did not — 29 of the 47 concepts, the entire first half of the course, would
   * have gone on producing no ledger rows at all. Adding the prop to the four
   * literal renders was chosen over mounting them through the registry because
   * the registry entries answer "is this playable" with a *note in the panel*
   * while these tabs answer it by not existing, and swapping that is a visible
   * behaviour change this task has no reason to make.
   *
   * The decks stay out on the same grounds Task 6d gave: "✓ Got it" is a claim
   * the learner makes about themselves, not a measurement, and an unearned
   * verdict in an append-only ledger cannot be taken back.
   */
  const tabs = [
    {
      label: "🃏 Letter cards",
      show: data.letterPool.length > 0,
      render: () => <LetterFlashcards newLetters={data.newLetters} allLetters={data.letterPool} />,
    },
    {
      label: "❓ Quiz",
      show: quizPool.length >= QUIZ_MIN_LETTERS,
      render: () => <LetterQuiz pool={quizPool} entries={data.formEntries} formsTaught={data.formsTaught} onResult={onResult} />,
    },
    {
      label: "🔀 Forms",
      show: data.formsTaught && data.formEntries.length > 0,
      render: () => <FormSwap entries={data.formEntries} onResult={onResult} />,
    },
    { label: "🧩 Build a word", show: builderWords.length > 0, render: () => <WordBuilder words={builderWords} onResult={onResult} /> },
    {
      label: "🔍 Spot the letter",
      show: spotWords.length > 0,
      render: () => <SpotTheLetter words={spotWords} pool={data.letterPool} onResult={onResult} />,
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
      // `data` as well as `onResult`: a tajweed drill bundles its own items and
      // ignores it, but a letter drill's pool is this lesson's, and it has no
      // other way to reach it. See `GameRenderProps`.
      render: () => g.render({ onResult, data }),
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
