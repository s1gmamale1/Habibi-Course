import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import LessonPage from "./[id]/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("LessonPage", () => {
  test("shows a visible videos section for lesson 1-01 (owner: videos were nowhere to be seen)", async () => {
    render(await LessonPage({ params: Promise.resolve({ id: "1-01" }) }));
    expect(screen.getByText("Videos for this lesson")).toBeTruthy();
  });
});
