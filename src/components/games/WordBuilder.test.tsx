import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { WordBuilder } from "./WordBuilder";

afterEach(() => vi.restoreAllMocks());

const words = [{ arabic: "شَمْس", translit: "shams", meaning: "sun" }];

// letters(شَمْس) = [ش, م, س]; random=0 → order [1,2,0]:
// tile 1 shows م, tile 2 shows س, tile 3 shows ش.
describe("WordBuilder", () => {
  test("solving reveals the joined voweled word and meaning", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={words} />);
    expect(await screen.findByText(/shams/)).toBeTruthy(); // clue in prompt
    const t1 = screen.getByRole("button", { name: "letter tile 1" });
    const t3 = screen.getByRole("button", { name: "letter tile 3" });
    await userEvent.click(t1);
    await userEvent.click(t3); // [0,2,1] → tile1 = ش correct
    expect(screen.getByRole("button", { name: "letter tile 1" }).className).toContain("game-correct");
    await userEvent.click(screen.getByRole("button", { name: "letter tile 2" }));
    await userEvent.click(screen.getByRole("button", { name: "letter tile 3" })); // solved
    expect(screen.getByText("شَمْس")).toBeTruthy(); // joined voweled word revealed
    expect(screen.getByText(/✓ shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });
});
