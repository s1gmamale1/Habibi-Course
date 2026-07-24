import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { WordEntry } from "@/games/derive";
import { pickDecoys, useBuildPuzzle } from "./useBuildPuzzle";

afterEach(() => vi.restoreAllMocks());

const shams: WordEntry = { arabic: "شَمْس", translit: "shams", meaning: "sun" };
const qamar: WordEntry = { arabic: "قَمَر", translit: "qamar", meaning: "moon" };
const bayt: WordEntry = { arabic: "بَيْت", translit: "bayt", meaning: "house" };
const words = [shams, qamar, bayt];
const single = [shams];
const arabics = words.map((w) => w.arabic);

// With Math.random mocked to 0, shuffled() rotates arrays left by one (see
// useSwapPuzzle.test.ts). Hand-verified: letters(شَمْس)=[ش,م,س]; the decoy
// pool built from قَمَر+بَيْت minus those letters is {ق,ر,ب,ي,ت} in that
// insertion order, which rotates to [ر,ب,ي,ت,ق] and slices to [ر,ب]; the
// bank shuffled([ش,م,س,ر,ب]) rotates to [م,س,ر,ب,ش].
describe("pickDecoys", () => {
  test("draws up to 2 letters from other words, excluding the target word's own letters", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickDecoys(["ش", "م", "س"], arabics, 0)).toEqual(["ر", "ب"]);
  });
  test("returns no decoys when only one word is supplied", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(pickDecoys(["ش", "م", "س"], [shams.arabic], 0)).toEqual([]);
  });
});

describe("useBuildPuzzle", () => {
  test("bank holds the word's letters plus decoys, shuffled; slots start empty", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useBuildPuzzle(words, 0));
    expect(result.current.letters).toEqual(["ش", "م", "س"]);
    expect(result.current.decoyCount).toBe(2);
    expect(result.current.bank).toEqual(["م", "س", "ر", "ب", "ش"]);
    expect(result.current.slots).toEqual([null, null, null]);
  });

  test("no decoys with a single word", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useBuildPuzzle(single, 0));
    expect(result.current.decoyCount).toBe(0);
    expect(result.current.bank).toEqual(["م", "س", "ش"]);
  });

  test("tapping a bank tile fills the first empty slot; tapping a filled slot undoes it", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useBuildPuzzle(single, 0)); // bank [م,س,ش]
    act(() => result.current.placeFromBank(0)); // م → first empty slot (0)
    expect(result.current.slots).toEqual([0, null, null]);
    act(() => result.current.removeFromSlot(0)); // undo — bank[0]=م !== letters[0]=ش
    expect(result.current.slots).toEqual([null, null, null]);
    act(() => result.current.placeFromBank(1)); // س → slot 0
    act(() => result.current.placeFromBank(0)); // م → slot 1 (next empty)
    expect(result.current.slots).toEqual([1, 0, null]);
  });

  test("correct fill solves the puzzle", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useBuildPuzzle(single, 0)); // bank [م,س,ش], letters [ش,م,س]
    act(() => result.current.placeFromBank(2)); // ش → slot 0
    act(() => result.current.placeFromBank(0)); // م → slot 1
    act(() => result.current.placeFromBank(1)); // س → slot 2
    expect(result.current.solved).toBe(true);
    expect(result.current.slots).toEqual([2, 0, 1]);
  });

  test("wrong fill returns mismatched slots to the bank; correct slots lock", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result } = renderHook(() => useBuildPuzzle(words, 0)); // bank [م,س,ر,ب,ش], letters [ش,م,س]
    act(() => result.current.placeFromBank(4)); // ش → slot 0 (correct)
    act(() => result.current.placeFromBank(2)); // ر → slot 1 (wrong, expected م)
    act(() => result.current.placeFromBank(3)); // ب → slot 2 (wrong, expected س)
    expect(result.current.solved).toBe(false);
    expect(result.current.slots).toEqual([4, null, null]);
    expect([...result.current.shake!.slots].sort()).toEqual([1, 2]);

    act(() => result.current.removeFromSlot(0)); // locked correct — no-op
    expect(result.current.slots).toEqual([4, null, null]);

    act(() => result.current.placeFromBank(2)); // freed bank tile is usable again
    expect(result.current.slots).toEqual([4, 2, null]);
  });

  test("round change reshuffles for the next word", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result, rerender } = renderHook(({ r }) => useBuildPuzzle(words, r), { initialProps: { r: 0 } });
    act(() => result.current.placeFromBank(0));
    rerender({ r: 1 });
    expect(result.current.letters).toEqual(["ق", "م", "ر"]);
    expect(result.current.bank).toEqual(["م", "ر", "س", "ب", "ق"]);
    expect(result.current.slots).toEqual([null, null, null]);
    expect(result.current.solved).toBe(false);
  });
});
