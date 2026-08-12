import { describe, test, expect } from "vitest";
import fs from "node:fs";
import { parseNote } from "./frontmatter";
import { inScopeNoteFiles, VAULT_DIR } from "./paths";

describe("parseNote", () => {
  test("splits frontmatter from body", () => {
    const { data, body } = parseNote("---\ntype: rule\nid: ghunnah\n---\n\n# Al-Ghunnah\n");
    expect(data).toEqual({ type: "rule", id: "ghunnah" });
    expect(body.trim()).toBe("# Al-Ghunnah");
  });

  test("throws when frontmatter is missing", () => {
    expect(() => parseNote("# No frontmatter\n")).toThrow(/missing frontmatter/);
  });

  test("throws when frontmatter is unterminated", () => {
    expect(() => parseNote("---\ntype: rule\n")).toThrow(/unterminated frontmatter/);
  });

  test("throws when frontmatter is not a mapping", () => {
    expect(() => parseNote("---\n- a\n- b\n---\nbody\n")).toThrow(/must be a mapping/);
  });
});

describe("inScopeNoteFiles", () => {
  test("finds exactly the 101 in-scope notes", () => {
    expect(inScopeNoteFiles()).toHaveLength(101);
  });

  test("is sorted and absolute", () => {
    const files = inScopeNoteFiles();
    expect(files).toEqual([...files].sort());
    expect(files.every((f) => f.startsWith("/"))).toBe(true);
  });

  test("skips dot-directories such as .obsidian", () => {
    // Check the path RELATIVE to the vault. Checking the absolute path is wrong:
    // a git worktree lives under `.claude/worktrees/`, so every absolute path
    // contains "/." and the assertion fails for a reason unrelated to the vault.
    const rel = inScopeNoteFiles().map((f) => f.slice(VAULT_DIR.length));
    expect(rel.some((f) => f.includes("/."))).toBe(false);
  });

  test("every in-scope note parses", () => {
    for (const file of inScopeNoteFiles()) {
      expect(() => parseNote(fs.readFileSync(file, "utf8")), file).not.toThrow();
    }
  });
});
