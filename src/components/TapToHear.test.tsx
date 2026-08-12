import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { TapToHear } from "./TapToHear";

describe("TapToHear renders per audio tier (gap-1 §4)", () => {
  test("qari-clip: tap plays audio", async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<TapToHear item={{ arabic: "بِ", audio: { type: "qari-clip", url: "https://example.com/a.mp3", reciter: "Husary (Mu'allim)" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /بِ/ }));
    expect(play).toHaveBeenCalled();
  });
  test("youtube-cue: tap opens embed iframe with start param", async () => {
    render(<TapToHear item={{ arabic: "ا", audio: { type: "youtube-cue", videoId: "VhRHKdPcNPA", startSeconds: 1117, title: "Muallimi Soniy" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /ا/ }));
    const iframe = screen.getByTitle("Muallimi Soniy") as HTMLIFrameElement;
    expect(iframe.src).toContain("youtube.com/embed/VhRHKdPcNPA");
    expect(iframe.src).toContain("start=1117");
    expect(screen.getByText(/via Muallimi Soniy/)).toBeTruthy();
  });
  test("teacher-voice: tap opens practice-cue popover — never a silent no-op", async () => {
    render(<TapToHear item={{ arabic: "ب", audio: { type: "teacher-voice", cue: "lips fully together" } }} />);
    await userEvent.click(screen.getByRole("button", { name: /ب/ }));
    expect(screen.getByText("lips fully together")).toBeTruthy();
    expect(screen.getByText(/practice live with your teacher/i)).toBeTruthy();
  });
});

/**
 * The popover is a real popover, and has to behave like one.
 *
 * It opened as an anonymous `<span>`: nothing announced that a thing had
 * appeared, nothing named it, and the only way to dismiss it was to find and
 * re-tap the letter that opened it. For a screen-reader user that is a control
 * whose activation produces silence, and for a keyboard user it is a panel with
 * no exit — the two together are why this sat on the accessibility list.
 *
 * `role="dialog"` rather than `role="tooltip"`: it holds an interactive iframe
 * in the youtube-cue tier, and a tooltip may not contain interactive content.
 */
describe("TapToHear popover accessibility", () => {
  const teacherVoice = {
    arabic: "ب",
    name: "ba",
    audio: { type: "teacher-voice", cue: "lips fully together" },
  } as const;

  test("the popover is an accessible dialog, named by the item", async () => {
    render(<TapToHear item={teacherVoice} />);
    expect(screen.queryByRole("dialog")).toBeNull();

    await userEvent.click(screen.getByRole("button", { name: /ب/ }));
    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toContain("ب");
  });

  test("Escape closes it — a panel with no exit is the actual complaint", async () => {
    render(<TapToHear item={teacherVoice} />);
    await userEvent.click(screen.getByRole("button", { name: /ب/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  test("focus returns to the button that opened it, not to the top of the page", async () => {
    render(<TapToHear item={teacherVoice} />);
    const button = screen.getByRole("button", { name: /ب/ });
    await userEvent.click(button);
    await userEvent.keyboard("{Escape}");
    expect(document.activeElement).toBe(button);
  });

  test("the button reports its own expanded state", async () => {
    render(<TapToHear item={teacherVoice} />);
    const button = screen.getByRole("button", { name: /ب/ });
    expect(button.getAttribute("aria-expanded")).toBe("false");

    await userEvent.click(button);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  test("the qari-clip tier plays and opens no dialog — there is nothing to dismiss", async () => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(
      <TapToHear
        item={{ arabic: "بِ", audio: { type: "qari-clip", url: "https://e.com/a.mp3", reciter: "Husary" } }}
      />,
    );
    const button = screen.getByRole("button", { name: /بِ/ });
    await userEvent.click(button);
    expect(screen.queryByRole("dialog")).toBeNull();
    // No popover ever opens in this tier, so claiming a collapsed state would
    // describe a control that does not exist.
    expect(button.hasAttribute("aria-expanded")).toBe(false);
  });

  test("the youtube-cue popover is a dialog too — it holds an interactive iframe", async () => {
    render(
      <TapToHear
        item={{ arabic: "ا", audio: { type: "youtube-cue", videoId: "V1", startSeconds: 10, title: "Cue" } }}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /ا/ }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("TapToHear item.name caption (reviewer fix: positional-forms labels were invisible)", () => {
  test("shows a visible caption with the item name when set", () => {
    render(<TapToHear item={{ arabic: "بِ", name: "ba — initial", audio: { type: "teacher-voice", cue: "lips" } }} />);
    expect(screen.getByText("ba — initial")).toBeTruthy();
  });
  test("renders no caption when the item has no name", () => {
    render(<TapToHear item={{ arabic: "بِ", audio: { type: "teacher-voice", cue: "lips" } }} />);
    expect(screen.queryByText("ba — initial")).toBeNull();
  });
  test("showName={false} suppresses the caption even when name is set", () => {
    render(
      <TapToHear
        item={{ arabic: "بِ", name: "ba — initial", audio: { type: "teacher-voice", cue: "lips" } }}
        showName={false}
      />,
    );
    expect(screen.queryByText("ba — initial")).toBeNull();
  });
});
