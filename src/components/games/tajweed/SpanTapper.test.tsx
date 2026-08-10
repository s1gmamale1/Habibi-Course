import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import surah112 from "@/generated/verses/112.json";
import { getGames } from "../GameRegistry";
import { SpanTapper } from "./SpanTapper";

/** The tappable letters, in reading order. Spaces are not tappable. */
const letters = () =>
  within(screen.getByRole("group", { name: "letters" })).getAllByRole("button");

const stateOf = (el: HTMLElement) => el.getAttribute("data-state");
const complete = () => screen.getByTestId("span-tapper").getAttribute("data-complete");
const submit = () => screen.getByRole("button", { name: /check/i }) as HTMLButtonElement;

// يَجْعَلْ — the ج carries sukūn, so it qalqalates. The final ل carries sukūn
// too but is not a qalqalah letter; the ي and ع are voweled.
const YAJAL = "يَجْعَلْ";
// جَعَلَ — the same ج, this time with a fatḥa. Identical glyph, wrong answer.
const JAALA = "جَعَلَ";
// لَمْ يَلِدْ وَلَمْ يُولَدْ — two sukūn-bearing dāls, one meaningful decoy per
// word (the مْ carries sukūn but is not a qalqalah letter).
const AYAH_3 = "لَمْ يَلِدْ وَلَمْ يُولَدْ";

describe("SpanTapper — qalqalah", () => {
  it("accepts a qalqalah letter that carries sukun", async () => {
    render(<SpanTapper text={YAJAL} criterion="qalqalah" />);

    await userEvent.click(screen.getByRole("button", { name: /جْ/ }));

    expect(stateOf(screen.getByRole("button", { name: /جْ/ }))).toBe("correct");
  });

  it("rejects a qalqalah letter with no sukun", async () => {
    // The identity of the letter is the same as above. Only the mark differs,
    // which is exactly what a glyph-identity match (SpotTheLetter's) gets wrong.
    render(<SpanTapper text={JAALA} criterion="qalqalah" />);

    await userEvent.click(screen.getByRole("button", { name: /جَ/ }));

    expect(stateOf(screen.getByRole("button", { name: /جَ/ }))).toBe("wrong");
  });

  it("requires ALL matching letters before the round completes", async () => {
    render(<SpanTapper text={AYAH_3} criterion="qalqalah" />);
    const dals = letters().filter((b) => b.textContent === "دْ");
    expect(dals).toHaveLength(2);

    expect(complete()).toBe("false");
    await userEvent.click(dals[0]);
    expect(complete()).toBe("false");
    await userEvent.click(dals[1]);
    expect(complete()).toBe("true");
  });

  it("marks a wrong tap without ending the round", async () => {
    render(<SpanTapper text={YAJAL} criterion="qalqalah" />);
    const [ya, jeem] = letters();

    await userEvent.click(ya);
    expect(stateOf(letters()[0])).toBe("wrong");
    expect(complete()).toBe("false");
    // The round is still live: the real target is still tappable afterwards.
    expect(submit().disabled).toBe(false);

    await userEvent.click(jeem);
    expect(stateOf(letters()[1])).toBe("correct");
    expect(complete()).toBe("true");
  });

  it("leaves untapped letters idle", () => {
    render(<SpanTapper text={YAJAL} criterion="qalqalah" />);

    expect(letters().map(stateOf)).toEqual(["idle", "idle", "idle", "idle"]);
  });

  it("reports via onResult on submit", async () => {
    const onResult = vi.fn();
    render(<SpanTapper text={YAJAL} criterion="qalqalah" onResult={onResult} />);

    // Nothing is reported until the learner submits — the prompt is "tap all",
    // so the drill must not score a partial answer on the learner's behalf.
    await userEvent.click(letters()[1]);
    expect(onResult).not.toHaveBeenCalled();

    await userEvent.click(submit());
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult).toHaveBeenCalledWith(
      expect.objectContaining({ gameId: "span-tapper", ruleId: "qalqalah", correct: true }),
    );
    expect(typeof onResult.mock.calls[0][0].at).toBe("number");
  });

  it("reports correct:false when a target was missed", async () => {
    const onResult = vi.fn();
    render(<SpanTapper text={AYAH_3} criterion="qalqalah" onResult={onResult} />);

    await userEvent.click(letters().filter((b) => b.textContent === "دْ")[0]);
    await userEvent.click(submit());

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it("reports correct:false when a wrong letter was tapped", async () => {
    const onResult = vi.fn();
    render(<SpanTapper text={YAJAL} criterion="qalqalah" onResult={onResult} />);

    await userEvent.click(letters()[0]); // ي — wrong
    await userEvent.click(letters()[1]); // جْ — right, so every target is found
    expect(complete()).toBe("true");
    await userEvent.click(submit());

    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ correct: false }));
  });

  it("does not reveal how many letters qualify until the learner submits", async () => {
    render(<SpanTapper text={AYAH_3} criterion="qalqalah" />);
    expect(screen.queryByRole("status")).toBeNull();

    await userEvent.click(submit());
    expect(screen.getByRole("status").textContent).toMatch(/0 of 2/);
  });

  it("scores once and then locks the round", async () => {
    const onResult = vi.fn();
    render(<SpanTapper text={YAJAL} criterion="qalqalah" onResult={onResult} />);

    await userEvent.click(submit());

    expect(onResult).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: /check/i })).toBeNull();
    // Letters stop responding, so a graded round cannot be edited afterwards.
    expect(letters().every((b) => (b as HTMLButtonElement).disabled)).toBe(true);
    await userEvent.click(letters()[1]);
    expect(letters().map(stateOf)).toEqual(["idle", "idle", "idle", "idle"]);
  });

  it("outlines the letters that were missed, once the round is graded", async () => {
    render(<SpanTapper text={YAJAL} criterion="qalqalah" />);

    await userEvent.click(submit());

    expect(letters().map((b) => b.getAttribute("data-missed"))).toEqual([
      null,
      "true", // the جْ the learner never tapped
      null,
      null,
    ]);
  });
});

