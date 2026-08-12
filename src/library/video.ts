import fs from "node:fs";
import path from "node:path";
import { VAULT_DIR } from "./paths";
import { allLessons } from "@/content/load";

export interface CatalogueVideo {
  id: string;
  title: string;
  titleOriginal?: string;
  duration?: string;
  topic: string;
  channel: string;
}

export interface Playlist {
  id: string;
  title: string;
  videoCount?: number;
  channel: string;
}

export interface LessonVideo {
  id: string;
  title: string;
  startSeconds: number;
  lessonIds: string[];
}

export interface ChannelSection {
  heading: string;
  videos: CatalogueVideo[];
}

const VIDEO_DIR = path.join(VAULT_DIR, "01-Sources", "Video");

/** Split one markdown table row into trimmed cells, honouring escaped pipes. */
function cells(row: string): string[] {
  return row
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.replace(/\\\|/g, "|").trim());
}

/** Strip the backticks the vault wraps ids in. */
const bare = (s: string) => s.replace(/^`|`$/g, "").trim();

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const PL_ID = /^PL[A-Za-z0-9_-]{16,}$/;
const DURATION = /^\d{1,2}:\d{2}$/;
/** An id cell that is actually backticked, not merely 11 alphanumeric characters — a
 * plain-text cell like "Subscribers" or "Netherlands" is 11 characters too. */
const BACKTICKED_ID = /^`[A-Za-z0-9_-]{11}`$/;

function readNote(file: string): string {
  const raw = fs.readFileSync(path.join(VIDEO_DIR, file), "utf8");
  const rest = raw.replace(/^---\r?\n/, "");
  const end = rest.search(/^---\r?$/m);
  return end === -1 ? rest : rest.slice(end).replace(/^---\r?\n?/, "");
}

/**
 * Videos catalogued in the vault's channel notes.
 *
 * Muallimi-Soniy's table is `# | Uzbek title | English | \`videoId\` | duration | topic`.
 * THE ID IS WRAPPED IN BACKTICKS — a naive `| id |` match finds almost none of them.
 * Rows are identified by having an id-shaped cell rather than by column position, so a
 * column being added upstream does not silently empty this list.
 *
 * The Uzbek title is kept as authored: the note records that Uzbek titles are copied
 * byte-for-byte from the channel payload while the English column is interpretation.
 * Showing only the translation would quietly assert the channel said something it did not.
 */
export function catalogueVideos(): CatalogueVideo[] {
  const out: CatalogueVideo[] = [];
  const body = readNote("Muallimi-Soniy.md");
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    const idIndex = c.findIndex((x) => YT_ID.test(bare(x)));
    if (idIndex === -1) continue;
    out.push({
      id: bare(c[idIndex]),
      title: c[idIndex - 1] || c[idIndex - 2] || bare(c[idIndex]),
      titleOriginal: c[idIndex - 2] || undefined,
      duration: c[idIndex + 1] || undefined,
      topic: c[idIndex + 2] || "Uncategorised",
      channel: "Muallimi Soniy",
    });
  }
  return out;
}

/** Playlists catalogued in Arabic101 — that note lists playlists, not individual videos. */
export function playlists(): Playlist[] {
  const out: Playlist[] = [];
  const body = readNote("Arabic101.md");
  for (const line of body.split("\n")) {
    if (!line.startsWith("|")) continue;
    const c = cells(line);
    const idIndex = c.findIndex((x) => PL_ID.test(bare(x)));
    if (idIndex === -1) continue;
    const count = Number(c[idIndex + 1]);
    out.push({
      id: bare(c[idIndex]),
      title: c[idIndex - 1] || bare(c[idIndex]),
      videoCount: Number.isFinite(count) ? count : undefined,
      channel: "Arabic101",
    });
  }
  return out;
}

/**
 * Arabic101's individual videos, grouped by the note's own `#`/`##` section
 * headings. That grouping is authored structure — Stage One, the Advanced
 * Tajweed table, the other sequenced playlists — not something invented here.
 *
 * Three table shapes carry per-video rows: the 30-day program's
 * `Day | Video ID | Session | Topic`, the sequenced playlists'
 * `# | Video ID | Dur | Title`, and the Advanced Tajweed table's five-column
 * variant that appends a Topic column after Title. Rows are found by an
 * id-shaped backticked cell, never by column position, and the LAST cell of
 * the row is always taken as the description — that generalises correctly
 * across all three shapes instead of hard-coding an index per shape.
 *
 * The same video id can legitimately appear in more than one section (a
 * video can be both a day in the 30-day program and an entry in a playlist),
 * so ids are NOT deduped across sections — the grouping is the point.
 * Duplicate rows for the same id within one section are folded to one.
 */
export function arabic101Sections(): ChannelSection[] {
  const sections: ChannelSection[] = [];
  let heading: string | null = null;
  let current: Map<string, CatalogueVideo> | null = null;

  const flush = () => {
    if (heading && current && current.size > 0) {
      sections.push({ heading, videos: [...current.values()] });
    }
  };

  const body = readNote("Arabic101.md");
  for (const line of body.split("\n")) {
    const headingMatch = line.match(/^#{1,2}\s+(.+?)\s*$/);
    if (headingMatch) {
      flush();
      heading = headingMatch[1];
      current = new Map();
      continue;
    }
    if (!line.startsWith("|") || !current || !heading) continue;
    const c = cells(line);
    const idIndex = c.findIndex((x) => BACKTICKED_ID.test(x));
    if (idIndex === -1) continue;
    const id = bare(c[idIndex]);
    const duration = c.find((x, i) => i !== idIndex && DURATION.test(x));
    current.set(id, {
      id,
      title: c[c.length - 1] || id,
      duration,
      topic: heading,
      channel: "Arabic101",
    });
  }
  flush();
  return sections;
}

/** The videos lessons actually cue, folded to one entry per distinct video. */
export function lessonVideos(): LessonVideo[] {
  const byId = new Map<string, LessonVideo>();
  for (const lesson of allLessons()) {
    for (const slide of lesson.slides) {
      for (const item of collectAudio(slide)) {
        if (item.type !== "youtube-cue") continue;
        const existing = byId.get(item.videoId);
        if (existing) {
          if (!existing.lessonIds.includes(lesson.id)) existing.lessonIds.push(lesson.id);
        } else {
          byId.set(item.videoId, {
            id: item.videoId,
            title: item.title,
            startSeconds: item.startSeconds,
            lessonIds: [lesson.id],
          });
        }
      }
    }
  }
  return [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
}

/** Every `audio` object reachable from a slide, whatever its shape. */
function collectAudio(node: unknown): { type: string; videoId: string; startSeconds: number; title: string }[] {
  const found: { type: string; videoId: string; startSeconds: number; title: string }[] = [];
  const walk = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(walk);
    if (!v || typeof v !== "object") return;
    const o = v as Record<string, unknown>;
    if (o.type === "youtube-cue" && typeof o.videoId === "string") {
      found.push({
        type: "youtube-cue",
        videoId: o.videoId,
        startSeconds: typeof o.startSeconds === "number" ? o.startSeconds : 0,
        title: typeof o.title === "string" ? o.title : o.videoId,
      });
    }
    Object.values(o).forEach(walk);
  };
  walk(node);
  return found;
}

export function videoTopics(): string[] {
  return [...new Set(catalogueVideos().map((v) => v.topic))].sort();
}
