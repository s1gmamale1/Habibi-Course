import type { CSSProperties } from "react";
import { PALETTE_A, PALETTE_B, RULE_META, UNDERLINE, type RuleId } from "@/content/tajweed";

/**
 * One rule, named in words with its colour beside it.
 *
 * The colour lives on a decorative swatch, never on the label: several palette
 * entries (`#000EBC` madd muttaṣil) are unreadable on the velvet background,
 * so the name stays white and the swatch carries hue *and* the family's
 * underline style — the same redundant pair `TajweedText` paints on the ayah.
 */
export function RuleChip({
  rule,
  palette = "B",
}: {
  rule: RuleId;
  /** Must match the palette the text is rendered with, or the swatch lies. */
  palette?: "A" | "B";
}) {
  const meta = RULE_META[rule];
  const colour = (palette === "A" ? PALETTE_A : PALETTE_B)[rule];
  const underline = UNDERLINE[meta.family];
  const swatch: CSSProperties = {
    color: colour,
    textDecorationColor: colour,
    ...(underline === "none"
      ? {}
      : {
          textDecorationLine: "underline",
          textDecorationStyle: underline as CSSProperties["textDecorationStyle"],
          textDecorationThickness: "2px",
          textUnderlineOffset: "3px",
        }),
  };

  return (
    <span
      data-rule={rule}
      className="rule-chip inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1"
    >
      <span aria-hidden="true" style={swatch} className="arabic shrink-0 text-xl leading-none">
        ـــ
      </span>
      <span dir="rtl" className="arabic shrink-0 text-base text-white/90">{meta.ar}</span>
      <span className="text-sm font-medium text-white/90">{meta.translit}</span>
    </span>
  );
}
