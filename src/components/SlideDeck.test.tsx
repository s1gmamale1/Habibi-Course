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
  {
    kind: "letter",
    item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
    makhraj: "the two lips",
    notes: ["one dot below"],
    forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
    example: { arabic: "باب", translit: "bāb", meaning: "door" },
    image: "/images/makhraj/shafatan.svg",
  },
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
  test("letter slide renders makhraj image, positional forms, and example word", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toMatch(/makhraj/i);
    expect(screen.getByText("Alone")).toBeTruthy();
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.getByText("Middle")).toBeTruthy();
    expect(screen.getByText("End")).toBeTruthy();
    expect(screen.getByText(/bāb\s*—\s*door/)).toBeTruthy();
  });
  test("letter slide does not duplicate the item name (TapToHear caption suppressed via showName)", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getAllByText("ba")).toHaveLength(1);
  });
});

describe("SlideDeck videos anchor (footer affordance for below-the-fold video section)", () => {
  test("shows a Videos link to #lesson-videos when videosAnchor is true", () => {
    render(<SlideDeck title={title} slides={slides} videosAnchor />);
    const link = screen.getByRole("link", { name: /videos/i });
    expect(link.getAttribute("href")).toBe("#lesson-videos");
  });
  test("omits the Videos link when videosAnchor is false or unset", () => {
    render(<SlideDeck title={title} slides={slides} />);
    expect(screen.queryByRole("link", { name: /videos/i })).toBeNull();
  });
});
