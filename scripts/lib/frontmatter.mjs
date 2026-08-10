import { parse } from "yaml";

const OPEN = /^---\r?\n/;

/**
 * Split a markdown note into its YAML frontmatter and body.
 * @param {string} raw
 * @returns {{data: Record<string, unknown>, body: string}}
 */
export function parseNote(raw) {
  if (!OPEN.test(raw)) throw new Error("missing frontmatter: note must start with ---");
  const rest = raw.replace(OPEN, "");
  const end = rest.search(/^---\r?$/m);
  if (end === -1) throw new Error("unterminated frontmatter: no closing ---");
  const yamlText = rest.slice(0, end);
  const body = rest.slice(end).replace(/^---\r?\n?/, "");
  const data = parse(yamlText) ?? {};
  if (typeof data !== "object" || Array.isArray(data)) {
    throw new Error("frontmatter must be a mapping");
  }
  return { data, body };
}
