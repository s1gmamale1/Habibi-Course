import { describe, test, expect } from "vitest";
import { categories } from "./categories";
import { allNotes } from "./load";

describe("categories", () => {
  test("there are exactly six, in the owner's chosen order", () => {
    expect(categories().map((c) => c.id)).toEqual([
      "alphabet", "tajweed", "video", "sources", "materials", "glossary",
    ]);
  });

  test("every category has a label, a blurb and a route", () => {
    for (const c of categories()) {
      expect(c.label.length, c.id).toBeGreaterThan(0);
      expect(c.blurb.length, c.id).toBeGreaterThan(0);
      expect(c.href.startsWith("/library"), c.id).toBe(true);
    }
  });

  test("the note-backed categories account for all 101 vault notes", () => {
    // Alphabet + Tajweed + Sources + Glossary cover every in-scope note. Video and
    // Materials are not note-backed, so they are excluded from this sum — but if the
    // four that ARE note-backed stop summing to 101, a note has become unreachable.
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    const noteBacked = byId.alphabet + byId.tajweed + byId.sources + byId.glossary;
    expect(noteBacked).toBe(allNotes().length);
  });

  test("counts match the vault", () => {
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    expect(byId.alphabet).toBe(29);
    expect(byId.tajweed).toBe(59);
    expect(byId.sources).toBe(11);
    expect(byId.glossary).toBe(2);
  });

  test("video and materials report real counts, not placeholders", () => {
    const byId = Object.fromEntries(categories().map((c) => [c.id, c.count]));
    expect(byId.video).toBeGreaterThan(90);
    expect(byId.materials).toBeGreaterThanOrEqual(1);
  });
});
