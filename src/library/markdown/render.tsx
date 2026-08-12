import React from "react";
import { lexNote, type Token, type Tokens } from "./parse";

export { lexNote };

type Slugger = (text: string) => string;

function isExternal(href: string): boolean {
  return /^https?:\/\//i.test(href);
}

// Mirrors the character range in src/library/sources.ts. That file's own docblock
// documents why a naive Arabic-*share* threshold is dangerous: an earlier version
// used one to find where a matn ends, and a heading that was legitimately 31.8%
// Arabic scored just under it, silently leaking two Qur'an-adjacent poems' opening
// verses. This is a different problem, though — no state carries between headings
// here — so a share is safe, but the threshold below is fitted to this vault's data,
// not borrowed from that file (which doesn't have one to borrow: it never reintroduced
// the share approach after removing it).
const ARABIC = /[؀-ۿ]/;
// Global variants for counting (`.match`), kept separate from ARABIC above: a global
// regex used with `.test()` mutates `lastIndex` across calls and misfires on repeated
// use, which is why ARABIC itself stays non-global — it's `.test()`'d once per heading
// in a loop below.
const ARABIC_G = /[؀-ۿ]/g;
// Latin letters, including the diacritics tajweed transliteration needs (ā ī ū ḍ ḥ ṭ
// ẓ ṣ ġ …): ASCII, Latin-1 Supplement, Latin Extended-A/B, IPA Extensions, and Latin
// Extended Additional.
const LATIN_G = /[A-Za-zÀ-ɏḀ-ỿ]/g;

/**
 * Share of Arabic among (Arabic + Latin) letters, ignoring digits/punctuation/spaces.
 *
 * Measured over all 138 Arabic-bearing headings in the 101 in-scope notes, there is a
 * clean gap to threshold in: this vault's short bilingual titles — "غ — ghayn",
 * "Madd al-Badal — مد البدل" — run as low as 14.3% Arabic by letter count, while the
 * real bug this fixes — an English sentence that merely names a letter in passing,
 * e.g. "Why ض is the hardest letter in Arabic" or "ط → ت is nāqiṣ — and this is the
 * rule's real content" — tops out at 12.5%. 0.13 sits in that gap, so it separates
 * every case in the corpus correctly: it does not misfire on either side.
 */
const ARABIC_SHARE_THRESHOLD = 0.13;

function isPredominantlyArabic(text: string): boolean {
  const arabicCount = (text.match(ARABIC_G) || []).length;
  if (arabicCount === 0) return false;
  const latinCount = (text.match(LATIN_G) || []).length;
  return arabicCount / (arabicCount + latinCount) >= ARABIC_SHARE_THRESHOLD;
}

