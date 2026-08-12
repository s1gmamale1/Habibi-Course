"use client";
import { useMemo, useState } from "react";
import { lookupVerse } from "@/components/tajweed/verses";
import type { RuleId } from "@/content/tajweed";
import {
  ISTILA_LETTERS,
  QALQALAH_LETTERS,
  baseOf,
  hasSukun,
  segmentGraphemes,
} from "@/games/tajweed";
import { registerGame, startWith, type GameResult } from "../GameRegistry";

/**
 * Span Tapper — "tap every letter that gets qalqalah".
 *
 * A fork of `SpotTheLetter`, deliberately not a configuration of it, because
 * three things differ and each one changes the model:
 *
 * 1. The target is an **index set, not a letter identity**. `SpotTheLetter`
 *    asks `letters[i] === target`, which is the wrong question here: a qalqalah
 *    letter qualifies only when it carries sukūn. In يَجْعَلْ the ج qalqalates;
 *    in جَعَلَ the same ج does not. A glyph-identity match accepts both.
 * 2. The text stays **voweled**. `baseLetters`/`contextualGlyphs`/
 *    `stripDiacritics` from `@/games/arabic` strip the very marks that decide
 *    the answer, so none of them is used here — segmentation comes from
 *    `segmentGraphemes`, which keeps each base letter with its marks.
 * 3. The answer is a **set with a submit step**, because the prompt is "tap
 *    all", not "find the one". Taps give immediate per-letter feedback, but
 *    the round is only scored when the learner says they are finished.
 *
 * **No shuffling, in an effect or anywhere else.** Letters are presented in
 * reading order — the text is the drill, so there is nothing to randomise, and
 * the unguarded-effect crash fixed in `0b09f21` has no way in. State is keyed
 * to nothing: a parent advancing to the next fragment must remount with
 * `key={text}` rather than swapping the `text` prop in place.
 */

const GAME_ID = "span-tapper";

/** What a tapped letter reports through `data-state`; untapped reads "idle". */
type TapState = "correct" | "wrong";

type CriterionSpec = {
  /** The question. It names the rule being drilled, never the answer. */
  prompt: string;
  /** Plural noun for the score line. */
  noun: string;
  /** Set only when the criterion is a tajweed rule proper, for `GameResult`. */
  ruleId?: RuleId;
  /** Does this segment — base letter plus its marks — qualify? */
  matches: (seg: string) => boolean;
};

/**
 * Criteria are predicates over a marked segment, so adding one is adding an
 * entry here: ikhfāʾ letters after a nūn sākin, throat letters, YARMALŪN, and
 * so on. Nothing else in the component knows which criteria exist.
 */
const CRITERIA = {
  qalqalah: {
    prompt: "Tap every letter that gets qalqalah.",
    noun: "qalqalah letters",
    ruleId: "qalqalah",
    // The sukūn is the whole condition — see the note above. This is qalqalah
    // ṣughrā only; qalqalah kubrā (an ayah-final letter made sākin by stopping)
    // depends on where the reciter stops, which a single fragment cannot say.
    matches: (seg: string) => QALQALAH_LETTERS.has(baseOf(seg)) && hasSukun(seg),
  },
  istila: {
    prompt: "Tap every heavy letter (istiʿlāʾ).",
    noun: "heavy letters",
    // No mark condition: istiʿlāʾ is a property of the letter itself, so خَلَقَ
    // has two heavy letters even though both carry a fatḥa. That is precisely
    // why a criterion is a predicate rather than a letter set plus a flag.
    matches: (seg: string) => ISTILA_LETTERS.has(baseOf(seg)),
  },
} satisfies Record<string, CriterionSpec>;

export type SpanCriterion = keyof typeof CRITERIA;

/** Spaces, ayah marks and punctuation are shown but are not tappable. */
const IS_LETTER = /\p{L}/u;

