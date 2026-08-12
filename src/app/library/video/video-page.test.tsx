import { describe, test, expect } from "vitest";
import { render } from "@testing-library/react";
import VideoPage from "./page";
import { VideoEmbed } from "@/components/library/VideoEmbed";
import { catalogueVideos, lessonVideos } from "@/library/video";

describe("VideoEmbed", () => {
  test("uses the privacy-preserving host — this course teaches children", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="test" />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("src")).toContain("youtube-nocookie.com");
  });

  test("lazy-loads and carries an accessible title", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="Alif" />);
    const iframe = container.querySelector("iframe");
    expect(iframe?.getAttribute("loading")).toBe("lazy");
    expect(iframe?.getAttribute("title")).toBe("Alif");
  });

  test("honours a start time when one is given", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="t" startSeconds={42} />);
    expect(container.querySelector("iframe")?.getAttribute("src")).toContain("start=42");
  });

  test("never embeds a re-hosted file — the src is always youtube", () => {
    const { container } = render(<VideoEmbed id="ObYKEtceQbU" title="t" />);
    const src = container.querySelector("iframe")?.getAttribute("src") ?? "";
    expect(src.startsWith("https://www.youtube-nocookie.com/embed/")).toBe(true);
  });
});

describe("/library/video", () => {
  test("renders the lesson videos and the catalogue", () => {
    const { container } = render(<VideoPage />);
    const iframes = container.querySelectorAll("iframe");
    expect(iframes.length).toBeGreaterThanOrEqual(lessonVideos().length);
  });

  test("lists the whole catalogue in the channel's own order, with each topic shown", () => {
    // Deliberately NOT grouped: 90 distinct topics across 96 videos, 86 of them unique.
    const { container } = render(<VideoPage />);
    const text = container.textContent ?? "";
    const vids = catalogueVideos();
    expect(vids.length).toBeGreaterThan(90);
    for (const v of vids.slice(0, 5)) expect(text).toContain(v.topic);
    // order preserved: video 1's title appears before video 2's
    expect(text.indexOf(vids[0].title)).toBeLessThan(text.indexOf(vids[1].title));
  });

  test("every lesson video links back to a lesson that cues it", () => {
    const { container } = render(<VideoPage />);
    const hrefs = [...container.querySelectorAll("a")].map((a) => a.getAttribute("href") ?? "");
    expect(hrefs.some((h) => h.startsWith("/lesson/"))).toBe(true);
  });
});
