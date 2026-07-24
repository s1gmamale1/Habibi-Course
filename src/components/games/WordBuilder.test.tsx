import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import { WordBuilder } from "./WordBuilder";

afterEach(() => vi.restoreAllMocks());

const shams = { arabic: "شَمْس", translit: "shams", meaning: "sun" };
const qamar = { arabic: "قَمَر", translit: "qamar", meaning: "moon" };
const bayt = { arabic: "بَيْت", translit: "bayt", meaning: "house" };

// With Math.random mocked to 0 (derivation in useBuildPuzzle.test.ts):
// words=[shams] alone → bank [م,س,ش] (labels 1,2,3), letters(شَمْس)=[ش,م,س], no decoys.
// words=[shams,qamar,bayt] round 0 → bank [م,س,ر,ب,ش] (labels 1-5), decoys ر,ب.
// round 1 (qamar) → bank [م,ر,س,ب,ق] (labels 1-5).
describe("WordBuilder", () => {
  test("bank includes decoys from other words; sub-hint warns about them", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams, qamar, bayt]} />);
    expect(await screen.findByText(/shams/)).toBeTruthy();
    expect(screen.getByText(/don't belong/)).toBeTruthy();
    expect(screen.getAllByRole("button", { name: /^bank letter/ })).toHaveLength(5);
  });

  test("no decoys with a single word — sub-hint omits the warning", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams]} />);
    expect(await screen.findByText(/shams/)).toBeTruthy();
    expect(screen.queryByText(/don't belong/)).toBeNull();
    expect(screen.getAllByRole("button", { name: /^bank letter/ })).toHaveLength(3);
  });

  test("tapping bank tiles fills slots in order; tapping a filled slot undoes it", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams]} />);
    const bankM = await screen.findByRole("button", { name: "bank letter م 1" });
    await userEvent.click(bankM); // م → slot 1 (first empty)
    const slot1 = screen.getByRole("button", { name: "slot 1" });
    expect(slot1.textContent).toBe("م");
    expect((bankM as HTMLButtonElement).disabled).toBe(true);
    await userEvent.click(slot1); // undo
    expect(screen.getByRole("button", { name: "slot 1" }).textContent).toBe("");
    expect((screen.getByRole("button", { name: "bank letter م 1" }) as HTMLButtonElement).disabled).toBe(false);
  });

  test("correct fill reveals the joined voweled word and meaning", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams]} />);
    await screen.findByRole("button", { name: "bank letter م 1" });
    await userEvent.click(screen.getByRole("button", { name: "bank letter ش 3" })); // ش → slot 1
    await userEvent.click(screen.getByRole("button", { name: "bank letter م 1" })); // م → slot 2
    await userEvent.click(screen.getByRole("button", { name: "bank letter س 2" })); // س → slot 3, solved
    expect(screen.getByText("شَمْس")).toBeTruthy();
    expect(screen.getByText(/✓ shams — sun/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /next word/i })).toBeTruthy();
  });

  test("wrong fill bounces mismatched slots back to the bank; correct slots persist", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams, qamar, bayt]} />);
    await screen.findByRole("button", { name: "bank letter م 1" });
    await userEvent.click(screen.getByRole("button", { name: "bank letter ش 5" })); // ش → slot 1 (correct)
    await userEvent.click(screen.getByRole("button", { name: "bank letter ر 3" })); // ر → slot 2 (wrong, expects م)
    await userEvent.click(screen.getByRole("button", { name: "bank letter ب 4" })); // ب → slot 3 (wrong, expects س)

    const slot1 = screen.getByRole("button", { name: "slot 1" });
    const slot2 = screen.getByRole("button", { name: "slot 2" });
    const slot3 = screen.getByRole("button", { name: "slot 3" });
    expect(slot1.textContent).toBe("ش");
    expect(slot1.className).toContain("game-correct");
    expect(slot2.textContent).toBe("");
    expect(slot3.textContent).toBe("");
    expect(slot2.className).toContain("game-shake");
    expect(slot3.className).toContain("game-shake");

    expect((screen.getByRole("button", { name: "bank letter ر 3" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "bank letter ب 4" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "bank letter ش 5" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /next word/i })).toBeNull();
  });

  test("next round advances to the next word and reshuffles the bank", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0);
    render(<WordBuilder words={[shams, qamar, bayt]} />);
    await screen.findByRole("button", { name: "bank letter م 1" });
    await userEvent.click(screen.getByRole("button", { name: "bank letter ش 5" }));
    await userEvent.click(screen.getByRole("button", { name: "bank letter م 1" }));
    await userEvent.click(screen.getByRole("button", { name: "bank letter س 2" }));
    await userEvent.click(screen.getByRole("button", { name: /next word/i }));
    expect(await screen.findByText(/qamar/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "bank letter ق 5" })).toBeTruthy();
  });
});
