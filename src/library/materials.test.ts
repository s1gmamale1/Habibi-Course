import { describe, test, expect } from "vitest";
import { allPosts, postBySlug, allPostSlugs, allAttachments } from "./materials";

describe("allPosts", () => {
  test("reads the seed post", () => {
    expect(allPosts().length).toBeGreaterThanOrEqual(1);
  });

  test("README.md is not published as a post", () => {
    expect(allPostSlugs()).not.toContain("readme");
  });

  test("every post has a title and a non-empty body", () => {
    for (const p of allPosts()) {
      expect(p.title.length, p.file).toBeGreaterThan(0);
      expect(p.body.trim().length, p.file).toBeGreaterThan(0);
    }
  });

  test("slugs are unique and URL-safe", () => {
    const s = allPostSlugs();
    expect(new Set(s).size).toBe(s.length);
    for (const x of s) expect(x).toMatch(/^[a-z0-9._-]+$/);
  });

  test("postBySlug round-trips and throws loudly on an unknown slug", () => {
    const first = allPosts()[0];
    expect(postBySlug(first.slug).title).toBe(first.title);
    expect(() => postBySlug("no-such-post")).toThrow(/unknown material/);
  });
});

describe("allAttachments", () => {
  test("returns an array and never throws when the folder is empty", () => {
    expect(Array.isArray(allAttachments())).toBe(true);
  });

  test("every attachment points inside /materials/ and reports a size", () => {
    for (const a of allAttachments()) {
      expect(a.href.startsWith("/materials/"), a.slug).toBe(true);
      expect(a.bytes, a.slug).toBeGreaterThan(0);
    }
  });
});
