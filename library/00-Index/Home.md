---
type: index
status: verified
---

# Tajweed Course Library

The verified source of truth for all course content. Nothing becomes a JSON
lesson until it exists here and passes `npm run check:library`.

## Map

- **01-Sources** — every external source, its licence, and its status
- **02-Rules** — one note per tajweed rule
- **03-Letters** — one note per letter: makhraj, sifat, common mistakes
- **04-Curriculum** — lesson-by-lesson content
- **05-Pedagogy** — methodology, assessment, hifz method
- **99-Corpus** — vendored Qur'an text and tajweed annotations. Never hand-edit.

## Rules of this vault

1. **Qur'an text is never typed by hand.** Examples are verified against
   `99-Corpus/quran-uthmani.txt` by exact match. The validator has no override.
2. **Every factual claim cites a source note.**
3. A note is `status: verified` only when a human has checked it against its
   cited source. `draft` and `needs-review` are honest states — use them.
4. **Full text is vendored only for public-domain or openly-licensed works.**
   In-copyright books get a citation note recording what claim they support,
   never their text.
5. **Never re-host audio or video.** Both YouTube sources are Standard YouTube
   License: link and embed only.

## The corpus

`99-Corpus/quran-uthmani.txt` is cpfair's pinned 2017 Tanzil snapshot —
1,376,504 bytes, 6,236 ayahs. `99-Corpus/tajweed.hafs.json` is the matching
annotation set — 5,578,730 bytes, 60,057 annotations across 18 rules, CC BY 4.0.

**These two files belong together and to nothing else.** quran.com's
`text_uthmani` is a *different* text — it inserts U+0640 TATWEEL before
superscript alef, carries waqf signs the pinned text lacks, and splits the
basmala differently. Pairing cpfair offsets with quran.com text mis-highlights
nearly every ayah. Never mix them.
