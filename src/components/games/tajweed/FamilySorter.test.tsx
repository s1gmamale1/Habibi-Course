import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PALETTE_B, RULE_META, TAJWEED_RULES, type RuleId } from "@/content/tajweed";
import verses106 from "@/generated/verses/106.json";
import { getGames } from "../GameRegistry";
import { FamilySorter, bucketsFor, wordWindow, type SorterItem } from "./FamilySorter";

/**
 * Four fragments over three families, so one bucket holds two cards and the
 * "one item per bucket" shortcut cannot solve the round.
 *
 * Offsets are into the fragment, marks included — 3..7 of "مِّن جُوعٍ" is
 * "ن جُ", the nūn sākin plus the jīm that conceals it.
 */
const ITEMS: SorterItem[] = [
  { id: "ikhfa-1", text: "مِّن جُوعٍ", spanStart: 3, spanEnd: 7, rule: "ikhfa" },
  { id: "ikhfa-2", text: "مِّن سِجِّيلٍ", spanStart: 3, spanEnd: 7, rule: "ikhfa" },
  { id: "idgham-1", text: "لَهَبٍ وَتَبَّ", spanStart: 4, spanEnd: 9, rule: "idghaam_ghunnah" },
  { id: "qalqalah-1", text: "يَجْعَلْ", spanStart: 2, spanEnd: 4, rule: "qalqalah" },
];

const root = () => screen.getByTestId("family-sorter");
const complete = () => root().getAttribute("data-complete");
const card = (id: string) => screen.getByTestId(`fragment-${id}`) as HTMLButtonElement;
const bucket = (id: string) => screen.getByTestId(`bucket-${id}`) as HTMLButtonElement;
const placed = (id: string) =>
  within(screen.getByTestId(`placed-${id}`)).queryAllByRole("button");
const tray = () => within(screen.getByRole("group", { name: "fragments" })).queryAllByRole("button");
const bucketIds = () =>
  [...root().querySelectorAll("[data-bucket]")].map((b) => b.getAttribute("data-bucket"));

/** Select a fragment, then drop it in a bucket. */
async function place(fragment: string, target: string) {
  await userEvent.click(card(fragment));
  await userEvent.click(bucket(target));
}

describe("FamilySorter — layout", () => {
  it("shows one card per fragment and one bucket per family present", () => {
    render(<FamilySorter items={ITEMS} />);

    expect(tray()).toHaveLength(4);
    // Canonical order, filtered to the families actually in play — madd,
    // ghunnah and silent are absent from these fragments, so they get no
    // bucket. Four cards into three buckets: one bucket takes two.
    expect(bucketIds()).toEqual(["idgham", "ikhfa", "qalqalah"]);
  });

  it("names each bucket for a screen reader, not by colour", () => {
    render(<FamilySorter items={ITEMS} />);

    expect(bucket("ikhfa").getAttribute("aria-label")).toMatch(/ikhfāʾ/i);
    expect(bucket("qalqalah").getAttribute("aria-label")).toMatch(/qalqalah/i);
  });

  it("keeps every fragment's marks intact", () => {
    render(<FamilySorter items={ITEMS} />);

    expect(card("qalqalah-1").textContent).toBe("يَجْعَلْ");
    expect(card("qalqalah-1").textContent).toContain("ْ"); // ARABIC SUKUN
  });

  it("marks the span being asked about without painting it in the rule palette", () => {
    // The whole point of the drill is naming the family. `TajweedText` would
    // colour the span by rule and underline it by *family* — which is the
    // answer — so this drill marks the span neutrally instead.
    const { container } = render(<FamilySorter items={ITEMS} />);

    expect(container.querySelector("[data-rule]")).toBeNull();
    const targets = [...container.querySelectorAll("[data-target]")];
    expect(targets).toHaveLength(4);
    for (const t of targets) expect(t.getAttribute("style")).toBeNull();
    expect(container.innerHTML).not.toContain(PALETTE_B.ikhfa);
    expect(container.innerHTML).not.toContain(PALETTE_B.qalqalah);
  });

  it("shows the marked span as the slice the item names", () => {
    render(<FamilySorter items={ITEMS} />);

    expect(card("ikhfa-1").querySelector("[data-target]")!.textContent).toBe("ن جُ");
  });

  it("does not label a card with its own rule", () => {
    // The bucket labels are on screen by necessity — they are the choices. What
    // must never appear is a rule name *on a card*, which would pair a fragment
    // with its family before the learner has answered.
    render(<FamilySorter items={ITEMS} />);

    for (const c of tray()) {
      for (const rule of TAJWEED_RULES) {
        expect(c.textContent).not.toContain(RULE_META[rule].translit);
        expect(c.getAttribute("data-rule")).toBeNull();
      }
    }
  });
});

