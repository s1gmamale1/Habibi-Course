import { describe, expect, test } from "vitest";
import { AudioSourceSchema, LessonSchema } from "./schema";

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
