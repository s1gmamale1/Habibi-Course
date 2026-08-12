import { describe, test, expect } from "vitest";
import fs from "node:fs";
import { parseNote } from "./frontmatter";
import { inScopeNoteFiles } from "./paths";
import { LibraryNoteSchema } from "./schema";

describe("LibraryNoteSchema", () => {
  test("every in-scope note validates", () => {
    for (const file of inScopeNoteFiles()) {
      const { data } = parseNote(fs.readFileSync(file, "utf8"));
      const result = LibraryNoteSchema.safeParse(data);
      expect(result.success, `${file}: ${result.error?.message}`).toBe(true);
    }
  });

  test("the four types are all present in the corpus", () => {
    const types = new Set(
      inScopeNoteFiles().map(
        (f) => LibraryNoteSchema.parse(parseNote(fs.readFileSync(f, "utf8")).data).type,
      ),
    );
    expect([...types].sort()).toEqual(["index", "letter", "rule", "source"]);
  });

  test("counts by type match the vault", () => {
    const counts: Record<string, number> = {};
    for (const f of inScopeNoteFiles()) {
      const n = LibraryNoteSchema.parse(parseNote(fs.readFileSync(f, "utf8")).data);
      counts[n.type] = (counts[n.type] ?? 0) + 1;
    }
    expect(counts).toEqual({ rule: 59, letter: 29, source: 11, index: 2 });
  });

  test("rejects an unknown status", () => {
    const bad = { type: "rule", id: "x", status: "published", arabic: "س", translit: "s", english: "e", family: "madd" };
    expect(LibraryNoteSchema.safeParse(bad).success).toBe(false);
  });

  test("rejects an unknown rule family", () => {
    const bad = { type: "rule", id: "x", status: "verified", arabic: "س", translit: "s", english: "e", family: "invented" };
    expect(LibraryNoteSchema.safeParse(bad).success).toBe(false);
  });

  test("sources[] wikilink strings survive as authored", () => {
    const n = LibraryNoteSchema.parse({
      type: "rule", id: "ghunnah", status: "verified", arabic: "الغنة",
      translit: "al-Ghunnah", english: "Nasalisation", family: "ghunnah",
      sources: ["[[Tuhfat-al-Atfal]]"],
    });
    expect(n.type === "rule" && n.sources).toEqual(["[[Tuhfat-al-Atfal]]"]);
  });
});
