// Build-time derivation of per-lesson game data from lesson content (spec §1).
import type { ArabicItem, Lesson } from "@/content/schema";
import { baseLetters } from "./arabic";

export type FormKey = "isolated" | "initial" | "medial" | "final";
export type FormEntry = { item: ArabicItem; forms: Partial<Record<FormKey, string>> };
export type WordEntry = { arabic: string; translit: string; meaning: string };

export type GameData = {
  lessonId: string;
  newLetters: ArabicItem[];
  letterPool: ArabicItem[];
  formEntries: FormEntry[];
  wordPool: WordEntry[];
  formsTaught: boolean;
};

// Forms are taught in lesson 1-07; the form-swap game is gated until then.
const FORMS_TAUGHT_FROM = "1-07";

export function deriveGameData(lessons: Lesson[], lessonId: string): GameData {
  const ordered = [...lessons].sort((a, b) => a.id.localeCompare(b.id));
  const idx = ordered.findIndex((l) => l.id === lessonId);
  if (idx === -1) throw new Error(`Unknown lesson id: ${lessonId}`);

  const letterPool: ArabicItem[] = [];
  const formEntries: FormEntry[] = [];
  const words = new Map<string, WordEntry>();
  const seen = new Set<string>();

  for (const l of ordered.slice(0, idx + 1)) {
    for (const slide of l.slides) {
      if (slide.kind !== "letter") continue;
      if (!seen.has(slide.item.arabic)) {
        seen.add(slide.item.arabic);
        letterPool.push(slide.item);
        const forms = slide.forms ?? {};
        if (Object.values(forms).filter(Boolean).length >= 3) {
          formEntries.push({ item: slide.item, forms });
        }
      }
      for (const ex of slide.examples ?? []) {
        if (!words.has(ex.arabic)) {
          words.set(ex.arabic, { arabic: ex.arabic, translit: ex.translit, meaning: ex.meaning });
        }
      }
    }
  }

  const learned = new Set(letterPool.map((it) => it.arabic));
  const wordPool = [...words.values()].filter((w) => baseLetters(w.arabic).every((c) => learned.has(c)));
  // "New" means not taught in an earlier lesson. Unit 1.4 re-teaches ع ح ص ض ط
  // as revision slides (to hang word `examples` off them), and those must not
  // show up under "Today's letters" — only a genuinely first-time letter does.
  const priorSeen = new Set(
    ordered.slice(0, idx).flatMap((l) => l.slides.flatMap((s) => (s.kind === "letter" ? [s.item.arabic] : []))),
  );
  const newLetters = ordered[idx].slides.flatMap((s) =>
    s.kind === "letter" && !priorSeen.has(s.item.arabic) ? [s.item] : [],
  );

  return {
    lessonId,
    newLetters,
    letterPool,
    formEntries,
    wordPool,
    formsTaught: lessonId.localeCompare(FORMS_TAUGHT_FROM) >= 0,
  };
}