describe("FamilySorter — assignment", () => {
  it("returns a fragment dropped in the wrong bucket, and shakes it", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "qalqalah");

    expect(placed("qalqalah")).toHaveLength(0);
    expect(tray()).toHaveLength(4); // it came straight back
    expect(card("ikhfa-1").getAttribute("data-state")).toBe("wrong");
    expect(card("ikhfa-1").className).toContain("game-shake");
    expect(card("ikhfa-1").disabled).toBe(false); // still placeable
  });

  it("restarts the shake when the same fragment is dropped wrong twice", async () => {
    // `game-shake` is a CSS animation. Re-applying a class the element already
    // carries does not replay it, so the drill restarts the animation by giving
    // the card a NEW React key — React then unmounts the old node and mounts a
    // fresh one, and the animation runs from frame zero.
    //
    // That only works if the key actually CHANGES on a repeat miss. Keyed on
    // `missed.includes(id)` it did not: `.includes` is a boolean, identical for
    // the first wrong drop and the fifth, so the second miss reused the very
    // same DOM node and the card sat still. Node identity is the assertion
    // because the remount *is* the mechanism.
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "qalqalah");
    const afterFirstMiss = card("ikhfa-1");
    expect(afterFirstMiss.className).toContain("game-shake");

    await place("ikhfa-1", "idgham");
    const afterSecondMiss = card("ikhfa-1");

    expect(afterSecondMiss.className).toContain("game-shake");
    expect(afterSecondMiss).not.toBe(afterFirstMiss);
  });

  it("locks a fragment dropped in the right bucket", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "ikhfa");

    expect(placed("ikhfa").map((b) => b.getAttribute("data-testid"))).toEqual(["fragment-ikhfa-1"]);
    expect(card("ikhfa-1").getAttribute("data-state")).toBe("correct");
    expect(card("ikhfa-1").disabled).toBe(true);
    expect(tray()).toHaveLength(3);
  });

  it("says so in words, not by colour alone", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "ikhfa");

    expect(card("ikhfa-1").getAttribute("aria-label")).toMatch(/correct/i);
    expect(screen.getByRole("status").textContent).toMatch(/ikhfāʾ/i);
  });

  it("names the family a wrong drop is not, without naming the right one", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "qalqalah");

    const live = screen.getByRole("status").textContent ?? "";
    expect(live).toMatch(/qalqalah/i);
    expect(live).not.toMatch(/ikhfāʾ/i);
  });

  it("ignores a bucket tap while no fragment is selected", async () => {
    render(<FamilySorter items={ITEMS} />);

    expect(bucket("ikhfa").disabled).toBe(true);
    await userEvent.click(bucket("ikhfa"));

    expect(placed("ikhfa")).toHaveLength(0);
    expect(complete()).toBe("false");
  });

  it("selects one fragment at a time", async () => {
    render(<FamilySorter items={ITEMS} />);

    await userEvent.click(card("ikhfa-1"));
    expect(card("ikhfa-1").getAttribute("aria-pressed")).toBe("true");

    await userEvent.click(card("qalqalah-1"));
    expect(card("ikhfa-1").getAttribute("aria-pressed")).toBe("false");
    expect(card("qalqalah-1").getAttribute("aria-pressed")).toBe("true");
  });

  it("holds two fragments of one family in the same bucket", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "ikhfa");
    await place("ikhfa-2", "ikhfa");

    expect(placed("ikhfa")).toHaveLength(2);
  });
});

