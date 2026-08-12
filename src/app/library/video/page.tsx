import Link from "next/link";
import { catalogueVideos, lessonVideos, playlists } from "@/library/video";
import { VideoEmbed } from "@/components/library/VideoEmbed";

export default function VideoPage() {
  const lessons = lessonVideos();
  const catalogue = catalogueVideos();

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Video</h1>
      <p className="mb-8 text-white/65">
        Videos are embedded from their channels, never re-hosted.
      </p>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">
          Used in lessons
        </h2>
        <ul className="grid gap-5">
          {lessons.map((v) => (
            <li key={v.id} className="glass rounded-2xl p-4">
              <VideoEmbed id={v.id} title={v.title} startSeconds={v.startSeconds} />
              <p className="mt-3 font-semibold text-white/90">{v.title}</p>
              <p className="mt-1 text-sm text-white/60">
                Cued in{" "}
                {v.lessonIds.map((id, i) => (
                  <span key={id}>
                    {i > 0 && ", "}
                    <Link href={`/lesson/${id}`} className="underline decoration-white/30 underline-offset-2">
                      lesson {id}
                    </Link>
                  </span>
                ))}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/*
        NOT grouped by topic, and that is a measured decision rather than a shortcut.
        The 96 topics are per-video subtitles, not categories: there are 90 distinct
        values, 86 of which appear exactly once, and normalising them still leaves 65
        buckets with 50 singletons. Grouping would render ninety sections of one video.

        Matching topics to the 59 rule notes was also tried and rejected: it covers only
        27 of 96, and it is confidently WRONG on some — "Idgham bila ghunnah" fuzzy-matches
        the `ghunnah` note rather than its own rule. A wrong association is worse than
        none in a course whose whole discipline is not asserting what it cannot verify.

        What this catalogue actually is: a numbered 96-part course. So it is shown in the
        channel's own order, with the topic as a subtitle. Linking videos to rules needs a
        hand-curated mapping in the vault, which this feature must not author — filed.
      */}
      <section className="mb-10">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">
          Muallimi Soniy — the full course, in order
        </h2>
        <ul className="grid gap-3">
          {catalogue.map((v, i) => (
            <li key={v.id} className="glass rounded-2xl p-4">
              <a
                href={`https://www.youtube.com/watch?v=${v.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2"
              >
                <span className="text-white/45">{i + 1}.</span> {v.title}
              </a>
              <p className="mt-1 text-sm text-white/60">{v.topic}</p>
              {v.titleOriginal && v.titleOriginal !== v.title && (
                <p className="mt-1 text-sm text-white/45" lang="uz">{v.titleOriginal}</p>
              )}
              <p className="mt-1 text-xs text-white/45">
                {v.channel}
                {v.duration ? ` · ${v.duration}` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Playlists</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {playlists().map((p) => (
            <li key={p.id} className="glass rounded-2xl p-4">
              <a
                href={`https://www.youtube.com/playlist?list=${p.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2"
              >
                {p.title}
              </a>
              <p className="mt-1 text-xs text-white/45">
                {p.channel}
                {p.videoCount ? ` · ${p.videoCount} videos` : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
