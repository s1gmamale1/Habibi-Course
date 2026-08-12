import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { lexNote, renderTokens } from "./render";
import { createHeadingSlugger } from "./slug";

function draw(md: string) {
  return render(<>{renderTokens(lexNote(md), createHeadingSlugger())}</>);
}

describe("block rendering", () => {
  test("headings get anchor ids", () => {
    draw("## Common mistakes\n");
    expect(screen.getByRole("heading", { level: 2 }).getAttribute("id")).toBe("common-mistakes");
  });

  test("renders a GFM table", () => {
    draw("| Sifah | Opposite |\n|---|---|\n| jahr | hams |\n");
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Sifah" })).toBeTruthy();
    expect(screen.getByRole("cell", { name: "jahr" })).toBeTruthy();
  });

  test("TRAP 2 — an escaped pipe stays inside its cell", () => {
    draw("| Title | Id |\n|---|---|\n| Alif \\| Ba | abc |\n");
    const cells = screen.getAllByRole("cell");
    expect(cells).toHaveLength(2);
    expect(cells[0].textContent).toBe("Alif | Ba");
  });

  test("TRAP 5 — a blockquote containing a heading keeps the heading", () => {
    const { container } = draw("> ### ⚠ Status: needs-review — sīn or ṣād?\n");
    expect(container.querySelector("blockquote h3")).not.toBeNull();
  });

  test("renders nested unordered lists", () => {
    const { container } = draw("- outer\n  - inner\n");
    expect(container.querySelectorAll("ul")).toHaveLength(2);
  });

  test("renders an ordered list", () => {
    const { container } = draw("1. first\n2. second\n");
    expect(container.querySelectorAll("ol li")).toHaveLength(2);
  });

  test("renders a fenced code block", () => {
    const { container } = draw("```json\n{\"a\":1}\n```\n");
    expect(container.querySelector("pre code")).not.toBeNull();
  });

  test("renders a horizontal rule", () => {
    const { container } = draw("---\n");
    expect(container.querySelector("hr")).not.toBeNull();
  });

  test("spec test #10 — a table cell containing Arabic gets dir=\"auto\"", () => {
    draw("| Arabic | Note |\n|---|---|\n| مِـمَّ | mixed with → separators |\n");
    const cell = screen.getByRole("cell", { name: /مِـمَّ/ });
    expect(cell.getAttribute("dir")).toBe("auto");
  });

  test("spec test #10 — an Arabic heading carries lang=\"ar\" and the .arabic class", () => {
    draw("## بَابُ الْمَدِّ وَالْقَصْرِ\n");
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.getAttribute("lang")).toBe("ar");
    expect(heading.className).toContain("arabic");
  });

  test("an English heading gets neither lang nor the .arabic class", () => {
    draw("## Common mistakes\n");
    const heading = screen.getByRole("heading", { level: 2 });
    expect(heading.getAttribute("lang")).toBeNull();
    expect(heading.className).not.toContain("arabic");
  });
});

describe("inline rendering", () => {
  test("bold, italic and inline code", () => {
    const { container } = draw("**b** and *i* and `c`\n");
    expect(container.querySelector("strong")?.textContent).toBe("b");
    expect(container.querySelector("em")?.textContent).toBe("i");
    expect(container.querySelector("code")?.textContent).toBe("c");
  });

  test("external links open in a new tab safely", () => {
    draw("[tanzil.net](https://tanzil.net)\n");
    const a = screen.getByRole("link", { name: "tanzil.net" });
    expect(a.getAttribute("href")).toBe("https://tanzil.net");
    expect(a.getAttribute("rel")).toContain("noopener");
  });

  test("internal links stay same-tab", () => {
    draw("[Ghunnah](/library/ghunnah)\n");
    expect(screen.getByRole("link", { name: "Ghunnah" }).getAttribute("target")).toBeNull();
  });
});

describe("raw HTML is never interpreted", () => {
  test("an html token renders as visible text, not markup", () => {
    const { container } = draw("<script>alert(1)</script>\n");
    expect(container.querySelector("script")).toBeNull();
    expect(container.textContent).toContain("<script>");
  });
});
