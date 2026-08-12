"use client";
import { useState } from "react";
import { lookupVerse } from "@/components/tajweed/verses";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { registerGame, type GameResult } from "../GameRegistry";

/**
 * Drill 8 — Ghunnah Timer. Press and hold for the length of a ghunnah; the
 * drill scores the hold in ḥarakāt.
 *
 * **A ḥarakah is not a number of milliseconds, so this drill never assumes one.**
 * It is the time to say one short vowel *at the reciter's own tempo* — only the
 * ratio between lengths is fixed, and `library/02-Rules/Ghunnah.md` says
 * outright that scholars differ on whether any absolute measure is admissible at
 * all. `MaddCounter` teaches exactly that, and has a test pinning the copy. A
 * drill that hard-coded "a ḥarakah = 500ms" would grade a slow reciter as wrong
 * for reciting slowly, which is not a mistake — it is tartīl.
 *
 * So the drill **calibrates against the learner before it measures them**:
 *
 * 1. They hold for one comfortable ḥarakah, three times. The **median** of those
 *    three is their `msPerHarakah` — median rather than mean so one slipped
 *    finger does not drag the reference with it (`calibrate` has a test for
 *    exactly that case).
 * 2. Then they hold the ghunnah, and the hold is scored as
 *    `heldMs / msPerHarakah` against the target count.
 * 3. Feedback is in ḥarakāt and nothing else. The learner is never shown a
 *    duration, because a duration is not the thing being taught, and seeing one
 *    would invite them to chase a number instead of their own pulse.
 * 4. **Recalibrate** is available throughout — tempo changes between tartīl and
 *    ḥadr, and between one sitting and the next.
 *
 * **The timing logic is pure and lives outside the component.** `scoreHold` and
 * `calibrate` take elapsed milliseconds as arguments and never call `Date.now`,
 * so every case above is tested directly with no timers, real or fake.
 */

const GAME_ID = "ghunnah-timer";

/**
 * How far off a hold may be, as a fraction **of the target**.
 *
 * Relative, not absolute, for two reasons. Human reproduction of an interval is
 * scalar — the error grows with the interval, which is why a fixed ±0.5 counts
 * would be generous at 2 and near-impossible at 6. And the pedagogy is scalar
 * too: the thing being learned is the ratio, so the tolerance should be a ratio.
 *
 * ±25% puts the 2-count band at 1.5–2.5 ḥarakāt. That is deliberately the width
 * at which the neighbouring readings start: below 1.5 the ear hears one count,
 * above 2.5 it hears three, and those are the two errors a teacher actually
 * corrects. Tighter than this and a beginner never passes; looser and a 1-count
 * ghunnah is allowed to pass as a 2-count one, which is the error the drill
 * exists to catch.
 */
const TOLERANCE = 0.25;

/**
 * Below this, a press-and-release is a click, not a hold. It is an input-noise
 * floor — a mouse click lands around 50–100ms — and it is the one millisecond
 * constant in the file. It says nothing about how long a ḥarakah is; it only
 * distinguishes a tap from a gesture, and it would be the same number for a
 * drill about anything else.
 */
const MIN_HOLD_MS = 60;

/** How many reference holds make a calibration. */
const CALIBRATION_HOLDS = 3;

/* ---------- pure timing logic ------------------------------------------ */

/**
 * Score a hold in ḥarakāt.
 *
 * `heldMs` is elapsed time measured by the caller; nothing here reads a clock.
 * `counts` is returned unrounded — rounding is a presentation choice, and
 * rounding before the comparison would let 2.549 read as "2.5, correct".
 */
export function scoreHold(
  heldMs: number,
  msPerHarakah: number,
  targetHarakat: number,
  tolerance = TOLERANCE,
): { counts: number; correct: boolean } {
  // No calibration means no scale, and a drill with no scale must not guess one.
  if (!(msPerHarakah > 0)) return { counts: 0, correct: false };
  const counts = Math.max(0, heldMs) / msPerHarakah;
  return { counts, correct: Math.abs(counts - targetHarakat) <= tolerance * targetHarakat };
}

