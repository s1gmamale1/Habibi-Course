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
      <SlideDeck title={l.title} slides={l.slides} />
      {l.videos.length > 0 && (
        <section className="mx-auto max-w-2xl p-6">
          <h2 className="mb-2 font-semibold">Videos for this lesson</h2>
          <ul className="list-disc space-y-1 pl-6">
            {l.videos.map((v) => (
              <li key={v.url}>
                <a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
