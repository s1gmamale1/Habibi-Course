import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { allAttempts } from "@/practice/ledger";
import { lessonSet } from "@/games2/studySet";
import "@/games2/games";
import { PracticeSession } from "./PracticeSession";
import { deriveGameData } from "@/games/derive";
import { allLessons } from "@/content/load";

beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });

describe("the slice, end to end", () => {
  test("a started session offers more than one kind of game", async () => {
    // The owner's actual complaint, asserted on the real screen.
    const user = userEvent.setup();
    render(<PracticeSession data={deriveGameData(allLessons(), "2-08")} games={[]} />);
    await user.click(await screen.findByTestId("start-review"));

    const seen = new Set<string>();
    for (let i = 0; i < 6; i += 1) {
      const band = await screen.findByTestId("drill-band");
      const gameId = band.getAttribute("data-game-id");
      if (gameId) seen.add(gameId);
      const btn = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
      if (!btn) break;
      await user.click(btn);
      const cont = screen.queryByRole("button", { name: "متابعة" });
      if (cont && !cont.hasAttribute("disabled")) await user.click(cont);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  test("answers land in the ledger with the concept the question named", async () => {
    const user = userEvent.setup();
    render(<PracticeSession data={deriveGameData(allLessons(), "2-08")} games={[]} />);
    await user.click(await screen.findByTestId("start-review"));
    const band = await screen.findByTestId("drill-band");
    const btn = within(band).getAllByRole("button").find((b) => b.getAttribute("aria-disabled") !== "true");
    await user.click(btn!);

    await waitFor(async () => expect((await allAttempts()).length).toBeGreaterThan(0));
    const concepts = new Set(lessonSet("2-08").letters.map((l) => l.arabic));
    for (const row of await allAttempts()) expect(concepts.has(row.conceptId)).toBe(true);
  });
});
