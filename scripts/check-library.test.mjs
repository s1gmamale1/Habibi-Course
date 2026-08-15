import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { checkVault, publishedLessonIds } from "./check-library.mjs";
import { loadCorpus } from "./lib/corpus.mjs";

/**
 * The course map is the vault gate's publish signal: several checks only apply
 * to lessons a learner can actually reach, and they ask this Set. Two ways it
 * used to go quietly wrong, both of which disabled those checks rather than
 * failing:
 *
 *   1. `content/course.json` was resolved against the *current working
 *      directory*, while the vault to check is an argument. Run the gate from
 *      anywhere but the repo root — a hook, a CI step with a different cwd, a
 *      git worktree — and the read missed.
 *   2. The miss was swallowed by a bare `catch` that returned an empty Set, so
 *      the publish-gated checks matched nothing and passed. The gate printed
 *      "0 errors" either way.
 *
 * A gate that fails open reports success precisely when it is broken, so both
 * are covered here: the path is script-relative, and an unreadable or corrupt
 * map is a hard error.
 */
describe("publishedLessonIds", () => {
  it("reads the real course map", () => {
    const ids = publishedLessonIds();
    expect(ids.size).toBeGreaterThan(0);
    expect(ids.has("1-01")).toBe(true);
  });

  it("resolves the course map from the script, not the working directory", () => {
    const cwd = process.cwd();
    try {
      process.chdir(tmpdir());
      expect(publishedLessonIds().size).toBeGreaterThan(0);
    } finally {
      process.chdir(cwd);
    }
  });

  it("throws rather than silently disabling the publish-gated checks", () => {
    expect(() => publishedLessonIds("/nonexistent/course.json")).toThrow(/course map/i);
  });

  it("throws on a course map that parses but has no phases", () => {
    expect(() => publishedLessonIds(new URL("./lib/rules.mjs", import.meta.url).pathname)).toThrow(
      /course map/i,
    );
  });
});

/**
 * The ten tongue makharij, pinned by letter.
 *
 * 18 of the 29 letters issue from the tongue, and every one of them used to
 * point at a single diagram whose highlight covered the whole tongue — so ت
 * (tip), ض (side) and ك (back) were indistinguishable to the learner this
 * course was built for. `makhraj_point` is what makes them distinguishable, so
 * it is worth more than a shape check: this pins the actual grouping.
 *
 * Every value came from the note's own prose except ش and ي, whose `makhraj`
 * line is ج's verbatim — all three are wasat al-lisan, the 3rd. If a future
 * edit moves a letter between points, that is a claim about tajweed and it
 * should have to be made deliberately, in front of this test.
 */
describe("the ten tongue makharij", () => {
  // cwd-relative, as the npm script invokes it. `new URL("../library",
  // import.meta.url)` resolves to the filesystem root under vitest's transform,
  // which on macOS walks into /Library and dies on a permissions error.
  const { tonguePoints } = checkVault(join(process.cwd(), "library"), loadCorpus());
  const at = (p) => [...(tonguePoints.get(p) ?? [])].sort();

  it("covers all ten points, and no more", () => {
    expect([...tonguePoints.keys()].sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it("accounts for all 18 tongue letters exactly once", () => {
    const all = [...tonguePoints.values()].flat();
    expect(all).toHaveLength(18);
    expect(new Set(all).size).toBe(18);
  });

  it("groups the letters as the classical ten", () => {
    expect(at(1)).toEqual(["ق"]); // deepest tongue, soft palate
    expect(at(2)).toEqual(["ك"]); // just in front of qāf, hard palate
    expect(at(3)).toEqual(["ج", "ش", "ي"].sort()); // wasat al-lisan
    expect(at(4)).toEqual(["ض"]); // the side edges — the only lateral point
    expect(at(5)).toEqual(["ل"]);
    expect(at(6)).toEqual(["ن"]);
    expect(at(7)).toEqual(["ر"]);
    expect(at(8)).toEqual(["ت", "د", "ط"].sort()); // nitʿiyyah
    expect(at(9)).toEqual(["ز", "س", "ص"].sort()); // asaliyyah, the whistling group
    expect(at(10)).toEqual(["ث", "ذ", "ظ"].sort()); // lithawiyyah
  });

  it("separates the three points a single tongue highlight collapsed", () => {
    // The concrete failure this whole exercise exists to fix: the back of the
    // tongue, the side, and the tip are three different places.
    const pointOf = (letter) =>
      [...tonguePoints.entries()].find(([, ls]) => ls.includes(letter))?.[0];
    expect(new Set([pointOf("ك"), pointOf("ض"), pointOf("ت")]).size).toBe(3);
  });
});

/**
 * The drift gate on `teaches:` — the thing that makes `idghaam_shafawi` vs
 * `idgham_shafawi` a build failure instead of two silently-different
 * id-vocabularies. A `teaches:` id must resolve to a real rule note, except
 * the five span-colour palette ids that name no rule (`madd_2`, `madd_246`,
 * `madd_6`, `qalqalah`, `silent` — see `TAJWEED_RULES` in
 * `src/content/tajweed.ts`), which are named explicitly and let through.
 *
 * A synthetic vault, not the real one: the real library has no reason to ever
 * reference a palette-only id or a misspelling, so the exception and the
 * failure it exists to catch both need a fixture to exercise at all.
 */
describe("the teaches: drift gate", () => {
  const corpus = loadCorpus();

  function vaultWith(...files) {
    const dir = mkdtempSync(join(tmpdir(), "check-library-test-"));
    for (const [name, contents] of files) writeFileSync(join(dir, name), contents);
    return dir;
  }

  const RULE_NOTE = `---
type: rule
id: leen
arabic: "لين"
translit: "al-Layin"
english: "Ease"
family: sifat
status: verified
---
Body.
`;

  it("lets a palette-only id through with no rule note", () => {
    const dir = vaultWith(
      ["leen.md", RULE_NOTE],
      [
        "lesson.md",
        `---
type: lesson
id: 9-98
status: draft
teaches: [leen, qalqalah]
---
Body.
`,
      ],
    );
    try {
      const { errors } = checkVault(dir, corpus);
      expect(errors.filter((e) => e.includes('teaches "'))).toEqual([]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("still fails an id that resolves to no rule note and isn't a palette id", () => {
    const dir = vaultWith(
      ["leen.md", RULE_NOTE],
      [
        "lesson.md",
        `---
type: lesson
id: 9-99
status: draft
teaches: [leen, idghaam_shafawi]
---
Body.
`,
      ],
    );
    try {
      const { errors } = checkVault(dir, corpus);
      expect(errors).toContainEqual(
        expect.stringContaining('teaches "idghaam_shafawi" but no rule note has that id'),
      );
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
