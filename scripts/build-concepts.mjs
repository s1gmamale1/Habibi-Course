#!/usr/bin/env node
// Emits src/generated/concepts.ts from the library.
//
// The library is the source (ADR-003) and is read through `node:fs`, but
// `practice/concepts.ts` has to run in a browser — so the concept list is
// generated and committed, exactly as the Qur'an corpus already is.
//
// This exists because the scheduler's concept space was previously
// `TAJWEED_RULES` in src/content/tajweed.ts, which is the span-colour palette
// for rendering ayat: 46 of the 59 rules the curriculum teaches had no id at
// all, and 5 ids in that list are taught by nothing.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { resolveRuleSlideId } from "./lib/rule-alias.mjs";

const ROOT = process.cwd();
const OUT = join(ROOT, "src/generated/concepts.ts");

/** Frontmatter only — enough for the scalar and inline-list fields we need. */
function frontmatter(text) {
  const m = /^---\n([\s\S]*?)\n---/.exec(text);
  return m ? m[1] : "";
}
const scalar = (fm, key) => {
  const m = new RegExp(`^${key}:\\s*(.+)$`, "m").exec(fm);
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : null;
};
const list = (fm, key) => {
  const m = new RegExp(`^${key}:\\s*\\[(.*?)\\]$`, "m").exec(fm);
  return m ? m[1].split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean) : [];
};

/**
 * A `key: value` value inside an `examples:` block entry, quote-aware so an
 * escaped `\"` inside a quoted value doesn't read as the closing quote (it
 * did, once — see `madd_farq`'s 10:59 example, which generated as a bare
 * `"\\"` until this learned to unescape `\"` and `\\`).
 */
function exampleValue(chunk, key) {
  const quoted = new RegExp(`${key}:\\s*"((?:\\\\.|[^"\\\\])*)"`).exec(chunk);
  if (quoted) return quoted[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
  const bare = new RegExp(`${key}:\\s*([^\\n]+)`).exec(chunk);
  return bare ? bare[1].trim() : undefined;
}

/** `examples:` is a block list of `- ref: / text: / note:` items. */
function examples(text) {
  const block = /^examples:\n([\s\S]*?)(?=\n[a-z_]+:|\n---)/m.exec(text);
  if (!block) return [];
  const out = [];
  for (const chunk of block[1].split(/^\s*-\s+/m).slice(1)) {
    const ref = exampleValue(chunk, "ref");
    const txt = exampleValue(chunk, "text");
    const note = exampleValue(chunk, "note");
    if (ref && txt) out.push(note ? { ref, text: txt, note } : { ref, text: txt });
  }
  return out;
}

const rules = [];
/**
 * `cpfair_key` -> canonical rule id(s), read straight off the rule notes'
 * frontmatter, not hand-copied.
 *
 * `content/lessons/*.json` rule slides were authored against the render
 * palette (the `cpfair-quran-tajweed` dataset — see `RULE_MATERIAL`'s doc
 * comment for the history), not the library's canonical ids: `"ikhfa"` in a
 * lesson JSON means `ikhfa_haqiqi`, `"madd_2"` means `madd_tabii`, and so on.
 * Every rule note that needs this translation documents it in its own
 * frontmatter as `cpfair_key:` (and the library is the source per ADR-003),
 * so the alias table is derived from there rather than typed out by hand —
 * a hand-typed copy is exactly the kind of thing that drifts from the
 * library silently.
 *
 * One key, `"qalqalah"`, is genuinely ambiguous: `qalqalah_sughra` and
 * `qalqalah_kubra` both declare `cpfair_key: qalqalah`, because the upstream
 * dataset doesn't distinguish the two degrees. Each also declares
 * `taught_in:`, the lesson that introduces it — used below to disambiguate.
 */
const cpfairByKey = new Map();
for (const f of readdirSync(join(ROOT, "library/02-Rules")).sort()) {
  if (!f.endsWith(".md")) continue;
  const text = readFileSync(join(ROOT, "library/02-Rules", f), "utf8");
  const fm = frontmatter(text);
  if (scalar(fm, "type") !== "rule") continue;
  const id = scalar(fm, "id");
  if (!id) continue;
  const harakat = scalar(fm, "harakat");
  rules.push({
    id,
    english: scalar(fm, "english") ?? id,
    translit: scalar(fm, "translit") ?? id,
    family: scalar(fm, "family") ?? "",
    letters: list(fm, "letters"),
    harakat: harakat === null ? null : Number(harakat),
    examples: examples(text),
  });
  const cpfairKey = scalar(fm, "cpfair_key");
  if (cpfairKey) {
    if (!cpfairByKey.has(cpfairKey)) cpfairByKey.set(cpfairKey, []);
    cpfairByKey.get(cpfairKey).push({ id, taughtIn: scalar(fm, "taught_in") });
  }
}

// Letter concepts are keyed by the Arabic glyph, not the note's ASCII `id`
// slug — deliberately. `Attempt.conceptId` already stores Arabic letters,
// `isConceptId`'s letter branch validates a single Arabic grapheme, and
// `RULE_MATERIAL[x].letters` stores glyphs so trigger-letters cross-reference
// directly. Switching to slugs would orphan the existing ledger.
const letters = [];
for (const f of readdirSync(join(ROOT, "library/03-Letters")).sort()) {
  if (!f.endsWith(".md")) continue;
  const fm = frontmatter(readFileSync(join(ROOT, "library/03-Letters", f), "utf8"));
  const arabic = scalar(fm, "arabic");
  if (scalar(fm, "type") === "letter" && arabic) letters.push(arabic);
}

const ruleIds = new Set(rules.map((r) => r.id));

/**
 * What each lesson actually taught, as schedulable concepts (ADR-003 — the
 * library is the source; this is generated, never hand-copied).
 *
 * Rule, in order, per lesson:
 * 1. Its curriculum note's `teaches:` ids that resolve to a rule concept,
 *    plus the letters its own `kind: "letter"` slides introduce, plus the
 *    rule concepts its own `kind: "rule"` slides carry (resolved through the
 *    `cpfair_key` alias table above where the slide uses the render-palette
 *    spelling rather than the canonical id).
 * 2. If that set is empty — a consolidation/review lesson — every concept
 *    taught by an earlier lesson, cumulative. An empty set would leave that
 *    lesson's practice screen blank; reviewing everything is the correct
 *    reading of a review lesson, not a fudge.
 *
 * "Earlier" is lesson order, not id string comparison: `content/lessons`
 * filenames and `content/course.json`'s publish order agree for all 74
 * lessons (verified by direct comparison while writing this), so sorting
 * `content/lessons/*.json` ids is equivalent to course order here and needs
 * no course.json parse.
 */
function walkMarkdown(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkMarkdown(p));
    else if (entry.name.endsWith(".md")) out.push(p);
  }
  return out;
}