/** Inline tokens → React. `html` is deliberately absent: it falls through to text. */
function renderInline(tokens: Token[] | undefined, key = "i"): React.ReactNode {
  if (!tokens) return null;
  return tokens.map((t, i) => {
    const k = `${key}-${i}`;
    switch (t.type) {
      case "text":
        return <React.Fragment key={k}>{(t as Tokens.Text).tokens ? renderInline((t as Tokens.Text).tokens, k) : (t as Tokens.Text).text}</React.Fragment>;
      case "strong":
        return <strong key={k} className="font-semibold text-white/90">{renderInline((t as Tokens.Strong).tokens, k)}</strong>;
      case "em":
        return <em key={k}>{renderInline((t as Tokens.Em).tokens, k)}</em>;
      case "codespan":
        return <code key={k} className="rounded bg-white/10 px-1 py-0.5 text-[0.9em]">{(t as Tokens.Codespan).text}</code>;
      case "br":
        return <br key={k} />;
      case "del":
        return <del key={k}>{renderInline((t as Tokens.Del).tokens, k)}</del>;
      case "link": {
        const l = t as Tokens.Link;
        const ext = isExternal(l.href);
        return (
          <a
            key={k}
            href={l.href}
            className="underline decoration-white/30 underline-offset-2 hover:decoration-white/70"
            {...(ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {renderInline(l.tokens, k)}
          </a>
        );
      }
      // `escape` carries the already-unescaped character, e.g. \| -> |
      case "escape":
        return <React.Fragment key={k}>{(t as Tokens.Escape).text}</React.Fragment>;
      // Raw HTML is NEVER interpreted. The two occurrences in the vault are false
      // positives inside code spans (<Video ID>, <audio>); showing the source text is
      // both correct for them and the cheapest safety property available here.
      default:
        return <React.Fragment key={k}>{(t as { raw?: string }).raw ?? ""}</React.Fragment>;
    }
  });
}

/** Block tokens → React. */
export function renderTokens(tokens: Token[], slugger: Slugger, key = "b"): React.ReactNode {
  return tokens.map((t, i) => {
    const k = `${key}-${i}`;
    switch (t.type) {
      case "space":
        return null;
      case "heading": {
        const h = t as Tokens.Heading;
        const id = slugger(h.text);
        const hasArabic = ARABIC.test(h.text);
        // A bāb heading (predominantly Arabic) gets the same presentation contract as
        // TajweedText: `.arabic` (Amiri, rtl) and `lang="ar"` for screen readers. A
        // heading that merely NAMES a letter inside an English sentence — "Why ض is
        // the hardest letter in Arabic" — gets neither: it gets `dir="auto"` instead,
        // the same bidi-safety table cells get below, so the lone letter (and any
        // `→`/`·` separators) still order correctly without being announced as Arabic.
        const arabicHeading = hasArabic && isPredominantlyArabic(h.text);
        const base = h.depth <= 2 ? "mt-8 mb-3 text-xl font-bold text-white/90" : "mt-6 mb-2 font-semibold text-white/85";
        const cls = arabicHeading ? `${base} arabic` : base;
        const Tag = (`h${Math.min(h.depth, 6)}`) as "h1";
        return (
          <Tag
            key={k}
            id={id}
            lang={arabicHeading ? "ar" : undefined}
            dir={!arabicHeading && hasArabic ? "auto" : undefined}
            className={cls}
          >
            {renderInline(h.tokens, k)}
          </Tag>
        );
      }
      case "paragraph":
        return <p key={k} className="my-3 leading-relaxed text-white/75">{renderInline((t as Tokens.Paragraph).tokens, k)}</p>;
      case "blockquote":
        return (
          <blockquote key={k} className="my-4 border-l-2 border-white/25 pl-4 text-white/70">
            {renderTokens((t as Tokens.Blockquote).tokens, slugger, k)}
          </blockquote>
        );
      case "list": {
        const l = t as Tokens.List;
        const Tag = l.ordered ? "ol" : "ul";
        return (
          <Tag key={k} className={`my-3 space-y-1 pl-6 text-white/75 ${l.ordered ? "list-decimal" : "list-disc"}`}>
            {l.items.map((item, j) => (
              <li key={`${k}-${j}`}>{renderTokens(item.tokens, slugger, `${k}-${j}`)}</li>
            ))}
          </Tag>
        );
      }
      case "table": {
        const tb = t as Tokens.Table;
        return (
          <div key={k} className="my-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  {tb.header.map((cell, j) => (
                    // dir="auto" — many cells mix Arabic with `→`/`·` separators, which
                    // otherwise resolve to reversed display order under UAX#9.
                    <th key={`${k}-h-${j}`} dir="auto" className="border-b border-white/20 px-2 py-1.5 text-left font-semibold text-white/85">
                      {renderInline(cell.tokens, `${k}-h-${j}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tb.rows.map((row, r) => (
                  <tr key={`${k}-r-${r}`}>
                    {row.map((cell, c) => (
                      <td key={`${k}-r-${r}-${c}`} dir="auto" className="border-b border-white/10 px-2 py-1.5 align-top text-white/75">
                        {renderInline(cell.tokens, `${k}-r-${r}-${c}`)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case "code":
        return (
          <pre key={k} className="my-4 overflow-x-auto rounded-lg bg-black/40 p-3 text-xs">
            <code>{(t as Tokens.Code).text}</code>
          </pre>
        );
      case "hr":
        return <hr key={k} className="my-6 border-white/15" />;
      case "text":
        return <p key={k} className="my-3 leading-relaxed text-white/75">{renderInline((t as Tokens.Text).tokens ?? [t], k)}</p>;
      default:
        return <p key={k} className="my-3 leading-relaxed text-white/75">{(t as { raw?: string }).raw ?? ""}</p>;
    }
  });
}
