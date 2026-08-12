"use client";
import { useEffect, useState } from "react";
import type { ArabicItem } from "@/content/schema";
import type { WordEntry } from "@/games/derive";
import { pickExemplar, registerGame } from "./GameRegistry";
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

/**
 * Deal the deck, with `startId` — when the session planned one — on top.
 *
 * The shuffle is kept and the planned card is moved to the front of it rather
 * than the deck being ordered around it: everything after the first card is the
 * deck the learner would have had anyway.
 */
function dealt(cards: readonly CardFace[], startId?: string): number[] {
  const order = shuffled(cards.map((_, i) => i));
  const at = order.findIndex((i) => cards[i].id === startId);
  return at <= 0 ? order : [order[at], ...order.filter((_, k) => k !== at)];
}

export function Flashcards({ cards, startId }: { cards: CardFace[]; startId?: string }) {
  const [deck, setDeck] = useState<number[] | null>(null);
  const [flipped, setFlipped] = useState(false);
  const cardsKey = cards.map((c) => c.id).join("|");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deck shuffle must run client-side only; render-time shuffle would mismatch SSR HTML
    setDeck(dealt(cards, startId));
    setFlipped(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- cards identity churns; cardsKey covers content
  }, [cardsKey, startId]);

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

export function LetterFlashcards({
  newLetters,
  allLetters,
  startId,
}: {
  newLetters: ArabicItem[];
  allLetters: ArabicItem[];
  /** The letter a session planned. Opens on the scope that actually contains it. */
  startId?: string;
}) {
  const opensOnAll = startId !== undefined && !newLetters.some((l) => l.arabic === startId);
  const [scope, setScope] = useState<"new" | "all">(
    newLetters.length > 0 && !opensOnAll ? "new" : "all",
  );
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
      <Flashcards key={scope} cards={letterCards(items)} startId={startId} />
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

/** A card is identified by its face, which for a letter deck is the letter. */
const letterCardKey = (arabic: string) => `${LETTER_CARDS_ID}/${arabic}`;

registerGame({
  id: LETTER_CARDS_ID,
  label: "🃏 Letter cards",
  exemplars: (data) =>
    (data?.letterPool ?? []).map((l) => ({
      conceptId: l.arabic,
      itemKey: letterCardKey(l.arabic),
    })),
  render: ({ data, item }) =>
    data && data.letterPool.length > 0 ? (
      <LetterFlashcards
        newLetters={data.newLetters}
        allLetters={data.letterPool}
        startId={pickExemplar(data.letterPool, (l) => letterCardKey(l.arabic), item?.itemKey)?.arabic}
      />
    ) : (
      <p className="text-white/50">No letters to review yet.</p>
    ),
});

/**
 * The word deck **advertises no exemplars**, and that is the honest answer
 * rather than a gap.
 *
 * Every other drill's exemplar names one of the 47 concepts the scheduler
 * tracks — a rule or a letter. A vocabulary card names neither. Its letters are
 * incidental to it in a way they are not to `word-builder`, where the learner
 * assembles the word letter by letter, or to `spot-the-letter`, where one letter
 * is the whole question: here the learner is asked what the *word* means, and
 * filing that under one of its letters would be inventing a concept the card
 * never tested. So a session cannot plan this deck, and `render` still honours a
 * key naming one of its words for the day a vocabulary concept exists.
 */
const wordCardKey = (arabic: string) => `${WORD_CARDS_ID}/${arabic}`;

registerGame({
  id: WORD_CARDS_ID,
  label: "📖 Word cards",
  render: ({ data, item }) =>
    data && data.wordPool.length > 0 ? (
      <Flashcards
        cards={wordCards(data.wordPool)}
        startId={pickExemplar(data.wordPool, (w) => wordCardKey(w.arabic), item?.itemKey)?.arabic}
      />
    ) : (
      <p className="text-white/50">No words to review yet.</p>
    ),
});
