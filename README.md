# Tajweed Course

A static-export Next.js platform for teaching Quranic Arabic letters and tajweed —
slide-deck lessons, printable practice sheets, a teacher-only notes route with
one-click PPTX deck export, and a live checkpoint kit, driven by JSON lesson
content validated against a Zod schema.

Each lesson also carries interactive practice games (letter/word flashcards, a
letter quiz, a letter-form position puzzle, a word builder, and spot-the-letter),
derived at build time from the lesson content itself (`src/games/`): the letter
pool is cumulative across lessons, and word games only use words whose letters
have already been taught. The games appear as a slide near the end of each
lesson deck and in an "Interactive practice" section on each practice page
(excluded from printing).

## Commands

```bash
npm run dev         # local dev server
npm test             # vitest unit tests
npm run lint         # eslint
npm run check:refs   # content integrity checks (scripts/check-refs.mjs)
npm run build        # static export to out/
```

## Sharing

The app builds to a static `out/` directory. To share a lesson or the whole
course with a student or co-teacher, serve `out/` locally and expose it with a
quick tunnel:

```bash
npm run build
npx serve out
cloudflared tunnel --url http://localhost:3000
```

## Docs

See `docs/` for the spec and plans (`docs/superpowers/specs`, `docs/superpowers/plans`),
the course syllabus (`docs/syllabus/`), and background research (`docs/research/`).
