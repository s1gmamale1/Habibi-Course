"use client";
import { useState } from "react";
import { lookupVerse } from "@/components/tajweed/verses";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { registerGame, type GameResult } from "../GameRegistry";

/**
 * Drill 4 — Madd Counter. A fragment with one length marked in it, and a
 * 2 / 4 / 6 ḥarakāt selector.
 *
 * **madd_246 has three right answers, and that is not a bug in the data.**
 * `madd_246` is madd ʿāriḍ lis-sukūn — the madd that only exists because the
 * reciter stops. It is transmitted at two, four *or* six ḥarakāt; the reciter
 * picks one and holds it consistently for the whole recitation. That is why its
 * `RULE_META` entry has no single `harakat` value. A drill that marked four
 * wrong for it would be teaching a falsehood, so `acceptedHarakat` returns all
 * three and the feedback says so. The only thing the drill nudges about is
 * *mixing* lengths within a session, which is the real error.
 *
 * **A ḥarakah is not a duration in milliseconds.** It is the time taken to say
 * one short vowel *at the reciter's own tempo* — so it stretches and contracts
 * with the pace of the recitation, and only the ratio 2 : 4 : 6 is fixed. The
 * finger-fold is a counting aid for learners, not a definition, and the UI copy
 * says so rather than implying a stopwatch.
 *
 * **The fragment is not rendered with `TajweedText`.** Palette B gives each
 * madd its own hue (`madd_2` #537FFF, `madd_muttasil` #000EBC, `madd_6`
 * #2144C1), so painting the span would let a learner who knows the palette read
 * the length off the ink. The marked span gets a neutral ring instead.
 */

const GAME_ID = "madd-counter";

/** The selector. Fixed, because these are the only lengths tajweed recognises. */
const CHOICES = [2, 4, 6] as const;

export type MaddItem = {
  /** The fragment — usually a whole āyah, since munfaṣil needs its neighbour. */
  text: string;
  /** The length being asked about, as offsets into `text`. */
  spanStart: number;
  spanEnd: number;
  rule: RuleId;
};

/**
 * Every length that is a correct answer for `rule`.
 *
 * - `madd_246` → `[2, 4, 6]`, all three transmitted (see the note above).
 * - anything with a `harakat` in `RULE_META` → that one value.
 * - anything else (qalqalah, hamzat waṣl, …) → `[]`: it carries no length, so
 *   it is not a question this drill can ask, and the item is dropped rather
 *   than defaulted to a number that would be invented.
 */
export function acceptedHarakat(rule: RuleId): number[] {
  if (rule === "madd_246") return [...CHOICES];
  const n = RULE_META[rule].harakat;
  return n === undefined ? [] : [n];
}

/* ---------- the fragment ---------------------------------------------- */

/**
 * Neutral marking: no palette colour, no family underline, no answer.
 *
 * Same accessibility shape as `TajweedText`, and for the same reason: the
 * fragment is one string cut in three by the marking span, and it must be read
 * as the one string. `role="img"` makes the children presentational so the
 * accessible name is the whole fragment. (`role="text"` is a WebKit extension,
 * not an ARIA role, and left the container generic — where `aria-label` is
 * prohibited and ignored — everywhere else.)
 */
function Fragment({ item }: { item: MaddItem }) {
  return (
    <span className="quran arabic" dir="rtl" lang="ar" aria-label={item.text} role="img">
      {item.text.slice(0, item.spanStart)}
      <span
        data-target="true"
        className="rounded-md bg-white/15 px-0.5 underline decoration-white/60 decoration-2 underline-offset-8"
      >
        {item.text.slice(item.spanStart, item.spanEnd)}
      </span>
      {item.text.slice(item.spanEnd)}
    </span>
  );
}

/* ---------- one question ----------------------------------------------- */

