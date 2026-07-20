import { allCheckpointIds, loadCheckpoint } from "@/content/load";
import { DrillGrid } from "@/components/DrillGrid";
import { PrintButton } from "@/components/ProgressClient";

export function generateStaticParams() {
  return allCheckpointIds().map((id) => ({ id }));
}

export default async function CheckpointPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cp = loadCheckpoint(id);
  return (
    <main className="mx-auto max-w-2xl p-6 pb-16">
      <h1 className="gradient-text text-2xl font-bold">🚩 {cp.title}</h1>
      <p className="mb-6 text-white/60">Live with your teacher · {cp.durationMinutes} minutes. A miss here is never a restart — revise the mapped lessons and retest.</p>
      <PrintButton />
      {cp.steps.map((s, i) => (
        <section key={s.name} className="glass mb-6 rounded-2xl p-4 sm:p-5">
          <h2 className="font-semibold text-white/90">{i + 1}. {s.name}</h2>
          <p className="mb-2 text-white/70">{s.script}</p>
          {s.items && <DrillGrid drill={{ title: "", instructions: "", grid: [s.items] }} />}
        </section>
      ))}
      <h2 className="mb-2 font-semibold text-white/90">Pass rubric</h2>
      <div className="glass mb-6 overflow-hidden rounded-2xl">
        <table className="w-full border-collapse text-sm">
          <tbody>{cp.rubric.map((r) => (
            <tr key={r.criterion} className="border-b border-white/10">
              <td className="py-2 pl-3 pr-3 text-white/80">{r.criterion}</td>
              <td className="py-2 pr-3 font-medium text-white/90">{r.pass}</td>
              <td className="py-2 pr-3 text-white/40">☐ pass ☐ revise</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
      <h2 className="mb-2 font-semibold text-white/90">Weak spot → revision map</h2>
      <ul className="list-disc pl-6 text-white/70">{cp.revisionMap.map((m) => (
        <li key={m.weakSpot}>{m.weakSpot} → revise {m.lessons.join(", ")}</li>
      ))}</ul>
    </main>
  );
}
