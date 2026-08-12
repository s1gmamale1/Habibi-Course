/**
 * Task 8. **On this screen the wording is the implementation**, so most of these
 * tests assert on strings — which normally smells, and here is the point. The
 * difference between a screen that helps a solo learner and one that measurably
 * harms them is entirely in whether "إدغام بغنّة" is presented as a diagnosis or
 * as a grade, and nothing but an assertion on the rendered text can hold that.
 *
 * `fake-indexeddb/auto` for the end-to-end case, exactly as `ledger.test.ts` and
 * `SessionRunner.test.tsx` do: jsdom ships no IndexedDB, and the claim that
 * "attempts change what this screen says" is worth nothing asserted against a
 * spy.
 */
import "fake-indexeddb/auto";
import { IDBFactory } from "fake-indexeddb";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import type { ArabicItem } from "@/content/schema";
import type { GameData } from "@/games/derive";
import { appendAttempt } from "@/practice/ledger";
import type { Attempt } from "@/practice/types";
import { DENSITY_WINDOW_DAYS, DueToday, DueTodayPanel } from "./DueToday";

/* ---------- fixtures ---------------------------------------------------- */

/** A Wednesday, 10:00 local. Fixed so "this week" and "the last 21 days" are decidable. */
const NOW = new Date(2026, 7, 12, 10, 0, 0).getTime();

const DAY = 24 * 60 * 60 * 1000;

/** `n` days before `NOW`, at 09:00 local — far enough from midnight that no DST shift moves the day. */
const daysAgo = (n: number, hour = 9) =>
  new Date(2026, 7, 12 - n, hour, 0, 0).getTime();

let seq = 0;
function mk(over: Partial<Attempt> = {}): Attempt {
  seq += 1;
  return {
    id: `a${seq}`,
    at: NOW - DAY,
    conceptId: "idghaam_ghunnah",
    itemKey: "item-1",
    gameId: "rule-identifier",
    correct: true,
    sessionId: "s1",
    isInterleaved: false,
    ...over,
  };
}

const wrong = (over: Partial<Attempt> = {}) => mk({ correct: false, ...over });

/** Five misses put a concept well above `RESOLVED` without this file restating the threshold. */
const fiveMisses = (conceptId: string, at = NOW - DAY) =>
  Array.from({ length: 5 }, (_, i) => wrong({ conceptId, at: at + i }));

const ROSTER = ["idghaam_ghunnah", "madd_munfasil", "ikhfa", "ت", "ب"];

const noop = () => {};

const view = (props: Partial<Parameters<typeof DueToday>[0]> = {}) =>
  render(<DueToday attempts={[]} roster={ROSTER} now={NOW} onStart={noop} {...props} />);

/* ---------- the vocabulary this screen may not contain ------------------- */

/**
 * Every reward token the Global Constraints forbid, in both languages.
 *
 * Asserting on absence is unusual and deliberate: an XP counter is not a bug
 * that shows up as a failing behaviour later — it is a design decision that
 * measurably inverts the sign of the whole mechanic (performance-contingent
 * rewards, d = −0.28 across 128 studies), and by the time anyone notices it is
 * shipped. The only place to catch it is here.
 */
const REWARD_VOCABULARY =
  /XP|نقطة|نقاط|درجة|ذهبي|فضّي|فضي|برونزي|المركز|المستوى|مستواك|شارة|وسام|دوري|جوهرة|قلوب|\bpoints?\b|\bscore[ds]?\b|\bbadges?\b|\bleagues?\b|\blevels?\b|\bgold\b|\bsilver\b|\bcoins?\b|\bhearts?\b|\bgems?\b|\bleaderboard\b|\branke?d?\b/i;

/** Loss framing. A rolling window has no cliff, so none of this can be true of it. */
const LOSS_VOCABULARY =
  /انقطع|انقطعت|انكسر|كسرت|خسرت|فقدت|ضاع|ضيّعت|\bbroken?\b|\block(ed)?\b|\blost\b|\bstreak\b|\bmissed\b|\bfail(ed|ure)?\b/i;

/* ---------- tests ------------------------------------------------------- */

