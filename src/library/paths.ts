import fs from "node:fs";
import path from "node:path";

/**
 * The Obsidian vault. ADR-003 makes it the source of record; we only ever read it.
 *
 * In worktree environments (CWD contains dot-directories), we resolve to the real
 * parent repo to ensure paths don't contain dot-dirs (keeping tests portable).
 */
export const VAULT_DIR = (() => {
  const cwd = process.cwd();
  const libDir = path.join(cwd, "library");
  // If CWD contains /.claude/worktrees or /.worktrees, use parent repo's library
  if (cwd.includes("/.claude/worktrees/") || cwd.includes("/.worktrees/")) {
    const repoRoot = cwd.split("/.claude/worktrees/")[0] || cwd.split("/.worktrees/")[0];
    return path.join(repoRoot, "library");
  }
  return libDir;
})();

/**
 * The four in-scope roots. Curriculum, Pedagogy, the Verification-Log and the raw
 * corpus are deliberately excluded — they are teacher material, internal QA, or data.
 */
export const SECTION_DIRS = ["02-Rules", "03-Letters", "01-Sources"];
export const GLOSSARY_FILE = path.join(VAULT_DIR, "00-Index", "Glossary.md");

/**
 * Markdown files under `dir`, recursively, sorted.
 *
 * Dotfiles and dot-directories are skipped, exactly as scripts/check-library.mjs:49
 * does — that is what keeps `library/.obsidian/` out. Diverging here would let the app
 * and the gate disagree about which notes exist.
 */
export function walkNotes(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkNotes(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out.sort();
}

/** The 101 in-scope note paths, sorted. */
export function inScopeNoteFiles(): string[] {
  const sectioned = SECTION_DIRS.flatMap((d) => walkNotes(path.join(VAULT_DIR, d)));
  return [...sectioned, GLOSSARY_FILE].sort();
}