/** The learner's ḥarakah, as the median of their reference holds. */
export function calibrate(samples: number[]): number | null {
  if (samples.length === 0) return null;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/* ---------- the example word ------------------------------------------- */

/**
 * Real words from the bundled corpus, so the learner holds a sound they will
 * actually meet. إِنَّآ (108:1) is the word `Ghunnah.md` uses for the pinch
 * test; ٱلضَّآلِّينَ (1:7) is the six-count madd every learner meets first.
 */
const EXAMPLES: Partial<Record<RuleId, { surah: number; ayah: number; word: number }>> = {
  ghunnah: { surah: 108, ayah: 1, word: 4 },
  madd_6: { surah: 1, ayah: 7, word: 8 },
};

function exampleWord(rule: RuleId): string | null {
  const spec = EXAMPLES[rule];
  if (!spec) return null;
  const verse = lookupVerse(spec.surah, spec.ayah);
  return verse?.text.split(" ")[spec.word] ?? null;
}

/* ---------- the drill --------------------------------------------------- */

type Outcome =
  | { kind: "tap" }
  | { kind: "cancelled" }
  | { kind: "reference"; done: number }
  | { kind: "scored"; counts: number; correct: boolean };

export function GhunnahTimer({
  rule = "ghunnah",
  onResult,
  now = () => Date.now(),
}: {
  /** What is being held. The target count comes from `RULE_META`. */
  rule?: RuleId;
  onResult?: (r: GameResult) => void;
  /** Injected clock, so the component's timing is testable without waiting. */
  now?: () => number;
}) {
  const [start, setStart] = useState<number | null>(null);
  const [samples, setSamples] = useState<number[]>([]);
  const [msPerHarakah, setMsPerHarakah] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome>({ kind: "reference", done: 0 });

  const meta = RULE_META[rule];
  const target = meta.harakat ?? 2;
  const word = exampleWord(rule);
  const phase = msPerHarakah === null ? "calibrate" : "measure";

  function press() {
    if (start !== null) return; // a held key repeats; the first press wins
    setStart(now());
  }

  function cancel() {
    if (start === null) return;
    setStart(null);
    setOutcome({ kind: "cancelled" });
  }

  function release() {
    if (start === null) return;
    const held = now() - start;
    setStart(null);
    if (held < MIN_HOLD_MS) {
      setOutcome({ kind: "tap" });
      return;
    }
    if (msPerHarakah === null) {
      const next = [...samples, held];
      setSamples(next);
      setOutcome({ kind: "reference", done: next.length });
      if (next.length >= CALIBRATION_HOLDS) setMsPerHarakah(calibrate(next));
      return;
    }
    const { counts, correct } = scoreHold(held, msPerHarakah, target);
    setOutcome({ kind: "scored", counts, correct });
    // The measurement travels with the verdict. `correct` is a lossy derivation
    // of `counts` against a tolerance that may be retuned; and `counts` alone is
    // meaningless without the calibration it was divided by, since a ḥarakah is
    // the learner's own pace and not a fixed duration.
    onResult?.({
      gameId: GAME_ID,
      ruleId: rule,
      correct,
      at: now(),
      measure: {
        heldMs: held,
        msPerHarakah,
        targetHarakat: target,
        measuredHarakat: counts,
      },
    });
  }

  function recalibrate() {
    setStart(null);
    setSamples([]);
    setMsPerHarakah(null);
    setOutcome({ kind: "reference", done: 0 });
  }

  /** Hold bindings, shared by both buttons. Keyboard included, not bolted on. */
  const holdProps = {
    onMouseDown: press,
    onMouseUp: release,
    onMouseLeave: cancel,
    onTouchStart: press,
    onTouchEnd: (e: React.TouchEvent) => {
      // Suppress the emulated mouse pair a touch fires afterwards: it would
      // open and close a second hold, and that phantom hold — being far under
      // MIN_HOLD_MS — would overwrite the real verdict with "that was a tap".
      e.preventDefault();
      release();
    },
    onKeyDown: (e: React.KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      press();
    },
    onKeyUp: (e: React.KeyboardEvent) => {
      if (e.key !== " " && e.key !== "Enter") return;
      e.preventDefault();
      release();
    },
  };

  const scored = outcome.kind === "scored" ? outcome : null;

  return (
    <div data-testid="ghunnah-timer" data-phase={phase} className="text-center">
      {/* The pedagogy, on screen before anything is measured. */}
      <p className="mx-auto mb-5 max-w-md text-xs text-white/50">
        A ḥarakah is the time to say one short vowel <em>at your own reciting tempo</em>. It has no
        fixed length, so this drill sets its scale from your pace first and then scores you against
        your own pace — never against a clock.
      </p>

      {phase === "calibrate" ? (
        <>
          <p className="mb-4 text-white/80">
            First, set your pace. Press and hold for <strong>one ḥarakah</strong> — one short vowel,
            at the speed you recite — {CALIBRATION_HOLDS} times.
          </p>
          <button
            type="button"
            data-testid="hold-calibrate"
            data-state={start !== null ? "holding" : undefined}
            className={`rounded-full border px-8 py-6 text-lg text-white transition ${
              start !== null ? "border-white/70 bg-white/20" : "border-white/20 bg-white/5"
            }`}
            {...holdProps}
          >
            {start !== null ? "Holding…" : "Hold for one ḥarakah"}
          </button>
        </>
      ) : (
        <>
          <p className="mb-2 text-white/80">
            Now hold the {meta.translit.toLowerCase()} for <strong>{target} ḥarakāt</strong>, at that
            same pace.
          </p>
          {word && (
            <p className="quran arabic mb-4 text-4xl leading-loose" dir="rtl" lang="ar">
              {word}
            </p>
          )}
          <button
            type="button"
            data-testid="hold-ghunnah"
            data-state={
              start !== null ? "holding" : scored ? (scored.correct ? "correct" : "wrong") : undefined
            }
            className={`rounded-full border px-8 py-6 text-lg text-white transition ${
              start !== null
                ? "border-white/70 bg-white/20"
                : scored?.correct
                  ? "game-correct"
                  : scored
                    ? "border-amber-400/50 bg-amber-500/10"
                    : "border-white/20 bg-white/5"
            }`}
            {...holdProps}
          >
            {start !== null ? "Holding…" : `Hold for ${target} ḥarakāt`}
          </button>
        </>
      )}

      {/* One live region. The verdict is in words and in ḥarakāt — never a
          colour on its own, and never a duration. */}
      <p role="status" className="mx-auto mt-5 min-h-6 max-w-md text-sm">
        {outcome.kind === "tap" ? (
          <span className="text-amber-300">That was a tap — press and hold instead.</span>
        ) : outcome.kind === "cancelled" ? (
          <span className="text-amber-300">Hold cancelled — let go on the button itself.</span>
        ) : outcome.kind === "reference" ? (
          outcome.done === 0 ? (
            <span className="text-white/60">Waiting for your first hold.</span>
          ) : (
            <span className="text-white/80">
              {outcome.done} of {CALIBRATION_HOLDS} reference holds recorded.
            </span>
          )
        ) : scored ? (
          <span className={scored.correct ? "text-green-300" : "text-amber-300"}>
            {scored.correct ? "✓" : "✗"} You held about {scored.counts.toFixed(1)} counts —{" "}
            {scored.correct
              ? `that is a ${target}-count ${meta.translit.toLowerCase()}.`
              : scored.counts < target
                ? `aim for ${target}.`
                : `longer than ${target}; ease off.`}
          </span>
        ) : (
          ""
        )}
      </p>

      {phase === "measure" && (
        <button
          type="button"
          onClick={recalibrate}
          className="mt-4 rounded-full border border-white/15 px-4 py-2 text-xs text-white/70"
        >
          Recalibrate my pace
        </button>
      )}
    </div>
  );
}

/* ---------- registration ------------------------------------------------- */

/**
 * **One exemplar per rule, and the concept is all this drill can honour.**
 *
 * There is no item list here to select from: the question is "hold this rule's
 * length at your own pace", and the only thing that varies with the plan is
 * *which* rule — its name, its target count, and the word it is shown in. Two
 * exemplars of one concept would be the same hold twice, so this drill can never
 * serve a wrong-answer tail; `drawRetry` has to find the second retrieval
 * elsewhere.
 *
 * Only the rules with an example word are offered. A hold prompt with no word to
 * hold is a drill asking the learner to imagine the ghunnah, and the ones with a
 * `harakat` but no `EXAMPLES` entry would be exactly that.
 */
const holdKey = (rule: RuleId) => `${GAME_ID}/${rule}`;

const HOLDABLE = (Object.keys(EXAMPLES) as RuleId[]).filter(
  (rule) => RULE_META[rule].harakat !== undefined && exampleWord(rule) !== null,
);

registerGame({
  id: GAME_ID,
  label: "🕰️ Hold the ghunnah",
  exemplars: () => HOLDABLE.map((rule) => ({ conceptId: rule, itemKey: holdKey(rule) })),
  render: ({ onResult, item }) => (
    <GhunnahTimer
      rule={HOLDABLE.find((rule) => holdKey(rule) === item?.itemKey)}
      onResult={onResult}
    />
  ),
});
