import fs from "node:fs";
import path from "node:path";
import { parseNote } from "./frontmatter";

const POSTS_DIR = path.join(process.cwd(), "materials");
const FILES_DIR = path.join(process.cwd(), "public", "materials");

export interface Post {
  slug: string;
  title: string;
  date?: string;
  summary?: string;
  body: string;
  file: string;
}

export interface Attachment {
  slug: string;
  title: string;
  href: string;
  bytes: number;
}

/** `README.md` documents the folder for a teacher; it is not content. */
const SKIP = new Set(["readme"]);

function listMarkdown(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md") && !f.startsWith("."))
    .sort();
}

function loadPost(file: string): Post {
  const full = path.join(POSTS_DIR, file);
  try {
    const raw = fs.readFileSync(full, "utf8");
    // Frontmatter is OPTIONAL here, unlike the vault: a teacher writing a post should
    // not have to remember a YAML header. Fall back to the whole file as the body.
    const { data, body } = raw.startsWith("---")
      ? parseNote(raw)
      : { data: {} as Record<string, unknown>, body: raw };
    const heading = /^#\s+(.+)$/m.exec(body);
    const slug = path.basename(file, ".md").toLowerCase();
    return {
      slug,
      title: heading ? heading[1].trim() : slug.replace(/[-_]/g, " "),
      date: typeof data.date === "string" ? data.date : undefined,
      summary: typeof data.summary === "string" ? data.summary : undefined,
      body,
      file: full,
    };
  } catch (err) {
    throw new Error(`Invalid material ${full}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

let cache: Post[] | null = null;

export function allPosts(): Post[] {
  if (!cache) {
    cache = listMarkdown(POSTS_DIR)
      .map(loadPost)
      .filter((p) => !SKIP.has(p.slug))
      .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.slug.localeCompare(b.slug));
  }
  return cache;
}

export function allPostSlugs(): string[] {
  return allPosts().map((p) => p.slug);
}

export function postBySlug(slug: string): Post {
  const found = allPosts().find((p) => p.slug === slug);
  if (!found) throw new Error(`unknown material: ${slug}`);
  return found;
}

/**
 * Downloadable files. These live in `public/materials/` because a static export can
 * only serve binary assets from `public/` — the path is a constraint, not a choice.
 */
export function allAttachments(): Attachment[] {
  if (!fs.existsSync(FILES_DIR)) return [];
  return fs
    .readdirSync(FILES_DIR)
    .filter((f) => !f.startsWith("."))
    .sort()
    .map((f) => ({
      slug: f.toLowerCase(),
      title: path.basename(f, path.extname(f)).replace(/[-_]/g, " "),
      href: `/materials/${f}`,
      bytes: fs.statSync(path.join(FILES_DIR, f)).size,
    }));
}