describe("FamilySorter — completing the round", () => {
  it("completes only once every fragment is placed", async () => {
    render(<FamilySorter items={ITEMS} />);
    expect(complete()).toBe("false");

    await place("ikhfa-1", "ikhfa");
    await place("ikhfa-2", "ikhfa");
    await place("idgham-1", "idgham");
    expect(complete()).toBe("false");

    await place("qalqalah-1", "qalqalah");
    expect(complete()).toBe("true");
  });

  it("does not count a wrong drop as progress", async () => {
    render(<FamilySorter items={ITEMS} />);

    const wrong = {
      "ikhfa-1": "idgham",
      "ikhfa-2": "qalqalah",
      "idgham-1": "ikhfa",
      "qalqalah-1": "idgham",
    };
    for (const [id, target] of Object.entries(wrong)) await place(id, target);

    expect(complete()).toBe("false");
    expect(tray()).toHaveLength(4);
  });

  it("reports the first-try score when the round completes", async () => {
    render(<FamilySorter items={ITEMS} />);

    await place("ikhfa-1", "qalqalah"); // one miss
    await place("ikhfa-1", "ikhfa");
    await place("ikhfa-2", "ikhfa");
    await place("idgham-1", "idgham");
    await place("qalqalah-1", "qalqalah");

    expect(screen.getByRole("status").textContent).toMatch(/3 of 4/);
  });
});

describe("FamilySorter — reporting", () => {
  it("reports every attempt with the item's own rule", async () => {
    const onResult = vi.fn();
    render(<FamilySorter items={ITEMS} onResult={onResult} now={() => 7} />);

    await place("ikhfa-1", "qalqalah");
    expect(onResult).toHaveBeenLastCalledWith({
      gameId: "family-sorter",
      ruleId: "ikhfa",
      correct: false,
      at: 7,
    });

    await place("ikhfa-1", "ikhfa");
    expect(onResult).toHaveBeenLastCalledWith({
      gameId: "family-sorter",
      ruleId: "ikhfa",
      correct: true,
      at: 7,
    });
    expect(onResult).toHaveBeenCalledTimes(2);
  });

  it("reports the sub-rule, not the bucket — two ikhfāʾ fragments differ", async () => {
    const onResult = vi.fn();
    const items: SorterItem[] = [
      { id: "a", text: "مِّن جُوعٍ", spanStart: 3, spanEnd: 7, rule: "ikhfa" },
      { id: "b", text: "تَرْمِيهِم بِحِ", spanStart: 9, spanEnd: 13, rule: "ikhfa_shafawi" },
    ];
    render(<FamilySorter items={items} onResult={onResult} />);

    await place("b", "ikhfa");

    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ ruleId: "ikhfa_shafawi", correct: true }),
    );
  });

  it("stops reporting a fragment once it is locked", async () => {
    const onResult = vi.fn();
    render(<FamilySorter items={ITEMS} onResult={onResult} />);

    await place("ikhfa-1", "ikhfa");
    await userEvent.click(card("ikhfa-1"));
    await userEvent.click(bucket("qalqalah"));

    expect(onResult).toHaveBeenCalledTimes(1);
  });
});

describe("FamilySorter — determinism", () => {
  it("orders the cards from the items, not from a random effect", () => {
    const first = render(<FamilySorter items={ITEMS} />);
    const order = tray().map((b) => b.getAttribute("data-testid"));
    first.unmount();

    render(<FamilySorter items={ITEMS} />);

    expect(tray().map((b) => b.getAttribute("data-testid"))).toEqual(order);
  });

  it("does not present the cards in answer order", () => {
    // Given in family order, they must not stay in it — otherwise the round is
    // solvable by dealing the cards top to bottom.
    render(<FamilySorter items={ITEMS} />);

    expect(tray().map((b) => b.getAttribute("data-testid"))).not.toEqual([
      "fragment-ikhfa-1",
      "fragment-ikhfa-2",
      "fragment-idgham-1",
      "fragment-qalqalah-1",
    ]);
  });
});

