"use client";
import { useState } from "react";
import type { Slide } from "@/content/schema";
import type { RuleId } from "@/content/tajweed";
import { IsolateControl } from "./IsolateControl";
import { RuleLegend } from "./RuleLegend";
import { TajweedText } from "./TajweedText";
import { lookupVerse } from "./verses";

type AyahSlideData = Extract<Slide, { kind: "ayah" }>;

/**
 * A whole ayah, painted by rule.
 *
 * `highlight` narrows the slide to the rules it is teaching: a qalqalah lesson
 * paints only the qalqalah and leaves the rest of the ayah plain, rather than
 * asking the learner to pick one hue out of six. With no `highlight`, every
 * generated span is painted.
 *
 * Isolate state lives here because it is per-slide — moving to the next ayah
 * should start from "All" again.
 */
export function AyahSlide({ surah, ayah, highlight, translation, audio }: Omit<AyahSlideData, "kind">) {
  const [isolate, setIsolate] = useState<RuleId | null>(null);
  const verse = lookupVerse(surah, ayah);
  const spans =
    verse && highlight?.length
      ? verse.spans.filter((s) => s.rules.some((r) => (highlight as string[]).includes(r)))
      : (verse?.spans ?? []);
  const rules = [...new Set(spans.map((s) => s.rules[0] as RuleId))];

  return (
    <div className="max-w-2xl">
      <h2 className="mb-4 text-sm uppercase tracking-wide text-white/50">
        Sūrah {surah} : {ayah}
      </h2>

      {verse ? (
        <p className="mb-6 text-center text-4xl leading-[2.1] sm:text-5xl">
          <TajweedText text={verse.text} spans={spans} isolate={isolate} onRuleTap={setIsolate} />
        </p>
      ) : (
        // No generated entry for this reference — see the note in verses.ts on
        // adding a surah. Degrade to the reference and translation; never crash.
        <p className="mb-6 text-center text-white/60">
          Ayah text not bundled for this reference — read it from the mushaf.
        </p>
      )}

      {translation && <p className="mb-6 text-center text-lg text-white/75">{translation}</p>}

      {audio?.type === "qari-clip" && (
        <audio controls src={audio.url} className="mb-4 w-full" aria-label={`Recitation — ${audio.reciter}`} />
      )}
      {audio?.type === "youtube-cue" && (
        <p className="mb-4 text-center">
          <a
            href={`https://www.youtube.com/watch?v=${audio.videoId}&t=${audio.startSeconds}`}
            target="_blank"
            rel="noreferrer"
            className="text-white/70 underline underline-offset-2 hover:text-white"
          >
            ▶ {audio.title} ↗
          </a>
        </p>
      )}
      {audio?.type === "teacher-voice" && (
        <p className="mb-4 text-center text-sm text-white/60">{audio.cue}</p>
      )}

      {rules.length > 1 && <IsolateControl rules={rules} value={isolate} onChange={setIsolate} />}
      <RuleLegend rules={rules} />
    </div>
  );
}
