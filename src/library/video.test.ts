import fs from "node:fs";
import path from "node:path";
import { describe, test, expect } from "vitest";
import { catalogueVideos, playlists, lessonVideos, videoTopics, arabic101Sections } from "./video";
import { VAULT_DIR } from "./paths";

const YT_ID = /^[A-Za-z0-9_-]{11}$/;

describe("catalogueVideos", () => {
  test("parses the Muallimi-Soniy table", () => {
    const v = catalogueVideos();
    expect(v.length).toBeGreaterThan(90);
  });

  test("every id is a plausible YouTube id", () => {
    for (const v of catalogueVideos()) expect(v.id, v.title).toMatch(YT_ID);
  });

  test("ids are unique", () => {
    const ids = catalogueVideos().map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every entry carries a title and a topic — the topic is what the page groups by", () => {
    for (const v of catalogueVideos()) {
      expect(v.title.length, v.id).toBeGreaterThan(0);
      expect(v.topic.length, v.id).toBeGreaterThan(0);
    }
  });

  test("the Uzbek original title is preserved verbatim, not translated away", () => {
    // The note states its own policy: Uzbek titles are copied byte-for-byte from the
    // channel payload; the English column is interpretation. Both must survive.
    const withOriginal = catalogueVideos().filter((v) => v.titleOriginal);
    expect(withOriginal.length).toBeGreaterThan(90);
    expect(withOriginal.some((v) => /[А-Яа-яЎўҚқҒғҲҳ]/.test(v.titleOriginal!))).toBe(true);
  });
});

describe("playlists", () => {
  test("parses the Arabic101 playlist table", () => {
    expect(playlists().length).toBeGreaterThanOrEqual(20);
  });

  test("every playlist id looks like a playlist, not a video", () => {
    for (const p of playlists()) expect(p.id, p.title).toMatch(/^PL[A-Za-z0-9_-]{16,}$/);
  });
});

describe("lessonVideos", () => {
  test("resolves the lesson cues to 9 distinct videos", () => {
    expect(lessonVideos()).toHaveLength(9);
  });

  test("each records every lesson that cues it", () => {
    for (const v of lessonVideos()) {
      expect(v.lessonIds.length, v.id).toBeGreaterThan(0);
      for (const id of v.lessonIds) expect(id).toMatch(/^\d-\d{2}$/);
    }
  });

  test("all cues sit in Unit 1 — if this changes, the Video page grouping needs revisiting", () => {
    const units = new Set(lessonVideos().flatMap((v) => v.lessonIds.map((l) => l[0])));
    expect([...units]).toEqual(["1"]);
  });
});

describe("arabic101Sections", () => {
  test("groups the note's individual videos by its own headings", () => {
    expect(arabic101Sections().length).toBeGreaterThanOrEqual(10);
  });

  test("surfaces at least 110 distinct video ids", () => {
    const ids = new Set(arabic101Sections().flatMap((s) => s.videos.map((v) => v.id)));
    expect(ids.size).toBeGreaterThanOrEqual(110);
  });

  test("every id is a plausible YouTube id", () => {
    for (const s of arabic101Sections()) {
      for (const v of s.videos) expect(v.id, `${s.heading}: ${v.title}`).toMatch(YT_ID);
    }
  });

  test("every video has a title and a topic equal to its section heading", () => {
    for (const s of arabic101Sections()) {
      for (const v of s.videos) {
        expect(v.title.length, v.id).toBeGreaterThan(0);
        expect(v.topic).toBe(s.heading);
      }
    }
  });

  test("the coverage that closes the gap: catalogueVideos + lessonVideos + arabic101Sections cover every backticked 11-char id in the vault's Video notes", () => {
    const dir = path.join(VAULT_DIR, "01-Sources", "Video");
    const found = new Set<string>();
    for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      for (const m of raw.matchAll(/`([A-Za-z0-9_-]{11})`/g)) found.add(m[1]);
    }

    const covered = new Set<string>([
      ...catalogueVideos().map((v) => v.id),
      ...lessonVideos().map((v) => v.id),
      ...arabic101Sections().flatMap((s) => s.videos.map((v) => v.id)),
    ]);

    const missing = [...found].filter((id) => !covered.has(id));
    expect(missing).toEqual([]);
  });
});

describe("videoTopics", () => {
  test("returns distinct sorted topics covering every catalogue video", () => {
    const topics = videoTopics();
    expect(topics.length).toBeGreaterThan(1);
    expect(topics).toEqual([...topics].sort());
    const covered = new Set(catalogueVideos().map((v) => v.topic));
    for (const t of covered) expect(topics).toContain(t);
  });
});
