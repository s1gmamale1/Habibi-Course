import { describe, it, expect, beforeAll } from "vitest";
import { mkdtempSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { checkVault } from "../../scripts/check-library.mjs";
import { loadCorpus } from "../../scripts/lib/corpus.mjs";

let corpus, dir;

function note(rel, content) {
  const p = join(dir, rel);
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content, "utf8");
}

beforeAll(() => {
  corpus = loadCorpus();
  dir = mkdtempSync(join(tmpdir(), "vault-"));
  note("02-Rules/Iqlab.md", [
    "---", "type: rule", "id: iqlab", "arabic: الإقلاب", "translit: Iqlab",
    "english: Conversion", "family: noon-sakinah", "cpfair_key: iqlab",
    "status: verified", "sources: ['[[Tuhfat-al-Atfal]]']", "---",
    "See [[Ghunnah]].",
  ].join("\n"));
  note("02-Rules/Ghunnah.md", [
    "---", "type: rule", "id: ghunnah", "arabic: الغنة", "translit: Ghunnah",
    "english: Nasalisation", "family: ghunnah", "status: verified", "---", "x",
  ].join("\n"));
  note("01-Sources/Classical/Tuhfat-al-Atfal.md", [
    "---", "type: source", "id: tuhfat", "status: verified", "---", "x",
  ].join("\n"));
});

describe("checkVault", () => {
  it("passes a well-formed vault", () => {
    const { errors } = checkVault(dir, corpus);
    expect(errors).toEqual([]);
  });

  it("rejects an unknown cpfair_key", () => {
    note("02-Rules/Bad.md", [
      "---", "type: rule", "id: bad", "arabic: x", "translit: x", "english: x",
      "family: noon-sakinah", "cpfair_key: not_a_real_key", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/not_a_real_key/);
  });

  it("rejects an unpadded taught_in id", () => {
    note("02-Rules/Unpadded.md", [
      "---", "type: rule", "id: unpadded", "arabic: x", "translit: x", "english: x",
      "family: madd", 'taught_in: "3-6"', "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/taught_in "3-6" must be zero-padded/);
  });

  it("accepts a correctly padded taught_in id", () => {
    note("02-Rules/Padded.md", [
      "---", "type: rule", "id: padded", "arabic: x", "translit: x", "english: x",
      "family: madd", 'taught_in: "3-06"', "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).not.toMatch(/Padded\.md.*taught_in/);
  });

  it("rejects a rule whose prerequisite rule has no note", () => {
    note("02-Rules/Orphan.md", [
      "---", "type: rule", "id: orphan", "arabic: x", "translit: x", "english: x",
      "family: madd", "prerequisites: [no_such_rule]", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/prerequisite rule "no_such_rule" has no note/);
  });

  it("accepts a rule prerequisite that resolves", () => {
    // 'ghunnah' is defined by 02-Rules/Ghunnah.md in this fixture vault
    note("02-Rules/Dependent.md", [
      "---", "type: rule", "id: dependent", "arabic: x", "translit: x", "english: x",
      "family: madd", "prerequisites: [ghunnah]", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).not.toMatch(/Dependent\.md/);
  });

  it("does not apply lesson-id format to rule prerequisites", () => {
    // rule prerequisites are RULE ids, not lesson ids — this must not error
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).not.toMatch(/prerequisite "ghunnah" must be a zero-padded/);
  });

  it("rejects a lesson teaching a rule id that has no note", () => {
    note("04-Curriculum/L-ghost.md", [
      "---", "type: lesson", 'id: "3-01"', "title: Ghost",
      "teaches: [no_such_rule]", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/teaches "no_such_rule" but no rule note/);
  });

  it("rejects a rule whose taught_in disagrees with the lesson teaching it", () => {
    note("02-Rules/Drifted.md", [
      "---", "type: rule", "id: drifted", "arabic: x", "translit: x", "english: x",
      "family: madd", 'taught_in: "3-99"', "status: draft", "---", "x",
    ].join("\n"));
    note("04-Curriculum/L-drifted.md", [
      "---", "type: lesson", 'id: "3-05"', "title: Drifted lesson",
      "teaches: [drifted]", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/taught_in "3-99" but lesson 3-05 teaches it/);
  });

  it("accepts a rule whose taught_in agrees with its lesson", () => {
    note("02-Rules/Aligned.md", [
      "---", "type: rule", "id: aligned", "arabic: x", "translit: x", "english: x",
      "family: madd", 'taught_in: "3-07"', "status: draft", "---", "x",
    ].join("\n"));
    note("04-Curriculum/L-aligned.md", [
      "---", "type: lesson", 'id: "3-07"', "title: Aligned lesson",
      "teaches: [aligned]", "status: draft", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).not.toMatch(/Aligned\.md: taught_in/);
  });

  it("rejects an unresolvable wikilink", () => {
    note("02-Rules/Dangling.md", [
      "---", "type: rule", "id: dangling", "arabic: x", "translit: x", "english: x",
      "family: madd", "status: draft", "---", "See [[No-Such-Note]].",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/No-Such-Note/);
  });

  it("rejects a fabricated Quranic example", () => {
    note("02-Rules/Fake.md", [
      "---", "type: rule", "id: fake", "arabic: x", "translit: x", "english: x",
      "family: madd", "status: draft",
      "examples:", "  - ref: '106:4'", "    text: 'قُلْ هُوَ ٱللَّهُ أَحَدٌ'", "---", "x",
    ].join("\n"));
    const { errors } = checkVault(dir, corpus);
    expect(errors.join("\n")).toMatch(/not found in 106:4/);
  });
});
