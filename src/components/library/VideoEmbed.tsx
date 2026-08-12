/**
 * One embedded video.
 *
 * `youtube-nocookie.com` is deliberate, not an optimisation: this course teaches
 * children, and the standard host sets tracking cookies before anyone presses play.
 *
 * Embedding is the ONLY permitted use of these channels — both are Standard YouTube
 * License. Never download, extract audio from, proxy or re-host any of them.
 */
export function VideoEmbed({
  id,
  title,
  startSeconds,
}: {
  id: string;
  title: string;
  startSeconds?: number;
}) {
  const src =
    `https://www.youtube-nocookie.com/embed/${id}` +
    (startSeconds ? `?start=${startSeconds}` : "");
  return (
    <div className="aspect-video w-full overflow-hidden rounded-xl border border-white/10">
      <iframe
        src={src}
        title={title}
        loading="lazy"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
        className="h-full w-full"
      />
    </div>
  );
}
