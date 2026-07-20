import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import TeachPage from "./[id]/page";

describe("TeachPage", () => {
  test("renders script and listen-for from real lesson 1-01", async () => {
    render(await TeachPage({ params: Promise.resolve({ id: "1-01" }) }));
    expect(screen.getByText(/listen for/i)).toBeTruthy();
    expect(screen.getByText(/interdental fricative/)).toBeTruthy(); // real 1-01 listenFor content
  });
});
