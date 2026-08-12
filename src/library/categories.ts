import { allNotes } from "./load";
import { catalogueVideos, lessonVideos, playlists, arabic101Sections } from "./video";
import { allPosts, allAttachments } from "./materials";

export interface Category {
  id: string;
  label: string;
  blurb: string;
  href: string;
  count: number;
}

/**
 * The Library's six boxes, in the order the owner chose.
 *
 * Alphabet and Tajweed are the two halves of what used to be one "notes" view;
 * Video and Materials are new and are not note-backed. `categories.test.ts` asserts
 * both that the four note-backed boxes sum to every in-scope note, AND — separately,
 * because the sum alone doesn't prove it — that every note is actually LISTED on one
 * of those boxes' index pages. The sum invariant alone once let `Sifat.md` (an
 * `index` note) count toward "Glossary & reference (2)" while that card's `href`
 * pointed at `/library/glossary`, the Glossary note's OWN detail page — so Sifat was
 * counted but unreachable from any index. The href below now points at a real index
 * of every `type: "index"` note instead.
 */
export function categories(): Category[] {
  const notes = allNotes();
  const count = (t: string) => notes.filter((n) => n.meta.type === t).length;

  return [
    {
      id: "alphabet",
      label: "Alphabet",
      blurb: "All 29 letters — makhraj, sifat, and what each is confused with.",
      href: "/library/alphabet",
      count: count("letter"),
    },
    {
      id: "tajweed",
      label: "Tajweed rules",
      blurb: "Every rule the course teaches, with its sources and worked examples.",
      href: "/library/tajweed",
      count: count("rule"),
    },
    {
      id: "video",
      label: "Video",
      blurb: "Lesson videos, the full catalogued course, and the channel playlists.",
      href: "/library/video",
      count:
        catalogueVideos().length +
        lessonVideos().length +
        playlists().length +
        arabic101Sections().reduce((sum, s) => sum + s.videos.length, 0),
    },
    {
      id: "sources",
      label: "Sources",
      blurb: "The classical matns and data sets this course is built on.",
      href: "/library/sources",
      count: count("source"),
    },
    {
      id: "materials",
      label: "Materials",
      blurb: "Handouts, posts and downloads added alongside the course.",
      href: "/library/materials",
      count: allPosts().length + allAttachments().length,
    },
    {
      id: "glossary",
      label: "Glossary & reference",
      blurb: "Uzbek · Arabic · English terms, plus other reference notes.",
      href: "/library/reference",
      count: count("index"),
    },
  ];
}
