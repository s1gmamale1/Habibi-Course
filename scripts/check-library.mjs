#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, basename, extname, relative } from "node:path";
import { parseNote } from "./lib/frontmatter.mjs";
import { loadCorpus, verifyExample } from "./lib/corpus.mjs";
import { CPFAIR_KEYS, RULE_FAMILIES, NOTE_TYPES, STATUSES } from "./lib/rules.mjs";

const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
const LESSON_ID = /^\d-\d{2}$/;
const LANDING = /\*\*(In plain terms:|Said simply:|What that means out loud:)\*\*/;

/**
 * Lesson ids a learner can actually reach — the ids listed in `content/course.json`.
 *
 * Some checks apply only to published content. Note `status` cannot stand in for
 * that: every lesson note in the vault is still `draft`, so gating on it would
 * make those checks silently dead. The course map is the real publish signal, and
 * it is the same file the app routes from.
 */
function publishedLessonIds(root = "content/course.json") {
  try {
    const course = JSON.parse(readFileSync(root, "utf8"));
    return new Set(course.phases.flatMap((p) => p.lessons.map((l) => l.id)));
  } catch {
    return new Set(); // no map reachable — publish-only checks simply do not run
  }
}

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
  const published = publishedLessonIds();
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

    // Lesson ids are zero-padded: "3-06", never "3-6". The content schema's
    // regex is /^\d-\d{2}$/, so an unpadded id here silently fails to match a
    // lesson later.
    for (const field of ["taught_in", "id"]) {
      const value = data[field];
      if (data.type === "lesson" && field === "id" && !LESSON_ID.test(String(value))) {
        errors.push(`${rel}: lesson id "${value}" must be zero-padded, e.g. "3-06"`);
      }
      if (field === "taught_in" && value != null && !LESSON_ID.test(String(value))) {
        errors.push(`${rel}: taught_in "${value}" must be zero-padded, e.g. "3-06"`);
      }
    }

    // `prerequisites` means different things by note type: a lesson depends on
    // earlier LESSONS, a rule depends on earlier RULES. Validate accordingly.
    if (data.type === "lesson") {
      for (const ref of data.prerequisites ?? []) {
        if (!LESSON_ID.test(String(ref))) {
          errors.push(`${rel}: prerequisite "${ref}" must be a zero-padded lesson id`);
        }
      }

      // The visible "# Lesson N — ..." heading must name the same lesson as the
      // frontmatter id. Inserting a lesson means renumbering the ones after it,
      // and a renumber only matches the pattern it was written for. When Unit 3
      // shifted to free 3-04, ten headings written "Lesson 3.27" survived a pass
      // that only matched the hyphenated "3-27", leaving files whose id and
      // heading named different lessons. Nothing else in the vault caught it.
      //
      // Compared by NUMBER, not by string: "2.8" and "2-08" are the same lesson
      // written two ways, and both spellings are in use. Only a genuine
      // disagreement — 3.27 against 3-28 — is an error.
      const h1 = body.match(/^#\s+Lesson\s+(\d+)[-.](\d+)/m);
      if (h1) {
        const [, phase, num] = h1;
        const [idPhase, idNum] = data.id.split("-");
        if (Number(phase) !== Number(idPhase) || Number(num) !== Number(idNum)) {
          errors.push(`${rel}: heading says "Lesson ${phase}.${num}" but id is "${data.id}"`);
        }
      }

      // A published lesson's teaching sequence must land its jargon in plain words.
      // Scoped to lessons a learner can reach: an unpublished draft is allowed to
      // be half-written, and erroring on all 45 of them would block every commit
      // until the whole backlog is done.
      //
      // Deliberately NOT one landing per teaching point. Requiring that would force
      // filler into the procedural lessons (2-10, 2-14), and a landing written to
      // satisfy a counter is worse than none — it restates the technical account
      // instead of translating it, which is the failure the skill names first.
      // One per lesson is the floor; judgement decides the rest.
      const seq = (body.match(/## Teaching sequence[\s\S]*?(?=\n## )/) || [""])[0];
      if (published.has(data.id) && seq && !LANDING.test(seq)) {
        errors.push(
          `${rel}: teaching sequence has no plain-language landing ` +
            `(expected one of: "In plain terms:", "Said simply:", "What that means out loud:")`,
        );
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

  // A rule's prerequisites are other rules. An unresolvable one means the
  // dependency graph is broken — which is exactly what the Jazariyyah ordering
  // exists to get right, so this is worth failing on.
  for (const n of notes.filter((x) => x.data.type === "rule")) {
    for (const ref of n.data.prerequisites ?? []) {
      if (!ruleStatus.has(String(ref))) {
        errors.push(`${n.rel}: prerequisite rule "${ref}" has no note`);
      }
    }
  }
  // Which lesson claims to teach each rule. First claimant wins.
  const taughtBy = new Map();
  for (const n of notes.filter((x) => x.data.type === "lesson")) {
    for (const id of n.data.teaches ?? []) {
      if (ruleStatus.get(id) !== "verified") {
        warnings.push(`${n.rel}: teaches "${id}" which is not verified`);
      }
      if (!ruleStatus.has(id)) {
        errors.push(`${n.rel}: teaches "${id}" but no rule note has that id`);
      }
      if (!taughtBy.has(id)) taughtBy.set(id, n.data.id);
    }
  }

  // A rule's taught_in must agree with the lesson that teaches it. These were
  // assigned independently per batch before the lessons existed, and drifted.
  for (const n of notes.filter((x) => x.data.type === "rule")) {
    const lesson = taughtBy.get(n.data.id);
    if (lesson && String(n.data.taught_in) !== String(lesson)) {
      errors.push(
        `${n.rel}: taught_in "${n.data.taught_in}" but lesson ${lesson} teaches it`,
      );
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
