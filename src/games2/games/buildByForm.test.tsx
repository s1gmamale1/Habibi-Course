import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { lessonSet } from "../studySet";
import { buildByFormQuestions, BuildByForm, type BuildByFormPayload } from "./buildByForm";

describe("buildByFormQuestions", () => {
  test("cues on the word's shape, never on its meaning", () => {
    // The owner: "re-order or construct the words (meaning the correct forms
    // not the actual words cuz we don teach the language vocab)".
    for (const q of buildByFormQuestions(lessonSet("2-08"))) {
      expect(JSON.stringify(q.payload)).not.toMatch(/meaning|translit/i);
    }
  });

  test("tiles are positional FORMS, not bare letters", () => {
    const p = buildByFormQuestions(lessonSet("2-08"))[0].payload as BuildByFormPayload;
    expect(p.tiles.length).toBeGreaterThan(1);
    expect(p.slots.length).toBe(p.answer.length);
  });

  test("questions are deterministic", () => {
    const a = JSON.stringify(buildByFormQuestions(lessonSet("2-08")));
    expect(a).toBe(JSON.stringify(buildByFormQuestions(lessonSet("2-08"))));
  });
});

describe("BuildByForm", () => {
  test("one verdict per completed word, never per tile", async () => {
    const answer = vi.fn();
    const q = buildByFormQuestions(lessonSet("2-08"))[0];
    const p = q.payload as BuildByFormPayload;
    render(<BuildByForm q={q} api={{ answer, now: () => 1 }} />);
    const tiles = screen.getAllByTestId(/^tile-/);
    await userEvent.click(tiles[0]);
    expect(answer).not.toHaveBeenCalled();
    for (let i = 1; i < p.answer.length; i += 1) {
      await userEvent.click(screen.getAllByTestId(/^tile-/)[0]);
    }
    expect(answer).toHaveBeenCalledTimes(1);
  });
});
