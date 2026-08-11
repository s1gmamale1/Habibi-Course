import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { getGames } from "../GameRegistry";
import { GhunnahTimer, calibrate, scoreHold } from "./GhunnahTimer";

/**
 * An injected clock. No test here ever waits: elapsed time is a number the test
 * chooses between press and release, so the suite runs at full speed and the
 * timing logic is exercised exactly, not approximately.
 */
function clock(start = 1_000) {
  let t = start;
  return { now: () => t, advance: (ms: number) => void (t += ms) };
}

type Clock = ReturnType<typeof clock>;

/** Press, let `ms` of the learner's time pass, release. */
function hold(el: Element, c: Clock, ms: number) {
  fireEvent.mouseDown(el);
  c.advance(ms);
  fireEvent.mouseUp(el);
}

const calibrateButton = () => screen.getByTestId("hold-calibrate");
const ghunnahButton = () => screen.getByTestId("hold-ghunnah");
const live = () => screen.getByRole("status").textContent ?? "";
const timer = () => screen.getByTestId("ghunnah-timer");

/** Complete the calibration step at `ms` per ḥarakah. */
function calibrated(c: Clock, ms: number, holds = 3) {
  for (let i = 0; i < holds; i++) hold(calibrateButton(), c, ms);
}

describe("scoreHold", () => {
  it("reports the hold in ḥarakāt, not in time", () => {
    expect(scoreHold(1000, 500, 2)).toEqual({ counts: 2, correct: true });
  });

  it("accepts a hold inside the tolerance band", () => {
    expect(scoreHold(1200, 500, 2).correct).toBe(true); // 2.4 counts
    expect(scoreHold(900, 500, 2).correct).toBe(true); // 1.8 counts
    // ±25% of the target, inclusive at the edges: 1.5 … 2.5 counts.
    expect(scoreHold(750, 500, 2).correct).toBe(true);
    expect(scoreHold(1250, 500, 2).correct).toBe(true);
  });

  it("rejects a hold that is clearly short", () => {
    expect(scoreHold(600, 500, 2)).toEqual({ counts: 1.2, correct: false });
    expect(scoreHold(250, 500, 2).correct).toBe(false);
  });

  it("rejects a hold that is clearly long", () => {
    expect(scoreHold(1300, 500, 2)).toEqual({ counts: 2.6, correct: false });
    expect(scoreHold(2000, 500, 2).correct).toBe(false);
  });

  it("scales with the learner's own tempo — the whole point of the drill", () => {
    // A slow reciter (700ms a ḥarakah) and a fast one (300ms) both pass when
    // they are proportionally right, and both fail on the other's timing.
    expect(scoreHold(1400, 700, 2)).toEqual({ counts: 2, correct: true });
    expect(scoreHold(600, 300, 2)).toEqual({ counts: 2, correct: true });
    expect(scoreHold(1400, 300, 2).correct).toBe(false); // 4.67 counts for the fast reciter
    expect(scoreHold(600, 700, 2).correct).toBe(false); // 0.86 counts for the slow one
  });

  it("widens the band in proportion to the target, not by a fixed amount", () => {
    // Holding 6 to ±0.5 counts is a professional's accuracy. The band is a
    // fraction of the target, so 4.8 passes against 6 while 1.2 fails against 2 —
    // both are 0.8 counts out, and only one of them is a big error.
    expect(scoreHold(4800, 1000, 6).correct).toBe(true);
    expect(scoreHold(1200, 1000, 2).correct).toBe(false);
  });

  it("takes the tolerance as an argument", () => {
    expect(scoreHold(1200, 500, 2, 0.05).correct).toBe(false);
    expect(scoreHold(1200, 500, 2, 0.5).correct).toBe(true);
  });

  it("refuses to score without a calibration", () => {
    expect(scoreHold(1000, 0, 2)).toEqual({ counts: 0, correct: false });
    expect(scoreHold(1000, -5, 2).correct).toBe(false);
  });
});

describe("calibrate", () => {
  it("takes the median of the learner's reference holds", () => {
    expect(calibrate([400, 420, 380])).toBe(400);
  });

  it("survives one slip without dragging the whole calibration with it", () => {
    // A mean would read 660 here and mis-set every later score.
    expect(calibrate([400, 1200, 380])).toBe(400);
  });

  it("averages the middle pair when there is an even number", () => {
    expect(calibrate([400, 500])).toBe(450);
  });

  it("has nothing to say about no samples", () => {
    expect(calibrate([])).toBeNull();
  });
});

