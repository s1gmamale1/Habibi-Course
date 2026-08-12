import { describe, test, expect } from "vitest";
import { allNotes } from "./load";
import { displayModeFor, withholdMatn } from "./sources";
import type { SourceNote } from "./schema";

const sources = () => allNotes().filter((n) => n.meta.type === "source");
const bySlug = (s: string) => allNotes().find((n) => n.slug === s)!;

describe("displayModeFor", () => {
  test("the four text-bearing classical sources withhold their matn", () => {
    for (const slug of ["muqaddimah-jazariyyah", "tuhfat-al-atfal", "shatibiyyah", "nihayat-al-qawl-al-mufid"]) {
      const n = bySlug(slug);
      expect(displayModeFor(n.meta as SourceNote), slug).toBe("withhold-matn");
    }
  });

  test("citation-only and metadata-only sources render in full", () => {
    for (const slug of ["sajawandi-waqf", "everyayah", "tanzil", "arabic101", "muallimi-soniy"]) {
      const n = bySlug(slug);
      expect(displayModeFor(n.meta as SourceNote), slug).toBe("full");
    }
  });

  test("every source note gets a mode", () => {
    for (const n of sources()) expect(["withhold-matn", "full"]).toContain(displayModeFor(n.meta as SourceNote));
  });
});

describe("withholdMatn", () => {
  test("removes the body of a `# The matn` section but keeps its headings", () => {
    const md = [
      "## Provenance", "", "English prose that must survive.", "",
      "# The matn", "", "## بَابُ الْمَدِّ وَالْقَصْر", "",
      "| وَغُنَّ مِيمًا ثُمَّ نُونًا شُدِّدَا | وَسَمِّ كُلًّا حَرْفَ غُنَّةٍ بَدَا |", "",
      "## Licensing", "", "Public domain.",
    ].join("\n");
    const { body, withheldLines } = withholdMatn(md);
    expect(withheldLines).toBe(1);
    expect(body).not.toContain("وَغُنَّ");                 // the verse row is gone
    expect(body).toContain("## بَابُ الْمَدِّ وَالْقَصْر");   // its Arabic heading is not
    expect(body).toContain("English prose that must survive.");
    expect(body).toContain("Public domain.");             // an English H2 closes the matn
  });

  test("removes `## Excerpt N` bodies — Nihayat's shape", () => {
    const md = ["## Excerpt 1 — the alif", "", "> قال بعض شراح الجزرية", "", "## What this book does not cover", "", "Kept."].join("\n");
    const { body, withheldLines } = withholdMatn(md);
    expect(withheldLines).toBe(1);
    expect(body).not.toContain("قال بعض");
    expect(body).toContain("## Excerpt 1 — the alif");
    expect(body).toContain("Kept.");
  });

  test("removes an Arabic-titled bab body — Shatibiyyah's shape", () => {
    const md = ["## بَابُ الْمَدِّ وَالْقَصْرِ", "", "وَمَدُّ الْأَصْلِ", "", "## Licensing", "", "PD."].join("\n");
    const { body } = withholdMatn(md);
    expect(body).not.toContain("وَمَدُّ الْأَصْلِ");
    expect(body).toContain("PD.");
  });

  test("leaves a note with no matn section untouched — Sajawandi's shape", () => {
    const md = ["## Symbols", "", "| مـ | lazim |", "", "## What is not established here", "", "Prose."].join("\n");
    const { body, withheldLines } = withholdMatn(md);
    expect(withheldLines).toBe(0);
    expect(body).toBe(md);
  });
});

describe("the real classical notes", () => {
  // Counts measured against the vault. Asserted as floors, not equalities, so an
  // editorial change to a note does not redden the gate for the wrong reason.
  test.each([
    ["muqaddimah-jazariyyah", 140],
    ["tuhfat-al-atfal", 85],
    ["shatibiyyah", 45],
    ["nihayat-al-qawl-al-mufid", 60],
  ])("%s withholds a substantial matn", (slug, floor) => {
    const { withheldLines } = withholdMatn(bySlug(slug).body);
    expect(withheldLines).toBeGreaterThan(floor);
  });

  test("over-correction guard — Arabic still survives on every classical page", () => {
    // Headings, arabic_title and the notes' own prose keep their Arabic. A rule that
    // stripped every Arabic glyph would pass the withholding tests and fail here.
    for (const slug of ["muqaddimah-jazariyyah", "tuhfat-al-atfal", "shatibiyyah", "nihayat-al-qawl-al-mufid"]) {
      const { body } = withholdMatn(bySlug(slug).body);
      expect(/[؀-ۿ]/.test(body), `${slug} lost all Arabic`).toBe(true);
    }
  });

  test("bab headings survive — they are structure, not matn", () => {
    const { body } = withholdMatn(bySlug("muqaddimah-jazariyyah").body);
    expect(body).toContain("بَابُ مَخَارِجِ الْحُرُوف");
  });

  test("Sajawandi is citation-only and loses nothing", () => {
    const n = bySlug("sajawandi-waqf");
    expect(withholdMatn(n.body).withheldLines).toBe(0);
  });

  // The floors above are necessary but NOT sufficient: they are `toBeGreaterThan`, so a
  // partial leak still passes them. A real leak did exactly that — the opening verses of
  // both poems rendered live while 147 other lines were withheld and the counts looked
  // healthy. These name the specific verses and are the tests that actually bite.
  test.each([
    ["muqaddimah-jazariyyah", "يَقُولُ رَاجِي عَفْوِ رَبٍّ سَامِعِ"],
    ["tuhfat-al-atfal", "يَقُولُ رَاجِي رَحمةِ الْغَفُورِ"],
    ["shatibiyyah", "وَلَمْ يَصِلُوا هَا مُضْمَرٍ قَبْلَ سَاكِنٍ"],
  ])("%s does not leak its opening verse", (slug, verse) => {
    const source = bySlug(slug).body;
    expect(source, `probe string is stale for ${slug}`).toContain(verse);
    expect(withholdMatn(source).body).not.toContain(verse);
  });
});
