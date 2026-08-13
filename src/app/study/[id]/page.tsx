import { allLessonIds } from "@/content/load";
import { lessonSet } from "@/games2/studySet";
import { SetScreen } from "@/components/practice/SetScreen";
// Side-effect: register the slice games so the registry is populated.
import "@/games2/games";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function StudyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const set = lessonSet(id);
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <h1 className="gradient-text mb-4 text-2xl font-bold">Study — {set.title}</h1>
      <SetScreen set={set} />
    </main>
  );
}
