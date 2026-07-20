"use client";
import { useState } from "react";
import type { Lesson } from "@/content/schema";
import { buildLessonDeck, type Deck } from "@/export/lessonToPptx";

type Status = "idle" | "working" | "done" | "error";

// SVG → PNG data URL via canvas. Returns null on any failure so the
// export continues without that image.
async function rasterizeSvg(path: string): Promise<string | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const svg = await res.text();
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error(`failed to load ${path}`));
        img.src = url;
      });
      const scale = 2;
      const canvas = document.createElement("canvas");
      canvas.width = (img.naturalWidth || 512) * scale;
      canvas.height = (img.naturalHeight || 512) * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/png");
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

const LABELS: Record<Status, string> = {
  idle: "⤓ Export PPTX",
  working: "Generating…",
  done: "Exported ✓ — export again",
  error: "Export failed — try again",
};

export default function ExportPptxButton({ lesson }: { lesson: Lesson }) {
  const [status, setStatus] = useState<Status>("idle");

  async function onExport() {
    setStatus("working");
    try {
      const PptxGenJS = (await import("pptxgenjs")).default;
      const paths = [...new Set(lesson.slides.flatMap((s) => ("image" in s && s.image ? [s.image] : [])))];
      const images: Record<string, string> = {};
      for (const p of paths) {
        const data = await rasterizeSvg(p);
        if (data) images[p] = data;
      }
      const pptx = new PptxGenJS();
      buildLessonDeck(pptx as unknown as Deck, lesson, images);
      await pptx.writeFile({ fileName: `tajweed-${lesson.id}.pptx` });
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <button
      type="button"
      onClick={onExport}
      disabled={status === "working"}
      className="mb-4 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-sm text-sky-300 hover:bg-white/10 disabled:opacity-50 print:hidden"
    >
      {LABELS[status]}
    </button>
  );
}
