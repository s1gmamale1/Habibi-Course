"use client";
import { useState } from "react";
import { TajweedText, type Span } from "@/components/tajweed/TajweedText";
import { lookupVerse } from "@/components/tajweed/verses";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { siblingRules } from "@/games/tajweed";
import { registerGame, startWith, type GameResult } from "../GameRegistry";

/**
 * Drill 1 — Rule Identifier. One rule's span is highlighted in an āyah
 * fragment; the learner names the rule.
 *
 * **The prompt never names the rule.** Same intent as `6b7e8d1`, which stopped
 * Spot-the-letter printing its target glyph: a drill that contains its own
 * answer trains matching, not recall. The prompt here says "which rule applies
 * to the highlighted part" and nothing more — no translit, no English gloss, no
 * Arabic name. (The span does keep its palette colour, because dimming its
 * neighbours is what marks it out at all. That leaks less than it looks: the
 * distractors are same-family, and `UNDERLINE` is per *family*, so the
 * redundant channel is identical across all four choices.)
 *
 * **Distractors are siblings, never `shuffled(pool).slice(0,4)`.** For an
 * ikhfāʾ question the tempting wrong answer is ikhfāʾ shafawī, not madd lāzim.
 * `siblingRules` supplies same-family rules first.
 */

export type RuleItem = {
  /** The fragment to show — a whole āyah or a phrase from one. */
  text: string;
  /** The span being asked about, as offsets into `text`. */
  spanStart: number;
  spanEnd: number;
  /** The answer. */
  rule: RuleId;
  /** The fragment's other spans, painted dimmed for context. */
  spans?: Span[];
  /**
   * Where the fragment comes from, as `surah:ayah`.
   *
   * Carried so an item has a **stable name** — one āyah offers several spans of
   * the same rule, and two āyahs offer the same rule at the same offset, so
   * neither the rule nor the offset identifies a question on its own. A
   * hand-built item may omit it; it is then named by its rule and offset, which
   * is enough within one list.
   */
  ref?: string;
};

const GAME_ID = "rule-identifier";

const CHOICE_COUNT = 4;

/* ---------- deterministic shuffling ---------------------------------- */

/**
 * Both anti-shuffle guards from the plan, because they solve different halves
 * of the problem that caused `0b09f21`:
 *
 * 1. **Seeded, not random.** `choicesFor` is a pure function of the item, so the
 *    order is derived during render. There is no effect, so there is no frame
 *    where state disagrees with props, and no SSR/client mismatch either — the
 *    server and the browser compute the same order from the same item.
 * 2. **Remount by `key`.** Per-question state (locked, missed, shaken) lives in
 *    `<Round>`, which the parent keys by round index. Advancing a question
 *    throws the old state away instead of resetting it in an effect, so a stale
 *    "locked" can never survive into the next question.
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

/** The answer plus three same-family distractors, in a stable order. */
export function choicesFor(item: RuleItem): RuleId[] {
  const seed = hashSeed(`${item.rule}|${item.spanStart}|${item.text}`);
  const distractors = seededShuffle(siblingRules(item.rule), seed).slice(0, CHOICE_COUNT - 1);
  // A second seed, so the answer does not land in the same slot every time.
  return seededShuffle([item.rule, ...distractors], seed ^ 0x9e3779b9);
}

function spansOf(item: RuleItem): Span[] {
  const spans = item.spans ?? [{ start: item.spanStart, end: item.spanEnd, rules: [item.rule] }];
  return [...spans].sort((a, b) => a.start - b.start);
}

/* ---------- one question --------------------------------------------- */

