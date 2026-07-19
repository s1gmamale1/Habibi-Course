"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Slide } from "@/content/schema";
import { TapToHear } from "./TapToHear";

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
          <ul className="list-disc space-y-3 pl-6 text-xl">{slide.body.map((b) => <li key={b}>{b}</li>)}</ul>
          {slide.items && <div className="mt-6 flex flex-wrap gap-3">{slide.items.map((it) => <TapToHear key={it.arabic} item={it} />)}</div>}
        </div>
      );
    case "letter":
      return (
        <div className="text-center">
          <TapToHear item={slide.item} size="lg" />
          <p className="mt-4 text-2xl font-semibold">{slide.item.name}{slide.item.translit ? ` — ${slide.item.translit}` : ""}</p>
          <p className="mt-2 text-lg"><span className="font-semibold">Makhraj:</span> {slide.makhraj}</p>
          <ul className="mt-3 space-y-1 text-stone-600">{slide.notes.map((n) => <li key={n}>{n}</li>)}</ul>
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
