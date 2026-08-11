import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import { Credits } from "./Credits";

// Attribution is a CONDITION of the Tanzil (CC BY 3.0) and cpfair/quran-tajweed (CC BY 4.0)
// licences, not a courtesy — the Tanzil notice specifically requires that a link be made to
// tanzil.net. Shipping the text without it is a breach, so this is a gate, not a nicety.
//
// Found by an independent review of PR #5, 2026-08-11: 0 of 229 built pages carried any
// attribution, while the project's own Source-Manifest already recorded the obligation and
// even drafted the credit line.
describe("Credits", () => {
  test("names Tanzil and links to tanzil.net", () => {
    render(<Credits />);
    const link = screen.getByRole("link", { name: /tanzil/i });
    expect(link.getAttribute("href")).toBe("http://tanzil.net");
  });

  test("names the tajweed annotation source", () => {
    render(<Credits />);
    expect(screen.getByRole("link", { name: /quran-tajweed/i })).toBeTruthy();
  });

  test("states both licences", () => {
    const { container } = render(<Credits />);
    expect(container.textContent).toContain("CC BY 3.0");
    expect(container.textContent).toContain("CC BY 4.0");
  });
});