const teachesByLesson = new Map();
for (const f of walkMarkdown(join(ROOT, "library/04-Curriculum"))) {
  const fm = frontmatter(readFileSync(f, "utf8"));
  if (scalar(fm, "type") !== "lesson") continue;
  const id = scalar(fm, "id");
  if (!id) continue;
  teachesByLesson.set(id, list(fm, "teaches"));
}

const lettersByLesson = new Map();
const ruleSlidesByLesson = new Map();
const lessonIds = readdirSync(join(ROOT, "content/lessons"))
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(/\.json$/, ""))
  .sort();
for (const id of lessonIds) {
  const file = `content/lessons/${id}.json`;
  const lesson = JSON.parse(readFileSync(join(ROOT, file), "utf8"));
  const introduced = new Set();
  const ruleConcepts = new Set();
  for (const slide of lesson.slides ?? []) {
    if (slide.kind === "letter" && slide.item?.arabic) introduced.add(slide.item.arabic);
    else if (slide.kind === "rule" && slide.ruleId) {
      ruleConcepts.add(resolveRuleSlideId(slide.ruleId, id, file, ruleIds, cpfairByKey));
    }
  }
  lettersByLesson.set(id, [...introduced]);
  ruleSlidesByLesson.set(id, [...ruleConcepts]);
}

// Stable output order: a concept's position in the master CONCEPTS list
// (rules, then letters, each in their own generated order), so re-runs are
// byte-identical regardless of Set/Map iteration order.
const conceptOrder = new Map([...ruleIds, ...letters].map((c, i) => [c, i]));
const byConceptOrder = (a, b) => conceptOrder.get(a) - conceptOrder.get(b);

const lessonConcepts = {};
const cumulative = new Set();
for (const id of lessonIds) {
  const teaches = (teachesByLesson.get(id) ?? []).filter((t) => ruleIds.has(t));
  const own = lettersByLesson.get(id) ?? [];
  const ownRules = ruleSlidesByLesson.get(id) ?? [];
  const taught = new Set([...teaches, ...own, ...ownRules]);
  if (taught.size > 0) {
    for (const c of taught) cumulative.add(c);
    lessonConcepts[id] = [...taught].sort(byConceptOrder);
  } else {
    lessonConcepts[id] = [...cumulative].sort(byConceptOrder);
  }
}

mkdirSync(join(ROOT, "src/generated"), { recursive: true });
writeFileSync(
  OUT,
  `// GENERATED by scripts/build-concepts.mjs — do not edit.
// Run \`npm run build:concepts\` after changing library/02-Rules or library/03-Letters.
//
// The 88 concepts the scheduler keys on (ADR-008): ${rules.length} tajweed rules
// and ${letters.length} letters, read from the library, which is the source.

export type RuleMaterial = {
  id: string;
  english: string;
  translit: string;
  family: string;
  /** The letters that trigger this rule. 15 for ikhfa; empty where not applicable. */
  letters: string[];
  harakat: number | null;
  examples: { ref: string; text: string; note?: string }[];
};

export const RULE_CONCEPTS = ${JSON.stringify(rules.map((r) => r.id), null, 2)} as const;

export const LETTER_CONCEPTS = ${JSON.stringify(letters, null, 2)} as const;

export const CONCEPTS: readonly string[] = [...RULE_CONCEPTS, ...LETTER_CONCEPTS];

export const RULE_MATERIAL: Readonly<Record<string, RuleMaterial>> = ${JSON.stringify(
    Object.fromEntries(rules.map((r) => [r.id, r])),
    null,
    2,
  )};

// What each of the ${lessonIds.length} lessons actually taught, resolved from its
// curriculum note's \`teaches:\` plus its own letter slides, falling back to
// every concept taught by an earlier lesson for consolidation lessons that
// teach nothing new of their own. See the resolution rule above this block.
export const LESSON_CONCEPTS: Readonly<Record<string, string[]>> = ${JSON.stringify(
    lessonConcepts,
    null,
    2,
  )};
`,
);
console.log(
  `wrote ${OUT}: ${rules.length} rules, ${letters.length} letters, ${lessonIds.length} lessons`,
);
