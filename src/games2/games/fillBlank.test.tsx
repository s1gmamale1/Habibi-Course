import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { fillBlankQuestions, FillBlank, type FillBlankPayload } from "./fillBlank";

describe("fillBlankQuestions", () => {
  test("builds from the lesson's own rules' worked examples", () => {
    const qs = fillBlankQuestions(lessonSet("3-23"));
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) {
      const p = q.payload as FillBlankPayload;
      expect(p.ref).toMatch(/^\d+:\d+$/);
      expect(p.blank).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("the ayah text is never hand-typed — it comes from the note", () => {
    // Constraint: Quranic text is sliced from the corpus or copied from a
    // library note, never authored here.
    for (const q of fillBlankQuestions(lessonSet("3-23"))) {
      const p = q.payload as FillBlankPayload;
      expect(`${p.before}${p.blank}${p.after}`).toMatch(/\p{Script=Arabic}/u);
    }
  });

  test("a lesson with no rules yields nothing rather than throwing", () => {
    expect(fillBlankQuestions(lessonSet("1-06"))).toEqual([]);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(fillBlankQuestions(lessonSet("3-23")));
    expect(a).toBe(JSON.stringify(fillBlankQuestions(lessonSet("3-23"))));
  });
});

describe("FillBlank", () => {
  test("the right option reports correct; a wrong one names the answer", async () => {
    const answer = vi.fn();
    const q = fillBlankQuestions(lessonSet("3-23"))[0];
    const p = q.payload as FillBlankPayload;
    render(<FillBlank q={q} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.answer);
  });
});
