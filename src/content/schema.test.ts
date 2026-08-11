import { describe, expect, test } from "vitest";
import { AudioSourceSchema, LessonSchema, SlideSchema } from "./schema";

describe("AudioSourceSchema (three-tier, gap-1)", () => {
  test("accepts qari-clip with url + reciter", () => {
    expect(
      AudioSourceSchema.parse({
        type: "qari-clip",
        url: "https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3",
        reciter: "Husary (Mu'allim)",
      }).type,
    ).toBe("qari-clip");
  });
  test("accepts youtube-cue with videoId + startSeconds + title", () => {
    expect(
      AudioSourceSchema.parse({
        type: "youtube-cue",
        videoId: "VhRHKdPcNPA",
        startSeconds: 1117,
        title: "Muallimi Soniy — letters that make A, I, U",
      }).type,
    ).toBe("youtube-cue");
  });
  test("accepts teacher-voice with a practice cue line", () => {
    expect(
      AudioSourceSchema.parse({
        type: "teacher-voice",
        cue: "ح: mid-throat, breathy, no vibration — as taught live",
      }).type,
    ).toBe("teacher-voice");
  });
  test("rejects an item with no audio tier (no silent audio state)", () => {
    expect(() => AudioSourceSchema.parse({ type: "none" })).toThrow();
  });
});

describe("LessonSchema", () => {
  test("rejects a lesson whose id is not zero-padded phase-number form", () => {
    expect(() =>
      LessonSchema.parse({ id: "lesson one", phase: 1, unit: "1.1", title: "x", objectives: [], slides: [], practice: { drills: [], dailyChecklist: [] }, teacherNotes: { script: [], listenFor: [], homework: "" }, videos: [] }),
    ).toThrow();
  });
});

describe("SlideSchema — drill grid rows", () => {
  const drill = (grid: unknown) => ({ kind: "drill", heading: "h", instructions: "do it", grid });
  const cell = { arabic: "ب", audio: { type: "teacher-voice", cue: "lips" } };

  test("a drill with a real row parses", () => {
    expect(() => SlideSchema.parse(drill([[cell]]))).not.toThrow();
  });

  // An empty inner row renders as a 0-column table rather than failing visibly.
  // The outer .min(1) never caught it because the array itself is non-empty.
  test("rejects an empty row inside an otherwise non-empty grid", () => {
    expect(() => SlideSchema.parse(drill([[]]))).toThrow();
    expect(() => SlideSchema.parse(drill([[cell], []]))).toThrow();
  });
});

describe("SlideSchema — letter-slide additions (forms/examples/image)", () => {
  test("letter slide with forms, form-tagged examples, and image parses", () => {
    const parsed = SlideSchema.parse({
      kind: "letter",
      item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
      makhraj: "the two lips",
      notes: ["one dot below"],
      forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
      examples: [
        { arabic: "بَيْت", translit: "bayt", meaning: "house", form: "initial" },
        { arabic: "جَبَل", translit: "jabal", meaning: "mountain", form: "medial" },
        { arabic: "قَلْب", translit: "qalb", meaning: "heart", form: "final" },
      ],
      image: "/images/makhraj/shafatan.svg",
    });
    expect(parsed.kind).toBe("letter");
    if (parsed.kind === "letter") {
      expect(parsed.forms?.initial).toBe("بـ");
      expect(parsed.examples?.[2]?.form).toBe("final");
      expect(parsed.image).toBe("/images/makhraj/shafatan.svg");
    }
  });

  test("rejects an examples entry with an invalid form tag", () => {
    expect(() =>
      SlideSchema.parse({
        kind: "letter",
        item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
        makhraj: "the two lips",
        notes: [],
        examples: [{ arabic: "بَيْت", translit: "bayt", meaning: "house", form: "middle" }],
      }),
    ).toThrow();
  });

  test("concept slide with image parses", () => {
    const parsed = SlideSchema.parse({
      kind: "concept",
      heading: "Makhraj diagram",
      body: ["the lips meet"],
      image: "/images/makhraj/shafatan.svg",
    });
    expect(parsed.kind).toBe("concept");
    if (parsed.kind === "concept") {
      expect(parsed.image).toBe("/images/makhraj/shafatan.svg");
    }
  });
});

