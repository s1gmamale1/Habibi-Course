import { z } from "zod";

/** Mirrors STATUSES in scripts/lib/rules.mjs:17. */
export const STATUSES = ["draft", "needs-review", "verified"] as const;

/** Mirrors RULE_FAMILIES in scripts/lib/rules.mjs:10-14. 13 legal, 12 in use. */
export const RULE_FAMILIES = [
  "preliminaries", "sifat", "tafkhim-tarqiq", "ra", "lam", "ghunnah",
  "meem-sakinah", "noon-sakinah", "idgham-theory", "madd", "qalqalah",
  "waqf", "orthography",
] as const;

/** Mirrors MAKHRAJ_ZONES in scripts/lib/rules.mjs:18. 5 legal, 4 in use. */
export const MAKHRAJ_ZONES = ["jawf", "halq", "lisan", "shafatan", "khayshum"] as const;

/**
 * `vendored` is NOT constrained by rules.mjs and takes five values in practice.
 * Source-Manifest.md documents only three of them — do not trust it as the vocabulary.
 */
export const VENDORED_MODES = [
  "full-text", "partial", "excerpts", "citation-only", "metadata-only",
] as const;

const StatusSchema = z.enum(STATUSES);

/** {ref: "108:3", text: "إِنَّ", note?: "..."} — already verified verbatim by the gate. */
const ExampleSchema = z.object({
  ref: z.string(),
  text: z.string(),
  note: z.string().optional(),
});

const BaseFields = { id: z.string(), status: StatusSchema };

export const RuleNoteSchema = z.object({
  type: z.literal("rule"),
  ...BaseFields,
  arabic: z.string(),
  translit: z.string(),
  english: z.string(),
  family: z.enum(RULE_FAMILIES),
  taught_in: z.string().optional(),
  prerequisites: z.array(z.string()).default([]),
  // Values are wikilink strings, e.g. "[[Tuhfat-al-Atfal]]". Kept as authored; the
  // renderer resolves them. 88 of the 100 sectioned notes carry this.
  sources: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
  letters: z.array(z.string()).optional(),
  colour_b: z.string().optional(),
  harakat: z.number().optional(),
  harakat_options: z.array(z.number()).optional(),
  cpfair_key: z.string().optional(),
});

export const LetterNoteSchema = z.object({
  type: z.literal("letter"),
  ...BaseFields,
  arabic: z.string(),
  name: z.string(),
  makhraj: z.string(),
  makhraj_zone: z.enum(MAKHRAJ_ZONES),
  sifat: z.array(z.string()),
  istila: z.boolean(),
  qalqalah: z.boolean(),
  taught_in: z.string().optional(),
  sources: z.array(z.string()).default([]),
  examples: z.array(ExampleSchema).default([]),
});

/**
 * The ragged one: 36 distinct keys across 11 notes, 15 appearing exactly once.
 * Only type/status/id are universal — Source-Manifest.md carries nothing else.
 * Unknown keys are permitted and simply not rendered.
 */
export const SourceNoteSchema = z.object({
  type: z.literal("source"),
  ...BaseFields,
  vendored: z.enum(VENDORED_MODES).optional(),
  url: z.string().optional(),
  url_secondary: z.string().optional(),
  title: z.string().optional(),
  arabic_title: z.string().optional(),
  author: z.string().optional(),
  author_arabic: z.string().optional(),
  author_source: z.string().optional(),
  year: z.union([z.string(), z.number()]).optional(),
  retrieved: z.union([z.string(), z.date()]).optional(),
  licence: z.string().optional(),
  licence_note: z.string().optional(),
  licence_terms_url: z.string().optional(),
  licence_source: z.string().optional(),
  metre: z.string().optional(),
  language: z.string().optional(),
  verses: z.union([z.string(), z.number()]).optional(),
  ayahs: z.number().optional(),
  handle: z.string().optional(),
  channel_id: z.string().optional(),
  playlist_id: z.string().optional(),
  playlist_title: z.string().optional(),
}).passthrough();

export const IndexNoteSchema = z.object({ type: z.literal("index"), ...BaseFields });

export const LibraryNoteSchema = z.discriminatedUnion("type", [
  RuleNoteSchema, LetterNoteSchema, SourceNoteSchema, IndexNoteSchema,
]);

export type RuleNote = z.infer<typeof RuleNoteSchema>;
export type LetterNote = z.infer<typeof LetterNoteSchema>;
export type SourceNote = z.infer<typeof SourceNoteSchema>;
export type IndexNote = z.infer<typeof IndexNoteSchema>;
export type LibraryNote = z.infer<typeof LibraryNoteSchema>;
