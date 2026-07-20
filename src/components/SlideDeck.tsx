"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Slide } from "@/content/schema";
import { TapToHear } from "./TapToHear";

const FORM_LABELS = {
  isolated: "Alone",
  initial: "Start",
  medial: "Middle",
  final: "End",
} as const;

function SlideView({ slide }: { slide: Slide }) {
  switch (slide.kind) {
    case "title":
      return (
        <div className="text-center">
          {slide.arabicDecor && <p className="arabic mb-6 text-7xl">{slide.arabicDecor}</p>}
          <h1 className="gradient-text text-4xl font-bold">{slide.heading}</h1>
        </div>
      );
    case "concept":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold text-white">{slide.heading}</h2>
          {slide.image && (
            <div className="glass mx-auto mb-4 inline-block rounded-2xl p-2">
              <img src={slide.image} alt={`makhraj — ${slide.heading}`} className="mx-auto max-h-[36vh] max-w-full rounded-xl" />
            </div>
          )}
          <ul className="list-disc space-y-3 pl-6 text-xl text-white/85">{slide.body.map((b) => <li key={b}>{b}</li>)}</ul>
          {slide.items && <div className="mt-6 flex flex-wrap gap-3">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} />)}</div>}
        </div>
      );
    case "letter":
      return (
        <div className="text-center">
          {slide.image && (
            <div className="glass mx-auto mb-4 inline-block rounded-2xl p-2">
              <img
                src={slide.image}
                alt={`makhraj — ${slide.item.name ?? slide.item.arabic}`}
                className="mx-auto max-h-[36vh] max-w-full rounded-xl"
              />
            </div>
          )}
          <TapToHear item={slide.item} size="lg" showName={false} />
          <p className="mt-4 text-2xl font-semibold text-white">{slide.item.name}{slide.item.translit ? ` — ${slide.item.translit}` : ""}</p>
          <p className="mt-2 text-lg text-white/80"><span className="font-semibold text-white">Makhraj:</span> {slide.makhraj}</p>
          {slide.forms && (
            <div dir="rtl" className="mt-4 flex flex-wrap justify-center gap-4">
              {(Object.keys(FORM_LABELS) as Array<keyof typeof FORM_LABELS>)
                .filter((k) => slide.forms?.[k])
                .slice(0, 4)
                .map((k) => (
                  <div key={k} className="text-center">
                    <p className="arabic text-4xl">{slide.forms?.[k]}</p>
                    <p className="text-xs text-white/50">{FORM_LABELS[k]}</p>
                  </div>
                ))}
            </div>
          )}
          <ul className="mt-3 space-y-1 text-white/70">{slide.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          {slide.examples && (
            <div className="mx-auto mt-4 max-w-xl">
              <p className="mb-2 text-xs uppercase tracking-wide text-white/50">See it inside real words</p>
              <div dir="rtl" className="flex flex-wrap justify-center gap-x-8 gap-y-3">
                {slide.examples.map((ex) => (
                  <div key={ex.arabic} className="text-center">
                    <p className="arabic text-4xl">{ex.arabic}</p>
                    <p dir="ltr" className="text-sm text-white/70">{ex.translit} — {ex.meaning}</p>
                    {ex.form && <p dir="ltr" className="text-xs text-white/45">{FORM_LABELS[ex.form]} position</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    case "drill":
      return (
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold text-white">{slide.heading}</h2>
          <p className="mb-6 text-white/70">{slide.instructions}</p>
          {slide.grid.map((row, i) => (
            <div key={i} dir="rtl" className="mb-3 flex flex-wrap justify-center gap-3">{row.map((it) => <TapToHear key={it.arabic + i} item={it} size="lg" />)}</div>
          ))}
        </div>
      );
    case "recap":
      return (
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold text-white">{slide.heading}</h2>
          <div dir="rtl" className="flex flex-wrap justify-center gap-4">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} size="lg" />)}</div>
        </div>
      );
    case "homework":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold text-white">{slide.heading}</h2>
          <ol className="list-decimal space-y-3 pl-6 text-xl text-white/85">{slide.tasks.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
      );
  }
}

export function SlideDeck({
  title,
  slides,
  videosAnchor = false,
}: {
  title: string;
  slides: Slide[];
  videosAnchor?: boolean;
}) {
  const [i, setI] = useState(0);
  const router = useRouter();
  const touchX = useRef<number | null>(null);
  const last = slides.length - 1;
  const go = useCallback((d: number) => setI((v) => Math.min(last, Math.max(0, v + d))), [last]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") router.push("/");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, router]);

  return (
    <div
      className="flex min-h-screen flex-col"
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
        touchX.current = null;
      }}
    >
      <div className="flex flex-1 items-center justify-center overflow-y-auto p-4 sm:p-6">
        <div className="glass-strong w-full max-w-2xl rounded-3xl p-6 text-white/90 shadow-2xl sm:p-8">
          <SlideView slide={slides[i]} />
        </div>
      </div>
      <div className="glass mx-auto flex w-full max-w-2xl items-center justify-between gap-2 rounded-t-2xl px-4 py-3 text-sm text-white/60 sm:px-6">
        <button type="button" onClick={() => go(-1)} className="cta-secondary rounded-full px-3 py-1.5">← Back</button>
        <span className="flex min-w-0 items-center justify-center gap-2">
          <span className="truncate">{title} — {i + 1} / {slides.length}</span>
          {videosAnchor && (
            <a href="#lesson-videos" className="shrink-0 whitespace-nowrap text-white/70 underline underline-offset-2 hover:text-white">
              🎬 Videos ↓
            </a>
          )}
        </span>
        <button type="button" onClick={() => go(1)} className="cta-secondary rounded-full px-3 py-1.5">Next →</button>
      </div>
    </div>
  );
}
