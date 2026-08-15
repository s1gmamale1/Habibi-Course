"use client";
import type { CSSProperties } from "react";

import { chainOf, type SlotRole } from "@/components/games/tajweed/ConditionBuilder";
import { PALETTE_B, RULE_META, UNDERLINE, type RuleId } from "@/content/tajweed";
import { RULE_MATERIAL, type RuleMaterial } from "@/generated/concepts";

/**
 * The third band: what the answer was, **and the rule it turned on**.
 *
 * ## Why a verdict is not enough
 *
 * Duolingo bets on implicit pattern extraction — answer enough items and the
 * rule is supposed to fall out — and it is the criticism teachers make of it
 * most consistently. Tajweed is a finite, explicitly rule-governed system with
 * eighteen named rules and stated conditions, so this screen inverts that
 * deliberately: every wrong answer names the rule *and* the condition that
 * decides it. **A bare ✗ is a failed implementation of this component.**
 *
 * ## Three things it will not do
 *
 * - **No sound.** Not on a right answer, not on a wrong one. In a tajweed course
 *   the audio channel belongs to recitation, and a chirp competing with a madd
 *   example is actively harmful. There is no `Audio` anywhere in this file and a
 *   test asserts the constructor is never called.
 * - **No colour-only signalling.** The verdict is a word, the rule is a name, and
 *   the rule's colour is joined by its family's `text-decoration-style` — the
 *   redundant channel `TajweedText` already uses, because ~8% of men cannot
 *   separate the hues and a screen reader reads none of them.
 * - **No score, no XP, no streak.** A count of right answers on this bar would be
 *   a performance-contingent reward attached to the moment of highest
 *   instructional value. The band names what to review, which is diagnosis.
 *
 * ## The reserved height
 *
 * `FEEDBACK_MIN_HEIGHT` is on the band whether or not there is anything to say,
 * so the drill above it never moves when an answer lands, and the primary button
 * sits at the same height throughout — check, verdict and continue in one fixed
 * slot, which is what lets Enter-Enter drive the loop without the eye travelling.
 */

/** Reserved up front. The band is this tall while empty, and no taller when full. */
export const FEEDBACK_MIN_HEIGHT = "8.5rem";

/** What the learner is being told about, in words that name something. */
export type ConceptNote = {
  /** The rule, in Arabic and transliteration — or the letter, and its name. */
  name: string;
  /** The condition that decides it, or what the drill was asking for. */
  condition: string;
  /**
   * Set when the concept is one of the eighteen rules. It carries the palette
   * colour *and* the family's underline style — the redundant channel — so a
   * letter, which has neither, simply renders without them.
   */
  ruleId?: RuleId;
};

/**
 * `RULE_MATERIAL` is the 59-rule concept space `match-answer` and `fill-blank`
 * actually emit `conceptId`s from (e.g. `leen`, `iqlab`, `ra_tafkhim`).
 * `RULE_META`/`TAJWEED_RULES` is a DIFFERENT, smaller 18-id space — the
 * span-colour render palette for `TajweedText` (see `@/content/tajweed`'s own
 * docstring). Gating this component's rule branch on the 18-id palette instead
 * of the full 59 is exactly the earlier bug shape: a rule the games can
 * legitimately ask about (`leen`) fell through to no name and no condition —
 * the direct violation of "every wrong answer names the thing and the
 * violated condition" this rebuild exists to fix.
 *
 * A concept counts as a rule if it is in EITHER space: `RULE_MATERIAL` is the
 * one that matters for real gameplay, but `RULE_META`'s 18 ids are not a
 * subset of it (different spelling conventions — `idghaam_ghunnah` there,
 * `idgham_maal_ghunnah` here), so dropping the `RULE_META` half of the check
 * would stop recognising rules this component always has handled.
 */
const isRule = (conceptId: string): boolean => conceptId in RULE_MATERIAL || conceptId in RULE_META;

/** The narrower 18-id space that also has a palette colour, an Arabic name, and (for some) a condition chain. */
const isPaletteRule = (conceptId: string): conceptId is RuleId => conceptId in RULE_META;

/**
 * What each drill asks the learner to *do*, for the 29 concepts that are letters
 * rather than rules.
 *
 * A letter has no condition chain — there is no "when X follows Y" to state — so
 * the second line says what was being asked instead of inventing a rule for it.
 * The wording describes the shipped drill, and nothing here is a claim about
 * tajweed: that all lives in `library/` and reaches this file through
 * `RULE_META` and `chainOf` only.
 */
const DRILL_ASK: Readonly<Record<string, string>> = {
  "letter-flashcards": "name the letter from its written form",
  "word-flashcards": "read the word, then check yourself against it",
  "letter-quiz": "pick the letter out of four, given its name",
  "spot-the-letter": "find the letter inside a whole word",
  "form-swap": "put each written form in its place — alone, start, middle, end",
  "word-builder": "spell the word letter by letter, in order",
  // The games2 slice drills (`SLICE_GAME_IDS`). Without these, every
  // question any of them asks fell through to the letter-quiz gloss below —
  // and that gloss ("pick the letter out of four, given its name") is not
  // what any of the four asks (I3).
  "broken-form": "spot the letter drawn in the wrong positional form",
  "match-answer": "match the rule or letter to its correct answer",
  "fill-blank": "fill in the blank from the rule's own worked example",
  "build-by-form": "place the word's own letters in reading order, by their shape",
  // `word-bank` and `type-it` (Task 7 — both were vocabulary tests, cued on
  // meaning or transliteration) are gone. No entry for either here: a gameId
  // nothing registers falls through to the generic fallback below, same as
  // any other unrecognised id — see `FeedbackBar.test.tsx`.
};

