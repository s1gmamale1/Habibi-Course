import type { CSSProperties } from "react";
import { PALETTE_A, PALETTE_B, RULE_META, UNDERLINE, type RuleId } from "@/content/tajweed";

/**
 * The rules on this page, named in words.
 *
 * Colour alone cannot carry 14 distinct rules — categorical colour tops out
 * around 8–10 hues, fewer under deuteranopia, and on the velvet background
 * `#000EBC` scores 1.71 contrast. So the swatch is decorative (`aria-hidden`)
 * and every row states the rule's Arabic name, transliteration and English
 * name as text. The swatch also carries the family's underline style, the
 * same redundant channel `TajweedText` applies to the ayah itself.
 */
export function RuleLegend({
  rules,
  palette = "B",
}: {
  rules: RuleId[];
  /** B = course default (Quranly: red qalqalah, blue madd). A = Dar al-Maʿrifah print (red madd). */
  palette?: "A" | "B";
}) {
  const unique = [...new Set(rules)];
  if (unique.length === 0) return null;
  const colours = palette === "A" ? PALETTE_A : PALETTE_B;

  return (
    <ul
      aria-label="Tajweed rules on this page"
      data-palette={palette}
      className="rule-legend glass mb-6 flex flex-col gap-2 rounded-2xl p-3 sm:p-4"
    >
      {unique.map((id) => {
        const meta = RULE_META[id];
        const colour = colours[id];
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
          <li key={id} data-rule={id} className="flex items-center gap-3 text-sm">
            <span aria-hidden="true" style={swatch} className="rule-legend__swatch arabic shrink-0 text-2xl leading-none">
              ـــ
            </span>
            <span dir="rtl" className="arabic shrink-0 text-lg text-white/90">{meta.ar}</span>
            <span className="shrink-0 font-medium text-white/90">{meta.translit}</span>
            <span className="text-white/60">{meta.en}</span>
            {meta.harakat !== undefined && (
              <span className="ml-auto shrink-0 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-xs text-white/70">
                {meta.harakat} ḥarakāt
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
