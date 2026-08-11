import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PALETTE_B, RULE_META, type RuleId } from "@/content/tajweed";
import verses1 from "@/generated/verses/1.json";
import verses106 from "@/generated/verses/106.json";
import verses111 from "@/generated/verses/111.json";
import { getGames } from "../GameRegistry";
import { MaddCounter, acceptedHarakat, type MaddItem } from "./MaddCounter";

type Verse = { ayah: number; text: string; spans: { start: number; end: number; rules: string[] }[] };

const verse = (data: unknown, ayah: number) => (data as Verse[]).find((v) => v.ayah === ayah)!;
const itemFrom = (v: Verse, rule: RuleId): MaddItem => {
  const span = v.spans.find((s) => s.rules[0] === rule)!;
  return { text: v.text, spanStart: span.start, spanEnd: span.end, rule };
};

// Every fixture is real generated data, not a hand-typed approximation.
const FATIHA_7 = verse(verses1, 7); // ...وَلَا ٱلضَّآلِّينَ
const MASAD_1 = verse(verses111, 1); // ...تَبَّتْ يَدَآ أَبِى لَهَبٍ
const QURAYSH_4 = verse(verses106, 4);

/** ٱلضَّآلِّينَ — madd lāzim, the one length with no discretion in it: six. */
const LAZIM = itemFrom(FATIHA_7, "madd_6");
/** يَدَآ أَبِى — madd munfaṣil, four. */
const MUNFASIL = itemFrom(MASAD_1, "madd_munfasil");
/** The final syllable of ٱلضَّآلِّينَ — madd ʿāriḍ lis-sukūn: 2, 4 *or* 6. */
const ARID = itemFrom(FATIHA_7, "madd_246");
/** خَوْفٍۭ — a second ʿāriḍ, for the within-session consistency check. */
const ARID_2 = itemFrom(QURAYSH_4, "madd_246");

const count = (n: number) => screen.getByTestId(`count-${n}`) as HTMLButtonElement;
const live = () => screen.getByRole("status").textContent ?? "";
const next = () => screen.getByRole("button", { name: /next/i });

describe("acceptedHarakat", () => {
  it("reads the count off RULE_META for the rules that have one", () => {
    expect(acceptedHarakat("madd_2")).toEqual([2]);
    expect(acceptedHarakat("madd_muttasil")).toEqual([4]);
    expect(acceptedHarakat("madd_munfasil")).toEqual([4]);
    expect(acceptedHarakat("madd_6")).toEqual([6]);
    expect(acceptedHarakat("ghunnah")).toEqual([2]);
    expect(acceptedHarakat("ikhfa")).toEqual([2]);
    expect(acceptedHarakat("iqlab")).toEqual([2]);
  });

  it("accepts 2, 4 AND 6 for madd ʿāriḍ lis-sukūn", () => {
    // The reciter chooses; all three readings are transmitted. `RULE_META`
    // deliberately gives madd_246 no single `harakat`, and that absence must
    // not be read as "unknown" or defaulted to one value.
    expect(acceptedHarakat("madd_246")).toEqual([2, 4, 6]);
    expect(RULE_META.madd_246.harakat).toBeUndefined();
  });

  it("declines rules that carry no length at all", () => {
    expect(acceptedHarakat("qalqalah")).toEqual([]);
    expect(acceptedHarakat("hamzat_wasl")).toEqual([]);
  });
});

