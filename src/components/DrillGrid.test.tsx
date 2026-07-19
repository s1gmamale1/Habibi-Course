import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { DrillGrid } from "./DrillGrid";

describe("DrillGrid", () => {
  test("renders title, instructions, and one TapToHear per item", () => {
    render(
      <DrillGrid drill={{ title: "Flashcards", instructions: "Name each letter.", grid: [[
        { arabic: "ا", name: "alif", audio: { type: "teacher-voice", cue: "open sound" } },
        { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
      ]] }} />,
    );
    expect(screen.getByText("Flashcards")).toBeTruthy();
    expect(screen.getByText("Name each letter.")).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });
});