describe("SpanTapper — istila", () => {
  it("matches heavy letters regardless of their vowel", async () => {
    // خَلَقَ — خ and ق are istiʿlāʾ, both voweled. Unlike qalqalah no sukūn is
    // required, which is why a criterion is a predicate and not a letter set.
    render(<SpanTapper text="خَلَقَ" criterion="istila" />);
    const [kha, lam, qaf] = letters();

    await userEvent.click(kha);
    await userEvent.click(lam);
    await userEvent.click(qaf);

    expect(letters().map(stateOf)).toEqual(["correct", "wrong", "correct"]);
  });

  it("reports without a ruleId, since istiʿlāʾ is a ṣifah and not a tajweed rule", async () => {
    const onResult = vi.fn();
    render(<SpanTapper text="خَلَقَ" criterion="istila" onResult={onResult} />);

    await userEvent.click(submit());

    expect(onResult.mock.calls[0][0].ruleId).toBeUndefined();
  });
});

describe("SpanTapper — text integrity", () => {
  it("never strips diacritics from the rendered text", () => {
    render(<SpanTapper text={YAJAL} criterion="qalqalah" />);
    const group = screen.getByRole("group", { name: "letters" });

    expect(group.textContent).toContain("ْ"); // ARABIC SUKUN
    expect(group.textContent).toBe(YAJAL); // exact round-trip, marks and all
  });

  it("keeps spaces as text rather than turning them into tappable letters", () => {
    const text = "لَمْ يَلِدْ";
    render(<SpanTapper text={text} criterion="qalqalah" />);

    expect(letters().map((b) => b.textContent).join("")).toBe(text.replace(/ /g, ""));
    expect(screen.getByRole("group", { name: "letters" }).textContent).toBe(text);
  });
});

describe("SpanTapper — real generated data", () => {
  const ayah = surah112.find((v) => v.ayah === 3)!;

  it("renders real generated data", () => {
    render(<SpanTapper text={ayah.text} criterion="qalqalah" />);

    expect(screen.getByRole("group", { name: "letters" }).textContent).toBe(ayah.text);
    expect(letters()).toHaveLength(12);
  });

  it("agrees with the corpus qalqalah spans for that ayah", async () => {
    // The generated spans are the independent authority here: two qalqalah
    // spans, both "دْ". (Ayah-final qalqalah on stopping — قلقلة كبرى, as in
    // أَحَدٌ — is not modelled by this criterion, so ayah 3 is used, where the
    // corpus and the sukūn rule agree exactly.)
    const spans = ayah.spans.filter((s) => s.rules.includes("qalqalah"));
    expect(spans.map((s) => ayah.text.slice(s.start, s.end))).toEqual(["دْ", "دْ"]);

    render(<SpanTapper text={ayah.text} criterion="qalqalah" />);
    for (const b of letters().filter((b) => b.textContent === "دْ")) await userEvent.click(b);

    expect(complete()).toBe("true");
    expect(letters().filter((b) => stateOf(b) === "correct")).toHaveLength(spans.length);
  });
});

describe("SpanTapper — registration", () => {
  it("is registered under the id span-tapper", () => {
    expect(getGames(["span-tapper"]).map((g) => g.id)).toEqual(["span-tapper"]);
  });
});