function Round({
  item,
  onResult,
  now,
  onNext,
  onScored,
  held,
  onHold,
}: {
  item: MaddItem;
  onResult?: (r: GameResult) => void;
  now: () => number;
  onNext: () => void;
  onScored: (firstTry: boolean) => void;
  /** The length already chosen for a ʿāriḍ this session, if any. */
  held: number | null;
  onHold: (n: number) => void;
}) {
  const [locked, setLocked] = useState<number | null>(null);
  const [missed, setMissed] = useState<number[]>([]);
  const [shake, setShake] = useState<{ n: number; i: number } | null>(null);

  const accepted = acceptedHarakat(item.rule);
  const meta = RULE_META[item.rule];
  const flexible = accepted.length > 1;

  function pick(n: number) {
    if (locked !== null) return;
    const correct = accepted.includes(n);
    // `correct` loses *which* length was picked, and the misses are the
    // diagnosis: reading a six-count madd as two is a different error from
    // reading it as four. `acceptedHarakat` is carried alongside because for
    // the ʿāriḍ there are three right answers, not one target.
    onResult?.({
      gameId: GAME_ID,
      ruleId: item.rule,
      correct,
      at: now(),
      choice: { chosenHarakat: n, acceptedHarakat: accepted },
    });
    if (correct) {
      setLocked(n);
      onScored(missed.length === 0);
      if (flexible) onHold(n);
    } else {
      setMissed((m) => (m.includes(n) ? m : [...m, n]));
      setShake({ n, i: (shake?.i ?? 0) + 1 });
    }
  }

  // Only flagged when the learner mixes lengths for the ʿāriḍ — never when the
  // answer itself is wrong, because it is not wrong.
  const inconsistent = locked !== null && flexible && held !== null && held !== locked;

  return (
    <div className="text-center">
      <p className="mb-4 text-white/80">How many ḥarakāt is the marked part held for?</p>
      <p className="mb-6 text-4xl leading-loose">
        <Fragment item={item} />
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        {CHOICES.map((n) => {
          const right = locked === n;
          const wrong = missed.includes(n);
          const shaking = shake?.n === n;
          return (
            <button
              key={`${n}-${shaking ? shake!.i : 0}`}
              type="button"
              data-testid={`count-${n}`}
              data-state={right ? "correct" : wrong ? "wrong" : undefined}
              aria-label={`${n} ḥarakāt`}
              onClick={() => pick(n)}
              className={`rounded-2xl border px-6 py-3 text-white transition ${
                right
                  ? "game-correct"
                  : wrong
                    ? "border-red-400/40 bg-red-500/10"
                    : "border-white/15 bg-white/5"
              } ${shaking ? "game-shake" : ""}`}
            >
              <span className="text-2xl">{n}</span>{" "}
              <span className="text-xs text-white/70">ḥarakāt</span>
              {(right || wrong) && (
                <span aria-hidden="true" className="ms-2">
                  {right ? "✓" : "✗"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* The pedagogy note, always on screen — a ḥarakah is a ratio, not a clock. */}
      <p className="mx-auto mt-4 max-w-md text-xs text-white/50">
        A ḥarakah is the time to say one short vowel <em>at your own reciting tempo</em>. Folding a
        finger per beat is a counting aid, not a definition — only the 2 : 4 : 6 ratio is fixed.
      </p>

      {/* State in words, never colour alone. */}
      <p role="status" className="mt-4 min-h-6 text-sm">
        {locked === null ? (
          missed.length > 0 ? (
            <span className="text-amber-300">✗ Not that one — count the beat again.</span>
          ) : (
            ""
          )
        ) : flexible ? (
          <span className="text-green-300">
            ✓ Correct — {meta.translit} ({meta.en}). 2, 4 and 6 are all three permitted; the reciter
            chooses one and stays consistent.
            {inconsistent && ` You held ${held} earlier — keep one length for the whole recitation.`}
          </span>
        ) : (
          <span className="text-green-300">
            ✓ Correct — {meta.translit} ({meta.en}) is held for {accepted[0]} ḥarakāt.{" "}
            <span className="arabic">{meta.ar}</span>
          </span>
        )}
      </p>

      {locked !== null && (
        <button type="button" className="cta-primary mt-3 rounded-full px-4 py-2" onClick={onNext}>
          Next question →
        </button>
      )}
    </div>
  );
}

/* ---------- the drill --------------------------------------------------- */

export function MaddCounter({
  items,
  onResult,
  now = () => Date.now(),
}: {
  items: MaddItem[];
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the scoring logic stays free of ambient time. */
  now?: () => number;
}) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ right: 0, asked: 0 });
  /** The ʿāriḍ length chosen first this session — the consistency anchor. */
  const [held, setHeld] = useState<number | null>(null);

  // Items with no length are dropped rather than guessed at.
  const playable = items.filter((i) => acceptedHarakat(i.rule).length > 0);
  if (playable.length === 0) return <p className="text-white/50">No madd to drill yet.</p>;
  const item = playable[round % playable.length];

  return (
    <div>
      <Round
        // Remount per round: per-question state is discarded, not reset in an
        // effect — the guard the plan requires after `0b09f21`.
        key={round}
        item={item}
        onResult={onResult}
        now={now}
        onNext={() => setRound((r) => r + 1)}
        onScored={(firstTry) =>
          setScore((s) => ({ right: s.right + (firstTry ? 1 : 0), asked: s.asked + 1 }))
        }
        held={held}
        onHold={(n) => setHeld((h) => h ?? n)}
      />
      {score.asked > 0 && (
        <p className="mt-3 text-center text-xs text-white/50">
          First-try score: {score.right} / {score.asked}
        </p>
      )}
    </div>
  );
}

/* ---------- registration ------------------------------------------------ */

/**
 * Five real lengths from the bundled surahs, ordered easiest first: the two
 * fixed-length madds, then the two four-count ones that differ only in whether
 * the hamza sits in the same word, and finally the ʿāriḍ with its three
 * permitted readings.
 */
const DEFAULT_SPECS = [
  [1, 7, "madd_6"],
  [108, 1, "madd_2"],
  [106, 2, "madd_muttasil"],
  [111, 1, "madd_munfasil"],
  [1, 7, "madd_246"],
] as const;

const DEFAULT_ITEMS: MaddItem[] = DEFAULT_SPECS.flatMap(([surah, ayah, rule]) => {
  const verse = lookupVerse(surah, ayah);
  const span = verse?.spans.find((s) => s.rules[0] === rule);
  if (!verse || !span) return [];
  return [{ text: verse.text, spanStart: span.start, spanEnd: span.end, rule: rule as RuleId }];
});

registerGame({
  id: GAME_ID,
  label: "⏱️ How long?",
  render: ({ onResult }) => <MaddCounter items={DEFAULT_ITEMS} onResult={onResult} />,
});
