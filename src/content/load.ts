import fs from "node:fs";
import path from "node:path";
import { CheckpointSchema, CourseSchema, LessonSchema, type Checkpoint, type Course, type Lesson } from "./schema";

const CONTENT_DIR = path.join(process.cwd(), "content");

function parseJsonFile<T>(file: string, parse: (raw: unknown) => T): T {
  try {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    return parse(raw);
  } catch (err) {
    throw new Error(`Invalid content in ${file}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function parseLessonFile(file: string): Lesson {
  return parseJsonFile(file, (raw) => LessonSchema.parse(raw));
}

export function loadCourse(): Course {
  return parseJsonFile(path.join(CONTENT_DIR, "course.json"), (raw) => CourseSchema.parse(raw));
}

export function allLessonIds(): string[] {
  return fs.readdirSync(path.join(CONTENT_DIR, "lessons")).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

export function loadLesson(id: string): Lesson {
  return parseLessonFile(path.join(CONTENT_DIR, "lessons", `${id}.json`));
}

export function allLessons(): Lesson[] {
  return allLessonIds().map((id) => loadLesson(id));
}

export function allCheckpointIds(): string[] {
  const dir = path.join(CONTENT_DIR, "checkpoints");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, "")).sort();
}

export function loadCheckpoint(id: string): Checkpoint {
  return parseJsonFile(path.join(CONTENT_DIR, "checkpoints", `${id}.json`), (raw) => CheckpointSchema.parse(raw));
}
