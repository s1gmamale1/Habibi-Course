import { allLessonIds, loadLesson } from "@/content/load";
import { SlideDeck } from "@/components/SlideDeck";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  return (
    <>
      <SlideDeck title={l.title} slides={l.slides} videosAnchor={l.videos.length > 0} />
      {l.videos.length > 0 && (
        <section id="lesson-videos" className="mx-auto max-w-2xl p-6">
          <div className="glass rounded-2xl p-4 sm:p-5">
            <h2 className="mb-2 font-semibold text-white/90">Videos for this lesson</h2>
            <ul className="list-disc space-y-1 pl-6 text-white/75">
              {l.videos.map((v) => (
                <li key={v.url}>
                  <a className="text-sky-300 underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
