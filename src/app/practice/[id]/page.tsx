import { allLessonIds, allLessons, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { GamePanel } from "@/components/games/GamePanel";
import { DueTodayPanel } from "@/components/practice/DueToday";
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
      {/* The entry point, above the lesson's own drills: what is due, what needs
          work, and how consistently the learner has turned up. It reads the
          ledger in the browser, so it renders nothing at all during a static
          export — which is why it sits above content that does not depend on it
          rather than replacing any of it. */}
      <DueTodayPanel data={gameData} />
      <PrintButton label="🖨 Print for offline practice (optional)" />
      {/* `DueToday`'s one loud action scrolls here. */}
      <section id="interactive-practice" className="glass mb-8 rounded-2xl p-4 print:hidden sm:p-5">
        <GamePanel data={gameData} heading="Interactive practice" games={lesson.games} />
      </section>
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
