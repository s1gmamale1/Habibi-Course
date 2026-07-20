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

describe("SlideSchema — R1 additions (forms/example/image)", () => {
  test("letter slide with forms, example, and image parses", () => {
    const parsed = SlideSchema.parse({
      kind: "letter",
      item: { arabic: "ب", name: "ba", audio: { type: "teacher-voice", cue: "lips" } },
      makhraj: "the two lips",
      notes: ["one dot below"],
      forms: { isolated: "ب", initial: "بـ", medial: "ـبـ", final: "ـب" },
      example: { arabic: "باب", translit: "bāb", meaning: "door" },
      image: "/images/makhraj/shafatan.svg",
    });
    expect(parsed.kind).toBe("letter");
    if (parsed.kind === "letter") {
      expect(parsed.forms?.initial).toBe("بـ");
      expect(parsed.example?.meaning).toBe("door");
      expect(parsed.image).toBe("/images/makhraj/shafatan.svg");
    }
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
