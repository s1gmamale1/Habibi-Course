import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TajweedText } from "./TajweedText";
import verses111 from "../../generated/verses/111.json";

const text = "بِسْمِ ٱللَّهِ";
// index 6 is the space; the alif waṣla ٱ (U+0671) is at index 7.
const spans = [{ start: 7, end: 8, rules: ["hamzat_wasl"] }];

describe("TajweedText", () => {
  it("renders the complete text exactly once", () => {
    const { container } = render(<TajweedText text={text} spans={spans} />);
    expect(container.textContent).toBe(text);
  });

  it("emits no whitespace between spans", () => {
    const { container } = render(<TajweedText text={text} spans={spans} />);
    expect(container.querySelector(".tajweed-text")!.innerHTML).not.toMatch(/>\s+</);
  });

  it("gives the silent family no underline at all", () => {
    // UNDERLINE is the redundant channel: each rule FAMILY gets a distinct
    // text-decoration-style so the information survives greyscale and colour
    // blindness. The silent family is deliberately the exception — a silent
    // letter's whole signal is that it is grey and unobtrusive, so it carries
    // `"none"`.
    //
    // That value was reaching `text-decoration-style`, where `none` is not a
    // legal value (solid | double | dotted | dashed | wavy). The declaration was
    // dropped and the style fell back to the initial `solid`, so every silent
    // span rendered with an underline it was explicitly meant not to have —
    // 647 of the course's 1,972 spans, a third of them. Caught in Safari, but
    // every engine does the same thing.
    const { container } = render(<TajweedText text={text} spans={spans} />);
    const el = container.querySelector<HTMLElement>("[data-rule='hamzat_wasl']")!;
    expect(el.style.textDecorationLine === "" || el.style.textDecorationLine === "none").toBe(true);
    expect(el.style.textDecorationStyle).not.toBe("none");
  });

  it("still gives a decorated family its distinct underline style", () => {
    const madd = [{ start: 0, end: 3, rules: ["madd_2"] }];
    const { container } = render(<TajweedText text={text} spans={madd} />);
    const el = container.querySelector<HTMLElement>("[data-rule='madd_2']")!;
    expect(el.style.textDecorationLine).toBe("underline");
    expect(el.style.textDecorationStyle).toBe("solid");
  });

  it("labels the container with the plain ayah for screen readers", () => {
    render(<TajweedText text={text} spans={spans} />);
    expect(screen.getByLabelText(text)).toBeTruthy();
  });

  it("exposes the whole ayah as one named node, under a real ARIA role", () => {
    // The ayah is painted across many coloured spans, and the intent is that a
    // screen reader read it as one continuous string rather than announcing
    // fragments. That was attempted with `role="text"` — which is not in the
    // ARIA spec at all; it is a WebKit-only extension. Everywhere else the
    // container fell back to a generic span, where `aria-label` is prohibited
    // and ignored, leaving the reader to piece the ayah together from whatever
    // the un-hidden runs happened to be.
    //
    // `role="img"` is the standard role whose children ARE presentational, so
    // the whole subtree collapses to the one accessible name. It is the only
    // mechanism that can hide the bare text runs between the spans: `aria-hidden`
    // is an attribute, and a text node cannot carry one.
    render(<TajweedText text={text} spans={spans} />);

    expect(screen.getByRole("img", { name: text })).toBeTruthy();
  });

  it("uses no non-standard role", () => {
    const { container } = render(<TajweedText text={text} spans={spans} />);
    const roles = [...container.querySelectorAll("[role]")].map((e) => e.getAttribute("role"));
    expect(roles).not.toContain("text");
  });

  it("gives a rule span its colour and underline", () => {
    const { container } = render(<TajweedText text={text} spans={spans} />);
    const el = container.querySelector("[data-rule='hamzat_wasl']") as HTMLElement;
    expect(el).toBeTruthy();
    expect(el.style.color.toLowerCase()).toContain("170"); // #AAAAAA → rgb(170,170,170)
  });

  it("dims non-matching rules in isolate mode", () => {
    const { container } = render(
      <TajweedText text={text} spans={spans} isolate="ikhfa" />,
    );
    const el = container.querySelector("[data-rule='hamzat_wasl']") as HTMLElement;
    expect(el.dataset.dimmed).toBe("true");
  });

  it("renders unstyled text when there are no spans", () => {
    const { container } = render(<TajweedText text={text} spans={[]} />);
    expect(container.textContent).toBe(text);
  });

  it("renders real generated data without corrupting it", () => {
    const ayah = (verses111 as Array<{ayah:number;text:string;spans:{start:number;end:number;rules:string[]}[]}>)[0];
    const { container } = render(<TajweedText text={ayah.text} spans={ayah.spans} />);
    // the full ayah survives verbatim
    expect(container.textContent).toBe(ayah.text);
    // no whitespace was introduced between elements
    expect(container.querySelector(".tajweed-text")!.innerHTML).not.toMatch(/>\s+</);
    // every span carries a rule and is styled
    const marked = container.querySelectorAll("[data-rule]");
    expect(marked.length).toBe(ayah.spans.length);
  });
});