describe("bucketsFor", () => {
  it("gives every rule in the course exactly one bucket", () => {
    for (const rule of TAJWEED_RULES) {
      const buckets = bucketsFor([{ id: rule, text: "x", spanStart: 0, spanEnd: 1, rule }]);
      expect(buckets).toHaveLength(1);
      expect(buckets[0].id).toBe(RULE_META[rule].family);
    }
  });

  it("honours explicit buckets, including iẓhār, which has no RuleId", async () => {
    // The four noon rules partition the alphabet, but the corpus only marks
    // three of them: iẓhār is the *absence* of a rule, so it carries no span
    // and no RuleId. A hand-authored round can still teach it.
    const onResult = vi.fn();
    const items: SorterItem[] = [
      { id: "n-ikhfa", text: "مِّن جُوعٍ", spanStart: 3, spanEnd: 7, bucket: "ikhfa", rule: "ikhfa" },
      { id: "n-izhar", text: "مِنْ عِلْمٍ", spanStart: 2, spanEnd: 6, bucket: "izhar" },
    ];
    render(
      <FamilySorter
        items={items}
        buckets={[
          { id: "izhar", label: "Iẓhār", ar: "إظهار" },
          { id: "ikhfa", label: "Ikhfāʾ", ar: "إخفاء" },
        ]}
        onResult={onResult}
      />,
    );

    expect(bucketIds()).toEqual(["izhar", "ikhfa"]);
    await place("n-izhar", "izhar");

    expect(card("n-izhar").getAttribute("data-state")).toBe("correct");
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: "family-sorter", correct: true, ruleId: undefined }),
    );
  });
});

describe("wordWindow", () => {
  it("expands a span to whole words and re-bases its offsets", () => {
    const ayah = (verses106 as { ayah: number; text: string; spans: { start: number; end: number; rules: string[] }[] }[])
      .find((v) => v.ayah === 4)!;
    const span = ayah.spans.find((s) => s.rules[0] === "ikhfa")!;

    const w = wordWindow(ayah.text, span.start, span.end);

    expect(w.text).toBe("مِّن جُوعٍ");
    // The re-based offsets still cut out the same letters.
    expect(w.text.slice(w.spanStart, w.spanEnd)).toBe(ayah.text.slice(span.start, span.end));
  });

  it("keeps a span that straddles a word break inside one window", () => {
    const ayah = (verses106 as { ayah: number; text: string; spans: { start: number; end: number; rules: string[] }[] }[])
      .find((v) => v.ayah === 4)!;
    const span = ayah.spans.find((s) => s.rules[0] === "idghaam_ghunnah")!;

    const w = wordWindow(ayah.text, span.start, span.end);

    expect(w.text).toBe("جُوعٍ وَءَامَنَهُم");
    expect(w.text.slice(w.spanStart, w.spanEnd)).toBe("عٍ وَ");
  });
});

describe("FamilySorter — real generated data", () => {
  it("sorts the spans of a real ayah", async () => {
    const ayah = (verses106 as { ayah: number; text: string; spans: { start: number; end: number; rules: string[] }[] }[])
      .find((v) => v.ayah === 4)!;
    const items: SorterItem[] = ayah.spans.map((s, i) => {
      const w = wordWindow(ayah.text, s.start, s.end);
      return { id: `s${i}`, ...w, rule: s.rules[0] as RuleId };
    });
    render(<FamilySorter items={items} />);

    expect(tray()).toHaveLength(ayah.spans.length);
    // 106:4 carries madd, qalqalah, idghām and ikhfāʾ — four of the six families.
    expect(bucketIds()).toEqual(["madd", "idgham", "ikhfa", "qalqalah"]);

    for (const [i, s] of ayah.spans.entries()) {
      await place(`s${i}`, RULE_META[s.rules[0] as RuleId].family);
    }

    expect(complete()).toBe("true");
  });
});

describe("FamilySorter — registration", () => {
  it("is registered under the id family-sorter", () => {
    const [entry] = getGames(["family-sorter"]);
    expect(entry).toBeTruthy();
    expect(entry.id).toBe("family-sorter");
    expect(entry.render({})).toBeTruthy();
  });
});
