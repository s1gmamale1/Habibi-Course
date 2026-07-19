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
