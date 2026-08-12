import { describe, test, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { allNotes, allSlugs, noteBySlug, loadNote } from "./load";
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

/**
 * These exercise the failure path for real. `loadNote` is exported precisely so this
 * can be driven with a genuine file on disk rather than by mocking `fs` — mocking
 * would also have to defeat `allNotes()`'s memo, which is a lot of machinery to prove
 * a one-line `catch`.
 */
describe("failure reporting", () => {
  let dir: string;
  const write = (name: string, body: string) => {
    const f = path.join(dir, name);
    fs.writeFileSync(f, body);
    return f;
  };

  beforeAll(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), "library-bad-")); });
  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  test("a note with no frontmatter throws, naming its own file", () => {
    const f = write("NoFrontmatter.md", "# Just a heading\n");
    expect(() => loadNote(f)).toThrow(/NoFrontmatter\.md/);
    expect(() => loadNote(f)).toThrow(/missing frontmatter/);
  });

  test("a note whose frontmatter fails the schema throws, naming its own file", () => {
    const f = write("BadStatus.md", "---\ntype: rule\nid: x\nstatus: published\n---\n# x\n");
    expect(() => loadNote(f)).toThrow(/BadStatus\.md/);
  });

  test("a valid note does not throw — proves the above fail for the right reason", () => {
    const f = write("Fine.md", "---\ntype: index\nid: fine\nstatus: verified\n---\n# Fine\n");
    expect(() => loadNote(f)).not.toThrow();
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
