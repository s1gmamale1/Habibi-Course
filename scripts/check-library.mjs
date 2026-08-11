#!/usr/bin/env node
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join, basename, dirname, extname, relative } from "node:path";
import { parseNote } from "./lib/frontmatter.mjs";
import { loadCorpus, verifyExample } from "./lib/corpus.mjs";
import { CPFAIR_KEYS, RULE_FAMILIES, NOTE_TYPES, STATUSES } from "./lib/rules.mjs";

const WIKILINK = /\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g;
const LESSON_ID = /^\d-\d{2}$/;
const LANDING = /\*\*(In plain terms:|Said simply:|What that means out loud:)\*\*/;

const HERE = dirname(fileURLToPath(import.meta.url));
export const DEFAULT_COURSE_MAP = join(HERE, "..", "content", "course.json");

/**
 * Lesson ids a learner can actually reach — the ids listed in `content/course.json`.
 *
 * Some checks apply only to published content. Note `status` cannot stand in for
 * that: every lesson note in the vault is still `draft`, so gating on it would
 * make those checks silently dead. The course map is the real publish signal, and
 * it is the same file the app routes from.
 *
 * Resolved against this file, the way `lib/corpus.mjs` resolves the corpus — not
 * against the working directory. The vault to check is an argument the caller
 * spells out; the course map is implicit, so a cwd-relative read made the gate's
 * strictness depend on where it happened to be invoked from.
 *
 * An unreadable or malformed map THROWS. It used to return an empty Set, which
 * silently switched off every publish-gated check while the gate went on printing
 * "0 errors" — a gate that reports success exactly when it is broken. Losing the
 * publish signal is a failure of the gate itself, not a finding about the vault,
 * so it aborts rather than joining the errors list.
 */
export function publishedLessonIds(root = DEFAULT_COURSE_MAP) {
  let course;
  try {
    course = JSON.parse(readFileSync(root, "utf8"));
  } catch (e) {
    throw new Error(`course map unreadable at ${root}: ${e.message}`);
  }
  if (!Array.isArray(course?.phases)) {
    throw new Error(`course map at ${root} has no "phases" array`);
  }
  return new Set(course.phases.flatMap((p) => p.lessons?.map((l) => l.id) ?? []));
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
      // Guarded on `data.id` as well as the heading: a note with a "# Lesson 3-27" heading and
      // no `id:` used to throw a TypeError out of here and abort the ENTIRE gate — swallowing
      // the missing-id error this same pass had already recorded 30 lines above. A checker that
      // dies on the error class it exists to report is worse than no checker.
      const h1 = body.match(/^#\s+Lesson\s+(\d+)[-.](\d+)/m);
      if (h1 && typeof data.id === "string") {
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
      // Most lessons put their teaching under "## Teaching sequence", but the Unit 3
      // revision lessons use "## Part A / ## Part B" instead. Scoping the search to the
      // one heading let those through unchecked — they have teaching content, just under
      // a different name. Fall back to the whole body rather than enumerate headings.
      const seq = (body.match(/## Teaching sequence[\s\S]*?(?=\n## )/) || [null])[0] ?? body;
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

  // ── The Unit 3 hifz strand must tile the eleven hifz surahs exactly ──────────
  //
  // Every āyah of surah 1 and 105–114 is assigned to exactly one Unit 3 lesson, in
  // order, as its new Sabaq. A gap means a learner finishes the unit without having
  // memorised part of the set; a duplicate means two lessons hand her the same lines
  // and the later one silently has no new material.
  //
  // This is checked because it is exactly what a renumber breaks quietly. The `hifz:`
  // field is prose — "revision only — Sabqi and Manzil, no new Sabaq" is a legitimate
  // value — so nothing else in the vault could notice a range going missing.
  {
    const HIFZ_SURAHS = [1, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114];
    const owner = new Map();
    for (const n of notes) {
      if (n.data.type !== "lesson" || !String(n.data.id).startsWith("3-")) continue;
      const m = String(n.data.hifz ?? "").match(/^(\d+):(\d+)(?:-(\d+):(\d+))?$/);
      if (!m) continue; // a revision session; its hifz field is prose by design
      const [, s1, a1, s2, a2] = m;
      if (s2 && s2 !== s1) {
        errors.push(`${n.rel}: hifz range "${n.data.hifz}" spans two surahs`);
        continue;
      }
      for (let a = Number(a1); a <= (a2 ? Number(a2) : Number(a1)); a++) {
        const key = `${s1}:${a}`;
        if (owner.has(key)) errors.push(`${n.rel}: hifz ${key} already assigned to ${owner.get(key)}`);
        else owner.set(key, n.data.id);
      }
    }
    // Only meaningful once Unit 3 exists at full length; skip while it is being built.
    if (owner.size) {
      const missing = [];
      for (const s of HIFZ_SURAHS) {
        let count = 0;
        while (corpus.get(`${s}:${count + 1}`)) count++;
        for (let a = 1; a <= count; a++) if (!owner.has(`${s}:${a}`)) missing.push(`${s}:${a}`);
      }
      if (missing.length) {
        errors.push(
          `Unit 3 hifz strand does not cover the whole hifz set — ${missing.length} āyah(s) ` +
            `unassigned: ${missing.slice(0, 8).join(", ")}${missing.length > 8 ? " …" : ""}`,
        );
      }
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
  let result;
  try {
    result = checkVault(dir, loadCorpus());
  } catch (e) {
    // The gate could not run — a missing corpus, an unreadable course map. That
    // is not "0 errors"; report it as the failure it is.
    console.error(`ERROR gate could not run: ${e.message}`);
    process.exit(1);
  }
  const { errors, warnings, counts } = result;
  for (const w of warnings) console.warn(`WARN  ${w}`);
  for (const e of errors) console.error(`ERROR ${e}`);
  console.log(
    `\n${counts.notes} notes — ${counts.rules} rules, ${counts.letters} letters, ` +
    `${counts.lessons} lessons · ${errors.length} errors, ${warnings.length} warnings`,
  );
  process.exit(errors.length > 0 ? 1 : 0);
}
