"use client";
import { useRef, useState } from "react";
import type { ArabicItem } from "@/content/schema";

export function TapToHear({ item, size = "md" }: { item: ArabicItem; size?: "md" | "lg" }) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const a = item.audio;

  function onTap() {
    if (a.type === "qari-clip") {
      if (!audioRef.current) audioRef.current = new Audio(a.url);
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } else {
      setOpen((v) => !v);
    }
  }

  return (
    <span className="relative inline-block text-center">
      <button
        type="button"
        onClick={onTap}
        aria-label={`${item.arabic}${item.name ? ` (${item.name})` : ""} — tap to hear`}
        className={`arabic rounded-xl border border-stone-300 bg-white px-3 py-1 shadow-sm active:scale-95 ${size === "lg" ? "text-6xl" : "text-3xl"}`}
      >
        {item.arabic}
        <span aria-hidden className="ml-1 align-super text-xs">🔊</span>
      </button>
      {open && a.type === "youtube-cue" && (
        <span className="absolute left-1/2 z-10 mt-2 block w-72 -translate-x-1/2 rounded-lg bg-black p-1 shadow-lg">
          <iframe
            title={a.title}
            src={`https://www.youtube.com/embed/${a.videoId}?start=${a.startSeconds}&autoplay=1`}
            className="aspect-video w-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <span className="block px-1 py-0.5 text-xs text-stone-300">via {a.title} ↗</span>
        </span>
      )}
      {open && a.type === "teacher-voice" && (
        <span className="absolute left-1/2 z-10 mt-2 block w-64 -translate-x-1/2 rounded-lg border border-stone-200 bg-white p-3 text-left shadow-lg">
          <span className="arabic block text-5xl">{item.arabic}</span>
          <span className="mt-1 block text-sm">{a.cue}</span>
          <span className="mt-1 block text-xs text-stone-500">No recording exists for this item — practice live with your teacher.</span>
        </span>
      )}
    </span>
  );
}
