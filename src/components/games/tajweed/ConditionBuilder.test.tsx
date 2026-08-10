import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RULE_META, type RuleId } from "@/content/tajweed";
import { siblingRules } from "@/games/tajweed";
import { getGames } from "../GameRegistry";
import {
  ConditionBuilder,
  DEFAULT_CHAINS,
  LENGTH_LADDER,
  bankFor,
  chainOf,
  decoysFor,
  ruleDecoys,
  type ConditionChain,
} from "./ConditionBuilder";

const IQLAB = chainOf("iqlab")!;
const IKHFA_SHAFAWI = chainOf("ikhfa_shafawi")!;

const tile = (label: string) => screen.getByRole("button", { name: label }) as HTMLButtonElement;
const slots = () => Array.from(document.querySelectorAll("[data-slot]"));
const live = () => screen.getByRole("status").textContent ?? "";
const board = () => screen.getByTestId("condition-builder");

/** Place every tile of the chain, in slot order. */
async function solve(chain: ConditionChain) {
  for (const slot of chain.slots) await userEvent.click(tile(slot.label));
}

describe("the chains themselves", () => {
  it("gives every drilled rule a full condition chain", () => {
    expect(DEFAULT_CHAINS.length).toBeGreaterThanOrEqual(4);
    for (const chain of DEFAULT_CHAINS) {
      expect(RULE_META[chain.rule]).toBeTruthy();
      // trigger · condition · rule · sound · length — the whole sentence.
      expect(chain.slots.map((s) => s.role)).toEqual([
        "trigger",
        "condition",
        "rule",
        "sound",
        "length",
      ]);
      // The rule slot is the rule's own name, not a paraphrase.
      const named = chain.slots.find((s) => s.role === "rule")!;
      expect(named.label).toBe(RULE_META[chain.rule].translit);
    }
  });

  it("states the iqlāb chain the way the course teaches it", () => {
    const labels = IQLAB.slots.map((s) => s.label);
    expect(labels[0]).toMatch(/nūn sākin/i);
    expect(labels[1]).toContain("ب");
    expect(labels[2]).toBe(RULE_META.iqlab.translit);
    expect(labels[3]).toMatch(/meem/i);
    expect(labels[4]).toMatch(/2 counts/i);
  });
});

describe("decoys", () => {
  it("names a sibling rule first, never a rule from another family entirely", () => {
    // ikhfāʾ's sibling is ikhfāʾ shafawī — the tempting wrong answer. `siblingRules`
    // pads to three with unrelated rules when a family is small; those padded
    // entries must not reach the bank.
    expect(ruleDecoys("ikhfa", DEFAULT_CHAINS)[0]).toBe("ikhfa_shafawi");
    expect(siblingRules("ikhfa")).toContain("ikhfa_shafawi");
    expect(siblingRules("ikhfa")).toContain("hamzat_wasl");
    expect(ruleDecoys("ikhfa", DEFAULT_CHAINS)).not.toContain("hamzat_wasl");
    expect(ruleDecoys("iqlab", DEFAULT_CHAINS)).not.toContain("madd_2");
  });

  it("never offers a rule its own name as a decoy", () => {
    for (const chain of DEFAULT_CHAINS) {
      expect(ruleDecoys(chain.rule, DEFAULT_CHAINS)).not.toContain(chain.rule);
    }
  });

  it("draws every decoy from a rule the course teaches, or a real length", () => {
    const taught = new Set(DEFAULT_CHAINS.flatMap((c) => c.slots.map((s) => s.label)));
    for (const chain of DEFAULT_CHAINS) {
      const decoys = decoysFor(chain, DEFAULT_CHAINS);
      expect(decoys.length).toBeGreaterThan(0);
      for (const d of decoys) {
        // Plausible: it is something some other rule really says, or a length
        // the tradition really transmits. Never invented nonsense.
        expect(taught.has(d.label) || LENGTH_LADDER.includes(d.label)).toBe(true);
        // and never the right answer for the slot it decoys
        expect(chain.slots.some((s) => s.role === d.role && s.label === d.label)).toBe(false);
      }
    }
  });

  it("gives iqlāb the confusable neighbours, not absurd ones", () => {
    const byRole = Object.fromEntries(decoysFor(IQLAB, DEFAULT_CHAINS).map((d) => [d.role, d.label]));
    expect(byRole.rule).toBe(RULE_META.ikhfa.translit);
    expect(byRole.trigger).toMatch(/mīm sākin/i);
    expect(byRole.length).toBeTruthy();
    expect(byRole.length).not.toBe(IQLAB.slots.find((s) => s.role === "length")!.label);
  });

  it("puts the decoys into the bank alongside the real tiles", () => {
    const bank = bankFor(IQLAB, DEFAULT_CHAINS);
    const labels = bank.map((t) => t.label);
    for (const slot of IQLAB.slots) expect(labels).toContain(slot.label);
    expect(bank.filter((t) => t.slot === null).length).toBeGreaterThan(0);
    expect(bank.length).toBeGreaterThan(IQLAB.slots.length);
    // Stable order — derived from the chain, not from Math.random.
    expect(bankFor(IQLAB, DEFAULT_CHAINS).map((t) => t.id)).toEqual(bank.map((t) => t.id));
  });
});

