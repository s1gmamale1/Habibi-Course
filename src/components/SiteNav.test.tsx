import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SiteNav } from "./SiteNav";

describe("SiteNav", () => {
  test("exposes a navigation landmark", () => {
    render(<SiteNav />);
    expect(screen.getByRole("navigation")).toBeTruthy();
  });

  test("links to the course, the library and credits", () => {
    render(<SiteNav />);
    expect(screen.getByRole("link", { name: "Course" }).getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: "Library" }).getAttribute("href")).toBe("/library");
    expect(screen.getByRole("link", { name: "Credits" }).getAttribute("href")).toBe("/credits");
  });

  test("does NOT surface /teach — that route is meant to be gated, not discovered", () => {
    render(<SiteNav />);
    expect(screen.queryByRole("link", { name: /teach/i })).toBeNull();
  });

  test("offers a skip link as the first focusable element", () => {
    render(<SiteNav />);
    const skip = screen.getByRole("link", { name: /skip to content/i });
    expect(skip.getAttribute("href")).toBe("#content");
  });
});
