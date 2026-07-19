import { allLessonIds, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PrintButton } from "@/components/ProgressClient";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = loadLesson(id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">Practice — {lesson.title}</h1>
      <p className="mb-6 text-stone-500">15–20 minutes daily. Tap any Arabic item to hear it (or get its practice cue).</p>
      <PrintButton />
      {lesson.practice.drills.map((d) => <DrillGrid key={d.title} drill={d} />)}
      <section className="mb-8 print:hidden">
        <h3 className="mb-2 text-xl font-semibold">Daily checklist</h3>
        <ul className="list-disc pl-6">{lesson.practice.dailyChecklist.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section className="print:hidden">
        <h3 className="mb-2 text-xl font-semibold">Linked videos</h3>
        <ul className="list-disc pl-6">
          {lesson.videos.map((v) => <li key={v.url}><a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}
        </ul>
      </section>
    </main>
  );
}
