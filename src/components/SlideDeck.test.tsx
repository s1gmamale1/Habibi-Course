import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { SlideDeck } from "./SlideDeck";
import type { Slide } from "@/content/schema";
import surah111 from "@/generated/verses/111.json";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

const title = "T";
const masad1 = surah111.find((v) => v.ayah === 1)!;
const slides: Slide[] = [
  { kind: "title", heading: "First slide" },
  { kind: "concept", heading: "Second slide", body: ["point one"] },
  {
    kind: "letter",
    item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
    makhraj: "the two lips",
    notes: ["one dot below"],
    forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
    examples: [{ arabic: "باب", translit: "bāb", meaning: "door", form: "initial" as const }],
    image: "/images/makhraj/shafatan.svg",
  },
  { kind: "concept", heading: "s4", body: ["b"] }, { kind: "concept", heading: "s5", body: ["b"] },
  { kind: "concept", heading: "s6", body: ["b"] }, { kind: "concept", heading: "s7", body: ["b"] },
  { kind: "homework", heading: "Homework", tasks: ["do drills"] },
];

describe("SlideDeck", () => {
  test("shows first slide and advances with ArrowRight", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    expect(screen.getByText("First slide")).toBeTruthy();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByText("Second slide")).toBeTruthy();
    expect(screen.getByText("T — 2 / 8")).toBeTruthy();
  });
  test("letter slide renders makhraj and a TapToHear button", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText(/the two lips/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /ب/ })).toBeTruthy();
  });
  test("letter slide renders makhraj image, positional forms, and example word", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    const img = screen.getByRole("img");
    expect(img.getAttribute("alt")).toMatch(/makhraj/i);
    expect(screen.getByText("Alone")).toBeTruthy();
    expect(screen.getByText("Start")).toBeTruthy();
    expect(screen.getByText("Middle")).toBeTruthy();
    expect(screen.getByText("End")).toBeTruthy();
    expect(screen.getByText(/bāb\s*—\s*door/)).toBeTruthy();
  });
  test("letter slide with an examples array renders each word with its form label", async () => {
    const withExamples: Slide[] = slides.map((s) =>
      s.kind === "letter"
        ? {
            ...s,
            examples: [
              { arabic: "بَاب", translit: "bāb", meaning: "door", form: "initial" as const },
              { arabic: "كِتَاب", translit: "kitāb", meaning: "book", form: "medial" as const },
              { arabic: "قَلْب", translit: "qalb", meaning: "heart", form: "final" as const },
            ],
          }
        : s,
    );
    render(<SlideDeck title={title} slides={withExamples} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getByText(/See it inside real words/i)).toBeTruthy();
    expect(screen.getByText(/bāb\s*—\s*door/)).toBeTruthy();
    expect(screen.getByText(/kitāb\s*—\s*book/)).toBeTruthy();
    expect(screen.getByText(/qalb\s*—\s*heart/)).toBeTruthy();
    expect(screen.getByText(/Start position/)).toBeTruthy();
    expect(screen.getByText(/Middle position/)).toBeTruthy();
    expect(screen.getByText(/End position/)).toBeTruthy();
  });
  test("letter slide does not duplicate the item name (TapToHear caption suppressed via showName)", async () => {
    render(<SlideDeck title={title} slides={slides} />);
    await userEvent.keyboard("{ArrowRight}{ArrowRight}");
    expect(screen.getAllByText("ba")).toHaveLength(1);
  });
});

