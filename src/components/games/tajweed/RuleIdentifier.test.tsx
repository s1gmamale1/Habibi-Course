import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { getGames } from "../GameRegistry";
import { RuleIdentifier, type RuleItem } from "./RuleIdentifier";
import verses106 from "@/generated/verses/106.json";

// "مِّن جُوعٍ" — noon sākin followed by jīm, the textbook ikhfāʾ. Indices 0-3
// cover "مِّن", the span the drill asks about.
const ikhfaItem: RuleItem = { text: "مِّن جُوعٍ", spanStart: 0, spanEnd: 3, rule: "ikhfa" };

const prompt = (container: HTMLElement) =>
  container.querySelector("[data-prompt]") as HTMLElement;

const choiceNames = () =>
  screen.getAllByRole("button", { name: /./ }).map((b) => b.textContent ?? "");

describe("RuleIdentifier", () => {
  it("asks which rule applies to the highlighted span", () => {
    render(<RuleIdentifier items={[ikhfaItem]} />);
    expect(screen.getByText(/which rule/i)).toBeTruthy();
    // and it shows the fragment it is asking about
    expect(screen.getByLabelText(ikhfaItem.text)).toBeTruthy();
  });

  it("highlights the asked span and dims the others", () => {
    const { container } = render(
      <RuleIdentifier
        items={[
          {
            text: "مِّن جُوعٍ",
            spans: [
              { start: 0, end: 3, rules: ["ikhfa"] },
              { start: 4, end: 9, rules: ["madd_2"] },
            ],
            spanStart: 0,
            spanEnd: 3,
            rule: "ikhfa",
          },
        ]}
      />,
    );
    expect(container.querySelector("[data-rule='ikhfa']")!.getAttribute("data-dimmed")).toBe(null);
    expect(container.querySelector("[data-rule='madd_2']")!.getAttribute("data-dimmed")).toBe("true");
  });

  it("offers four choices, all of them real rules", () => {
    render(<RuleIdentifier items={[ikhfaItem]} />);
    const names = choiceNames();
    expect(names).toHaveLength(4);
    const translits = Object.values(RULE_META).map((m) => m.translit);
    for (const n of names) expect(translits).toContain(n);
  });

  it("offers same-family distractors, not random ones", () => {
    render(<RuleIdentifier items={[ikhfaItem]} />);
    // ikhfāʾ shafawī is the *tempting* wrong answer — the other ikhfāʾ.
    expect(screen.getByRole("button", { name: /ikhfāʾ shafawī/i })).toBeTruthy();
  });

  it("locks and reports correct on the right answer", async () => {
    const onResult = vi.fn();
    render(<RuleIdentifier items={[ikhfaItem]} onResult={onResult} now={() => 1234} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));

    expect(onResult).toHaveBeenCalledWith({
      gameId: "rule-identifier",
      ruleId: "ikhfa",
      correct: true,
      at: 1234,
    });
    const btn = screen.getByRole("button", { name: /^ikhfāʾ$/i });
    expect(btn.getAttribute("data-state")).toBe("correct");
    expect(btn.className).toContain("game-correct");
    expect(screen.getByText("First-try score: 1 / 1")).toBeTruthy();
  });

  it("states the result in words, not colour alone, in a live region", async () => {
    const { container } = render(<RuleIdentifier items={[ikhfaItem]} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    const live = container.querySelector("[aria-live]") as HTMLElement;
    expect(live.textContent).toMatch(/correct/i);
    expect(live.textContent).toMatch(/ikhfāʾ/i);
  });

  it("shakes and reports incorrect on a wrong answer", async () => {
    const onResult = vi.fn();
    render(<RuleIdentifier items={[ikhfaItem]} onResult={onResult} now={() => 99} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));

    expect(onResult).toHaveBeenCalledWith({
      gameId: "rule-identifier",
      ruleId: "ikhfa",
      correct: false,
      at: 99,
    });
    const btn = screen.getByRole("button", { name: /ikhfāʾ shafawī/i });
    expect(btn.getAttribute("data-state")).toBe("wrong");
    expect(btn.className).toContain("game-shake");
    // still answerable — a wrong pick does not end the question
    expect(screen.queryByRole("button", { name: /next question/i })).toBe(null);
  });

  it("scores a missed first try as 0, and stops reporting once locked", async () => {
    const onResult = vi.fn();
    render(<RuleIdentifier items={[ikhfaItem]} onResult={onResult} />);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    expect(screen.getByText("First-try score: 0 / 1")).toBeTruthy();

    expect(onResult).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole("button", { name: /ikhfāʾ shafawī/i }));
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  it("does not reveal the answer anywhere in the prompt", () => {
    const { container } = render(<RuleIdentifier items={[ikhfaItem]} />);
    const meta = RULE_META.ikhfa;
    const text = prompt(container).textContent ?? "";
    expect(text).not.toContain(meta.translit);
    expect(text).not.toContain(meta.en);
    expect(text).not.toContain(meta.ar);
    // and the answer is not marked out before it is picked
    expect(container.querySelector("[data-state='correct']")).toBe(null);
  });

  it("orders the choices deterministically from the item, not from a random effect", () => {
    const first = render(<RuleIdentifier items={[ikhfaItem]} />);
    const a = choiceNames();
    first.unmount();
    render(<RuleIdentifier items={[ikhfaItem]} />);
    expect(choiceNames()).toEqual(a);
  });

  it("moves to the next item with a fresh, unlocked question", async () => {
    const second: RuleItem = { text: "يَجْعَلُ", spanStart: 1, spanEnd: 3, rule: "qalqalah" };
    render(<RuleIdentifier items={[ikhfaItem, second]} />);
    await userEvent.click(screen.getByRole("button", { name: /^ikhfāʾ$/i }));
    await userEvent.click(screen.getByRole("button", { name: /next question/i }));

    expect(screen.getByLabelText(second.text)).toBeTruthy();
    expect(document.querySelector("[data-state]")).toBe(null);
    expect(screen.getByRole("button", { name: /^qalqalah$/i })).toBeTruthy();
  });

  it("renders real generated data", () => {
    type Verse = { ayah: number; text: string; spans: { start: number; end: number; rules: string[] }[] };
    const ayah = (verses106 as Verse[]).find((v) => v.ayah === 4)!;
    // 106:4 — the richest ayah in the course: madd munfaṣil, qalqalah,
    // two idghām shafawī, an ikhfāʾ (مِّن جُوعٍ) and an idghām bi-ghunnah.
    const items: RuleItem[] = ayah.spans.map((s) => ({
      text: ayah.text,
      spans: ayah.spans,
      spanStart: s.start,
      spanEnd: s.end,
      rule: s.rules[0] as RuleId,
    }));
    const { container } = render(<RuleIdentifier items={items} />);

    // the whole ayah survives verbatim inside the prompt
    expect(prompt(container).textContent).toContain(ayah.text);
    // first span is madd munfaṣil, so every choice must be a madd
    const names = choiceNames();
    expect(names).toHaveLength(4);
    for (const n of names) {
      const rule = (Object.keys(RULE_META) as RuleId[]).find((r) => RULE_META[r].translit === n)!;
      expect(RULE_META[rule].family).toBe("madd");
    }
    expect(names).toContain(RULE_META.madd_munfasil.translit);
  });

  it("registers itself as a playable drill", () => {
    const [entry] = getGames(["rule-identifier"]);
    expect(entry).toBeTruthy();
    expect(entry.label).toBe("❓ Which rule?");
    expect(entry.render({})).toBeTruthy();
  });
});