describe("DueToday — diagnosis, never a grade", () => {
  test("names the rules that need review, as a diagnosis", () => {
    const { container } = view({ attempts: fiveMisses("idghaam_ghunnah") });

    expect(screen.getByText(/تحتاج مراجعة/)).toBeTruthy();
    // The rule by name — the same `noteFor` the feedback bar uses, so the learner
    // reads one vocabulary across the app.
    expect(container.textContent).toMatch(/إدغام/);
    expect(container.textContent).not.toMatch(REWARD_VOCABULARY);
  });

  test("a letter concept is named too, not just the eighteen rules", () => {
    const { container } = view({
      attempts: fiveMisses("ت"),
      data: gameData([{ arabic: "ت", name: "tā" }]),
    });
    expect(container.textContent).toMatch(/ت · tā/);
  });

  test("a concept with only ungraded attempts is not called weak", () => {
    // It has no entry in `derive()`'s map at all — the inherited fact this screen
    // must not assume away by walking the roster instead of the map.
    const { container } = view({
      attempts: Array.from({ length: 5 }, () => mk({ correct: null })),
    });
    expect(container.textContent).not.toMatch(/إدغام/);
  });

  test("nothing weak is stated as such, and is never a reward for it", () => {
    // Three clean reps, which is `CLEAN_RUN` — one is not enough and this file
    // does not get to decide that. `derive()` does.
    const { container } = view({
      attempts: [0, 1, 2].map((i) => mk({ at: NOW - DAY + i, correct: true })),
    });
    expect(container.textContent).toMatch(/لا شيء يحتاج مراجعة/);
    expect(container.textContent).not.toMatch(REWARD_VOCABULARY);
  });
});

describe("DueToday — the density display has no loss condition", () => {
  test("a missed day says nothing about having missed it", () => {
    // Practised the day before yesterday and not since: a counter with a cliff
    // would be showing a zero right now.
    const { container } = view({ attempts: [mk({ at: daysAgo(2) })] });

    expect(container.textContent).not.toMatch(LOSS_VOCABULARY);
    expect(container.textContent).toMatch(/تدرّبت .*من آخر/);
  });

  test("the window is rolling: a day drops out of it silently", () => {
    const { container } = view({
      attempts: [mk({ at: daysAgo(1) }), mk({ at: daysAgo(25) })],
    });
    // 25 days ago is outside the 21-day window and simply does not count. No
    // announcement, because nothing happened to the learner.
    expect(container.textContent).toMatch(/تدرّبت ١ من آخر ٢١ يوم/);
    expect(container.textContent).not.toMatch(LOSS_VOCABULARY);
  });

  test("the window's far edge is exactly twenty-one days wide", () => {
    const inside = view({ attempts: [mk({ at: daysAgo(DENSITY_WINDOW_DAYS - 1) })] });
    expect(inside.container.textContent).toMatch(/تدرّبت ١ من آخر ٢١ يوم/);
    inside.unmount();

    // One day further back is the first day outside it — and leaving is silent.
    const outside = view({ attempts: [mk({ at: daysAgo(DENSITY_WINDOW_DAYS) })] });
    expect(outside.container.textContent).toMatch(/ستظهر هنا/);
    expect(outside.container.textContent).not.toMatch(LOSS_VOCABULARY);
  });

  test("an attempt dated in the future is not practice already done", () => {
    // The same cut `orderedAttempts` makes at `now`. A clock that jumped
    // forward and back must not leave the learner credited for a day they have
    // not had.
    const { container } = view({ attempts: [mk({ at: daysAgo(-1) })] });
    expect(container.textContent).toMatch(/ستظهر هنا/);
  });

  test("no standalone zero anywhere, in any state", () => {
    for (const attempts of [[], [mk({ at: daysAgo(30) })], [mk({ at: daysAgo(2) })]]) {
      const { container, unmount } = view({ attempts });
      // ٢٠ and ١٠ are fine; a bare ٠ is a punishing count and there is no state
      // in which this screen has one to show.
      expect(container.textContent).not.toMatch(/(^|\s|·)٠(\s|·|$)/);
      unmount();
    }
  });

  test("no metric is denominated in time", () => {
    const { container } = view({ attempts: [mk(), mk({ at: daysAgo(3) })] });
    expect(container.textContent).not.toMatch(/دقيقة|دقائق|ثانية|ثوان|\bminutes?\b|\bseconds?\b/i);
  });
});

