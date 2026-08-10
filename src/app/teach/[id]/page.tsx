import { allLessonIds, loadLesson } from "@/content/load";
import ExportPptxButton from "@/components/ExportPptxButton";

export function generateStaticParams() {
  return allLessonIds().map((id) => ({ id }));
}

export default async function TeachPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = loadLesson(id);
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <p className="mb-2 text-xs uppercase tracking-wide text-amber-300/80">Teacher notes — do not share this link</p>
      <h1 className="gradient-text mb-4 text-2xl font-bold">{l.title}</h1>
      <ExportPptxButton lesson={l} />
      <div className="glass space-y-4 rounded-2xl p-4 sm:p-5">
        <div>
          <h2 className="mb-1 font-semibold text-white/90">Objectives</h2>
          <ul className="list-disc pl-6 text-white/75">{l.objectives.map((o) => <li key={o}>{o}</li>)}</ul>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white/90">Talking script</h2>
          <ol className="list-decimal space-y-1 pl-6 text-white/75">{l.teacherNotes.script.map((s) => <li key={s}>{s}</li>)}</ol>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white/90">Listen for (this lesson&apos;s mistakes)</h2>
          <ul className="list-disc space-y-1 pl-6 text-white/75">
            {l.teacherNotes.listenFor.map((s, i) =>
              typeof s === "string" ? (
                <li key={`${i}-${s}`}>{s}</li>
              ) : (
                <li key={`${i}-${s.item}`}>
                  <span className="text-white/90">{s.item}</span>
                  {s.makhraj ? <span className="text-white/50"> — {s.makhraj}</span> : null}
                  <div className="text-white/60">Mistake: {s.commonMistake}</div>
                  {s.whyItHappens ? <div className="text-white/50">Why: {s.whyItHappens}</div> : null}
                  <div className="text-white/75">Say: “{s.correctionCue}”</div>
                  {s.severityIfWrong ? (
                    <div className="text-white/50">
                      Severity: {s.severityIfWrong === "jali" ? "Jali (major)" : "Khafi (minor)"}
                    </div>
                  ) : null}
                </li>
              ),
            )}
          </ul>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white/90">Homework to assign</h2>
          <p className="text-white/75">{l.teacherNotes.homework}</p>
        </div>
        <div>
          <h2 className="mb-1 font-semibold text-white/90">Reference videos (audition before the lesson)</h2>
          <ul className="list-disc pl-6 text-white/75">{l.videos.map((v) => <li key={v.url}><a className="text-sky-300 underline" href={v.url} target="_blank" rel="noreferrer">{v.title}</a></li>)}</ul>
        </div>
      </div>
    </main>
  );
}
