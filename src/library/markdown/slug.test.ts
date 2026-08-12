import { describe, test, expect } from "vitest";
import { createHeadingSlugger, slugifyHeading } from "./slug";

describe("createHeadingSlugger", () => {
  test("lowercases and hyphenates plain headings", () => {
    const s = createHeadingSlugger();
    expect(s("Common mistakes")).toBe("common-mistakes");
  });

  test("keeps headings distinct when they differ only by Unicode", () => {
    const s = createHeadingSlugger();
    const a = s("⚠ The count is disputed");
    const b = s("The count is disputed");
    expect(a).not.toBe(b);
  });

  test("survives an em-dash plus Arabic — the live trap 3 target", () => {
    const s = createHeadingSlugger();
    const slug = s("The four-word exception — iẓhār muṭlaq");
    expect(slug).toBeTruthy();
    expect(slug).not.toMatch(/^-+$/);
    expect(slug).toContain("four-word");
  });

  test("preserves Arabic headings without collapsing them to empty", () => {
    const s = createHeadingSlugger();
    const a = s("بَابُ الْمَدِّ وَالْقَصْر");
    const b = s("بَابُ النُّونِ السَّاكِنَة");
    expect(a).toBeTruthy();
    expect(b).toBeTruthy();
    expect(a).not.toBe(b);
  });

  test("dedupes repeats with a numeric suffix", () => {
    const s = createHeadingSlugger();
    expect(s("Sources")).toBe("sources");
    expect(s("Sources")).toBe("sources-2");
    expect(s("Sources")).toBe("sources-3");
  });

  test("is stable — the same document yields the same ids twice", () => {
    const run = () => { const s = createHeadingSlugger(); return ["Definition", "Sources", "Sources"].map(s); };
    expect(run()).toEqual(run());
  });
});

describe("slugifyHeading", () => {
  test("is pure — repeated calls never drift", () => {
    expect(slugifyHeading("Sources")).toBe("sources");
    expect(slugifyHeading("Sources")).toBe("sources");
    expect(slugifyHeading("Sources")).toBe("sources");
  });

  test("agrees with the slugger's FIRST emission for a heading", () => {
    const s = createHeadingSlugger();
    expect(s("Common mistakes")).toBe(slugifyHeading("Common mistakes"));
  });

  test("never returns empty, even for a symbol-only heading", () => {
    expect(slugifyHeading("⚠")).toBe("section");
  });

  test("strips Arabic harakat, so a bab heading reads as words not letters", () => {
    // Without stripping marks this becomes "ب-اب-ال-م-د-و-ال-ق-ص-ر" — every harakah
    // turns into a hyphen and the word boundaries are lost.
    expect(slugifyHeading("بَابُ الْمَدِّ وَالْقَصْر")).toBe("باب-المد-والقصر");
  });

  test("KEEPS Latin transliteration diacritics — they are semantic here", () => {
    // ẓ is not z: ظ vs ز. NFC leaves these precomposed, so mark-stripping never sees them.
    expect(slugifyHeading("The four-word exception — iẓhār muṭlaq"))
      .toBe("the-four-word-exception-iẓhār-muṭlaq");
  });
});
