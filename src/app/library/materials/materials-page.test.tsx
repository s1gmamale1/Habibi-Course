import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import MaterialsPage from "./page";
import { generateStaticParams } from "./[slug]/page";
import { allPostSlugs, allPosts } from "@/library/materials";

describe("/library/materials", () => {
  test("lists every post", () => {
    const { container } = render(<MaterialsPage />);
    const text = container.textContent ?? "";
    for (const p of allPosts()) expect(text).toContain(p.title);
  });

  test("renders without an attachment present — the folder starts empty", () => {
    expect(() => render(<MaterialsPage />)).not.toThrow();
  });
});

describe("/library/materials/[slug]", () => {
  test("generates one page per post", () => {
    expect(generateStaticParams().map((p) => p.slug).sort()).toEqual([...allPostSlugs()].sort());
  });
});
