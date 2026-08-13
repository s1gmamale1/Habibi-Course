/**
 * `DRILL_ASK` used to be keyed on the old registry's ids, so none of the four
 * games2 slice drills (`SLICE_GAME_IDS`) matched anything in it and every
 * question any of them asked fell through to the letter-quiz gloss — on
 * `word-bank` ("spell the word letter by letter") and `type-it` ("type the
 * transliteration") alike (I3). This file pins the fix and guards against a
 * fifth game silently regressing it the same way.
 */
import { describe, expect, test } from "vitest";
import { SLICE_GAME_IDS } from "@/games2/games";
import { noteFor } from "./FeedbackBar";

/** `noteFor`'s fallback for an id with no `DRILL_ASK` entry. */
const FALLBACK = "recognise this letter wherever it appears";

describe("noteFor / DRILL_ASK", () => {
  test("every SLICE_GAME_IDS id has its own ask, not the letter-quiz fallback", () => {
    for (const id of SLICE_GAME_IDS) {
      const note = noteFor("ب", id, "ba");
      expect(note.condition).not.toBe(FALLBACK);
      expect(note.condition.length).toBeGreaterThan(0);
    }
  });

  test("the asks are distinct per game, not just moved off the fallback together", () => {
    const conditions = SLICE_GAME_IDS.map((id) => noteFor("ب", id, "ba").condition);
    expect(new Set(conditions).size).toBe(SLICE_GAME_IDS.length);
  });

  test("word-bank asks for spelling and type-it asks for the transliteration", () => {
    // The two asks the module report called out by name as wrong under the
    // fallback.
    expect(noteFor("ب", "word-bank", "ba").condition).toMatch(/spell/i);
    expect(noteFor("ب", "type-it", "ba").condition).toMatch(/translit/i);
  });
});
