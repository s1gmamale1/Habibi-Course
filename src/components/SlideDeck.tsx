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
          <h1 className="text-4xl font-bold">{slide.heading}</h1>
        </div>
      );
    case "concept":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          {slide.image && (
            <img src={slide.image} alt={`makhraj — ${slide.heading}`} className="mx-auto mb-4 max-h-[38vh] max-w-full" />
          )}
          <ul className="list-disc space-y-3 pl-6 text-xl">{slide.body.map((b) => <li key={b}>{b}</li>)}</ul>
          {slide.items && <div className="mt-6 flex flex-wrap gap-3">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} />)}</div>}
        </div>
      );
    case "letter":
      return (
        <div className="text-center">
          {slide.image && (
            <img
              src={slide.image}
              alt={`makhraj — ${slide.item.name ?? slide.item.arabic}`}
              className="mx-auto mb-4 max-h-[38vh] max-w-full"
            />
          )}
          <TapToHear item={slide.item} size="lg" />
          <p className="mt-4 text-2xl font-semibold">{slide.item.name}{slide.item.translit ? ` — ${slide.item.translit}` : ""}</p>
          <p className="mt-2 text-lg"><span className="font-semibold">Makhraj:</span> {slide.makhraj}</p>
          {slide.forms && (
            <div dir="rtl" className="mt-4 flex flex-wrap justify-center gap-4">
              {(Object.keys(FORM_LABELS) as Array<keyof typeof FORM_LABELS>)
                .filter((k) => slide.forms?.[k])
                .slice(0, 4)
                .map((k) => (
                  <div key={k} className="text-center">
                    <p className="arabic text-4xl">{slide.forms?.[k]}</p>
                    <p className="text-xs text-stone-500">{FORM_LABELS[k]}</p>
                  </div>
                ))}
            </div>
          )}
          <ul className="mt-3 space-y-1 text-stone-600">{slide.notes.map((n) => <li key={n}>{n}</li>)}</ul>
          {slide.example && (
            <div className="mt-4">
              <p className="arabic text-4xl">{slide.example.arabic}</p>
              <p className="text-stone-600">{slide.example.translit} — {slide.example.meaning}</p>
            </div>
          )}
        </div>
      );
    case "drill":
      return (
        <div className="text-center">
          <h2 className="mb-2 text-3xl font-bold">{slide.heading}</h2>
          <p className="mb-6 text-stone-600">{slide.instructions}</p>
          {slide.grid.map((row, i) => (
            <div key={i} dir="rtl" className="mb-3 flex flex-wrap justify-center gap-3">{row.map((it) => <TapToHear key={it.arabic + i} item={it} size="lg" />)}</div>
          ))}
        </div>
      );
    case "recap":
      return (
        <div className="text-center">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          <div dir="rtl" className="flex flex-wrap justify-center gap-4">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} size="lg" />)}</div>
        </div>
      );
    case "homework":
      return (
        <div className="max-w-2xl">
          <h2 className="mb-6 text-3xl font-bold">{slide.heading}</h2>
          <ol className="list-decimal space-y-3 pl-6 text-xl">{slide.tasks.map((t) => <li key={t}>{t}</li>)}</ol>
        </div>
      );
  }
}

export function SlideDeck({ title, slides }: { title: string; slides: Slide[] }) {
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
      <div className="flex flex-1 items-center justify-center p-6">
        <SlideView slide={slides[i]} />
      </div>
      <div className="flex items-center justify-between p-4 text-sm text-stone-500">
        <button type="button" onClick={() => go(-1)} className="rounded px-3 py-1 hover:bg-stone-200">← Back</button>
        <span>{title} — {i + 1} / {slides.length}</span>
        <button type="button" onClick={() => go(1)} className="rounded px-3 py-1 hover:bg-stone-200">Next →</button>
      </div>
    </div>
  );
}
