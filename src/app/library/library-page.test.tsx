import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import LibraryNotePage from "./[slug]/page";

/**
 * The composition point: `page.tsx` computes `withholdMatn(note.body)` and must render
 * the STRIPPED body, not the original note. A reviewer once flipped `note={body}` to
 * `note={note}` — leaving the computation and the "N lines withheld" panel intact — and
 * all 633 tests in the suite stayed green while the page republished the full matn.
 * `sources.test.ts` covers `withholdMatn` in isolation; nothing covered the page actually
 * using its result. These render the real page for the real slugs and check the DOM.
 */
async function draw(slug: string) {
  return render(await LibraryNotePage({ params: Promise.resolve({ slug }) }));
}

describe("/library/[slug] — the withheld matn does not reach the page", () => {
  test.each([
    ["muqaddimah-jazariyyah", "يَقُولُ رَاجِي عَفْوِ رَبٍّ سَامِعِ"],
    ["tuhfat-al-atfal", "يَقُولُ رَاجِي رَحمةِ الْغَفُورِ"],
    ["shatibiyyah", "وَلَمْ يَصِلُوا هَا مُضْمَرٍ قَبْلَ سَاكِنٍ"],
  ])("%s: the opening verse is absent from the rendered page", async (slug, probe) => {
    const { container } = await draw(slug);
    expect(container.textContent).not.toContain(probe);
  });

  test.each(["muqaddimah-jazariyyah", "tuhfat-al-atfal", "shatibiyyah"])(
    "%s: the withheld-matn panel is rendered",
    async (slug) => {
      await draw(slug);
      expect(screen.getByText(/are withheld/i)).toBeTruthy();
    },
  );

  test("over-correction guard — an Arabic bāb heading survives on muqaddimah-jazariyyah", async () => {
    const { container } = await draw("muqaddimah-jazariyyah");
    expect(container.textContent).toContain("بَابُ مَخَارِجِ الْحُرُوف");
  });

  test("sajawandi-waqf is citation-only — no withheld-matn panel", async () => {
    await draw("sajawandi-waqf");
    expect(screen.queryByText(/are withheld/i)).toBeNull();
  });
});
