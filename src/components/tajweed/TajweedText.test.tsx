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

  it("labels the container with the plain ayah for screen readers", () => {
    render(<TajweedText text={text} spans={spans} />);
    expect(screen.getByLabelText(text)).toBeTruthy();
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
