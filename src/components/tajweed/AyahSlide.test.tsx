import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { RULE_META } from "@/content/tajweed";
import { AyahSlide } from "./AyahSlide";

/** 106:4 carries madd, qalqalah, idghām and ikhfāʾ — enough rules for the isolate control. */
const SURAH = 106;
const AYAH = 4;

const isolateGroup = () => screen.getByRole("group", { name: "Show only one rule" });

describe("AyahSlide — isolating a rule", () => {
  it("isolates from the IsolateControl buttons", async () => {
    const { container } = render(<AyahSlide surah={SURAH} ayah={AYAH} />);

    await userEvent.click(
      within(isolateGroup()).getByRole("button", { name: RULE_META.qalqalah.translit }),
    );

    expect(container.querySelectorAll("[data-dimmed]").length).toBeGreaterThan(0);
  });

  it("does not isolate when the painted ayah itself is clicked", async () => {
    // `TajweedText` used to take an `onRuleTap` callback, wired here to the
    // isolate state, which put an `onClick` on each coloured span. Those spans
    // are removed from the accessibility tree and are not focusable — so the
    // affordance existed for a sighted mouse user and for nobody else, and
    // there was no keyboard or screen-reader equivalent on the text.
    //
    // The isolate control below is the real, accessible path: actual
    // `<button type="button">` elements carrying `aria-pressed`. The ayah is
    // painted output, not a control.
    const { container } = render(<AyahSlide surah={SURAH} ayah={AYAH} />);
    const painted = container.querySelectorAll<HTMLElement>(".tajweed-text [data-rule]");
    expect(painted.length).toBeGreaterThan(1);

    await userEvent.click(painted[0]);

    expect(container.querySelector("[data-dimmed]")).toBeNull();
  });

  it("gives the painted spans no click handler and no tab stop", () => {
    const { container } = render(<AyahSlide surah={SURAH} ayah={AYAH} />);

    for (const span of container.querySelectorAll<HTMLElement>(".tajweed-text [data-rule]")) {
      expect(span.tagName).toBe("SPAN");
      expect(span.getAttribute("tabindex")).toBeNull();
      expect(span.getAttribute("role")).toBeNull();
    }
  });
});
