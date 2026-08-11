import { tmpdir } from "node:os";
import { describe, expect, it } from "vitest";
import { publishedLessonIds } from "./check-library.mjs";

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
