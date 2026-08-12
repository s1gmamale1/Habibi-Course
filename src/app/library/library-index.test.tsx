import { describe, test, expect } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import TajweedPage from "./tajweed/page";
import AlphabetPage from "./alphabet/page";
import SourcesPage from "./sources/page";
import ReferencePage from "./reference/page";
import { allNotes, allSlugs } from "@/library/load";

describe("/library/tajweed", () => {
  test("lists all 59 rules and no non-rules", () => {
    render(<TajweedPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(59);
  });

  test("groups by family and shows every family in use", () => {
    render(<TajweedPage />);
    const families = new Set(allNotes().filter((n) => n.meta.type === "rule").map((n) => (n.meta as { family: string }).family));
    // Anchored: family "ra" is a literal substring of family "orthography", so an
    // unanchored regex matches both headings and getByRole throws on ambiguity.
    for (const f of families) expect(screen.getByRole("heading", { name: new RegExp(`^${f}$`, "i") })).toBeTruthy();
  });

  test("Sifat.md is NOT listed as a rule — it is type: index", () => {
    render(<TajweedPage />);
    expect(screen.queryByRole("link", { name: /^Ṣifāt al-Ḥurūf/ })).toBeNull();
  });
});

describe("/library/alphabet", () => {
  test("lists all 29 letters", () => {
    render(<AlphabetPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(29);
  });
});

describe("/library/sources", () => {
  test("lists all 11 sources — the index is generated, not read from the manifest", () => {
    render(<SourcesPage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(11);
  });

  test("the three sources missing from Source-Manifest.md are present anyway", () => {
    render(<SourcesPage />);
    for (const name of [/Shatibiyyah/i, /Sajawandi/i, /Nihayat/i]) {
      expect(screen.getByRole("link", { name })).toBeTruthy();
    }
  });
});

describe("/library/reference", () => {
  test("lists both index notes, including Sifat", () => {
    render(<ReferencePage />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByRole("link", { name: /Sifat/i })).toBeTruthy();
    expect(screen.getByRole("link", { name: /Glossary/i })).toBeTruthy();
  });
});

describe("every in-scope note is reachable from an index page", () => {
  // categories.ts's own sum-invariant test only proves the four note-backed COUNTS add
  // up to 101 — it does not prove any given note is actually LISTED on the page its
  // count implies. That gap is exactly how Sifat.md shipped counted-but-unreachable:
  // "Glossary & reference (2)" included it, but the card's href pointed at the
  // Glossary note's own detail page, not an index. This walks the real pages instead.
  test("the union of what alphabet, tajweed, sources and reference list covers every slug", () => {
    const linked = new Set<string>();
    for (const Page of [AlphabetPage, TajweedPage, SourcesPage, ReferencePage]) {
      render(<Page />);
      for (const link of screen.getAllByRole("link")) {
        const m = /^\/library\/([^/]+)$/.exec(link.getAttribute("href") ?? "");
        if (m) linked.add(m[1]);
      }
      cleanup();
    }
    expect([...linked].sort()).toEqual([...allSlugs()].sort());
  });
});