describe("DueToday — the weekly target counts distinct days", () => {
  test("two sessions in one day do not make it two of three", () => {
    const { container } = view({
      attempts: [mk({ at: daysAgo(0, 9) }), mk({ at: daysAgo(0, 18) })],
    });
    expect(container.textContent).toMatch(/١ من ٣ أيام مختلفة/);
    expect(container.textContent).not.toMatch(/٢ من ٣/);
  });

  test("two different days do", () => {
    const { container } = view({
      attempts: [mk({ at: daysAgo(0) }), mk({ at: daysAgo(1) })],
    });
    expect(container.textContent).toMatch(/٢ من ٣ أيام مختلفة/);
  });

  test("the week starts on Monday — Sunday belongs to the week before", () => {
    // NOW is Wednesday 12 Aug 2026; `daysAgo(3)` is the Sunday.
    const { container } = view({ attempts: [mk({ at: daysAgo(3) })] });
    expect(container.textContent).toMatch(/ثلاثة أيام مختلفة هي الهدف/);
    // …and it still counts toward the rolling window, which has no week in it.
    expect(container.textContent).toMatch(/تدرّبت ١ من آخر ٢١/);
  });

  test("the day boundary is the learner's midnight, not Greenwich's", () => {
    // Both directions, so the assertion does not encode this machine's offset:
    // a UTC-keyed boundary lands *after* local midnight in a positive offset and
    // *before* it in a negative one, and one of these two catches either.
    const mondayJustAfterMidnight = new Date(2026, 7, 10, 0, 30, 0).getTime();
    const sundayJustBefore = new Date(2026, 7, 9, 23, 30, 0).getTime();

    const inWeek = view({ attempts: [mk({ at: mondayJustAfterMidnight })] });
    expect(inWeek.container.textContent).toMatch(/١ من ٣ أيام مختلفة/);
    inWeek.unmount();

    const before = view({ attempts: [mk({ at: sundayJustBefore })] });
    expect(before.container.textContent).toMatch(/ثلاثة أيام مختلفة هي الهدف/);
  });

  test("the dots stop at the target however many days there are", () => {
    // A Friday, so a Monday-start week can hold five distinct days.
    const friday = new Date(2026, 7, 14, 10, 0, 0).getTime();
    const { container } = view({
      now: friday,
      attempts: [10, 11, 12, 13, 14].map((d) => mk({ at: new Date(2026, 7, d, 9, 0, 0).getTime() })),
    });
    expect(container.textContent).toMatch(/٥ أيام مختلفة/);
    // The row is a target, not a tally: it does not grow into a score.
    expect(container.querySelector('[data-testid="week-dots"]')?.textContent).toBe(
      "\u25cf\u25cf\u25cf",
    );
  });

  test("passing the target reports the truth rather than capping it", () => {
    const { container } = view({
      attempts: [0, 1, 2].map((n) => mk({ at: daysAgo(n) })),
    });
    expect(container.textContent).toMatch(/٣ أيام مختلفة/);
    expect(container.textContent).not.toMatch(LOSS_VOCABULARY);
  });

  test("the dots are never the only signal", () => {
    const { container } = view({ attempts: [mk({ at: daysAgo(0) })] });
    const dots = container.querySelector('[data-testid="week-dots"]');
    expect(dots?.getAttribute("aria-hidden")).toBe("true");
    // Filled and empty differ in shape, not only in hue, and they say the same
    // thing the words beside them say.
    expect(dots?.textContent).toBe("\u25cf\u25cb\u25cb");
    expect(container.querySelector('[data-testid="week-line"]')?.textContent).toMatch(/أيام مختلفة/);
  });

  test("the dots fill with the days, and never past the target", () => {
    const three = view({ attempts: [0, 1, 2].map((n) => mk({ at: daysAgo(n) })) });
    expect(three.container.querySelector('[data-testid="week-dots"]')?.textContent).toBe(
      "\u25cf\u25cf\u25cf",
    );
    three.unmount();
    // Four distinct days is not four dots: the row is a target, not a tally.
    const four = view({ attempts: [0, 1, 2, 3].map((n) => mk({ at: daysAgo(n) })) });
    expect(four.container.querySelector('[data-testid="week-dots"]')?.textContent).toBe(
      "\u25cf\u25cf\u25cf",
    );
  });
});

