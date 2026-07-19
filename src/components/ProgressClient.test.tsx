import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test } from "vitest";
import { CourseMap } from "./ProgressClient";
import type { Course } from "@/content/schema";

const course: Course = {
  title: "Tajweed Course",
  phases: [{ number: 1, title: "Letters & Sounds", lessons: [{ id: "1-01", title: "Orientation", calendarSlot: "Week 1 — Mon" }], checkpoint: { id: "checkpoint-1", title: "Checkpoint 1" } }],
};

describe("CourseMap + progress", () => {
  beforeEach(() => localStorage.clear());
  test("renders lesson with links and toggles done state persistently", async () => {
    render(<CourseMap course={course} />);
    expect(screen.getByRole("link", { name: /lesson/i })).toBeTruthy();
    await userEvent.click(screen.getByRole("checkbox", { name: /done/i }));
    expect(JSON.parse(localStorage.getItem("tajweed-progress-v1")!).done).toContain("1-01");
  });
  test("shows checkpoint gate row", () => {
    render(<CourseMap course={course} />);
    expect(screen.getByText(/Checkpoint 1/)).toBeTruthy();
  });
});