function Round({
  item,
  onResult,
  now,
  onNext,
  onScored,
}: {
  item: RuleItem;
  onResult?: (r: GameResult) => void;
  now: () => number;
  onNext: () => void;
  onScored: (firstTry: boolean) => void;
}) {
  const [locked, setLocked] = useState(false);
  const [missed, setMissed] = useState<RuleId[]>([]);
  const [shake, setShake] = useState<{ rule: RuleId; n: number } | null>(null);
  const choices = choicesFor(item);
  const answer = RULE_META[item.rule];

  const pick = (rule: RuleId) => {
    if (locked) return;
    const correct = rule === item.rule;
    onResult?.({ gameId: GAME_ID, ruleId: item.rule, correct, at: now() });
    if (correct) {
      setLocked(true);
      onScored(missed.length === 0);
    } else {
      setMissed((m) => (m.includes(rule) ? m : [...m, rule]));
      setShake({ rule, n: (shake?.n ?? 0) + 1 });
    }
  };

  return (
    <div className="text-center">
      <div data-prompt="true">
        <p className="mb-4 text-white/80">Which rule applies to the highlighted part?</p>
        <p className="mb-5 text-4xl leading-loose">
          <TajweedText text={item.text} spans={spansOf(item)} isolate={item.rule} />
        </p>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {choices.map((rule) => {
          const wrong = missed.includes(rule);
          const right = locked && rule === item.rule;
          const shaking = shake?.rule === rule;
          return (
            <button
              key={`${rule}-${shaking ? shake!.n : 0}`}
              type="button"
              data-state={right ? "correct" : wrong ? "wrong" : undefined}
              onClick={() => pick(rule)}
              className={`rounded-2xl border px-4 py-3 text-white transition ${
                right ? "game-correct" : wrong ? "border-red-400/40 bg-red-500/10" : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
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
        {locked ? (
          <span className="text-green-300">
            ✓ Correct — {answer.translit} ({answer.en}) <span className="arabic">{answer.ar}</span>
          </span>
        ) : missed.length > 0 ? (
          <span className="text-amber-300">✗ Not that one — try again.</span>
        ) : (
          ""
        )}
      </p>

      {locked && (
        <button type="button" className="cta-primary mt-3 rounded-full px-4 py-2" onClick={onNext}>
          Next question →
        </button>
      )}
    </div>
  );
}

/* ---------- the drill ------------------------------------------------- */

export function RuleIdentifier({
  items,
  onResult,
  now = () => Date.now(),
}: {
  items: RuleItem[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });

  if (items.length === 0) return <p className="text-white/50">No rules to drill yet.</p>;
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
        onScored={(firstTry) => setScore((s) => ({ right: s.right + (firstTry ? 1 : 0), asked: s.asked + 1 }))}
      />
      {score.asked > 0 && (
        <p className="mt-3 text-center text-xs text-white/50">
          First-try score: {score.right} / {score.asked}
        </p>
      )}
    </div>
  );
}

/* ---------- registration ---------------------------------------------- */

/** One question per rule-span of a bundled āyah, with the āyah as context. */
function itemsFromVerse(surah: number, ayah: number): RuleItem[] {
  const verse = lookupVerse(surah, ayah);
  if (!verse) return [];
  return verse.spans
    .filter((s) => s.rules[0] in RULE_META)
    .map((s) => ({
      text: verse.text,
      spans: verse.spans,
      spanStart: s.start,
      spanEnd: s.end,
      rule: s.rules[0] as RuleId,
      ref: `${surah}:${ayah}`,
    }));
}

/**
 * 106:4 is the richest āyah the course carries — madd munfaṣil, qalqalah, two
 * idghām shafawī, ikhfāʾ and idghām bi-ghunnah in one line. 112 and 114 add
 * lām shamsiyyah and the madd family.
 */
const DEFAULT_ITEMS: RuleItem[] = ([[106, 4], [106, 2], [112, 1], [114, 1]] as const).flatMap(
  ([surah, ayah]) => itemsFromVerse(surah, ayah),
);

/**
 * A question is one marked span in one āyah, so both name it. 106:4 alone
 * carries two idghām shafawī spans — two exemplars of one concept, which is
 * what lets a tail retry re-ask the rule without replaying the question.
 */
export const ruleItemKey = (item: RuleItem) =>
  `${GAME_ID}/${item.ref ?? item.rule}/${item.spanStart}`;

registerGame({
  id: GAME_ID,
  label: "❓ Which rule?",
  exemplars: () =>
    DEFAULT_ITEMS.map((it) => ({ conceptId: it.rule, itemKey: ruleItemKey(it) })),
  render: ({ onResult, item }) => (
    <RuleIdentifier
      items={startWith(DEFAULT_ITEMS, ruleItemKey, item?.itemKey)}
      onResult={onResult}
    />
  ),
});
