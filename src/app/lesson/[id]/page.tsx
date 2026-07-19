import { allLessonIds, loadLesson } from "@/content/load";
import { SlideDeck } from "@/components/SlideDeck";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  return <SlideDeck title={l.title} slides={l.slides} />;
}