describe("tajweed slide kinds", () => {
  test("accepts a rule slide", () => {
    expect(SlideSchema.safeParse({
      kind: "rule", ruleId: "ikhfa", heading: "Ikhfāʾ Ḥaqīqī",
      condition: "noon sākinah or tanwīn followed by one of 15 letters",
      letters: ["ص", "ذ"], harakat: 2, mnemonic: "صِفْ ذَا ثَنَا",
      body: ["Conceal the noon."],
    }).success).toBe(true);
  });

  test("rejects a rule slide with an unknown ruleId", () => {
    expect(SlideSchema.safeParse({
      kind: "rule", ruleId: "not_a_rule", heading: "x",
      condition: "x", body: ["x"],
    }).success).toBe(false);
  });

  test("accepts an ayah slide", () => {
    expect(SlideSchema.safeParse({
      kind: "ayah", surah: 111, ayah: 1,
      highlight: ["qalqalah"], translation: "May the hands of Abu Lahab perish",
    }).success).toBe(true);
  });

  test("rejects an ayah slide with an out-of-range surah", () => {
    expect(SlideSchema.safeParse({ kind: "ayah", surah: 115, ayah: 1 }).success).toBe(false);
  });

  test("accepts contrast, legend and mistake slides", () => {
    expect(SlideSchema.safeParse({
      kind: "contrast", heading: "Ikhfāʾ vs Iẓhār",
      pairs: [
        { surah: 106, ayah: 4, text: "مِّن جُوعٍ", rule: "ikhfa", note: "ج conceals" },
        { surah: 106, ayah: 4, text: "مِنْ خَوْفٍ", rule: "ikhfa", note: "خ conceals" },
      ],
    }).success).toBe(true);
    expect(SlideSchema.safeParse({ kind: "legend", heading: "Colours", rules: ["ikhfa"] }).success).toBe(true);
    expect(SlideSchema.safeParse({
      kind: "mistake", heading: "Three mistakes with ghunnah",
      mistakes: [{ wrong: "No nasal resonance", why: "nose not engaged", fix: "pinch your nose — the sound must stop" }],
    }).success).toBe(true);
  });
});

describe("lesson fields", () => {
  const base = {
    id: "3-23", phase: 3, unit: "3.4", title: "Ikhfāʾ I",
    objectives: ["Identify ikhfāʾ"],
    slides: Array.from({ length: 8 }, () => ({ kind: "title", heading: "x" })),
    practice: { drills: [], dailyChecklist: ["Read"] },
    teacherNotes: { script: ["x"], listenFor: [{ item: "noon", commonMistake: "izhār default", correctionCue: "hum it" }], homework: "x" },
    videos: [],
  };
  test("accepts prerequisites and stage", () => {
    expect(LessonSchema.safeParse({ ...base, prerequisites: ["3-14", "2-03"], stage: "Noon Sākinah" }).success).toBe(true);
  });
  test("accepts phase 4 for the Kalimas unit", () => {
    expect(LessonSchema.safeParse({ ...base, id: "4-01", phase: 4, unit: "4.1" }).success).toBe(true);
  });
  test("rejects phase 5", () => {
    expect(LessonSchema.safeParse({ ...base, phase: 5 }).success).toBe(false);
  });
  test("still accepts plain-string listenFor from the 15 shipped lessons", () => {
    expect(LessonSchema.safeParse({
      ...base,
      teacherNotes: { script: ["x"], listenFor: ["noon not concealed"], homework: "x" },
    }).success).toBe(true);
  });
});
