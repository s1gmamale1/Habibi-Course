import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusNotice } from "./StatusNotice";
import { NoteBody } from "./NoteBody";
import { allNotes } from "@/library/load";

describe("StatusNotice", () => {
  test("needs-review renders a visible caution with a role", () => {
    render(<StatusNotice status="needs-review" kind="rule" />);
    const el = screen.getByRole("note");
    expect(el.textContent).toMatch(/needs review/i);
  });

  test("draft renders a quiet factual line, not an alarm", () => {
    render(<StatusNotice status="draft" kind="letter" />);
    const el = screen.getByRole("note");
    expect(el.textContent).toMatch(/not yet reviewed/i);
    // The two signals must be visually distinct: draft carries no amber warning tint.
    expect(el.className).not.toMatch(/amber/);
  });

  test("needs-review IS tinted, so the two never look alike", () => {
    render(<StatusNotice status="needs-review" kind="rule" />);
    expect(screen.getByRole("note").className).toMatch(/amber/);
  });

  test("verified renders nothing at all", () => {
    const { container } = render(<StatusNotice status="verified" kind="rule" />);
    expect(container.innerHTML).toBe("");
  });
});

describe("NoteBody against the real vault", () => {
  test("THE INVARIANT — no note leaks a wikilink bracket", () => {
    for (const note of allNotes()) {
      const { container, unmount } = render(<NoteBody note={note} />);
      expect(container.textContent ?? "", `${note.file} leaked [[`).not.toContain("[[");
      unmount();
    }
  });

  test("every note renders some text", () => {
    for (const note of allNotes()) {
      const { container, unmount } = render(<NoteBody note={note} />);
      expect((container.textContent ?? "").trim().length, note.file).toBeGreaterThan(0);
      unmount();
    }
  });
});
