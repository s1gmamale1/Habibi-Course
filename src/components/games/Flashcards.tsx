"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { WordEntry } from "@/games/derive";
import { registerGame } from "./GameRegistry";
import { shuffled } from "./useSwapPuzzle";

export type CardFace = { id: string; front: string; back: string[] };

function cueText(it: ArabicItem): string {
  switch (it.audio.type) {
    case "teacher-voice":
      return it.audio.cue;
    case "youtube-cue":
      return `▶ ${it.audio.title}`;
    case "qari-clip":
      return `Recited by ${it.audio.reciter}`;
  }
}

export function letterCards(items: ArabicItem[]): CardFace[] {
  return items.map((it) => ({
    id: it.arabic,
    front: it.arabic,
    back: [[it.name, it.translit].filter(Boolean).join(" — ") || it.arabic, cueText(it)],
  }));
}

export function wordCards(words: WordEntry[]): CardFace[] {
  return words.map((w) => ({ id: w.arabic, front: w.arabic, back: [`${w.translit} — ${w.meaning}`] }));
}

export function Flashcards({ cards }: { cards: CardFace[] }) {
  const [deck, setDeck] = useState<number[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const cardsKey = cards.map((c) => c.id).join("|");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deck shuffle must run client-side only; render-time shuffle would mismatch SSR HTML
    setDeck(shuffled(cards.map((_, i) => i)));
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cards identity churns; cardsKey covers content
  }, [cardsKey]);

  if (!deck) return <p className="text-white/50">Shuffling…</p>;
  if (deck.length === 0) {
    return (
      <div className="text-center">
        <p className="mb-3 text-2xl text-white/90">🎉 Deck cleared!</p>
        <button
          type="button"
          className="cta-secondary rounded-full px-4 py-2"
          onClick={() => {
            setDeck(shuffled(cards.map((_, i) => i)));
            setFlipped(false);
          }}
        >
          Restart
        </button>
      </div>
    );
  }
  // Deck indices can outlive a shrinking cards prop for one render (the
  // reshuffle effect runs after render) — treat that frame as still shuffling.
  const card = cards[deck[0]];
  if (!card) return <p className="text-white/50">Shuffling…</p>;
  return (
    <div className="text-center">
      <p className="mb-2 text-xs text-white/50">
        {deck.length} card{deck.length === 1 ? "" : "s"} left
      </p>
      <button
        type="button"
        aria-label="flip card"
        onClick={() => setFlipped((f) => !f)}
        className="glass mx-auto flex min-h-40 w-full max-w-xs flex-col items-center justify-center rounded-2xl p-6"
      >
        {flipped ? (
          <span className="space-y-1">
            {/* Keyed by index, not by line text: two identical back lines are legitimate
                content (a letter whose name and transliteration coincide) and would collide. */}
            {card.back.map((line, i) => (
              <span key={`${i}-${line}`} dir="ltr" className="block text-white/85">
                {line}
              </span>
            ))}
          </span>
        ) : (
          <span className="arabic text-6xl text-white">{card.front}</span>
        )}
        <span className="mt-3 block text-xs text-white/40">{flipped ? "tap to see front" : "tap to reveal"}</span>
      </button>
      <div className="mt-4 flex justify-center gap-3">
        <button
          type="button"
          className="cta-secondary rounded-full px-4 py-2"
          onClick={() => {
            setDeck((d) => d && [...d.slice(1), d[0]]);
            setFlipped(false);
          }}
        >
          ↺ Again
        </button>
        <button
          type="button"
          className="cta-primary rounded-full px-4 py-2"
          onClick={() => {
            setDeck((d) => d && d.slice(1));
            setFlipped(false);
          }}
        >
          ✓ Got it
        </button>
      </div>
    </div>
  );
}

export function LetterFlashcards({ newLetters, allLetters }: { newLetters: ArabicItem[]; allLetters: ArabicItem[] }) {
  const [scope, setScope] = useState<"new" | "all">(newLetters.length > 0 ? "new" : "all");
  const items = scope === "new" && newLetters.length > 0 ? newLetters : allLetters;
  return (
    <div>
      {newLetters.length > 0 && (
        <div className="mb-3 flex justify-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => setScope("new")}
            className={`rounded-full px-3 py-1 ${scope === "new" ? "cta-primary" : "cta-secondary"}`}
          >
            Today&apos;s letters
          </button>
          <button
            type="button"
            onClick={() => setScope("all")}
            className={`rounded-full px-3 py-1 ${scope === "all" ? "cta-primary" : "cta-secondary"}`}
          >
            All {allLetters.length} so far
          </button>
        </div>
      )}
      <Flashcards key={scope} cards={letterCards(items)} />
    </div>
  );
}

/* ---------- registration ---------------------------------------------- */

/**
 * Two decks, two ids, deliberately — not one `flashcards`.
 *
 * They share a renderer and nothing else. The letter deck drills a *letter*,
 * which is one of the 47 scheduled concepts; the word deck drills vocabulary,
 * where the letter is only incidental. `shapeOf` keys off the id, so folding
 * them together would give the scheduler one name for two different things and
 * no way to tell which of them a learner actually answered.
 *
 * Both are **recognition**: the learner is shown a glyph and asked to recall
 * what it is, then grades themselves. That is the shallowest end of the ramp,
 * which is exactly what a flashcard is for.
 *
 * Neither reports a `GameResult` yet — self-graded "Got it" is a claim the
 * learner makes about themselves, not a measurement, and inventing a `correct`
 * from it would put an unearned verdict in the ledger. See the report for
 * Task 6b.
 */
const LETTER_CARDS_ID = "letter-flashcards";
const WORD_CARDS_ID = "word-flashcards";

registerGame({
  id: LETTER_CARDS_ID,
  label: "🃏 Letter cards",
  render: ({ data }) =>
    data && data.letterPool.length > 0 ? (
      <LetterFlashcards newLetters={data.newLetters} allLetters={data.letterPool} />
    ) : (
      <p className="text-white/50">No letters to review yet.</p>
    ),
});

registerGame({
  id: WORD_CARDS_ID,
  label: "📖 Word cards",
  render: ({ data }) =>
    data && data.wordPool.length > 0 ? (
      <Flashcards cards={wordCards(data.wordPool)} />
    ) : (
      <p className="text-white/50">No words to review yet.</p>
    ),
});
