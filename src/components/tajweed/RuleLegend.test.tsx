import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RuleLegend } from "./RuleLegend";

describe("RuleLegend", () => {
  it("lists every rule with its name and colour", () => {
    render(<RuleLegend rules={["ikhfa", "qalqalah"]} />);
    expect(screen.getByText("Ikhfāʾ")).toBeTruthy();
    expect(screen.getByText("Qalqalah")).toBeTruthy();
  });

  it("shows the harakat count when a rule has one", () => {
    render(<RuleLegend rules={["ikhfa"]} />);
    expect(screen.getByText(/2/)).toBeTruthy();
  });

  it("omits the harakat count for a rule that has none", () => {
    const { container } = render(<RuleLegend rules={["qalqalah"]} />);
    expect(container.textContent).not.toMatch(/ḥarak/);
  });

  it("shows the Arabic name too", () => {
    render(<RuleLegend rules={["qalqalah"]} />);
    expect(screen.getByText("قلقلة")).toBeTruthy();
  });

  it("shows the English name too", () => {
    render(<RuleLegend rules={["qalqalah"]} />);
    expect(screen.getByText("Echoing")).toBeTruthy();
  });

  it("switches palette when asked", () => {
    const { container: b } = render(<RuleLegend rules={["qalqalah"]} palette="B" />);
    const { container: a } = render(<RuleLegend rules={["qalqalah"]} palette="A" />);
    expect(b.innerHTML).not.toBe(a.innerHTML); // red in B, light blue in A
  });

  it("defaults to palette B, the course default", () => {
    const { container: dflt } = render(<RuleLegend rules={["qalqalah"]} />);
    const { container: b } = render(<RuleLegend rules={["qalqalah"]} palette="B" />);
    expect(dflt.innerHTML).toBe(b.innerHTML);
  });

  // Colour is never the only channel: the swatch is decorative, the name is the
  // real carrier, and each family also gets its own underline style.
  it("hides the colour swatch from screen readers", () => {
    const { container } = render(<RuleLegend rules={["ikhfa"]} />);
    const swatch = container.querySelector(".rule-legend__swatch")!;
    expect(swatch.getAttribute("aria-hidden")).toBe("true");
  });

  it("gives each family its own underline style on the swatch", () => {
    const { container } = render(<RuleLegend rules={["ikhfa", "madd_2"]} />);
    const styles = [...container.querySelectorAll(".rule-legend__swatch")].map(
      (el) => (el as HTMLElement).style.textDecorationStyle,
    );
    expect(styles).toEqual(["dotted", "solid"]);
  });

  it("renders one row per unique rule, in the order given", () => {
    const { container } = render(<RuleLegend rules={["qalqalah", "ikhfa", "qalqalah"]} />);
    const rows = [...container.querySelectorAll("[data-rule]")].map((el) =>
      el.getAttribute("data-rule"),
    );
    expect(rows).toEqual(["qalqalah", "ikhfa"]);
  });

  it("renders nothing when there are no rules", () => {
    const { container } = render(<RuleLegend rules={[]} />);
    expect(container.innerHTML).toBe("");
  });
});
