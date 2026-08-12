import { describe, test, expect } from "vitest";
import { generateStaticParams } from "./[slug]/page";
import { allSlugs } from "@/library/load";

describe("/library/[slug]", () => {
  test("generates exactly 101 pages", () => {
    expect(generateStaticParams()).toHaveLength(101);
  });

  test("covers every loaded slug", () => {
    const params = generateStaticParams().map((p) => p.slug);
    expect([...params].sort()).toEqual([...allSlugs()].sort());
  });

  test("no param collides with a section landing route", () => {
    const params = new Set(generateStaticParams().map((p) => p.slug));
    for (const seg of ["rules", "letters", "sources"]) expect(params.has(seg)).toBe(false);
  });
});
