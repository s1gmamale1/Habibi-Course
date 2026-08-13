import { describe, expect, test } from "vitest";
import { isQuestion, MODE_RANK } from "./types";

describe("Question", () => {
  test("accepts a well-formed question", () => {
    expect(isQuestion({ conceptId: "ب", itemKey: "match/ب", gameId: "match", payload: {} })).toBe(true);
  });

  test("rejects one whose conceptId is not a real concept", () => {
    // The whole point of carrying conceptId on the question: it is what gets
    // written to an append-only ledger, so a bad one is permanent.
    expect(isQuestion({ conceptId: "idgham", itemKey: "match/x", gameId: "match", payload: {} })).toBe(false);
    expect(isQuestion({ conceptId: "", itemKey: "match/x", gameId: "match", payload: {} })).toBe(false);
  });

  test("rejects an itemKey that is not prefixed with its game id", () => {
    // Two games' questions about one letter must never collide.
    expect(isQuestion({ conceptId: "ب", itemKey: "ب", gameId: "match", payload: {} })).toBe(false);
  });
});

describe("MODE_RANK", () => {
  test("ramps recognition → discrimination → production", () => {
    expect(MODE_RANK.recognition).toBeLessThan(MODE_RANK.discrimination);
    expect(MODE_RANK.discrimination).toBeLessThan(MODE_RANK.production);
  });
});
