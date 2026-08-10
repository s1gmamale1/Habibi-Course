#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";
import { parseNote } from "./lib/frontmatter.mjs";
import { loadCorpus, verifyExample } from "./lib/corpus.mjs";
import { CPFAIR_KEYS, RULE_FAMILIES, NOTE_TYPES, STATUSES } from "./lib/rules.mjs";

const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (extname(p) === ".md") out.push(p);
  }
  return out;
}

export function checkVault(dir, corpus) {
  const errors = [];
  const warnings = [];
  const files = walk(dir);
  const names = new Set(files.map((f) => basename(f, ".md")));
  const notes = [];

  for (const file of files) {
    const rel = relative(dir, file);
    let parsed;
    try {
      parsed = parseNote(readFileSync(file, "utf8"));
    } catch (e) {
      errors.push(`${rel}: ${e.message}`);
      continue;
    }
    const { data, body } = parsed;
    notes.push({ rel, data });

    if (!NOTE_TYPES.has(data.type)) errors.push(`${rel}: invalid type "${data.type}"`);
    if (!STATUSES.has(data.status)) errors.push(`${rel}: invalid status "${data.status}"`);

    if (data.type === "rule") {
      for (const field of ["id", "arabic", "translit", "english", "family"]) {
        if (!data[field]) errors.push(`${rel}: rule missing required field "${field}"`);
      }
      if (data.family && !RULE_FAMILIES.has(data.family)) {
        errors.push(`${rel}: unknown family "${data.family}"`);
      }
      if (data.cpfair_key && !CPFAIR_KEYS.has(data.cpfair_key)) {
        errors.push(`${rel}: unknown cpfair_key "${data.cpfair_key}"`);
      }
    }

    for (const ex of data.examples ?? []) {
      const r = verifyExample(corpus, ex);
      if (!r.ok) errors.push(`${rel}: example ${r.reason}`);
    }

    for (const src of data.sources ?? []) {
      const m = String(src).match(/\[\[([^\]|#]+)/);
      const target = m ? m[1].trim() : String(src).trim();
      if (!names.has(target)) errors.push(`${rel}: source note not found "${target}"`);
    }

    for (const m of body.matchAll(WIKILINK)) {
      const target = m[1].trim();
      if (!names.has(target)) errors.push(`${rel}: dangling wikilink [[${target}]]`);
    }
  }

  const ruleStatus = new Map(
    notes.filter((n) => n.data.type === "rule").map((n) => [n.data.id, n.data.status]),
  );
  for (const n of notes.filter((x) => x.data.type === "lesson")) {
    for (const id of n.data.teaches ?? []) {
      if (ruleStatus.get(id) !== "verified") {
        warnings.push(`${n.rel}: teaches "${id}" which is not verified`);
      }
    }
  }

  return {
    errors,
    warnings,
    counts: {
      notes: notes.length,
      rules: notes.filter((n) => n.data.type === "rule").length,
      letters: notes.filter((n) => n.data.type === "letter").length,
      lessons: notes.filter((n) => n.data.type === "lesson").length,
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dir = process.argv[2] ?? "library";
  const { errors, warnings, counts } = checkVault(dir, loadCorpus());
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  console.log(
    `\n${counts.notes} notes — ${counts.rules} rules, ${counts.letters} letters, ` +
    `${counts.lessons} lessons · ${errors.length} errors, ${warnings.length} warnings`,
  );
  process.exit(errors.length > 0 ? 1 : 0);
}
