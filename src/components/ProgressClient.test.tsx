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
  /**
   * Every row ships two links whose visible text is just "Lesson" and
   * "Practice". Across 74 lessons that is 148 controls with 2 distinct names,
   * and a screen-reader user listing the links on this page gets no way to tell
   * one row from another — the links-out-of-context problem, on the page that
   * is the course's entire table of contents.
   *
   * The visible text stays short on purpose: the lesson title is already in the
   * row, and repeating it in every button would be visual noise for everyone
   * else. `aria-label` is exactly the tool for that split.
   */
  test("each lesson link is named by its lesson, not just 'Lesson'", () => {
    render(<CourseMap course={course} />);
    expect(screen.getByRole("link", { name: "Lesson: Orientation" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Practice: Orientation" })).toBeTruthy();
    // And the bare names are gone, so two rows can never collide again.
    expect(screen.queryByRole("link", { name: "Lesson" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Practice" })).toBeNull();
  });

  test("the visible text stays short — the distinction is for assistive tech only", () => {
    render(<CourseMap course={course} />);
    expect(screen.getByRole("link", { name: "Lesson: Orientation" }).textContent).toBe("Lesson");
  });

  test("tolerates corrupt progress storage (non-array done value)", async () => {
    localStorage.setItem("tajweed-progress-v1", '{"done":5}');
    render(<CourseMap course={course} />);
    const checkbox = screen.getByRole("checkbox", { name: /done/i }) as HTMLInputElement;
    expect(checkbox.checked).toBe(false);
    await userEvent.click(checkbox);
    expect(JSON.parse(localStorage.getItem("tajweed-progress-v1")!).done).toContain("1-01");
  });
});