describe("GhunnahTimer — calibration comes first", () => {
  it("will not measure a ghunnah before the learner has set their own pace", () => {
    const c = clock();
    render(<GhunnahTimer now={c.now} />);

    expect(timer().getAttribute("data-phase")).toBe("calibrate");
    expect(screen.queryByTestId("hold-ghunnah")).toBeNull();
    expect(calibrateButton()).toBeTruthy();
  });

  it("counts the reference holds down and then opens the measurement", () => {
    const c = clock();
    render(<GhunnahTimer now={c.now} />);

    hold(calibrateButton(), c, 400);
    expect(live()).toMatch(/1 of 3/);
    hold(calibrateButton(), c, 420);
    hold(calibrateButton(), c, 380);

    expect(timer().getAttribute("data-phase")).toBe("measure");
    expect(ghunnahButton()).toBeTruthy();
  });

  it("does not count a stray tap as a reference hold", () => {
    const c = clock();
    render(<GhunnahTimer now={c.now} />);

    hold(calibrateButton(), c, 5);

    expect(live()).toMatch(/hold/i);
    expect(live()).not.toMatch(/1 of 3/);
    expect(timer().getAttribute("data-phase")).toBe("calibrate");
  });

  it("says a ḥarakah is set by the reciter's own tempo, never by a clock", () => {
    const c = clock();
    const { container } = render(<GhunnahTimer now={c.now} />);

    expect(container.textContent).toMatch(/tempo|own pace/i);
    expect(container.textContent).not.toMatch(/millisecond|\bms\b|second/i);
  });

  it("lets the learner recalibrate at any time", () => {
    const c = clock();
    render(<GhunnahTimer now={c.now} />);
    calibrated(c, 400);

    fireEvent.click(screen.getByRole("button", { name: /recalibrate/i }));

    expect(timer().getAttribute("data-phase")).toBe("calibrate");
    expect(screen.queryByTestId("hold-ghunnah")).toBeNull();
  });
});

describe("GhunnahTimer — measuring", () => {
  it("scores a good hold against the learner's own ḥarakah and reports it", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 400);

    hold(ghunnahButton(), c, 800);

    expect(live()).toMatch(/about 2\.0 counts/i);
    expect(live()).toMatch(/✓/);
    expect(ghunnahButton().getAttribute("data-state")).toBe("correct");
    expect(onResult).toHaveBeenCalledWith({
      gameId: "ghunnah-timer",
      ruleId: "ghunnah",
      correct: true,
      at: expect.any(Number),
    });
  });

  it("tells a short hold how many counts it was and what to aim for", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 500);

    hold(ghunnahButton(), c, 600);

    expect(live()).toMatch(/about 1\.2 counts/i);
    expect(live()).toMatch(/aim for 2/i);
    expect(ghunnahButton().getAttribute("data-state")).toBe("wrong");
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it("tells a long hold it went past the target", () => {
    const c = clock();
    render(<GhunnahTimer now={c.now} />);
    calibrated(c, 500);

    hold(ghunnahButton(), c, 1800);

    expect(live()).toMatch(/about 3\.6 counts/i);
    expect(live()).toMatch(/longer than 2/i);
  });

  it("never puts a time on the screen", () => {
    const c = clock();
    const { container } = render(<GhunnahTimer now={c.now} />);
    calibrated(c, 500);

    hold(ghunnahButton(), c, 610);

    expect(container.textContent).not.toContain("610");
    expect(container.textContent).not.toMatch(/millisecond|\bms\b|second/i);
    expect(container.textContent).toMatch(/counts/i);
  });

  it("passes a slow reciter and a fast one on the same proportional hold", () => {
    const slow = clock();
    const slowResult = vi.fn();
    const view = render(<GhunnahTimer now={slow.now} onResult={slowResult} />);
    calibrated(slow, 800);
    hold(ghunnahButton(), slow, 1600);
    expect(slowResult).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
    view.unmount();

    const fast = clock();
    const fastResult = vi.fn();
    render(<GhunnahTimer now={fast.now} onResult={fastResult} />);
    calibrated(fast, 300);
    hold(ghunnahButton(), fast, 600);
    expect(fastResult).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it("fails the slow reciter's timing when the fast one uses it", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 300);

    hold(ghunnahButton(), c, 1600); // 5.3 counts at this learner's pace

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it("does not report anything during calibration", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);

    calibrated(c, 400);

    expect(onResult).not.toHaveBeenCalled();
  });

  it("lets the learner hold again as often as they like", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 400);

    hold(ghunnahButton(), c, 400);
    hold(ghunnahButton(), c, 800);

    expect(onResult.mock.calls.map((call) => call[0].correct)).toEqual([false, true]);
    expect(live()).toMatch(/about 2\.0 counts/i);
  });

  it("holds for a longer madd when asked to", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer rule="madd_6" now={c.now} onResult={onResult} />);
    calibrated(c, 400);

    hold(ghunnahButton(), c, 800); // 2 counts — right for a ghunnah, wrong here

    expect(live()).toMatch(/aim for 6/i);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: "madd_6", correct: false }),
    );
  });

  it("works from the keyboard, not the mouse alone", async () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 400);

    const button = ghunnahButton();
    fireEvent.keyDown(button, { key: " " });
    c.advance(800);
    fireEvent.keyUp(button, { key: " " });

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
    await userEvent.tab(); // the control is reachable, not a bare div
    expect(button.tagName).toBe("BUTTON");
  });

  it("discards a hold that was released outside the button", () => {
    const c = clock();
    const onResult = vi.fn();
    render(<GhunnahTimer now={c.now} onResult={onResult} />);
    calibrated(c, 400);

    fireEvent.mouseDown(ghunnahButton());
    c.advance(800);
    fireEvent.mouseLeave(ghunnahButton());
    fireEvent.mouseUp(ghunnahButton());

    expect(onResult).not.toHaveBeenCalled();
    expect(live()).toMatch(/cancel/i);
  });
});

describe("GhunnahTimer — registration", () => {
  it("is registered under the id ghunnah-timer", () => {
    const [entry] = getGames(["ghunnah-timer"]);
    expect(entry).toBeTruthy();
    expect(entry.id).toBe("ghunnah-timer");
    expect(entry.render({})).toBeTruthy();
  });
});
