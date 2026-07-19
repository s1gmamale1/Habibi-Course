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
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold">🚩 {cp.title}</h1>
      <p className="mb-6 text-stone-500">Live with your teacher · {cp.durationMinutes} minutes. A miss here is never a restart — revise the mapped lessons and retest.</p>
      <PrintButton />
      {cp.steps.map((s, i) => (
        <section key={s.name} className="mb-6">
          <h2 className="font-semibold">{i + 1}. {s.name}</h2>
          <p className="mb-2">{s.script}</p>
          {s.items && <DrillGrid drill={{ title: "", instructions: "", grid: [s.items] }} />}
        </section>
      ))}
      <h2 className="mb-2 font-semibold">Pass rubric</h2>
      <table className="mb-6 w-full border-collapse text-sm">
        <tbody>{cp.rubric.map((r) => (
          <tr key={r.criterion} className="border-b border-stone-200">
            <td className="py-2 pr-3">{r.criterion}</td>
            <td className="py-2 font-medium">{r.pass}</td>
            <td className="py-2 pl-3 text-stone-400">☐ pass ☐ revise</td>
          </tr>
        ))}</tbody>
      </table>
      <h2 className="mb-2 font-semibold">Weak spot → revision map</h2>
      <ul className="list-disc pl-6">{cp.revisionMap.map((m) => (
        <li key={m.weakSpot}>{m.weakSpot} → revise {m.lessons.join(", ")}</li>
      ))}</ul>
    </main>
  );
}
