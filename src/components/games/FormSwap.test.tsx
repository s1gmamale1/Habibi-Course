import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { FormEntry } from "@/games/derive";
import type { GameResult } from "./GameRegistry";
import { FormSwap } from "./FormSwap";

afterEach(() => vi.restoreAllMocks());

const ba: FormEntry = {
  item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
  forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
};

// Math.random mocked to 0 → initial order [1,2,3,0]:
// Alone slot shows بـ, Start shows ـبـ, Middle shows ـب, End shows ب.
describe("FormSwap", () => {
  test("solving via swaps locks tiles green and offers next letter", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<FormSwap entries={[ba]} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });
    const start = screen.getByRole("button", { name: "Start slot" });
    const middle = screen.getByRole("button", { name: "Middle slot" });
    const end = screen.getByRole("button", { name: "End slot" });
    expect(alone.textContent).toBe("بـ");

    // Swap Alone↔End: puts ب into Alone (correct) → no shake, green lock
    await userEvent.click(alone);
    await userEvent.click(end);
    expect(screen.getByRole("button", { name: "Alone slot" }).className).toContain("game-correct");

    // Swap Start↔End, then Middle↔End → solved
    await userEvent.click(start);
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));
    await userEvent.click(middle);
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));
    expect(screen.getByText(/all forms in place/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next letter/i })).toBeTruthy();
  });
  test("fruitless swap shakes", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<FormSwap entries={[ba]} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });
    await userEvent.click(alone);
    await userEvent.click(screen.getByRole("button", { name: "Middle slot" }));
    // [3,2,1,0]: nothing newly correct → second-clicked slot shakes
    expect(screen.getByRole("button", { name: "Middle slot" }).className).toContain("game-shake");
  });
});

/**
 * **One attempt per completed swap.**
 *
 * A swap is this drill's graded move — it is the thing the board renders a
 * verdict for, green-locking a tile that landed or shaking one that did not — so
 * it is the unit `FamilySorter` and `ConditionBuilder` would call one placement.
 *
 * Selecting the first tile of a pair is *half* a move and carries no verdict at
 * all. It emits nothing rather than `correct: null`: null exists for a round the
 * drill genuinely could not grade, and a null row per tile-select would be pure
 * volume in an append-only ledger that `derive()` skips anyway.
 */
describe("FormSwap — reporting", () => {
  test("a productive swap reports correct, a fruitless one reports wrong", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const results: GameResult[] = [];
    let t = 3000;
    render(<FormSwap entries={[ba]} onResult={(r) => results.push(r)} now={() => (t += 5)} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });

    // Alone↔Middle seats nothing.
    await userEvent.click(alone);
    await userEvent.click(screen.getByRole("button", { name: "Middle slot" }));
    // Undo it, then Alone↔End, which seats ب in Alone.
    await userEvent.click(screen.getByRole("button", { name: "Alone slot" }));
    await userEvent.click(screen.getByRole("button", { name: "Middle slot" }));
    await userEvent.click(screen.getByRole("button", { name: "Alone slot" }));
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));

    expect(results).toEqual([
      { gameId: "form-swap", correct: false, at: 3005 },
      { gameId: "form-swap", correct: false, at: 3010 },
      { gameId: "form-swap", correct: true, at: 3015 },
    ]);
  });

  test("selecting a tile is half a move and reports nothing", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const results: GameResult[] = [];
    render(<FormSwap entries={[ba]} onResult={(r) => results.push(r)} now={() => 7} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });

    await userEvent.click(alone); // select
    expect(results).toEqual([]);
    await userEvent.click(alone); // deselect — still no verdict
    expect(results).toEqual([]);
  });

  test("an inert tap — locked-correct tile, or a solved board — is not an attempt", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    const results: GameResult[] = [];
    render(<FormSwap entries={[ba]} onResult={(r) => results.push(r)} now={() => 7} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });

    await userEvent.click(alone);
    await userEvent.click(screen.getByRole("button", { name: "End slot" })); // Alone locks
    await userEvent.click(screen.getByRole("button", { name: "Start slot" }));
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));
    await userEvent.click(screen.getByRole("button", { name: "Middle slot" }));
    await userEvent.click(screen.getByRole("button", { name: "End slot" })); // solved
    expect(screen.getByText(/all forms in place/i)).toBeTruthy();
    const afterSolve = results.length;

    await userEvent.click(screen.getByRole("button", { name: "Alone slot" })); // locked
    await userEvent.click(screen.getByRole("button", { name: "Start slot" })); // solved board
    expect(results).toHaveLength(afterSolve);
  });

  test("reports nothing but the verdict, on the injected clock", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    vi.spyOn(Date, "now").mockReturnValue(999_999);
    const results: GameResult[] = [];
    render(<FormSwap entries={[ba]} onResult={(r) => results.push(r)} now={() => 42} />);
    const alone = await screen.findByRole("button", { name: "Alone slot" });
    await userEvent.click(alone);
    await userEvent.click(screen.getByRole("button", { name: "End slot" }));

    expect(results).toHaveLength(1);
    expect(results[0].at).toBe(42);
    expect(Object.keys(results[0]).sort()).toEqual(["at", "correct", "gameId"]);
  });
});
