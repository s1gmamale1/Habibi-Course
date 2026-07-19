import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SlideDeck } from "./SlideDeck";
import type { Lesson } from "@/content/schema";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const lesson: Lesson = {
  id: "1-01", phase: 1, unit: "1.1", title: "T", objectives: ["o"],
  slides: [
    { kind: "title", heading: "First slide" },
    { kind: "concept", heading: "Second slide", body: ["point one"] },
    { kind: "letter", item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } }, makhraj: "the two lips", notes: ["one dot below"] },
    { kind: "concept", heading: "s4", body: ["b"] }, { kind: "concept", heading: "s5", body: ["b"] },
    { kind: "concept", heading: "s6", body: ["b"] }, { kind: "concept", heading: "s7", body: ["b"] },
    { kind: "homework", heading: "Homework", tasks: ["do drills"] },
  ],
  practice: { drills: [], dailyChecklist: ["x"] },
  teacherNotes: { script: ["s"], listenFor: ["l"], homework: "h" },
  videos: [],
};

describe("SlideDeck", () => {
  test("shows first slide and advances with ArrowRight", async () => {
    render(<SlideDeck lesson={lesson} />);
    expect(screen.getByText("First slide")).toBeTruthy();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Second slide")).toBeTruthy();
    expect(screen.getByText("2 / 8")).toBeTruthy();
  });
  test("letter slide renders makhraj and a TapToHear button", async () => {
    render(<SlideDeck lesson={lesson} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText(/the two lips/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /ب/ })).toBeTruthy();
  });
});
