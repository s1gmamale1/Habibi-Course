import { describe, it, expect } from "vitest";
import { parseNote } from "../../scripts/lib/frontmatter.mjs";

describe("parseNote", () => {
  it("splits frontmatter from body", () => {
    const raw = "---\ntype: rule\nid: iqlab\n---\n\n# Iqlab\n\nBody text.\n";
    const { data, body } = parseNote(raw);
    expect(data).toEqual({ type: "rule", id: "iqlab" });
    expect(body.trim()).toBe("# Iqlab\n\nBody text.".trim());
  });

  it("parses nested lists and objects", () => {
    const raw = "---\nletters: [ب, ت]\nexamples:\n  - ref: '106:4'\n    text: 'مِّن'\n---\nx\n";
    const { data } = parseNote(raw);
    expect(data.letters).toEqual(["ب", "ت"]);
    expect(data.examples[0]).toEqual({ ref: "106:4", text: "مِّن" });
  });

  it("throws when frontmatter is missing", () => {
    expect(() => parseNote("# No frontmatter\n")).toThrow(/missing frontmatter/i);
  });

  it("throws when frontmatter is unterminated", () => {
    expect(() => parseNote("---\ntype: rule\n")).toThrow(/unterminated/i);
  });
});