/**
 * The note for one concept.
 *
 * A **rule** is named and conditioned from `RULE_MATERIAL` — all 59, the full
 * space the games actually draw `conceptId` from — which is honest but plain:
 * a translit name and, when there's a taught ḥarakāt count, how long it's
 * held. The 18 rules that are ALSO in the smaller `RULE_META` render palette
 * get the better version where one exists: an Arabic name alongside the
 * translit, and — for the twelve of those with a `condition-builder` chain
 * (worded from `library/02-Rules/`) — the actual trigger/condition/sound/
 * length sentence instead of the plain gloss. `ruleId` (and with it the
 * palette colour + family underline) is set only for that 18-id subset;
 * everything else in the 59 renders as plain text, honest about not having a
 * curated colour.
 *
 * A **letter** is named as itself. `letterName` comes from the lesson's derived
 * pool when the caller has one, because `PlannedItem` carries the glyph and
 * nothing else — the concept key for a letter *is* the letter.
 */
export function noteFor(conceptId: string, gameId: string, letterName?: string): ConceptNote {
  if (isRule(conceptId)) {
    const material: RuleMaterial | undefined = RULE_MATERIAL[conceptId];
    const paletteId = isPaletteRule(conceptId) ? conceptId : undefined;
    const meta = paletteId ? RULE_META[paletteId] : undefined;
    const chain = paletteId ? chainOf(paletteId) : undefined;
    const label = (role: SlotRole) => chain?.slots.find((s) => s.role === role)?.label ?? "";
    const harakat = meta?.harakat ?? material?.harakat ?? undefined;
    const condition = chain
      ? `${label("trigger")} ${label("condition")} — ${label("sound")}, ${label("length")}`
      : `${meta?.en ?? material?.english ?? conceptId}${harakat ? ` — held ${harakat} counts` : ""}`;
    const name = meta ? `${meta.ar} · ${meta.translit}` : (material?.translit ?? conceptId);
    return { name, condition, ruleId: paletteId };
  }
  return {
    name: letterName ? `${conceptId} · ${letterName}` : conceptId,
    condition: DRILL_ASK[gameId] ?? "recognise this letter wherever it appears",
  };
}

/** Verdict in words, so the colour beside it is never the only signal. */
const VERDICT_TEXT: Record<"yes" | "no" | "ungraded", string> = {
  yes: "صحيح · Correct",
  no: "ليس بعد · Not yet",
  ungraded: "سُجّل · Recorded",
};

const MARK: Record<"yes" | "no" | "ungraded", string> = { yes: "✓", no: "✗", ungraded: "•" };

export function FeedbackBar({
  verdict,
  note,
  label,
  canContinue,
  onContinue,
}: {
  /** `undefined` — unanswered. `null` — answered, ungraded. See `useSession`. */
  verdict: boolean | null | undefined;
  note: ConceptNote | null;
  /** The primary button's text. It is the same button in every state. */
  label: string;
  /**
   * Separate from `verdict` because the two are separate facts: the button is
   * live once the question has been answered *or* once there is no question
   * left, and neither of those is "what the answer was".
   */
  canContinue: boolean;
  onContinue: () => void;
}) {
  const key = verdict === undefined ? null : verdict === null ? "ungraded" : verdict ? "yes" : "no";
  const ruleStyle = note?.ruleId ? nameStyle(note.ruleId) : undefined;

  return (
    <div
      data-testid="feedback-band"
      // Reserved, not grown into: the drill above must not move when this fills.
      style={{ minHeight: FEEDBACK_MIN_HEIGHT }}
      // Opaque ground, never a blur and never `overflow: hidden` — ḥarakāt and
      // Qurʾānic marks extend well outside the em box and a tight clipped box
      // eats a fatḥa.
      className="flex flex-col justify-between gap-3 rounded-2xl border border-white/10 bg-[#121218] p-4"
    >
      <p
        role="status"
        aria-live="polite"
        className="text-start text-sm leading-relaxed text-white/80"
      >
        {key && (
          <>
            <span aria-hidden="true" className="me-2">
              {MARK[key]}
            </span>
            <span className={key === "yes" ? "text-green-300" : key === "no" ? "text-amber-300" : "text-white/60"}>
              {VERDICT_TEXT[key]}
            </span>
            {note && (
              <>
                <span aria-hidden="true" className="px-2 text-white/30">
                  —
                </span>
                <span className="arabic font-semibold" style={ruleStyle}>
                  {note.name}
                </span>
                <span className="mt-1 block text-white/60">{note.condition}</span>
              </>
            )}
          </>
        )}
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          // Present and in place from the first frame, disabled rather than
          // absent: a button that appears is a button that moves.
          disabled={!canContinue}
          onClick={onContinue}
          className="cta-primary rounded-full px-6 py-2 text-sm font-semibold disabled:opacity-40"
        >
          {label}
        </button>
      </div>
    </div>
  );
}

/**
 * The rule's colour **and** its family's underline, together.
 *
 * Never the colour alone: on this background `madd_muttasil`'s `#000EBC` scores
 * 1.71 contrast, fourteen distinct hues is already past what categorical colour
 * can carry, and a screen reader announces none of it. `UNDERLINE` is per family
 * and `silent` has none, which is why the line is conditional rather than
 * defaulted.
 */
function nameStyle(ruleId: RuleId): CSSProperties {
  const style = UNDERLINE[RULE_META[ruleId].family];
  return {
    color: PALETTE_B[ruleId],
    ...(style === "none"
      ? {}
      : {
          textDecorationLine: "underline",
          textDecorationStyle: style as CSSProperties["textDecorationStyle"],
          textUnderlineOffset: "0.35em",
        }),
  };
}
