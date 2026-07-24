import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { shuffled, shuffledUnsolved, useSwapPuzzle } from "./useSwapPuzzle";

afterEach(() => vi.restoreAllMocks());

// With Math.random mocked to 0, Fisher–Yates rotates the array left by one:
// shuffled([0,1,2,3]) === [1,2,3,0]. Tests rely on this.
describe("shuffled / shuffledUnsolved", () => {
  test("mocked random=0 rotates left by one", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    expect(shuffled([0, 1, 2, 3])).toEqual([1, 2, 3, 0]);
  });
  test("shuffledUnsolved never returns a value-solved order for distinct values", () => {
    for (let i = 0; i < 50; i++) {
      const order = shuffledUnsolved(["a", "b", "c"]);
      expect(order.some((tile, slot) => ["a", "b", "c"][tile] !== ["a", "b", "c"][slot])).toBe(true);
    }
  });
  test("all-identical values return identity instead of looping forever", () => {
    expect(shuffledUnsolved(["x", "x"])).toEqual([0, 1]);
  });
});

describe("useSwapPuzzle", () => {
  test("good swap locks a slot; solving flips solved", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // initial order [1,2,0] for 3 values
    const { result } = renderHook(() => useSwapPuzzle(["A", "B", "C"], 0));
    expect(result.current.order).toEqual([1, 2, 0]);
    expect(result.current.solved).toBe(false);
    act(() => result.current.select(0));
    act(() => result.current.select(2)); // [0,2,1] — slot 0 now correct
    expect(result.current.order).toEqual([0, 2, 1]);
    expect(result.current.shake).toBeNull();
    act(() => result.current.select(0)); // locked correct slot — no selection
    expect(result.current.selected).toBeNull();
    act(() => result.current.select(1));
    act(() => result.current.select(2)); // [0,1,2] — solved
    expect(result.current.solved).toBe(true);
  });
  test("fruitless swap shakes the second slot", () => {
    vi.spyOn(Math, "random").mockReturnValue(0); // initial order [1,2,3,0] for 4 values
    const { result } = renderHook(() => useSwapPuzzle(["A", "B", "C", "D"], 0));
    act(() => result.current.select(0));
    act(() => result.current.select(2)); // [3,2,1,0] — nothing newly correct
    expect(result.current.shake?.slot).toBe(2);
    expect(result.current.solved).toBe(false);
  });
  test("round change reshuffles", () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const { result, rerender } = renderHook(({ r }) => useSwapPuzzle(["A", "B", "C"], r), {
      initialProps: { r: 0 },
    });
    act(() => result.current.select(0));
    rerender({ r: 1 });
    expect(result.current.order).toEqual([1, 2, 0]);
    expect(result.current.selected).toBeNull();
  });
});