export function SpanTapper({
  text,
  criterion,
  onResult,
}: {
  text: string;
  criterion: SpanCriterion;
  onResult?: (r: GameResult) => void;
}) {
  const spec: CriterionSpec = CRITERIA[criterion];
  const segments = useMemo(() => segmentGraphemes(text), [text]);
  const targets = useMemo(
    () => segments.flatMap((seg, i) => (spec.matches(seg) ? [i] : [])),
    [segments, spec],
  );

  // Partial, so an untapped index reads as `undefined` and falls through to
  // "idle" rather than being typed as though every letter had been tapped.
  const [taps, setTaps] = useState<Partial<Record<number, TapState>>>({});
  const [submitted, setSubmitted] = useState(false);

  const foundCount = targets.filter((i) => taps[i] === "correct").length;
  const wrongCount = Object.values(taps).filter((s) => s === "wrong").length;
  // A fragment with no qualifying letter never reads as complete, so an
  // untouched drill cannot claim the learner has finished it.
  const allFound = targets.length > 0 && foundCount === targets.length;
  const isCorrect = allFound && wrongCount === 0;

  function tap(i: number) {
    if (submitted || taps[i]) return;
    setTaps((t) => ({ ...t, [i]: spec.matches(segments[i]) ? "correct" : "wrong" }));
  }

  function check() {
    if (submitted) return;
    setSubmitted(true);
    onResult?.({ gameId: GAME_ID, ruleId: spec.ruleId, correct: isCorrect, at: Date.now() });
  }

  return (
    <div data-testid="span-tapper" data-complete={allFound ? "true" : "false"} className="text-center">
      <p className="mb-4 text-white/80">{spec.prompt}</p>

      <div dir="rtl" role="group" aria-label="letters" className="flex flex-wrap justify-center gap-1">
        {segments.map((seg, i) => {
          if (!IS_LETTER.test(seg)) {
            return (
              <span key={i} className="arabic text-5xl text-white/70">
                {seg}
              </span>
            );
          }
          const state = taps[i] ?? "idle";
          const missed = submitted && state !== "correct" && targets.includes(i);
          return (
            <button
              key={i}
              type="button"
              data-index={i}
              data-state={state}
              data-missed={missed ? "true" : undefined}
              // State is announced in the label and drawn as a ✓/✗ mark, so
              // correctness never rides on colour alone.
              aria-label={state === "idle" ? undefined : `${seg} — ${state}`}
              disabled={submitted || state !== "idle"}
              onClick={() => tap(i)}
              className={`arabic rounded-xl border px-2 py-2 text-5xl text-white ${
                state === "correct"
                  ? "game-correct"
                  : state === "wrong"
                    ? "border-red-400/70 bg-red-500/15"
                    : "border-white/10 bg-white/5"
              } ${missed ? "border-dashed border-amber-300/80" : ""}`}
            >
              {seg}
              {state !== "idle" && (
                <span aria-hidden="true" className="ms-1 align-super text-base">
                  {state === "correct" ? "✓" : "✗"}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!submitted && (
        <button type="button" className="cta-primary mt-4 rounded-full px-4 py-2" onClick={check}>
          Check answer
        </button>
      )}

      {submitted && (
        <p role="status" className={`mt-4 ${isCorrect ? "text-green-300" : "text-amber-200"}`}>
          {isCorrect ? "✓" : "✗"} Found {foundCount} of {targets.length} {spec.noun}
          {wrongCount > 0 ? ` · ${wrongCount} wrong ${wrongCount === 1 ? "tap" : "taps"}` : ""}
          {missedLabel(targets.length - foundCount)}
        </p>
      )}
    </div>
  );
}

/** The missed letters are outlined in the text above, so name only the count. */
function missedLabel(missed: number) {
  return missed > 0 ? ` · ${missed} missed (outlined)` : "";
}

/* ---------- registration ------------------------------------------------ */

/**
 * The fragments this drill can pose, from the surahs the course recites in
 * full. Real Qur'anic text, never a placeholder.
 *
 * **The list is filtered by the criterion's own predicate, not by hand.** An
 * āyah with no qualifying letter is a round the learner cannot complete —
 * `allFound` is false forever when `targets` is empty — so asking whether a
 * fragment is playable is asking `matches`, and any other answer could drift
 * from it. That also means adding an āyah here cannot accidentally add an
 * unanswerable one.
 *
 * 112:3 is kept first, so the drill a lesson already mounts opens on the same
 * fragment it did before.
 */
const DEFAULT_REFS = [
  [112, 3],
  [112, 4],
  [105, 4],
  [106, 4],
  [111, 1],
  [108, 3],
] as const;

type SpanFragment = { text: string; criterion: SpanCriterion; itemKey: string };

const DEFAULT_FRAGMENTS: SpanFragment[] = (
  Object.keys(CRITERIA) as SpanCriterion[]
).flatMap((criterion) =>
  DEFAULT_REFS.flatMap(([surah, ayah]) => {
    const verse = lookupVerse(surah, ayah);
    if (!verse) return [];
    const playable = segmentGraphemes(verse.text).some((seg) => CRITERIA[criterion].matches(seg));
    return playable
      ? [{ text: verse.text, criterion, itemKey: `${GAME_ID}/${criterion}/${surah}:${ayah}` }]
      : [];
  }),
);

registerGame({
  id: GAME_ID,
  label: "Span tapper",
  /**
   * Only the criteria that *are* one of the 47 concepts. `istila` is a property
   * of a letter rather than a rule the scheduler tracks — it has no `RuleId` —
   * so its fragments are playable from the tab list and cannot be planned. A
   * conceptId invented for them would be a 48th concept nothing else knows.
   */
  exemplars: () =>
    DEFAULT_FRAGMENTS.flatMap((f) => {
      const spec: CriterionSpec = CRITERIA[f.criterion];
      return spec.ruleId ? [{ conceptId: spec.ruleId, itemKey: f.itemKey }] : [];
    }),
  render: ({ onResult, item }) => {
    const [fragment] = startWith(DEFAULT_FRAGMENTS, (f) => f.itemKey, item?.itemKey);
    return (
      <SpanTapper
        // Keyed by the fragment: per-round tap state belongs to the text it was
        // tapped on, and is thrown away with it rather than reset in an effect.
        key={fragment.itemKey}
        text={fragment.text}
        criterion={fragment.criterion}
        onResult={onResult}
      />
    );
  },
});
