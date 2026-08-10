"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Per-ayah recitation playback for tajweed drills.
 *
 * **Why this is not shared with `TapToHear`.** `TapToHear.tsx:19-27` holds the
 * only other player in the repo, and its playback is three lines inline. The
 * plan proposed extracting a hook out of it; that file is owned by another
 * session right now, so this hook is written fresh and `TapToHear` is left
 * untouched. Consolidating the two — `TapToHear` calling `useAudioCue`, and this
 * hook growing the `AudioSource` union that its item audio uses — is deliberate
 * future work, not an oversight. Until then the duplication is one `new Audio`
 * call, which is cheaper than a cross-session conflict.
 *
 * ## The audio source
 *
 * Recitation is Maḥmūd Khalīl al-Ḥuṣarī's *Muʿallim* (teaching) recording,
 * served per ayah by everyayah.com. It is the course's reference voice: slow,
 * clean, one voice, recorded to be imitated — which is what a drill needs, since
 * the learner is matching what they hear against a rule they have been taught.
 *
 * **Stream only. Never download, bundle, mirror or re-host these files.** That
 * edition carries no explicit written licence; hotlinking it is long-standing
 * tolerated custom in the Quran-app ecosystem rather than a granted permission,
 * and the courtesy that custom runs on is that the reciter is credited by name
 * wherever a clip plays. `RECITER` exists so no caller has to remember to.
 */

export const RECITER = "Maḥmūd Khalīl al-Ḥuṣarī (Muʿallim)";

const BASE = "https://everyayah.com/data/Husary_Muallim_128kbps";

const pad3 = (n: number) => String(n).padStart(3, "0");

/**
 * The clip URL for an ayah. A pure function of (surah, ayah), which is why it is
 * exported separately and tested directly: everything else here needs a browser
 * to be wrong in, but a padding slip here silently 404s every clip in the
 * course, and a failed `<audio>` load is mute — nothing tells you.
 */
export function ayahAudioUrl(surah: number, ayah: number): string {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    throw new RangeError(`surah out of range: ${surah}`);
  }
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > 286) {
    throw new RangeError(`ayah out of range: ${ayah}`);
  }
  return `${BASE}/${pad3(surah)}${pad3(ayah)}.mp3`;
}

export type AudioCue = {
  play: () => void;
  pause: () => void;
  isPlaying: boolean;
  /** The URL this cue would play — the seam tests assert on. */
  src: string;
};

/**
 * Every call into the media API is guarded. Under jsdom `HTMLMediaElement`
 * exists but has no decoder behind it, so `play()` is a stub that reports "not
 * implemented"; under SSR there is no `Audio` constructor at all. A drill has to
 * render and score in both, so a dead audio stack degrades to silence rather
 * than to an exception.
 */
function createAudio(src: string): HTMLAudioElement | null {
  if (typeof window === "undefined" || typeof window.Audio !== "function") return null;
  try {
    return new window.Audio(src);
  } catch {
    return null;
  }
}

/** Pause only what is actually sounding, so a dead audio stack stays quiet. */
function stop(el: HTMLAudioElement | null | undefined): void {
  if (!el || el.paused) return;
  try {
    el.pause();
  } catch {
    /* no media stack to stop */
  }
}

export function useAudioCue(src: string): AudioCue {
  const [isPlaying, setIsPlaying] = useState(false);
  const held = useRef<{ el: HTMLAudioElement; src: string } | null>(null);

  /**
   * Lazily built on first play, and rebuilt when `src` changes, so nothing is
   * fetched for a clip the learner never asks to hear — and so no effect runs
   * on render. An effect that reaches for the element would reintroduce exactly
   * the stale-frame hazard that `0b09f21` fixed.
   */
  const elementFor = useCallback((next: string): HTMLAudioElement | null => {
    if (held.current?.src !== next) {
      stop(held.current?.el);
      const el = createAudio(next);
      held.current = el ? { el, src: next } : null;
      if (el) {
        // Real browsers drive these; jsdom never fires them, which is why
        // `play`/`pause` also set the flag optimistically below.
        el.addEventListener("ended", () => setIsPlaying(false));
        el.addEventListener("pause", () => setIsPlaying(false));
        el.addEventListener("play", () => setIsPlaying(true));
      }
    }
    return held.current?.el ?? null;
  }, []);

  const play = useCallback(() => {
    const el = elementFor(src);
    if (!el) return;
    try {
      el.currentTime = 0;
      const started = el.play() as unknown;
      if (started && typeof (started as Promise<void>).catch === "function") {
        // Autoplay policy, a 404, an offline learner: all land here.
        (started as Promise<void>).catch(() => setIsPlaying(false));
      }
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  }, [elementFor, src]);

  const pause = useCallback(() => {
    setIsPlaying(false);
    stop(held.current?.el);
  }, []);

  // Cleanup only — a drill unmounted mid-clip must not keep reciting over the
  // next screen.
  useEffect(
    () => () => stop(held.current?.el),
    [],
  );

  return { play, pause, isPlaying, src };
}
