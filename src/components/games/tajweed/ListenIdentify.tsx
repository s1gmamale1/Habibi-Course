"use client";
import { useState } from "react";
import { TajweedText, type Span } from "@/components/tajweed/TajweedText";
import { lookupVerse } from "@/components/tajweed/verses";
import { RULE_META, TAJWEED_RULES, type RuleId } from "@/content/tajweed";
import { siblingRules } from "@/games/tajweed";
import { registerGame, type GameResult } from "../GameRegistry";
import { RECITER, ayahAudioUrl, useAudioCue } from "./useAudioCue";

/**
 * Drill 5 — Listen and Identify. A clip of the ayah plays; the learner names the
 * rule they *heard*.
 *
 * **Why this drill exists at all.** Every other drill in this folder trains the
 * eye: a span is highlighted, a letter is tapped, a text is read. But tajweed is
 * an auditory discipline transmitted by imitation — the rules are a notation for
 * sounds, not the other way round. A learner who can label a coloured span and
 * cannot hear an ikhfāʾ has learned the notation and not the recitation. This is
 * the only drill that closes that gap.
 *
 * **The text is not rendered until the question is answered.** Showing it would
 * make this the rule identifier with a soundtrack: the coloured spans give the
 * answer away instantly, and even uncoloured text lets the learner reason from
 * the letters instead of listening. The reference is withheld for the same
 * reason — "106:4" is one search away from the text. Both appear the moment an
 * answer is given, right or wrong, because seeing what you just heard is the
 * part that teaches.
 *
 * **Distractors are siblings, minus whatever else is audible in the same clip.**
 * Same-family rules are the meaningful wrong answers (`siblingRules`), but a
 * clip contains many rules at once: offering idghām bi-ghunnah as a distractor
 * for an idghām shafawī question in 106:4 would make two choices honestly
 * correct, since both really are in the recording. `avoid` removes them.
 */

export type ListenItem = {
  surah: number;
  ayah: number;
  /** The rule the learner is listening for. */
  rule: RuleId;
  /** The text — revealed only after answering. */
  text: string;
  /** Rule spans, for the coloured reveal. */
  spans?: Span[];
  /** Other rules audible in the same clip; never usable as distractors. */
  avoid?: RuleId[];
};

const GAME_ID = "listen-identify";
const CHOICE_COUNT = 4;

/* ---------- deterministic shuffling ---------------------------------- */

