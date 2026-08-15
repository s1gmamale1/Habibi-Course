import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { matchAnswerQuestions, MatchAnswer, type MatchAnswerPayload } from "./matchAnswer";

describe("matchAnswerQuestions", () => {
  test("asks about the lesson's rules, not about word meanings", () => {
    const qs = matchAnswerQuestions(lessonSet("3-23"));
    expect(qs.length).toBeGreaterThan(0);
    for (const q of qs) expect(q.conceptId).not.toMatch(/^\p{Script=Arabic}+$/u);
  });

  test("no option is an English gloss of an Arabic word", () => {
    // The constraint this whole plan exists for. The old game's options were
    // "steam / opening / bread" on a madd lesson.
    for (const q of matchAnswerQuestions(lessonSet("3-23"))) {
      const p = q.payload as MatchAnswerPayload;
      for (const o of [p.answer, ...p.distractors]) expect(o).not.toMatch(/^(door|house|name|bread)$/i);
    }
  });

  test("a letters lesson asks letter ↔ name", () => {
    const qs = matchAnswerQuestions(lessonSet("1-06"));
    expect(qs.length).toBeGreaterThan(0);
    const p = qs[0].payload as MatchAnswerPayload;
    expect(p.distractors.length).toBeGreaterThan(0);
    expect(p.distractors).not.toContain(p.answer);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(matchAnswerQuestions(lessonSet("3-23")));
    expect(a).toBe(JSON.stringify(matchAnswerQuestions(lessonSet("3-23"))));
  });
});

describe("MatchAnswer", () => {
  const q = () => matchAnswerQuestions(lessonSet("3-23"))[0];

  test("the right option reports correct", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as MatchAnswerPayload;
    render(<MatchAnswer q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.answer }));
    expect(answer).toHaveBeenCalledWith(true);
  });

  test("a wrong option reports incorrect and names the right answer", async () => {
    const answer = vi.fn();
    const question = q();
    const p = question.payload as MatchAnswerPayload;
    render(<MatchAnswer q={question} api={{ answer, now: () => 1 }} />);
    await userEvent.click(screen.getByRole("button", { name: p.distractors[0] }));
    expect(answer).toHaveBeenCalledWith(false);
    expect(screen.getByRole("status").textContent).toContain(p.answer);
  });
});
