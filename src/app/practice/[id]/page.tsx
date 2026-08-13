import { allLessonIds, allLessons, loadLesson } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PracticeSession } from "@/components/practice/PracticeSession";
import { PrintButton } from "@/components/ProgressClient";
import { deriveGameData } from "@/games/derive";
// Side-effect imports: register the drills so `lesson.games` can resolve them.
//
// The tajweed barrel is load-bearing — nothing else imports those seven modules,
// and without this line they are tree-shaken away exactly as they were before it
// existed. Those seven drills are not ported into the games2 slice, so this stays
// even after the slice's own registry is wired in below.
//
// The old letters barrel (`@/components/games/letters`) is dropped here rather
// than kept: it registered five letter drills into the *old* `GameRegistry`, but
// `GamePanel` never looks them up there — it imports `Flashcards`, `LetterQuiz`,
// `FormSwap`, `SpotTheLetter`, and `WordBuilder` by name for its own literal tab
// list, and no lesson's `games` list (checked across `content/lessons/*.json`)
// names a letter drill id through `getGames`. Dropping it changes nothing
// reachable; `SLICE_GAME_IDS` below is what a session actually plans over now.
import "@/components/games/tajweed";
import "@/games2/games";

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
      <a href={`/study/${id}`} className="cta-secondary mb-4 inline-block rounded-full px-4 py-2 text-sm">
        📚 Study this set
      </a>
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