/**
 * Seeded, and derived during render from the item — never shuffled in an
 * effect. Same reasoning as `RuleIdentifier`: no effect means no frame where
 * state disagrees with props (the hazard behind `0b09f21`), and server and
 * client compute the same order from the same item. Per-question state lives in
 * `<Round>`, which the parent remounts by `key`, so a stale "answered" cannot
 * survive into the next clip.
 */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededShuffle<T>(items: readonly T[], seed: number): T[] {
  const out = [...items];
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * The answer plus three distractors: same-family first, then any other rule that
 * is not audible in this clip. The fallback only runs when the family has been
 * emptied by `avoid`, and it prefers an unambiguous far-away rule over a
 * tempting one that would also be a correct answer by ear.
 */
export function choicesFor(item: ListenItem): RuleId[] {
  const avoid = new Set<RuleId>(item.avoid ?? []);
  const seed = hashSeed(`${item.rule}|${item.surah}:${item.ayah}`);
  const siblings = siblingRules(item.rule).filter((r) => !avoid.has(r));
  const rest = TAJWEED_RULES.filter(
    (r) => r !== item.rule && !avoid.has(r) && !siblings.includes(r),
  );
  const distractors = [
    ...seededShuffle(siblings, seed),
    ...seededShuffle(rest, seed),
  ].slice(0, CHOICE_COUNT - 1);
  // A second seed, so the answer does not land in the same slot every time.
  return seededShuffle([item.rule, ...distractors], seed ^ 0x9e3779b9);
}

/* ---------- one clip -------------------------------------------------- */

function Round({
  item,
  onResult,
  now,
  onNext,
  onScored,
}: {
  item: ListenItem;
  onResult?: (r: GameResult) => void;
  now: () => number;
  onNext: () => void;
  onScored: (correct: boolean) => void;
}) {
  const [picked, setPicked] = useState<RuleId | null>(null);
  const cue = useAudioCue(ayahAudioUrl(item.surah, item.ayah));
  const choices = choicesFor(item);
  const answer = RULE_META[item.rule];
  const answered = picked !== null;

  const pick = (rule: RuleId) => {
    if (answered) return;
    const correct = rule === item.rule;
    setPicked(rule);
    onResult?.({ gameId: GAME_ID, ruleId: item.rule, correct, at: now() });
    onScored(correct);
  };

  const spans = item.spans ?? [];

  return (
    <div className="text-center">
      <div data-prompt="true">
        <p className="mb-4 text-white/80">Listen. Which rule do you hear?</p>
        <button
          type="button"
          onClick={() => (cue.isPlaying ? cue.pause() : cue.play())}
          data-audio-src={cue.src}
          aria-label={cue.isPlaying ? "Pause the recitation" : "Play the recitation"}
          className="glass rim-glow rounded-full px-6 py-4 text-2xl text-white transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-95"
        >
          <span aria-hidden="true">{cue.isPlaying ? "⏸" : "▶"} 🔊</span>
        </button>
      </div>

      <p className="mt-2 text-xs text-white/50">Recitation: {RECITER}</p>

      <div className="mt-5 flex flex-wrap justify-center gap-3">
        {choices.map((rule) => {
          const right = answered && rule === item.rule;
          const wrong = picked === rule && rule !== item.rule;
          return (
            <button
              key={rule}
              type="button"
              data-state={right ? "correct" : wrong ? "wrong" : undefined}
              onClick={() => pick(rule)}
              className={`rounded-2xl border px-4 py-3 text-white transition ${
                right
                  ? "game-correct"
                  : wrong
                    ? "border-red-400/40 bg-red-500/10 game-shake"
                    : "border-white/15 bg-white/5"
              }`}
            >
              {RULE_META[rule].translit}
              {/* aria-hidden keeps the tick out of the accessible name; the live
                  region below carries the same news for screen readers. */}
              {(right || wrong) && (
                <span aria-hidden="true" className="ms-2">{right ? "✓" : "✗"}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* State in words, never colour alone. */}
      <p aria-live="polite" className="mt-4 min-h-6 text-sm">
        {answered && (
          <span className={picked === item.rule ? "text-green-300" : "text-amber-300"}>
            {picked === item.rule ? "✓ Correct — " : "✗ Not that one — you heard "}
            {answer.translit} ({answer.en}) <span className="arabic">{answer.ar}</span>
          </span>
        )}
      </p>

      {/* The reveal: what the ear just did, now shown to the eye. */}
      {answered && (
        <div className="mt-4">
          <p className="text-4xl leading-loose">
            <TajweedText text={item.text} spans={spans} isolate={item.rule} />
          </p>
          <p className="mt-2 text-xs text-white/50" dir="ltr">
            {item.surah}:{item.ayah}
          </p>
          <button type="button" className="cta-primary mt-3 rounded-full px-4 py-2" onClick={onNext}>
            Next clip →
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------- the drill ------------------------------------------------- */

export function ListenIdentify({
  items,
  onResult,
  now = () => Date.now(),
}: {
  items: ListenItem[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  if (items.length === 0) return <p className="text-white/50">No clips to listen to yet.</p>;
  const item = items[round % items.length];

  return (
    <div>
      <Round
        // Remount per round: per-question state is discarded, not reset in an effect.
        key={round}
        item={item}
        onResult={onResult}
        now={now}
        onNext={() => setRound((r) => r + 1)}
        onScored={(correct) =>
          setScore((s) => ({ right: s.right + (correct ? 1 : 0), asked: s.asked + 1 }))
        }
      />
      {score.asked > 0 && (
        <p className="mt-3 text-center text-xs text-white/50">
          Score: {score.right} / {score.asked}
        </p>
      )}
    </div>
  );
}

/* ---------- registration ---------------------------------------------- */

/**
 * One question per rule of a bundled ayah, each knowing which other rules are
 * audible alongside it so they are never offered as wrong answers.
 */
function itemsFromVerse(surah: number, ayah: number): ListenItem[] {
  const verse = lookupVerse(surah, ayah);
  if (!verse) return [];
  const present = [
    ...new Set(verse.spans.map((s) => s.rules[0]).filter((r): r is RuleId => r in RULE_META)),
  ];
  return present.map((rule) => ({
    surah,
    ayah,
    rule,
    text: verse.text,
    spans: verse.spans,
    avoid: present.filter((r) => r !== rule),
  }));
}

/**
 * The short surahs the course recites in full, so every clip is one the learner
 * already knows by ear. 106:4 alone carries madd munfaṣil, qalqalah, idghām
 * shafawī, ikhfāʾ and idghām bi-ghunnah.
 */
export const DEFAULT_LISTEN_ITEMS: ListenItem[] = (
  [
    [106, 4],
    [106, 2],
    [112, 1],
    [114, 1],
  ] as const
).flatMap(([surah, ayah]) => itemsFromVerse(surah, ayah));

registerGame({
  id: GAME_ID,
  label: "🎧 What did you hear?",
  render: ({ onResult }) => <ListenIdentify items={DEFAULT_LISTEN_ITEMS} onResult={onResult} />,
});
