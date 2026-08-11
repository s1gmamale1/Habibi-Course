import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { loadLesson } from "@/content/load";
import ExportPptxButton from "./ExportPptxButton";

const writeFileMock = vi.fn();

vi.mock("pptxgenjs", () => ({
  default: class {
    layout = "";
    addSlide() {
      return { addText() {}, addImage() {}, addTable() {}, addNotes() {} };
    }
    writeFile = writeFileMock;
  },
}));

describe("ExportPptxButton", () => {
  beforeEach(() => {
    writeFileMock.mockReset().mockResolvedValue("ok");
    // Image fetches fail in tests → rasterize returns null → deck exports without images.
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
  });

  test("exports the deck with the lesson filename", async () => {
    const lesson = loadLesson("1-01");
    render(<ExportPptxButton lesson={lesson} />);
    await userEvent.click(screen.getByRole("button", { name: /export pptx/i }));
    expect(await screen.findByRole("button", { name: /exported/i })).toBeTruthy();
    // The outcome is also announced separately — the button label alone is not announced
    // when it changes under a focused control.
    expect(screen.getByRole("status").textContent).toMatch(/exported/i);
    expect(writeFileMock).toHaveBeenCalledWith({ fileName: "tajweed-1-01.pptx" });
  });

  test("shows a retry state when export fails", async () => {
    writeFileMock.mockRejectedValueOnce(new Error("boom"));
    render(<ExportPptxButton lesson={loadLesson("1-01")} />);
    await userEvent.click(screen.getByRole("button", { name: /export pptx/i }));
    expect(await screen.findByRole("button", { name: /failed/i })).toBeTruthy();
    expect(screen.getByRole("status").textContent).toMatch(/failed/i);
  });
});
