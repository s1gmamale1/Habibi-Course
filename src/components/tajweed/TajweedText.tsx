"use client";
import { PALETTE_B, PALETTE_A, RULE_META, UNDERLINE, type RuleId } from "@/content/tajweed";

export type Span = { start: number; end: number; rules: string[] };

/**
 * An ayah painted rule by rule.
 *
 * **Accessibility.** The visual text is one string cut into many coloured
 * `<span>`s, and a screen reader must read the ayah as that one string, not as
 * the fragments the colouring happens to produce. The container carries the
 * plain ayah as its accessible name and `role="img"`, whose children are
 * *presentational* — the whole subtree collapses to that one name. It has to be
 * done at the container: the runs between the spans are bare text nodes, and a
 * text node cannot carry `aria-hidden`, so no amount of per-child hiding can
 * cover them. (This was `role="text"`, which is a WebKit extension and not an
 * ARIA role; everywhere else the container degraded to a generic span, where
 * `aria-label` is prohibited and dropped.)
 *
 * The painted spans are output, not controls. Isolating a rule is done from
 * `IsolateControl`, which is real buttons with `aria-pressed`.
 */
export function TajweedText({
  text, spans, palette = "B", isolate,
}: {
  text: string; spans: Span[]; palette?: "A" | "B";
  isolate?: RuleId | null;
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
    <span className="tajweed-text quran" dir="rtl" lang="ar" aria-label={text} role="img">
      {children}
    </span>
  );
}
