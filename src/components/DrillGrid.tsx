import type { Drill } from "@/content/schema";
import { TapToHear } from "./TapToHear";

export function DrillGrid({ drill }: { drill: Drill }) {
  return (
    <section className="drill glass mb-8 break-inside-avoid rounded-2xl p-4 sm:p-5">
      <h3 className="mb-1 text-xl font-semibold text-white/90">{drill.title}</h3>
      <p className="mb-4 text-white/60">{drill.instructions}</p>
      {drill.grid.map((row, i) => (
        <div key={i} dir="rtl" className="mb-3 flex flex-wrap gap-3">
          {row.map((it, j) => (
            <span key={`${it.arabic}-${j}`} className="drill-cell">
              <TapToHear item={it} size="lg" />
              <span className="tally mt-1 hidden text-xs tracking-widest text-white/40">☐☐☐☐☐☐☐☐☐☐</span>
            </span>
          ))}
        </div>
      ))}
    </section>
  );
}
