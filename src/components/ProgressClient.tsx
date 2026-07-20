"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Course } from "@/content/schema";

const KEY = "tajweed-progress-v1";

export function useProgress() {
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) ?? '{"done":[]}');
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-time localStorage hydrate; render-time read would mismatch SSR HTML
      setDone(Array.isArray(raw?.done) ? raw.done.filter((x: unknown): x is string => typeof x === "string") : []);
    } catch {
      setDone([]);
    }
  }, []);
  function toggleDone(id: string) {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify({ done: next }));
      } catch {
        // Ignore write failures; state still updates in memory
      }
      return next;
    });
  }
  return { isDone: (id: string) => done.includes(id), toggleDone };
}

export function CourseMap({ course }: { course: Course }) {
  const { isDone, toggleDone } = useProgress();
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <h1 className="gradient-text mb-1 text-4xl font-bold tracking-tight">{course.title}</h1>
      <p className="mb-8 text-white/60">Calendar is suggested — checkpoints decide advancement. Repeat anything, anytime.</p>
      {course.phases.map((phase) => (
        <section key={phase.number} className="glass mb-8 rounded-2xl p-4 sm:p-5">
          <h2 className="mb-4 text-xl font-semibold text-white/90">Phase {phase.number} — {phase.title}</h2>
          <ul className="space-y-2">
            {phase.lessons.map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                <input type="checkbox" aria-label={`done: ${l.title}`} checked={isDone(l.id)} onChange={() => toggleDone(l.id)} className="done-checkbox" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-white/90">{l.title}</p>
                  <p className="text-xs text-white/50">{l.calendarSlot}</p>
                </div>
                <Link className="cta-primary rounded-lg px-3 py-1.5 text-sm font-medium" href={`/lesson/${l.id}`}>Lesson</Link>
                <Link className="cta-secondary rounded-lg px-3 py-1.5 text-sm" href={`/practice/${l.id}`}>Practice</Link>
              </li>
            ))}
            <li className="gate-glow rounded-xl bg-amber-500/10 p-4">
              <Link href={`/checkpoint/${phase.checkpoint.id}`} className="font-semibold text-amber-200">🚩 {phase.checkpoint.title}</Link>
              <p className="text-xs text-amber-100/70">Live gate with your teacher — pass to move on, or revise the mapped lessons and retest.</p>
            </li>
          </ul>
        </section>
      ))}
    </main>
  );
}

export function PrintButton({ label = "🖨 Print this sheet" }: { label?: string } = {}) {
  return (
    <button type="button" onClick={() => window.print()} className="cta-secondary mb-6 rounded-lg px-3 py-1.5 text-sm print:hidden">
      {label}
    </button>
  );
}
