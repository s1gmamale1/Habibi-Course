import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { allNotes, allSlugs, noteBySlug } from "./load";
import { slugFor, RESERVED_SEGMENTS } from "./routes";
import { VAULT_DIR, walkNotes } from "./paths";

describe("slugFor", () => {
  test("lowercases the basename", () => {
    expect(slugFor("Ghunnah")).toBe("ghunnah");
    expect(slugFor("Idgham-Maal-Ghunnah")).toBe("idgham-maal-ghunnah");
  });
});

describe("allNotes", () => {
  test("loads exactly 101 notes", () => {
    expect(allNotes()).toHaveLength(101);
  });

  test("is sorted by slug", () => {
    const slugs = allNotes().map((n) => n.slug);
    expect(slugs).toEqual([...slugs].sort());
  });

  test("noteBySlug round-trips", () => {
    const n = noteBySlug("ghunnah");
    expect(n.basename).toBe("Ghunnah");
    expect(n.meta.type).toBe("rule");
    expect(n.body).toContain("## Definition");
  });

  test("noteBySlug throws for an unknown slug", () => {
    expect(() => noteBySlug("no-such-note")).toThrow(/unknown library slug/);
  });
});

describe("slug safety", () => {
  // Guards the WHOLE vault, not just the 101 in scope, so adding a note later
  // cannot silently collide with one already published.
  test("lowercasing preserves uniqueness across all 183 vault basenames", () => {
    const basenames = walkNotes(VAULT_DIR).map((f) => path.basename(f, ".md"));
    expect(basenames).toHaveLength(183);
    const slugs = basenames.map(slugFor);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  test("no note claims a reserved section segment", () => {
    const slugs = new Set(allSlugs());
    for (const seg of RESERVED_SEGMENTS) expect(slugs.has(seg)).toBe(false);
  });

  test("every slug is URL-safe", () => {
    for (const s of allSlugs()) expect(s).toMatch(/^[a-z0-9._-]+$/);
  });
});

describe("failure reporting", () => {
  test("a malformed note names its own file", () => {
    const file = path.join(VAULT_DIR, "02-Rules", "Ghunnah.md");
    const raw = fs.readFileSync(file, "utf8");
    expect(raw.startsWith("---")).toBe(true); // guards the fixture assumption
  });
});

/**
 * walkNotes' dot-skip cannot be falsified against the real vault: `library/.obsidian`
 * exists but holds no .md files, and it sits outside the three section directories
 * inScopeNoteFiles() walks. So an assertion over real data passes whether or not the
 * skip works. This builds a throwaway fixture in the OS temp dir — never in library/,
 * which this feature must never write to — so the behaviour is actually pinned.
 */
describe("walkNotes dot-skip, against a fixture that can fail", () => {
  let root: string;

  beforeAll(() => {
    root = fs.mkdtempSync(path.join(os.tmpdir(), "library-walk-"));
    fs.mkdirSync(path.join(root, "visible"), { recursive: true });
    fs.mkdirSync(path.join(root, ".hidden"), { recursive: true });
    fs.writeFileSync(path.join(root, "visible", "Kept.md"), "---\ntype: index\n---\n");
    fs.writeFileSync(path.join(root, ".hidden", "Skipped.md"), "---\ntype: index\n---\n");
    fs.writeFileSync(path.join(root, ".Dotfile.md"), "---\ntype: index\n---\n");
  });

  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  test("a .md inside a dot-directory is not returned", () => {
    expect(walkNotes(root).map((f) => path.basename(f))).toEqual(["Kept.md"]);
  });

  test("a dotfile .md at the top level is not returned", () => {
    expect(walkNotes(root).some((f) => f.endsWith(".Dotfile.md"))).toBe(false);
  });
});
