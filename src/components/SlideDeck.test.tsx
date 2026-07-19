import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SlideDeck } from "./SlideDeck";
import type { Slide } from "@/content/schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const title = "T";
const slides: Slide[] = [
  { kind: "title", heading: "First slide" },
  { kind: "concept", heading: "Second slide", body: ["point one"] },
  { kind: "letter", item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } }, makhraj: "the two lips", notes: ["one dot below"] },
  { kind: "concept", heading: "s4", body: ["b"] }, { kind: "concept", heading: "s5", body: ["b"] },
  { kind: "concept", heading: "s6", body: ["b"] }, { kind: "concept", heading: "s7", body: ["b"] },
  { kind: "homework", heading: "Homework", tasks: ["do drills"] },
];

describe("SlideDeck", () => {
  test("shows first slide and advances with ArrowRight", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    expect(screen.getByText("First slide")).toBeTruthy();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Second slide")).toBeTruthy();
    expect(screen.getByText("T — 2 / 8")).toBeTruthy();
  });
  test("letter slide renders makhraj and a TapToHear button", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText(/the two lips/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /ب/ })).toBeTruthy();
  });
});