describe("MaddCounter — the question", () => {
  it("asks for a length and offers 2, 4 and 6", () => {
    render(<MaddCounter items={[LAZIM]} />);

    expect(screen.getByText(/how many ḥarakāt/i)).toBeTruthy();
    expect([2, 4, 6].map((n) => count(n).textContent)).toEqual([
      expect.stringContaining("2"),
      expect.stringContaining("4"),
      expect.stringContaining("6"),
    ]);
    expect(count(4).getAttribute("aria-label")).toMatch(/4 ḥarakāt/i);
  });

  it("shows the fragment with the madd marked, and its marks intact", () => {
    const { container } = render(<MaddCounter items={[LAZIM]} />);

    expect(screen.getByLabelText(LAZIM.text)).toBeTruthy();
    const target = container.querySelector("[data-target]")!;
    expect(target.textContent).toBe(LAZIM.text.slice(LAZIM.spanStart, LAZIM.spanEnd));
  });

  it("does not paint the fragment in the rule palette", () => {
    // Palette B gives each madd its own hue, so a learner who knows the colours
    // could read the answer off the ink instead of the sound.
    const { container } = render(<MaddCounter items={[LAZIM]} />);

    expect(container.querySelector("[data-rule]")).toBeNull();
    expect(container.innerHTML).not.toContain(PALETTE_B.madd_6);
    expect(container.querySelector("[data-target]")!.getAttribute("style")).toBeNull();
  });

  it("does not name the rule before it is answered", () => {
    render(<MaddCounter items={[LAZIM]} />);

    expect(screen.queryByText(new RegExp(RULE_META.madd_6.translit, "i"))).toBeNull();
    expect(screen.queryByText(RULE_META.madd_6.ar)).toBeNull();
  });

  it("says a ḥarakah is relative to the reciter's tempo, not a clock", () => {
    const { container } = render(<MaddCounter items={[LAZIM]} />);

    expect(container.textContent).toMatch(/tempo/i);
    expect(container.textContent).not.toMatch(/millisecond|seconds/i);
  });
});

describe("MaddCounter — answering", () => {
  it("locks the correct count and reports it", async () => {
    const onResult = vi.fn();
    render(<MaddCounter items={[LAZIM]} onResult={onResult} now={() => 42} />);

    await userEvent.click(count(6));

    expect(count(6).getAttribute("data-state")).toBe("correct");
    expect(count(6).className).toContain("game-correct");
    expect(onResult).toHaveBeenCalledWith({
      gameId: "madd-counter",
      ruleId: "madd_6",
      correct: true,
      at: 42,
    });
    expect(live()).toMatch(/correct/i);
    expect(live()).toMatch(new RegExp(RULE_META.madd_6.translit, "i"));
  });

  it("shakes a wrong count without ending the question", async () => {
    const onResult = vi.fn();
    render(<MaddCounter items={[LAZIM]} onResult={onResult} />);

    await userEvent.click(count(2));

    expect(count(2).getAttribute("data-state")).toBe("wrong");
    expect(count(2).className).toContain("game-shake");
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
    expect(live()).toMatch(/not/i);
    // and the right answer is still available
    expect(count(6).disabled).toBe(false);
    await userEvent.click(count(6));
    expect(count(6).getAttribute("data-state")).toBe("correct");
  });

  it("does not reveal the answer through the wrong-answer feedback", async () => {
    render(<MaddCounter items={[MUNFASIL]} />);

    await userEvent.click(count(2));

    expect(live()).not.toMatch(/4/);
    expect(live()).not.toMatch(new RegExp(RULE_META.madd_munfasil.translit, "i"));
  });

  it("stops scoring once the question is locked", async () => {
    const onResult = vi.fn();
    render(<MaddCounter items={[MUNFASIL]} onResult={onResult} />);

    await userEvent.click(count(4));
    await userEvent.click(count(2));

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(count(2).getAttribute("data-state")).toBeNull();
  });

  it("keeps a first-try score across questions", async () => {
    render(<MaddCounter items={[LAZIM, MUNFASIL]} />);

    await userEvent.click(count(2)); // miss
    await userEvent.click(count(6));
    await userEvent.click(next());
    await userEvent.click(count(4));

    expect(screen.getByText("First-try score: 1 / 2")).toBeTruthy();
  });

  it("starts the next question unlocked", async () => {
    render(<MaddCounter items={[LAZIM, MUNFASIL]} />);

    await userEvent.click(count(6));
    await userEvent.click(next());

    expect(document.querySelector("[data-state]")).toBeNull();
    expect(screen.getByLabelText(MUNFASIL.text)).toBeTruthy();
  });
});

