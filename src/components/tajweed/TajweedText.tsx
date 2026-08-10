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
          textDecorationLine: meta ? "underline" : undefined,
          textDecorationStyle: meta
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
