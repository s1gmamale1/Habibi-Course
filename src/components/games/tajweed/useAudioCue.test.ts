import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { RECITER, ayahAudioUrl, useAudioCue } from "./useAudioCue";

afterEach(() => vi.restoreAllMocks());

describe("ayahAudioUrl", () => {
  it("builds the everyayah URL with 3-digit zero padding", () => {
    // The one thing here that can actually be wrong: an off-by-one in the
    // padding 404s every clip silently, because a failed <audio> load is mute.
    expect(ayahAudioUrl(1, 1)).toBe(
      "https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3",
    );
    expect(ayahAudioUrl(106, 4)).toBe(
      "https://everyayah.com/data/Husary_Muallim_128kbps/106004.mp3",
    );
  });

  it("pads each of surah and ayah independently, at every digit width", () => {
    expect(ayahAudioUrl(2, 286)).toContain("/002286.mp3"); // longest ayah number
    expect(ayahAudioUrl(114, 6)).toContain("/114006.mp3"); // highest surah number
    expect(ayahAudioUrl(12, 45)).toContain("/012045.mp3"); // both two-digit
    expect(ayahAudioUrl(9, 100)).toContain("/009100.mp3"); // 1-digit + 3-digit
  });

  it("rejects references that cannot name a real ayah", () => {
    expect(() => ayahAudioUrl(0, 1)).toThrow(RangeError);
    expect(() => ayahAudioUrl(115, 1)).toThrow(RangeError);
    expect(() => ayahAudioUrl(1, 0)).toThrow(RangeError);
    expect(() => ayahAudioUrl(1.5, 1)).toThrow(RangeError);
  });

  it("names the reciter, who must be credited wherever a clip plays", () => {
    expect(RECITER).toMatch(/ḥuṣarī/i);
  });
});

describe("useAudioCue", () => {
  it("exposes the source it would play", () => {
    const src = ayahAudioUrl(106, 4);
    const { result } = renderHook(() => useAudioCue(src));
    expect(result.current.src).toBe(src);
    expect(result.current.isPlaying).toBe(false);
  });

  it("plays the source and reports that it is playing", () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    const { result } = renderHook(() => useAudioCue(ayahAudioUrl(1, 1)));

    act(() => result.current.play());

    expect(play).toHaveBeenCalled();
    expect(result.current.isPlaying).toBe(true);
  });

  it("stops reporting playing once paused", () => {
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    vi.spyOn(window.HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
    const { result } = renderHook(() => useAudioCue(ayahAudioUrl(1, 1)));

    act(() => result.current.play());
    act(() => result.current.pause());

    expect(result.current.isPlaying).toBe(false);
  });

  it("survives an environment with no media stack instead of throwing", () => {
    // jsdom has no decoder: the real `play()` is a not-implemented stub. A drill
    // must still render and score when the audio never sounds.
    vi.spyOn(window.HTMLMediaElement.prototype, "play").mockImplementation(() => {
      throw new Error("Not implemented: HTMLMediaElement.prototype.play");
    });
    const { result } = renderHook(() => useAudioCue(ayahAudioUrl(1, 1)));

    expect(() => act(() => result.current.play())).not.toThrow();
    expect(result.current.isPlaying).toBe(false);
  });

  it("follows a changed source rather than replaying the old clip", () => {
    const play = vi.spyOn(window.HTMLMediaElement.prototype, "play").mockResolvedValue();
    const { result, rerender } = renderHook(({ src }) => useAudioCue(src), {
      initialProps: { src: ayahAudioUrl(1, 1) },
    });
    act(() => result.current.play());

    rerender({ src: ayahAudioUrl(114, 6) });
    expect(result.current.src).toBe(ayahAudioUrl(114, 6));
    act(() => result.current.play());

    expect(play.mock.instances.at(-1)).not.toBe(play.mock.instances[0]);
    expect((play.mock.instances.at(-1) as HTMLAudioElement).src).toContain("114006.mp3");
  });
});
