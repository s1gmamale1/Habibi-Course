import { allPostSlugs, postBySlug } from "@/library/materials";
import { lexNote, renderTokens } from "@/library/markdown/render";
import { createHeadingSlugger } from "@/library/markdown/slug";

export function generateStaticParams() {
  return allPostSlugs().map((slug) => ({ slug }));
}

export default async function MaterialPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  return (
    <main className="mx-auto max-w-3xl p-6 pb-16">
      {post.date && <p className="mb-2 text-xs uppercase tracking-wide text-white/45">{post.date}</p>}
      <div className="library-prose">{renderTokens(lexNote(post.body), createHeadingSlugger())}</div>
    </main>
  );
}
