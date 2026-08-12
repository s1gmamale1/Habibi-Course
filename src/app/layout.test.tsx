import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import RootLayout from "./layout";

/**
 * The skip link (SiteNav.tsx) points at `href="#content"`. A fragment link only MOVES
 * KEYBOARD FOCUS in Firefox and Safari if its target is itself focusable — a bare
 * `<div id="content">` is not, so the browser scrolls but focus stays on the nav, and
 * the very next Tab returns there. `tabIndex={-1}` is what makes the target
 * programmatically focusable without adding it to the normal Tab order.
 */
describe("RootLayout — skip-link target", () => {
  test("#content is focusable", () => {
    const { container } = render(<RootLayout>{"child"}</RootLayout>);
    const target = container.querySelector("#content");
    expect(target).not.toBeNull();
    expect(target?.getAttribute("tabindex")).toBe("-1");
  });

  test("#content actually receives focus when focused", () => {
    const { container } = render(<RootLayout>{"child"}</RootLayout>);
    const target = container.querySelector<HTMLElement>("#content");
    target?.focus();
    expect(document.activeElement).toBe(target);
  });
});
