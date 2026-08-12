"use client";
import { useRef, useState } from "react";
import type { ArabicItem } from "@/content/schema";

export function TapToHear({
  item,
  size = "md",
  showName = true,
}: {
  item: ArabicItem;
  size?: "md" | "lg";
  showName?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const a = item.audio;
  const isLg = size === "lg";

  /**
   * Only two of the three tiers open anything. A `qari-clip` plays and returns,
   * so it has no expanded state to report and no dialog to dismiss — claiming
   * `aria-expanded="false"` there would describe a disclosure control that does
   * not exist.
   */
  const hasPopover = a.type !== "qari-clip";
  const label = `${item.arabic}${item.name ? ` (${item.name})` : ""}`;

  function onTap() {
    if (a.type === "qari-clip") {
      if (!audioRef.current) audioRef.current = new Audio(a.url);
      audioRef.current.currentTime = 0;
      void audioRef.current.play();
    } else {
      setOpen((v) => !v);
    }
  }

  /**
   * Escape closes, and focus goes back to the button that opened it.
   *
   * Handled on the wrapper rather than the panel because focus stays on the
   * button while the popover is open — the panel is not focusable and nothing
   * inside it takes focus on open. Returning focus explicitly matters for the
   * youtube tier, where a tab into the iframe leaves focus inside a subtree
   * that is about to be unmounted.
   */
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Escape" || !open) return;
    e.stopPropagation();
    setOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <span
      onKeyDown={onKeyDown}
      className={`relative inline-block text-center ${isLg ? "rim-glow-b" : ""}`}
    >
      <button
        ref={buttonRef}
        type="button"
        onClick={onTap}
        aria-expanded={hasPopover ? open : undefined}
        aria-label={`${label} — tap to hear`}
        className={`arabic ${isLg ? "glass rim-glow" : "rim-static"} rounded-2xl px-4 py-2 font-medium text-white transition-transform duration-300 ease-out hover:scale-[1.03] active:scale-95 ${isLg ? "text-6xl" : "text-3xl"}`}
      >
        {item.arabic}
        <span aria-hidden className="ml-1 align-super text-xs">🔊</span>
        {showName && item.name && (
          <span aria-hidden dir="ltr" className="mt-0.5 block text-xs text-white/60">{item.name}</span>
        )}
      </button>
      {open && a.type === "youtube-cue" && (
        // `dialog`, not `tooltip`: it contains an interactive iframe, and a
        // tooltip may not hold interactive content.
        <span
          role="dialog"
          aria-label={`${label} — recording`}
          className="glass-strong absolute left-1/2 z-10 mt-2 block w-72 -translate-x-1/2 rounded-xl p-1 shadow-xl"
        >
          <iframe
            title={a.title}
            src={`https://www.youtube.com/embed/${a.videoId}?start=${a.startSeconds}&autoplay=1`}
            className="aspect-video w-full rounded-lg"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
          <span className="block px-1 py-1 text-xs text-white/60">via {a.title} ↗</span>
        </span>
      )}
      {open && a.type === "teacher-voice" && (
        <span
          role="dialog"
          aria-label={`${label} — practice cue`}
          className="glass-strong absolute left-1/2 z-10 mt-2 block w-64 -translate-x-1/2 rounded-xl p-3 text-left shadow-xl"
        >
          <span className="arabic block text-5xl">{item.arabic}</span>
          <span className="mt-1 block text-sm text-white/85">{a.cue}</span>
          <span className="mt-1 block text-xs text-white/50">No recording exists for this item — practice live with your teacher.</span>
        </span>
      )}
    </span>
  );
}
