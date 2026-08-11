"use client";
import { PALETTE_B, PALETTE_A, RULE_META, UNDERLINE, type RuleId } from "@/content/tajweed";

export type Span = { start: number; end: number; rules: string[] };

export function TajweedText({
  text, spans, palette = "B", isolate, onRuleTap,
}: {
  text: string; spans: Span[]; palette?: "A" | "B";
  isolate?: RuleId | null; onRuleTap?: (rule: RuleId) => void;
}) {
  const colours = palette === "A" ? PALETTE_A : PALETTE_B;
  const children: React.ReactNode[] = [];
  let cursor = 0;

  const pushPlain = (to: number) => {
    if (to > cursor) children.push(text.slice(cursor, to));
    cursor = to;
  };

  for (const span of spans) {
    if (span.start < cursor) continue; // defensive: spans must be disjoint
    pushPlain(span.start);
    const primary = span.rules[0] as RuleId;
    const meta = RULE_META[primary];
    const dimmed = Boolean(isolate) && !span.rules.includes(isolate as string);
    children.push(
      <span
        key={span.start}
        data-rule={primary}
        data-dimmed={dimmed ? "true" : undefined}
        aria-hidden="true"
        onClick={onRuleTap ? () => onRuleTap(primary) : undefined}
        style={{
          color: colours[primary],
          // `UNDERLINE` carries "none" for the silent family, meaning *no underline*
          // — a silent letter's whole signal is that it is grey and unobtrusive.
          // That has to suppress the LINE. Passing it to `text-decoration-style`
          // instead is silently inert: "none" is not a legal style value
          // (solid | double | dotted | dashed | wavy), so the declaration is dropped
          // and the style falls back to `solid` — drawing the underline it was meant
          // to remove, on a third of every span in the course.
          textDecorationLine: meta && UNDERLINE[meta.family] !== "none" ? "underline" : undefined,
          textDecorationStyle:
            meta && UNDERLINE[meta.family] !== "none"
              ? (UNDERLINE[meta.family] as React.CSSProperties["textDecorationStyle"])
              : undefined,
          opacity: dimmed ? 0.25 : undefined,
        }}
      >
        {text.slice(span.start, span.end)}
      </span>,
    );
    cursor = span.end;
  }
  pushPlain(text.length);

  return (
    <span className="tajweed-text quran" dir="rtl" lang="ar" aria-label={text} role="text">
      {children}
    </span>
  );
}
