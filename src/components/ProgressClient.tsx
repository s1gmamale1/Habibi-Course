"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/content/schema";

const KEY = "tajweed-progress-v1";

export function useProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try { setDone(JSON.parse(localStorage.getItem(KEY) ?? '{"done":[]}').done ?? []); } catch { setDone([]); }
  }, []);
  function toggleDone(id: string) {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem(KEY, JSON.stringify({ done: next }));
      return next;
    });
  }
  return { isDone: (id: string) => done.includes(id), toggleDone };
}

export function CourseMap({ course }: { course: Course }) {
  const { isDone, toggleDone } = useProgress();
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="mb-1 text-3xl font-bold">{course.title}</h1>
      <p className="mb-8 text-stone-500">Calendar is suggested — checkpoints decide advancement. Repeat anything, anytime.</p>
      {course.phases.map((phase) => (
        <section key={phase.number} className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Phase {phase.number} — {phase.title}</h2>
          <ul className="space-y-2">
            {phase.lessons.map((l) => (
              <li key={l.id} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-3">
                <input type="checkbox" aria-label={`done: ${l.title}`} checked={isDone(l.id)} onChange={() => toggleDone(l.id)} className="h-5 w-5" />
                <div className="flex-1">
                  <p className="font-medium">{l.title}</p>
                  <p className="text-xs text-stone-500">{l.calendarSlot}</p>
                </div>
                <Link className="rounded bg-stone-800 px-3 py-1 text-sm text-white" href={`/lesson/${l.id}`}>Lesson</Link>
                <Link className="rounded border border-stone-300 px-3 py-1 text-sm" href={`/practice/${l.id}`}>Practice</Link>
              </li>
            ))}
            <li className="rounded-lg border-2 border-amber-400 bg-amber-50 p-3">
              <Link href={`/checkpoint/${phase.checkpoint.id}`} className="font-semibold">🚩 {phase.checkpoint.title}</Link>
              <p className="text-xs text-stone-600">Live gate with your teacher — pass to move on, or revise the mapped lessons and retest.</p>
            </li>
          </ul>
        </section>
      ))}
    </main>
  );
}
