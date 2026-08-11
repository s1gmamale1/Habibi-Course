import { describe, expect, test } from "vitest";
// The same corpus loader the vault gate uses, so both halves of ADR-005 check against one
// implementation rather than two that can drift apart.
import { loadCorpus } from "../../scripts/lib/corpus.mjs";
import { allLessonIds, loadLesson } from "./load";

// ADR-005: Qur'anic text is sliced from a pinned 2017 Tanzil snapshot, never typed. That is
// the highest-severity error class this project has — a missing shadda survives proofreading,
// renders perfectly, and misteaches.
//
// The rule was ENFORCED ONLY ON `library/`. `npm run check:library` runs the vault checker
// over markdown; nothing loaded the corpus and checked `content/lessons/*.json`, which is what
// actually reaches a student. The invariant held by author discipline alone, so a hand-typed
// or mis-sliced string added tomorrow would have passed every gate in the repo.
//
// Found by an independent review of PR #5, 2026-08-11. It passed on the day it was written —
// that is the point: it locks in a property that was already true.
describe("Qur'anic text in shipped lessons is verbatim from the pinned corpus", () => {
  const corpus = loadCorpus();
  // Compare NFC-normalised: the corpus and the authored JSON can differ in Unicode
  // composition without differing in a single letter, and that is not a defect.
  const nfc = (s: string) => s.normalize("NFC");

  const pairs = allLessonIds().flatMap((id) =>
    loadLesson(id)
      .slides.filter((s): s is Extract<typeof s, { kind: "contrast" }> => s.kind === "contrast")
      .flatMap((s) => s.pairs.map((p) => ({ id, ...p }))),
  );

  test("there are contrast pairs to check (guards against a silently empty sweep)", () => {
    expect(pairs.length).toBeGreaterThan(0);
  });

  test.each(pairs.map((p) => [`${p.id} ${p.surah}:${p.ayah}`, p] as const))(
    "%s occurs verbatim in its cited ayah",
    (_label, p) => {
      const verse = corpus.get(`${p.surah}:${p.ayah}`);
      expect(verse, `${p.id}: ${p.surah}:${p.ayah} is not in the pinned corpus`).toBeTruthy();
      expect(
        nfc(verse as string).includes(nfc(p.text)),
        `${p.id}: "${p.text}" is not a verbatim substring of ${p.surah}:${p.ayah}. ` +
          `Slice it from the corpus rather than typing it.`,
      ).toBe(true);
    },
  );
});
