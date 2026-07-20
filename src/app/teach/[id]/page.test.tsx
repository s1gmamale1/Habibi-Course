import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeachPage from "./page";

describe("TeachPage", () => {
  test("renders the PPTX export button", async () => {
    render(await TeachPage({ params: Promise.resolve({ id: "1-01" }) }));
    expect(screen.getByRole("button", { name: /export pptx/i })).toBeTruthy();
  });
});