describe("DueToday — the weak list is a list, not a wall", () => {
  test("worst first, among concepts whose newest answer was clean", () => {
    // Neither is flagged — both were last answered correctly — so the order is
    // decided by accumulated wrongness alone. `ikhfa` carries five misses to
    // `iqlab`'s two.
    const { container } = view({
      attempts: [
        ...fiveMisses("ikhfa"),
        mk({ conceptId: "ikhfa", at: NOW - DAY + 50, correct: true }),
        wrong({ conceptId: "iqlab", at: NOW - DAY }),
        wrong({ conceptId: "iqlab", at: NOW - DAY + 1 }),
        mk({ conceptId: "iqlab", at: NOW - DAY + 50, correct: true }),
      ],
    });
    const named = [...container.querySelectorAll('[data-testid="weak-list"] li')].map(
      (li) => li.textContent ?? "",
    );
    expect(named).toHaveLength(2);
    expect(named[0]).toMatch(/إخفاء/);
    expect(named[1]).toMatch(/إقلاب/);
  });

  test("a long list is capped and the remainder counted out loud", () => {
    const ids = ["ikhfa", "iqlab", "qalqalah", "madd_munfasil", "madd_muttasil", "madd_6"];
    const { container } = view({ attempts: ids.flatMap((id) => fiveMisses(id)) });

    expect(container.querySelectorAll('[data-testid="weak-list"] li')).toHaveLength(5);
    // Hidden would be worse than capped: the learner is told what is not shown.
    expect(container.textContent).toMatch(/و١ غيرها/);
  });

  test("an unrepaired miss is named first, even by a concept with a worse history", () => {
    // `ikhfa` carries far more accumulated wrongness, but its last answer was
    // clean. `iqlab` has a better history and its newest evidence is a miss the
    // session never repaired — that is what `derive()`'s durable `flagged` says,
    // read out of the ledger rather than from `useSession`'s live copy, which
    // does not outlive the session that minted it. Unfinished business first.
    const { container } = view({
      attempts: [
        ...fiveMisses("ikhfa"),
        mk({ conceptId: "ikhfa", at: NOW - DAY + 50, correct: true }),
        ...Array.from({ length: 4 }, (_, i) => mk({ conceptId: "iqlab", at: NOW - DAY + i, correct: true })),
        wrong({ conceptId: "iqlab", at: NOW - DAY + 60 }),
      ],
    });
    const named = [...container.querySelectorAll('[data-testid="weak-list"] li')].map(
      (li) => li.textContent ?? "",
    );
    expect(named).toHaveLength(2);
    expect(named[0]).toMatch(/إقلاب/);
    expect(named[1]).toMatch(/إخفاء/);
  });
});

