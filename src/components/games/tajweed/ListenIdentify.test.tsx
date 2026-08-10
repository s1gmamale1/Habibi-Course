import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { getGames } from "../GameRegistry";
import { DEFAULT_LISTEN_ITEMS, ListenIdentify, type ListenItem } from "./ListenIdentify";

afterEach(() => vi.restoreAllMocks());

/** 106:4 — "…وَءَامَنَهُم مِّنْ خَوْفٍۭ", the ikhfāʾ of noon sākin before khāʾ. */
const item: ListenItem = {
  surah: 106,
  ayah: 4,
  rule: "ikhfa",
  text: "مِّنْ خَوْفٍ",
  spans: [{ start: 0, end: 4, rules: ["ikhfa"] }],
};

const playButton = () => screen.getByRole("button", { name: /play|listen/i });

const choiceNames = () =>
  screen
    .getAllByRole("button")
    .filter((b) => b !== playButton())
    .map((b) => b.textContent ?? "");

describe("ListenIdentify", () => {
  it("plays the everyayah clip for its ayah", async () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    render(<ListenIdentify items={[item]} />);

    expect(playButton().getAttribute("data-audio-src")).toBe(
      "https://everyayah.com/data/Husary_Muallim_128kbps/106004.mp3",
    );
    await userEvent.click(playButton());
    expect(play).toHaveBeenCalled();
  });

  it("credits the reciter", () => {
    render(<ListenIdentify items={[item]} />);
    expect(screen.getByText(/ḥuṣarī/i)).toBeTruthy();
  });

  it("does not render the ayah text before answering", () => {
    // The whole point of this drill: the ear, not the eye. Printing the text —
    // let alone its coloured spans — hands over the answer before the clip ends.
    const { container } = render(<ListenIdentify items={[item]} />);
    expect(container.textContent).not.toContain(item.text);
    expect(container.querySelector("[data-rule]")).toBe(null);
    expect(container.querySelector(".tajweed-text")).toBe(null);
    // nor the reference, which is one search away from the text
    expect(container.textContent).not.toContain("106:4");
  });

  it("does not name the rule in the prompt", () => {
    const { container } = render(<ListenIdentify items={[item]} />);
    const prompt = (container.querySelector("[data-prompt]") as HTMLElement).textContent ?? "";
    for (const name of [RULE_META.ikhfa.translit, RULE_META.ikhfa.en, RULE_META.ikhfa.ar]) {
      expect(prompt).not.toContain(name);
    }
  });

  it("reveals the text, coloured and referenced, after answering", async () => {
    const { container } = render(<ListenIdentify items={[item]} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));

    expect(screen.getByLabelText(item.text)).toBeTruthy();
    expect(container.querySelector("[data-rule='ikhfa']")).toBeTruthy();
    expect(container.textContent).toContain("106:4");
  });

  it("reveals the text after a wrong answer too — that is the teaching moment", async () => {
    render(<ListenIdentify items={[item]} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));
    expect(screen.getByLabelText(item.text)).toBeTruthy();
  });

  it("offers same-family distractors, not random ones", () => {
    render(<ListenIdentify items={[item]} />);
    expect(screen.getByRole("button", { name: /ikhfāʾ shafawī/i })).toBeTruthy();
    const names = choiceNames();
    expect(names).toHaveLength(4);
    const translits = Object.values(RULE_META).map((m) => m.translit);
    for (const n of names) expect(translits).toContain(n);
  });

  it("never offers a distractor that is also audible in the same clip", () => {
    // 106:4 also contains idghām bi-ghunnah. Offering it as a wrong answer for
    // an idghām question would make two choices honestly correct by ear.
    render(
      <ListenIdentify
        items={[{ ...item, rule: "idghaam_shafawi", avoid: ["idghaam_ghunnah"] }]}
      />,
    );
    expect(choiceNames()).not.toContain(RULE_META.idghaam_ghunnah.translit);
    expect(choiceNames()).toContain(RULE_META.idghaam_shafawi.translit);
  });

  it("reports the result", async () => {
    const onResult = vi.fn();
    render(<ListenIdentify items={[item]} onResult={onResult} now={() => 1234} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));

    expect(onResult).toHaveBeenCalledWith({
      gameId: "listen-identify",
      ruleId: "ikhfa",
      correct: true,
      at: 1234,
    });
  });

  it("reports a wrong answer once, and stops reporting once answered", async () => {
    const onResult = vi.fn();
    render(<ListenIdentify items={[item]} onResult={onResult} now={() => 99} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));

    expect(onResult).toHaveBeenCalledWith({
      gameId: "listen-identify",
      ruleId: "ikhfa",
      correct: false,
      at: 99,
    });
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it("announces the result to assistive tech, in words and not colour alone", async () => {
    const { container } = render(<ListenIdentify items={[item]} />);
    const live = container.querySelector("[aria-live]") as HTMLElement;
    expect(live).toBeTruthy();

    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    expect(live.textContent).toMatch(/correct/i);
    expect(live.textContent).toMatch(/ikhfāʾ/i);
  });

  it("marks the choices with state, not colour alone", async () => {
    render(<ListenIdentify items={[item]} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));

    expect(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }).getAttribute("data-state")).toBe("wrong");
    // the right answer is shown once the question is over
    expect(screen.getByRole("button", { name: /^ikhfāʾ$/i }).getAttribute("data-state")).toBe("correct");
  });

  it("orders the choices deterministically from the item, not from a random effect", () => {
    const first = render(<ListenIdentify items={[item]} />);
    const a = choiceNames();
    first.unmount();
    render(<ListenIdentify items={[item]} />);
    expect(choiceNames()).toEqual(a);
  });

  it("moves to the next clip with a fresh, unanswered question", async () => {
    const second: ListenItem = { surah: 112, ayah: 1, rule: "qalqalah", text: "قُلْ هُوَ ٱللَّهُ أَحَدٌ" };
    render(<ListenIdentify items={[item, second]} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    await userEvent.click(screen.getByRole("button", { name: /next clip/i }));

    expect(document.querySelector("[data-state]")).toBe(null);
    expect(document.querySelector(".tajweed-text")).toBe(null);
    expect(playButton().getAttribute("data-audio-src")).toContain("112001.mp3");
    expect(screen.getByRole("button", { name: /^qalqalah$/i })).toBeTruthy();
  });

  it("says so rather than crashing when a lesson gives it nothing to play", () => {
    render(<ListenIdentify items={[]} />);
    expect(screen.getByText(/no clips/i)).toBeTruthy();
  });

  it("registers itself as a playable drill", () => {
    const [entry] = getGames(["listen-identify"]);
    expect(entry).toBeTruthy();
    expect(entry.render({})).toBeTruthy();
  });
});

describe("ListenIdentify default items", () => {
  it("drills real bundled verses", () => {
    const [entry] = getGames(["listen-identify"]);
    render(<>{entry.render({})}</>);
    // A registered drill with no items would render the empty state instead.
    expect(screen.queryByText(/no clips/i)).toBe(null);
    expect(playButton().getAttribute("data-audio-src")).toMatch(
      /^https:\/\/everyayah\.com\/data\/Husary_Muallim_128kbps\/\d{6}\.mp3$/,
    );
  });

  it("gives every default item a rule the course actually teaches", () => {
    expect(DEFAULT_LISTEN_ITEMS.length).toBeGreaterThan(0);
    for (const i of DEFAULT_LISTEN_ITEMS) {
      expect(RULE_META[i.rule as RuleId]).toBeTruthy();
      expect(i.text.length).toBeGreaterThan(0);
    }
  });
});
