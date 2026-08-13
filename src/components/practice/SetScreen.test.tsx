import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { allAttempts } from "@/practice/ledger";
import { lessonSet } from "@/games2/studySet";
import "@/games2/games";
import { SetScreen } from "./SetScreen";

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

describe("SetScreen", () => {
  test("offers a mode per graded game", async () => {
    render(<SetScreen set={lessonSet("2-08")} />);
    expect(await screen.findByRole("button", { name: /match/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /broken form/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /word bank/i })).toBeTruthy();
    expect(screen.getByRole("button", { name: /type it/i })).toBeTruthy();
  });

  test("answering on the set screen writes a real ledger row", async () => {
    // The gap this closes: free practice previously recorded NOTHING, because
    // GameResult carried no conceptId and inventing one is forbidden.
    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));

    const band = await screen.findByTestId("set-drill");
    const option = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(option!);

    await waitFor(async () => expect((await allAttempts()).length).toBeGreaterThan(0));
    const rows = await allAttempts();
    expect(rows[0].sessionId).toMatch(/^set:/);
    expect(rows[0].isInterleaved).toBe(false);
  });

  test("leaving a mode returns to the mode list", async () => {
    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));
    await user.click(screen.getByRole("button", { name: /done/i }));
    expect(await screen.findByRole("button", { name: /broken form/i })).toBeTruthy();
  });

  test("the correction survives the answer, and the question only changes after Continue", async () => {
    // C1: `record` used to call `setIndex` synchronously inside the answer
    // handler, unmounting the drill (keyed on `current.itemKey`) before its
    // own `role="status"` correction ever painted.
    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));

    const counterBefore = screen.getByText(/1\/\d+/);
    expect(counterBefore).toBeTruthy();

    const band = await screen.findByTestId("set-drill");
    const option = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(option!);

    const status = within(band).getByRole("status");
    await waitFor(() => expect(/[✓✗]/.test(status.textContent ?? "")).toBe(true));

    // Still on the first question — advancing is gated on Continue.
    expect(screen.getByText(/1\/\d+/)).toBeTruthy();

    const continueBtn = screen.getByRole("button", { name: /continue/i });
    expect(continueBtn.hasAttribute("disabled")).toBe(false);
    await user.click(continueBtn);

    expect(screen.getByText(/2\/\d+/)).toBeTruthy();
  });

  test("a rejected write says so, unobtrusively, and never blocks", async () => {
    // I4: the blanket `.catch()` used to swallow a rejected write with no
    // trace — the same class of failure `appendAttempt`'s malformed-question
    // guard would otherwise raise silently here. Mirrors `SessionRunner`'s
    // identical notice.
    const failing = new IDBFactory();
    vi.spyOn(failing, "open").mockImplementation(() => {
      throw new Error("InvalidStateError");
    });
    globalThis.indexedDB = failing;

    const user = userEvent.setup();
    render(<SetScreen set={lessonSet("2-08")} />);
    await user.click(await screen.findByRole("button", { name: /match/i }));

    const band = await screen.findByTestId("set-drill");
    const option = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(option!);

    await waitFor(() => expect(screen.getByTestId("write-failures").textContent).toMatch(/\S/));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(screen.getByRole("button", { name: /continue/i }).hasAttribute("disabled")).toBe(false);
  });
});
