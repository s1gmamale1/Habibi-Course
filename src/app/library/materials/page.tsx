import Link from "next/link";
import { allPosts, allAttachments } from "@/library/materials";

const kb = (bytes: number) => `${Math.max(1, Math.round(bytes / 1024))} KB`;

export default function MaterialsPage() {
  const posts = allPosts();
  const files = allAttachments();

  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      <h1 className="gradient-text mb-2 text-3xl font-bold">Materials</h1>
      <p className="mb-8 text-white/65">Handouts, posts and downloads added alongside the course.</p>

      {posts.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Posts</h2>
          <ul className="grid gap-3">
            {posts.map((p) => (
              <li key={p.slug} className="glass rim-static rounded-2xl p-4">
                <Link href={`/library/materials/${p.slug}`}>
                  <span className="font-semibold text-white/90">{p.title}</span>
                  {p.date && <span className="ml-2 text-xs text-white/45">{p.date}</span>}
                  {p.summary && <p className="mt-1 text-sm text-white/65">{p.summary}</p>}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-white/55">Downloads</h2>
        {files.length === 0 ? (
          <p className="text-sm text-white/50">
            Nothing here yet. Files added to <code className="rounded bg-white/10 px-1">public/materials/</code> appear on this shelf.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {files.map((f) => (
              <li key={f.slug} className="glass rounded-2xl p-4">
                <a href={f.href} className="font-semibold text-white/90 underline decoration-white/30 underline-offset-2">
                  {f.title}
                </a>
                <p className="mt-1 text-xs text-white/45">{kb(f.bytes)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