describe("SlideDeck tajweed slide kinds", () => {
  test("renders a rule slide with its condition and letters", () => {
    const slide: Slide = {
      kind: "rule",
      ruleId: "ikhfa",
      heading: "Ikhfāʾ Ḥaqīqī",
      condition: "nūn sākinah or tanwīn followed by one of 15 letters",
      letters: ["ص", "ذ"],
      harakat: 2,
      mnemonic: "صِفْ ذَا ثَنَا",
      body: ["Conceal the nūn — do not say it fully, do not merge it away."],
    };
    render(<SlideDeck title={title} slides={[slide]} />);
    expect(screen.getByText("Ikhfāʾ Ḥaqīqī")).toBeTruthy();
    expect(screen.getByText(/one of 15 letters/)).toBeTruthy();
    expect(screen.getByText("ص")).toBeTruthy();
    expect(screen.getByText("ذ")).toBeTruthy();
    expect(screen.getByText(/2 ḥarakāt/)).toBeTruthy();
    expect(screen.getByText("صِفْ ذَا ثَنَا")).toBeTruthy();
    expect(screen.getByText(/Conceal the nūn/)).toBeTruthy();
  });

  test("renders an ayah slide as coloured tajweed text", () => {
    const slide: Slide = {
      kind: "ayah",
      surah: 111,
      ayah: 1,
      translation: "May the hands of Abū Lahab perish",
    };
    const { container } = render(<SlideDeck title={title} slides={[slide]} />);
    // al-Masad 111:1 is real generated data: three spans — madd munfaṣil,
    // idghām bi-ghunnah, qalqalah.
    expect(screen.getByText(/111\s*:\s*1/)).toBeTruthy();
    expect(container.textContent).toContain(masad1.text);
    expect(container.textContent).toContain("لَهَبٍ");
    const painted = container.querySelector(".tajweed-text")!.querySelectorAll("[data-rule]");
    expect(painted).toHaveLength(3);
    expect(screen.getByText(/May the hands of Abū Lahab perish/)).toBeTruthy();
  });

  test("renders an ayah slide without generated spans as plain text, not a crash", () => {
    // Surah 2 is outside the imported hifz set — the slide must still render.
    const slide: Slide = { kind: "ayah", surah: 2, ayah: 97, translation: "…" };
    const { container } = render(<SlideDeck title={title} slides={[slide]} />);
    expect(screen.getByText(/2\s*:\s*97/)).toBeTruthy();
    expect(container.querySelectorAll("[data-rule]")).toHaveLength(0);
  });

  test("renders a contrast slide with both members of the pair", () => {
    const slide: Slide = {
      kind: "contrast",
      heading: "Ikhfāʾ vs Idghām",
      pairs: [
        { surah: 106, ayah: 4, text: "مِّن جُوعٍ", rule: "ikhfa", note: "the jīm conceals the nūn" },
        { surah: 2, ayah: 5, text: "مَن يَقُولُ", rule: "idghaam_ghunnah", note: "the yāʾ swallows the nūn" },
      ],
    };
    render(<SlideDeck title={title} slides={[slide]} />);
    expect(screen.getByText("Ikhfāʾ vs Idghām")).toBeTruthy();
    expect(screen.getByText("مِّن جُوعٍ")).toBeTruthy();
    expect(screen.getByText("مَن يَقُولُ")).toBeTruthy();
    expect(screen.getByText(/the jīm conceals the nūn/)).toBeTruthy();
    expect(screen.getByText(/the yāʾ swallows the nūn/)).toBeTruthy();
    expect(screen.getByText("Ikhfāʾ")).toBeTruthy();
    expect(screen.getByText("Idghām bi-Ghunnah")).toBeTruthy();
    expect(screen.getByText(/106\s*:\s*4/)).toBeTruthy();
  });

  test("renders a legend slide listing the rules", () => {
    const slide: Slide = { kind: "legend", heading: "What the colours mean", rules: ["ikhfa", "qalqalah"] };
    const { container } = render(<SlideDeck title={title} slides={[slide]} />);
    expect(screen.getByText("What the colours mean")).toBeTruthy();
    expect(screen.getByText("Ikhfāʾ")).toBeTruthy();
    expect(screen.getByText("Qalqalah")).toBeTruthy();
    expect(container.querySelectorAll(".rule-legend [data-rule]")).toHaveLength(2);
  });

  test("renders a mistake slide with wrong/why/fix", () => {
    const slide: Slide = {
      kind: "mistake",
      heading: "Three mistakes with ghunnah",
      mistakes: [
        { wrong: "No nasal resonance", why: "the nose is not engaged", fix: "pinch your nose — the sound must stop" },
      ],
    };
    render(<SlideDeck title={title} slides={[slide]} />);
    expect(screen.getByText("Three mistakes with ghunnah")).toBeTruthy();
    expect(screen.getByText(/No nasal resonance/)).toBeTruthy();
    expect(screen.getByText(/the nose is not engaged/)).toBeTruthy();
    expect(screen.getByText(/pinch your nose/)).toBeTruthy();
  });
});

describe("SlideDeck videos anchor (footer affordance for below-the-fold video section)", () => {
  test("shows a Videos link to #lesson-videos when videosAnchor is true", () => {
    render(<SlideDeck title={title} slides={slides} videosAnchor />);
    const link = screen.getByRole("link", { name: /videos/i });
    expect(link.getAttribute("href")).toBe("#lesson-videos");
  });
  test("omits the Videos link when videosAnchor is false or unset", () => {
    render(<SlideDeck title={title} slides={slides} />);
    expect(screen.queryByRole("link", { name: /videos/i })).toBeNull();
  });
});