describe("ConditionBuilder — the board", () => {
  it("shows one empty slot per part, with a hint that is not the answer", () => {
    render(<ConditionBuilder chains={[IQLAB]} />);

    expect(slots()).toHaveLength(IQLAB.slots.length);
    for (const s of slots()) expect(s.getAttribute("data-state")).toBe("empty");
    expect(slots()[0].getAttribute("data-active")).toBe("true");

    const hints = slots().map((s) => s.textContent ?? "");
    for (const hint of hints) {
      expect(hint).not.toContain(RULE_META.iqlab.translit);
      expect(hint).not.toContain(RULE_META.iqlab.ar);
    }
  });

  it("does not name the rule in the prompt", () => {
    render(<ConditionBuilder chains={[IQLAB]} />);
    const prompt = screen.getByTestId("condition-prompt").textContent ?? "";
    for (const name of [RULE_META.iqlab.translit, RULE_META.iqlab.en, RULE_META.iqlab.ar]) {
      expect(prompt).not.toContain(name);
    }
  });

  it("offers every bank tile as a real button", () => {
    render(<ConditionBuilder chains={[IQLAB]} />);
    for (const t of bankFor(IQLAB, DEFAULT_CHAINS)) {
      expect(tile(t.label).tagName).toBe("BUTTON");
    }
  });
});

