"use client";
import { PALETTE_A, PALETTE_B, RULE_META, type RuleId } from "@/content/tajweed";

/**
 * "Show only ikhfāʾ" — dim every other rule.
 *
 * This sidesteps the 14-colour discrimination problem entirely: a learner
 * never has to tell two hues apart, because only one rule is lit at a time.
 * It is also how the course teaches — one rule per lesson.
 *
 * Toggles are real buttons with `aria-pressed`; the colour dot is decorative.
 */
export function IsolateControl({
  rules,
  value,
  onChange,
  palette = "B",
}: {
  rules: RuleId[];
  value: RuleId | null;
  onChange: (rule: RuleId | null) => void;
  /** Must match the palette the text is rendered with, or the dots lie. */
  palette?: "A" | "B";
}) {
  const unique = [...new Set(rules)];
  if (unique.length === 0) return null;
  const colours = palette === "A" ? PALETTE_A : PALETTE_B;

  return (
    <div
      role="group"
      aria-label="Show only one rule"
      className="isolate-control mb-4 flex flex-wrap items-center gap-2 print:hidden"
    >
      <button
        type="button"
        aria-pressed={value === null}
        onClick={() => onChange(null)}
        className={`rounded-full px-3 py-1.5 text-sm ${value === null ? "cta-primary" : "cta-secondary"}`}
      >
        All
      </button>
      {unique.map((id) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            data-rule={id}
            aria-pressed={active}
            onClick={() => onChange(active ? null : id)}
            className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-sm ${active ? "cta-primary" : "cta-secondary"}`}
          >
            <span
              aria-hidden="true"
              style={{ backgroundColor: colours[id] }}
              className="isolate-control__dot h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-white/30"
            />
            {RULE_META[id].translit}
          </button>
        );
      })}
    </div>
  );
}
