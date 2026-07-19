import { allLessonIds, loadLesson } from "@/content/load";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function TeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  return (
    <main className="mx-auto max-w-2xl p-6">
      <p className="mb-2 text-xs uppercase tracking-wide text-amber-700">Teacher notes — do not share this link</p>
      <h1 className="mb-4 text-2xl font-bold">{l.title}</h1>
      <h2 className="mb-1 font-semibold">Objectives</h2>
      <ul className="mb-4 list-disc pl-6">{l.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
      <h2 className="mb-1 font-semibold">Talking script</h2>
      <ol className="mb-4 list-decimal space-y-1 pl-6">{l.teacherNotes.script.map((s) => <li key={s}>{s}</li>)}</ol>
      <h2 className="mb-1 font-semibold">Listen for (this lesson's mistakes)</h2>
      <ul className="mb-4 list-disc space-y-1 pl-6">{l.teacherNotes.listenFor.map((s) => <li key={s}>{s}</li>)}</ul>
      <h2 className="mb-1 font-semibold">Homework to assign</h2>
      <p className="mb-4">{l.teacherNotes.homework}</p>
      <h2 className="mb-1 font-semibold">Reference videos (audition before the lesson)</h2>
      <ul className="list-disc pl-6">{l.videos.map((v) => <li key={v.url}><a className="underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}</ul>
    </main>
  );
}
