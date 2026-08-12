import { describe, test, expect } from "vitest";
import { resolveWikilinks, stripWikilink, buildResolver, WIKILINK } from "./wikilinks";
import { allNotes } from "../load";

const resolve = (name: string) => (name === "Ghunnah" || name === "Izhar-Shafawi" ? `/library/${name.toLowerCase()}` : null);

describe("resolveWikilinks", () => {
  test("rewrites a plain wikilink to a markdown link", () => {
    expect(resolveWikilinks("see [[Ghunnah]] now", resolve)).toBe("see [Ghunnah](/library/ghunnah) now");
  });

  test("uses the alias as display text", () => {
    expect(resolveWikilinks("[[Ghunnah|the nasal sound]]", resolve)).toBe("[the nasal sound](/library/ghunnah)");
  });

  test("TRAP 1 — a wikilink spanning two lines still resolves", () => {
    const md = "a fully-formed meem — [[Izhar-Shafawi|iẓhār\nshafawī]], the wrong rule.";
    const out = resolveWikilinks(md, resolve);
    expect(out).not.toContain("[[");
    expect(out).toContain("(/library/izhar-shafawi)");
  });

  test("TRAP 3 — an empty target becomes a same-page anchor", () => {
    const out = resolveWikilinks("see [[#The four-word exception — iẓhār muṭlaq]] below", resolve);
    expect(out).not.toContain("[[");
    expect(out).toContain("(#the-four-word-exception-i");
  });

  test("carries a heading fragment onto the target route", () => {
    expect(resolveWikilinks("[[Ghunnah#Duration — 2 harakāt]]", resolve)).toContain("(/library/ghunnah#duration-2-harak");
  });

  test("an unresolvable target degrades to plain text, never leaking brackets", () => {
    const out = resolveWikilinks("see [[No-Such-Note]] here", resolve);
    expect(out).toBe("see No-Such-Note here");
  });

  test("an unresolvable aliased target keeps the alias as plain text", () => {
    expect(resolveWikilinks("[[No-Such-Note|the thing]]", resolve)).toBe("the thing");
  });
});

describe("stripWikilink", () => {
  test("TRAP 4 — frontmatter sources[] entries are wikilinks", () => {
    expect(stripWikilink("[[Tuhfat-al-Atfal]]")).toBe("Tuhfat-al-Atfal");
  });

  test("passes a bare string through", () => {
    expect(stripWikilink("Tuhfat-al-Atfal")).toBe("Tuhfat-al-Atfal");
  });
});

describe("against the real vault", () => {
  test("PRECONDITION — no [[ appears inside a code span or fence", () => {
    // resolveWikilinks runs on raw markdown before lexing, which is only safe while
    // this holds. If a note ever puts [[x]] inside code, this fails and the transform
    // must move into the token walk instead.
    for (const n of allNotes()) {
      const fences = n.body.match(/```[\s\S]*?```/g) ?? [];
      const inline = n.body.replace(/```[\s\S]*?```/g, "").match(/`[^`\n]*`/g) ?? [];
      for (const segment of [...fences, ...inline]) {
        expect(segment.includes("[["), `${n.file}: ${segment.slice(0, 60)}`).toBe(false);
      }
    }
  });

  test("every wikilink in every in-scope note resolves — the set is link-closed", () => {
    // Asserting `out` has no leftover "[[" (the previous form of this test) holds for
    // ANY resolver, including a broken one — resolveWikilinks degrades an unresolvable
    // target to plain text, so it never leaks brackets either way. That let a reviewer
    // replace buildResolver's body with `() => null` and keep this test green. Walking
    // the raw wikilinks and asserting the resolver itself returns non-null is the only
    // way to catch that.
    const r = buildResolver();
    for (const n of allNotes()) {
      for (const m of n.body.matchAll(WIKILINK)) {
        const target = (m[1] ?? "").trim();
        if (!target) continue; // empty target — a same-page anchor, legitimately resolves to null
        expect(r(target), `${n.file}: "${m[0]}" did not resolve`).not.toBeNull();
      }
    }
  });

  test("the resolver knows all 101 notes", () => {
    const r = buildResolver();
    for (const n of allNotes()) expect(r(n.basename)).toBe(`/library/${n.slug}`);
  });
});
