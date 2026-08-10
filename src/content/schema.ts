import { z } from "zod";
import { TAJWEED_RULES } from "./tajweed";

export const RuleIdSchema = z.enum(TAJWEED_RULES);

// Structured teacher-notes entry: what to listen for, what usually goes wrong,
// and the cue that fixes it. New tajweed content authors this shape.
export const ListenForSchema = z.object({
  item: z.string().min(1),
  makhraj: z.string().optional(),
  commonMistake: z.string().min(1),
  whyItHappens: z.string().optional(),
  correctionCue: z.string().min(1),
  severityIfWrong: z.enum(["jali", "khafi"]).optional(),
  source: z.string().optional(),
});
export type ListenFor = z.infer<typeof ListenForSchema>;

// Three-tier audio model — docs/research/addenda/gap-1.md §3.
export const AudioSourceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("qari-clip"), url: z.string().url(), reciter: z.string().min(1) }),
  z.object({
    type: z.literal("youtube-cue"),
    videoId: z.string().regex(/^[\w-]{6,20}$/),
    startSeconds: z.number().int().nonnegative(),
    title: z.string().min(1),
  }),
  z.object({ type: z.literal("teacher-voice"), cue: z.string().min(1) }),
]);
export type AudioSource = z.infer<typeof AudioSourceSchema>;

export const ArabicItemSchema = z.object({
  arabic: z.string().min(1),
  name: z.string().optional(),      // e.g. "ba"
  translit: z.string().optional(),  // e.g. "b"
  audio: AudioSourceSchema,
});
export type ArabicItem = z.infer<typeof ArabicItemSchema>;

export const SlideSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("title"), heading: z.string(), arabicDecor: z.string().optional() }),
  z.object({
    kind: z.literal("concept"),
    heading: z.string(),
    body: z.array(z.string()).min(1),
    items: z.array(ArabicItemSchema).optional(),
    image: z.string().optional(),
  }),
  z.object({
    kind: z.literal("letter"),
    item: ArabicItemSchema,
    makhraj: z.string().min(1),
    notes: z.array(z.string()),
    forms: z
      .object({
        isolated: z.string().optional(),
        initial: z.string().optional(),
        medial: z.string().optional(),
        final: z.string().optional(),
      })
      .optional(),
    examples: z
      .array(
        z.object({
          arabic: z.string().min(1),
          translit: z.string().min(1),
          meaning: z.string().min(1),
          form: z.enum(["isolated", "initial", "medial", "final"]).optional(),
        }),
      )
      .min(1)
      .optional(),
    image: z.string().optional(),
  }),
  z.object({
    kind: z.literal("drill"),
    heading: z.string(),
    instructions: z.string().min(1),
    grid: z.array(z.array(ArabicItemSchema)).min(1),
  }),
  z.object({ kind: z.literal("recap"), heading: z.string(), items: z.array(ArabicItemSchema).min(1) }),
  z.object({ kind: z.literal("homework"), heading: z.string(), tasks: z.array(z.string()).min(1) }),
  z.object({
    kind: z.literal("rule"),
    ruleId: RuleIdSchema,
    heading: z.string().min(1),
    condition: z.string().min(1),
    letters: z.array(z.string()).optional(),
    harakat: z.number().int().min(0).max(6).optional(),
    mnemonic: z.string().optional(),
    body: z.array(z.string()).min(1),
    image: z.string().optional(),
  }),
  z.object({
    kind: z.literal("ayah"),
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1),
    highlight: z.array(RuleIdSchema).optional(),
    translation: z.string().optional(),
    audio: AudioSourceSchema.optional(),
  }),
  z.object({
    kind: z.literal("contrast"),
    heading: z.string().min(1),
    pairs: z
      .array(
        z.object({
          surah: z.number().int().min(1).max(114),
          ayah: z.number().int().min(1),
          text: z.string().min(1),
          rule: RuleIdSchema,
          note: z.string().min(1),
        }),
      )
      .min(2),
  }),
  z.object({ kind: z.literal("legend"), heading: z.string().min(1), rules: z.array(RuleIdSchema).min(1) }),
  z.object({
    kind: z.literal("mistake"),
    heading: z.string().min(1),
    mistakes: z
      .array(
        z.object({ wrong: z.string().min(1), why: z.string().min(1), fix: z.string().min(1) }),
      )
      .min(1),
  }),
]);
export type Slide = z.infer<typeof SlideSchema>;

export const DrillSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  grid: z.array(z.array(ArabicItemSchema)).min(1),
});
export type Drill = z.infer<typeof DrillSchema>;

export const LessonSchema = z.object({
  id: z.string().regex(/^\d-\d{2}$/), // "1-01"
  phase: z.number().int().min(1).max(4), // 4 = the Unit 4 Kalimas
  unit: z.string().min(1),            // "1.1"
  title: z.string().min(1),
  objectives: z.array(z.string()).min(1).max(4),
  prerequisites: z.array(z.string().regex(/^\d-\d{2}$/)).default([]),
  stage: z.string().optional(),
  slides: z.array(SlideSchema).min(8).max(24), // spec: 8–18 typical; extended to 24 for the Unit 1.2 joining lessons
  practice: z.object({ drills: z.array(DrillSchema), dailyChecklist: z.array(z.string()).min(1) }),
  teacherNotes: z.object({
    script: z.array(z.string()).min(1),
    // Permissive on purpose. The 15 shipped lessons author `listenFor` as plain
    // strings; new tajweed content authors the structured ListenForSchema form.
    // Migrating the shipped lessons to the structured form is a separate,
    // supervised task — until then both shapes must validate, so do NOT narrow
    // this to `z.array(ListenForSchema)`.
    listenFor: z.array(z.union([z.string(), ListenForSchema])).min(1),
    homework: z.string().min(1),
  }),
  videos: z.array(z.object({ title: z.string(), url: z.string().url() })),
});
export type Lesson = z.infer<typeof LessonSchema>;

export const CourseSchema = z.object({
  title: z.string(),
  phases: z.array(
    z.object({
      number: z.number().int(),
      title: z.string(),
      lessons: z.array(z.object({ id: z.string().regex(/^\d-\d{2}$/), title: z.string(), calendarSlot: z.string() })),
      checkpoint: z.object({ id: z.string(), title: z.string() }),
    }),
  ),
});
export type Course = z.infer<typeof CourseSchema>;

export const CheckpointSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  durationMinutes: z.string(), // e.g. "30–40"
  steps: z.array(z.object({ name: z.string(), script: z.string(), items: z.array(ArabicItemSchema).optional() })).min(1),
  rubric: z.array(z.object({ criterion: z.string(), pass: z.string() })).min(1),
  revisionMap: z.array(z.object({ weakSpot: z.string(), lessons: z.array(z.string()) })).min(1),
});
export type Checkpoint = z.infer<typeof CheckpointSchema>;
