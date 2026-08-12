import { allNotes } from "./load";
import { catalogueVideos, lessonVideos, playlists } from "./video";
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
 * that the four note-backed boxes still sum to every in-scope note, so a note cannot
 * silently become unreachable from the landing page.
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
      blurb: "Lesson videos and the catalogued channels, grouped by topic.",
      href: "/library/video",
      count: catalogueVideos().length + lessonVideos().length + playlists().length,
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
      href: "/library/glossary",
      count: count("index"),
    },
  ];
}
