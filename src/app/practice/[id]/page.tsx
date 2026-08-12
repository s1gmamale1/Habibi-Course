import { allLessonIds, allLessons, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { PrintButton } from "@/components/ProgressClient";
import { deriveGameData } from "@/games/derive";
// Side-effect imports: register the drills so `lesson.games` can resolve them.
//
// The tajweed barrel is load-bearing — nothing else imports those seven modules,
// and without this line they are tree-shaken away exactly as they were before it
// existed. The letters barrel is **not**, today: `GamePanel` imports all five of
// those modules by name for its literal tab list, so deleting this line changes
// nothing and no test can see it. Said plainly rather than hidden, the way
// `MAX_TIMED` is in `session.ts`. It stops being redundant the moment that
// literal list is replaced by the registry, which is the change that would
// otherwise un-register all six in silence.
import "@/components/games/tajweed";
import "@/components/games/letters";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const lesson = loadLesson(id);
  const gameData = deriveGameData(allLessons(), id);
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <h1 className="gradient-text text-2xl font-bold">Practice — {lesson.title}</h1>
      <p className="mb-6 text-white/60">15–20 minutes daily. Tap any Arabic item to hear it (or get its practice cue).</p>
      {/* The entry point, and the only place the practice engine is reachable:
          it owns what is due, the lesson's drills, and the session that runs
          between them. Client-side, because this page is a static export and
          the ledger lives in the browser. The print button is passed through so
          the page keeps its original order. */}
      <PracticeSession data={gameData} games={lesson.games}>
        <PrintButton label="🖨 Print for offline practice (optional)" />
      </PracticeSession>
      {lesson.practice.drills.map((d) => <DrillGrid key={d.title} drill={d} />)}
      <section className="glass mb-8 rounded-2xl p-4 print:hidden sm:p-5">
        <h3 className="mb-2 text-xl font-semibold text-white/90">Daily checklist</h3>
        <ul className="list-disc pl-6 text-white/75">{lesson.practice.dailyChecklist.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>
      <section className="glass rounded-2xl p-4 print:hidden sm:p-5">
        <h3 className="mb-2 text-xl font-semibold text-white/90">Linked videos</h3>
        <ul className="list-disc pl-6 text-white/75">
          {lesson.videos.map((v) => <li key={v.url}><a className="text-sky-300 underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}
        </ul>
      </section>
    </main>
  );
}