describe("DueToday — one loud action", () => {
  test("exactly one control, and it is the primary one", () => {
    const { container } = view({ attempts: fiveMisses("ikhfa") });
    expect(container.querySelectorAll("button")).toHaveLength(1);
    expect(container.querySelectorAll(".cta-primary")).toHaveLength(1);
    expect(screen.getByTestId("start-review").textContent).toMatch(/ابدأ المراجعة/);
  });

  test("it is live even with nothing due — review is never locked", async () => {
    const onStart = vi.fn();
    // Everything answered so recently that nothing has come round again.
    view({ attempts: [mk({ at: NOW - 1000 })], roster: ["idghaam_ghunnah"], onStart });
    const button = screen.getByTestId("start-review");
    expect(button.hasAttribute("disabled")).toBe(false);
    await userEvent.click(button);
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});

describe("DueToday — the first run", () => {
  test("an empty ledger is an invitation, not a zero and a dead end", async () => {
    const onStart = vi.fn();
    const { container } = view({ attempts: [], onStart });

    // Every concept is seeded due, so the count is real rather than a placeholder.
    expect(screen.getByText(/للمراجعة اليوم/)).toBeTruthy();
    expect(container.textContent).toMatch(/٥ مفاهيم/);
    expect(container.textContent).toMatch(/لم تتدرّب بعد/);
    // The density line does not report a zero; it says what will appear there.
    expect(container.textContent).toMatch(/ستظهر هنا/);
    expect(container.textContent).not.toMatch(LOSS_VOCABULARY);
    expect(container.textContent).not.toMatch(REWARD_VOCABULARY);

    await userEvent.click(screen.getByTestId("start-review"));
    expect(onStart).toHaveBeenCalled();
  });

  test("the count agrees with Arabic number agreement", () => {
    const one = view({ attempts: [], roster: ["ikhfa"] });
    expect(one.container.textContent).toMatch(/مفهوم واحد/);
    one.unmount();

    const two = view({ attempts: [], roster: ["ikhfa", "ت"] });
    expect(two.container.textContent).toMatch(/مفهومان/);
    two.unmount();

    const many = view({ attempts: [], roster: Array.from({ length: 12 }, (_, i) => `c${i}`) });
    expect(many.container.textContent).toMatch(/١٢ مفهوم/);
  });

  test("nothing due reads as free time, not as an empty screen", () => {
    const { container } = view({ attempts: [mk({ at: NOW - 1000 })], roster: ["idghaam_ghunnah"] });
    expect(container.textContent).toMatch(/لا شيء مستحقّ الآن/);
    expect(container.textContent).toMatch(/متى شئت/);
  });
});

describe("DueToday — RTL", () => {
  test("logical properties only, and the card is RTL", () => {
    const { container } = view({ attempts: fiveMisses("idghaam_ghunnah") });

    expect(container.querySelector('[data-testid="due-today"]')?.getAttribute("dir")).toBe("rtl");

    const physical = /^-?(ml|mr|pl|pr|left|right|float)-|^text-(left|right)$|^(border|rounded)-(l|r)($|-)/;
    for (const el of container.querySelectorAll("[class]")) {
      for (const raw of el.getAttribute("class")!.split(/\s+/)) {
        // Strip Tailwind variants (`sm:`, `hover:`) before judging the utility.
        const token = raw.slice(raw.lastIndexOf(":") + 1);
        expect(token, `${raw} is a physical direction`).not.toMatch(physical);
      }
    }
  });

  test("numerals inside Arabic lines are isolated", () => {
    const { container } = view({ attempts: [mk({ at: daysAgo(1) })] });
    // Without an isolate, a digit run inside an RTL line reorders against the
    // words around it. Asserted per line, not as a count over the card — a
    // `<bdi>` somewhere else is no help to the line that lost one.
    for (const id of ["density-line", "week-line", "due-count"]) {
      const line = container.querySelector(`[data-testid="${id}"]`);
      expect(line?.querySelectorAll("bdi").length, id).toBeGreaterThan(0);
    }
  });
});

/* ---------- end to end: the ledger decides what this screen says --------- */

function gameData(letters: { arabic: string; name: string }[]): GameData {
  const letterPool = letters.map(
    (l) => ({ arabic: l.arabic, translit: l.name, name: l.name }) as unknown as ArabicItem,
  );
  return {
    lessonId: "1-01",
    newLetters: [],
    letterPool,
    formEntries: [],
    wordPool: [],
    formsTaught: false,
  };
}

describe("DueTodayPanel — attempts in the ledger change what this screen says", () => {
  beforeEach(() => {
    // A fresh store per test: the ledger cannot delete, so isolation is the DB.
    globalThis.indexedDB = new IDBFactory();
  });
  afterEach(() => vi.restoreAllMocks());

  test("a concept missed five times appears under تحتاج مراجعة", async () => {
    const now = Date.now();
    for (let i = 0; i < 5; i += 1) {
      await appendAttempt({
        id: `e${i}`,
        at: now - 60_000 + i,
        conceptId: "madd_munfasil",
        itemKey: "x",
        gameId: "rule-identifier",
        correct: false,
        sessionId: "s",
        isInterleaved: false,
      });
    }

    const { container } = render(<DueTodayPanel data={gameData([{ arabic: "ت", name: "tā" }])} />);

    await waitFor(() => expect(screen.getByText(/تحتاج مراجعة/)).toBeTruthy());
    expect(container.textContent).toMatch(/منفصل/);
    // One real attempt today, read back out of the real store.
    expect(container.textContent).toMatch(/تدرّبت ١ من آخر ٢١/);
    expect(container.textContent).not.toMatch(REWARD_VOCABULARY);
    expect(container.textContent).not.toMatch(LOSS_VOCABULARY);
  });

  test("an empty store renders the first-run state rather than nothing", async () => {
    const { container } = render(<DueTodayPanel data={gameData([{ arabic: "ت", name: "tā" }])} />);
    await waitFor(() => expect(screen.getByTestId("start-review")).toBeTruthy());
    expect(container.textContent).toMatch(/لم تتدرّب بعد/);
    // The 18 rules *and* the pool's letters: a roster that dropped the letters
    // would silently stop scheduling 29 of the 47 concepts.
    expect(container.textContent).toMatch(/١٩ مفهوم/);
  });

  test("a ledger that will not open leaves the screen usable", async () => {
    // No store at all, which is what a private-mode browser and a blocked-origin
    // browser both look like from here.
    (globalThis as { indexedDB?: IDBFactory }).indexedDB = undefined;
    const { container } = render(<DueTodayPanel data={gameData([])} />);
    await waitFor(() => expect(screen.getByTestId("start-review")).toBeTruthy());
    // No dialog, no error text competing with the one action. Same rule as
    // `SessionRunner`'s write failures: a lost row never stops the learner.
    expect(screen.getByTestId("start-review").hasAttribute("disabled")).toBe(false);
    // And it does not tell the learner they have never practised, which is a
    // claim about them made out of a failure of ours.
    expect(screen.getByTestId("ledger-unavailable")).toBeTruthy();
    expect(container.textContent).not.toMatch(/لم تتدرّب بعد/);
  });
});
