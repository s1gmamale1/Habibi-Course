# Tajweed Course

A static-export Next.js platform for teaching Quranic Arabic letters and tajweed —
slide-deck lessons, printable practice sheets, a teacher-only notes route, and a
live checkpoint kit, driven by JSON lesson content validated against a Zod schema.

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
