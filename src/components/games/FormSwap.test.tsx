import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { FormEntry } from "@/games/derive";
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
