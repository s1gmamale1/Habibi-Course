import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

test("smoke: react renders under vitest", () => {
  render(<p>bismillah</p>);
  expect(screen.getByText("bismillah")).toBeTruthy();
});