describe("ConditionBuilder — placing tiles", () => {
  it("locks a correct tile into its slot and takes it out of the bank", async () => {
    const onResult = vi.fn();
    render(<ConditionBuilder chains={[IQLAB]} onResult={onResult} now={() => 7} />);
    const first = IQLAB.slots[0].label;

    await userEvent.click(tile(first));

    expect(slots()[0].getAttribute("data-state")).toBe("correct");
    expect(slots()[0].textContent).toContain(first);
    expect(slots()[1].getAttribute("data-active")).toBe("true");
    expect(screen.queryByRole("button", { name: first })).toBeNull();
    expect(onResult).toHaveBeenCalledWith({
      gameId: "condition-builder",
      ruleId: "iqlab",
      correct: true,
      at: 7,
    });
    expect(live()).toMatch(/correct|right/i);
  });

  it("bounces a decoy back to the bank without ending the round", async () => {
    const onResult = vi.fn();
    render(<ConditionBuilder chains={[IQLAB]} onResult={onResult} />);
    const decoy = decoysFor(IQLAB, DEFAULT_CHAINS).find((d) => d.role === "trigger")!;

    await userEvent.click(tile(decoy.label));

    // Still in the bank, marked wrong in words as well as colour, shaking.
    const bounced = tile(decoy.label);
    expect(bounced.getAttribute("data-state")).toBe("wrong");
    expect(bounced.className).toContain("game-shake");
    expect(bounced.disabled).toBe(false);
    // The slot is untouched and the round carries on.
    expect(slots()[0].getAttribute("data-state")).toBe("empty");
    expect(board().getAttribute("data-complete")).toBe("false");
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
    expect(live()).toMatch(/not part of this rule/i);

    // and the right tile still works afterwards
    await userEvent.click(tile(IQLAB.slots[0].label));
    expect(slots()[0].getAttribute("data-state")).toBe("correct");
  });

  it("tells a learner who is right but early that the part comes later", async () => {
    render(<ConditionBuilder chains={[IQLAB]} />);

    await userEvent.click(tile(IQLAB.slots[4].label));

    expect(slots()[4].getAttribute("data-state")).toBe("empty");
    expect(live()).toMatch(/comes later/i);
    // The hint says which slot is open — it never says which tile belongs there.
    expect(live()).not.toContain(IQLAB.slots[0].label);
  });

  it("reports the finished chain and marks the board complete", async () => {
    const onResult = vi.fn();
    render(<ConditionBuilder chains={[IQLAB]} onResult={onResult} now={() => 99} />);

    await solve(IQLAB);

    expect(board().getAttribute("data-complete")).toBe("true");
    expect(slots().every((s) => s.getAttribute("data-state") === "correct")).toBe(true);
    expect(onResult).toHaveBeenCalledTimes(IQLAB.slots.length);
    expect(onResult).toHaveBeenLastCalledWith({
      gameId: "condition-builder",
      ruleId: "iqlab",
      correct: true,
      at: 99,
    });
    expect(live()).toMatch(/complete/i);
    // Only now is the whole rule spelled out, in words.
    expect(live()).toContain(RULE_META.iqlab.en);
  });

  it("stops accepting tiles once the chain is complete", async () => {
    const onResult = vi.fn();
    render(<ConditionBuilder chains={[IQLAB]} onResult={onResult} />);
    const decoy = decoysFor(IQLAB, DEFAULT_CHAINS)[0];

    await solve(IQLAB);
    await userEvent.click(tile(decoy.label));

    expect(onResult).toHaveBeenCalledTimes(IQLAB.slots.length);
    expect(tile(decoy.label).disabled).toBe(true);
  });

  it("keeps a first-try score and starts the next rule clean", async () => {
    render(<ConditionBuilder chains={[IQLAB, IKHFA_SHAFAWI]} />);
    const decoy = decoysFor(IQLAB, DEFAULT_CHAINS)[0];

    await userEvent.click(tile(decoy.label)); // a miss
    await solve(IQLAB);
    await userEvent.click(screen.getByRole("button", { name: /next/i }));

    expect(screen.getByText(/first-try score: 0 \/ 1/i)).toBeTruthy();
    expect(slots().every((s) => s.getAttribute("data-state") === "empty")).toBe(true);
    expect(board().getAttribute("data-complete")).toBe("false");
  });
});

describe("ConditionBuilder — a second rule", () => {
  it("builds ikhfāʾ shafawī from its own tiles and decoys", async () => {
    const onResult = vi.fn();
    render(<ConditionBuilder chains={[IKHFA_SHAFAWI]} onResult={onResult} />);

    expect(slots()).toHaveLength(IKHFA_SHAFAWI.slots.length);
    // Its rule decoy is its family sibling, ikhfāʾ ḥaqīqī.
    expect(ruleDecoys("ikhfa_shafawi", DEFAULT_CHAINS)[0]).toBe("ikhfa");
    expect(tile(RULE_META.ikhfa.translit)).toBeTruthy();

    await solve(IKHFA_SHAFAWI);

    expect(board().getAttribute("data-complete")).toBe("true");
    expect(onResult).toHaveBeenLastCalledWith(
      expect.objectContaining({ ruleId: "ikhfa_shafawi" as RuleId, correct: true }),
    );
  });

  it("plays every chain the course ships without a missing tile", async () => {
    for (const chain of DEFAULT_CHAINS) {
      const view = render(<ConditionBuilder chains={[chain]} />);
      await solve(chain);
      expect(board().getAttribute("data-complete")).toBe("true");
      view.unmount();
    }
  });

  it("says nothing to build when given no chains", () => {
    render(<ConditionBuilder chains={[]} />);
    expect(screen.getByText(/nothing to build/i)).toBeTruthy();
  });
});

describe("ConditionBuilder — registration", () => {
  it("is registered under the id condition-builder", () => {
    const [entry] = getGames(["condition-builder"]);
    expect(entry).toBeTruthy();
    expect(entry.id).toBe("condition-builder");
    expect(entry.render({})).toBeTruthy();
  });
});