describe("MaddCounter — madd ʿāriḍ lis-sukūn accepts 2, 4 and 6", () => {
  it.each([2, 4, 6])("accepts %i ḥarakāt", async (n) => {
    const onResult = vi.fn();
    const view = render(<MaddCounter items={[ARID]} onResult={onResult} />);

    await userEvent.click(count(n));

    expect(count(n).getAttribute("data-state")).toBe("correct");
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: "madd_246", correct: true }),
    );
    view.unmount();
  });

  it("never marks 4 wrong for it", async () => {
    // The regression this whole drill turns on: 4 is a *correct* reading of
    // madd ʿāriḍ, and marking it wrong would teach a falsehood.
    const onResult = vi.fn();
    render(<MaddCounter items={[ARID]} onResult={onResult} />);

    await userEvent.click(count(4));

    expect(count(4).getAttribute("data-state")).not.toBe("wrong");
    expect(onResult).not.toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it("says all three are permitted, and asks for consistency", async () => {
    render(<MaddCounter items={[ARID]} />);

    await userEvent.click(count(4));

    expect(live()).toMatch(/all three/i);
    expect(live()).toMatch(/consistent/i);
  });

  it("marks every other length wrong for a rule that has only one", async () => {
    render(<MaddCounter items={[LAZIM]} />);

    await userEvent.click(count(4));

    expect(count(4).getAttribute("data-state")).toBe("wrong");
  });

  it("nudges when a second ʿāriḍ is held for a different length", async () => {
    render(<MaddCounter items={[ARID, ARID_2]} />);

    await userEvent.click(count(4));
    await userEvent.click(next());
    await userEvent.click(count(2));

    // Still correct — 2 is a legitimate reading. Only the mixing is flagged.
    expect(count(2).getAttribute("data-state")).toBe("correct");
    expect(live()).toMatch(/held 4/i);
  });

  it("does not nudge when the same length is held again", async () => {
    render(<MaddCounter items={[ARID, ARID_2]} />);

    await userEvent.click(count(4));
    await userEvent.click(next());
    await userEvent.click(count(4));

    expect(live()).not.toMatch(/held 4/i);
  });
});

describe("MaddCounter — real generated data", () => {
  it("scores al-Fātiḥa 1:7 ٱلضَّآلِّينَ as six", async () => {
    expect(FATIHA_7.text.slice(LAZIM.spanStart, LAZIM.spanEnd)).toBe("آلِّ");
    const onResult = vi.fn();
    render(<MaddCounter items={[LAZIM]} onResult={onResult} />);

    await userEvent.click(count(6));

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: true }));
  });

  it("scores al-Masad 111:1 يَدَآ أَبِى as four", async () => {
    const onResult = vi.fn();
    render(<MaddCounter items={[MUNFASIL]} onResult={onResult} />);

    await userEvent.click(count(6));
    await userEvent.click(count(4));

    expect(onResult.mock.calls.map((c) => c[0].correct)).toEqual([false, true]);
  });

  it("drops items whose rule carries no length", () => {
    const qalqalah: MaddItem = { text: "يَجْعَلْ", spanStart: 2, spanEnd: 4, rule: "qalqalah" };
    render(<MaddCounter items={[qalqalah]} />);

    expect(screen.getByText(/no madd to drill/i)).toBeTruthy();
  });
});

describe("MaddCounter — registration", () => {
  it("is registered under the id madd-counter", () => {
    const [entry] = getGames(["madd-counter"]);
    expect(entry).toBeTruthy();
    expect(entry.id).toBe("madd-counter");
    expect(entry.render({})).toBeTruthy();
  });
});
