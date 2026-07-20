# WISHLIST

Capture inbox. Append-only — nothing here is scheduled. Scoped work gets promoted to `ROADMAP.md`.

## 2026-07-20 — deferred from the owner-feedback review round

- **Per-letter makhraj diagrams instead of 5 zone diagrams.** 18 tongue letters currently share one `lisan.svg` with the same highlight, so ت (tip), ض (side), ك (back) all look identical. The owner asked for diagrams so the student "wouldn't have to guess"; for tongue letters they still do. Would need ~10 more SVGs (tongue sub-zones) and a per-letter mapping in the content.
- **Makhraj SVGs are dark-theme only.** Strokes are light at 0.32–0.40 opacity on transparent; on a printed page or a light background they vanish. Add a `@media print` variant or a dark-stroke fallback. (Low urgency: printed sheets are drill grids, which carry no diagrams.)
- **`overview.svg` head outline is two subpaths**, leaving an open contour at the jaw/shoulder join; labels are ~10px at mobile render size.
- **Accessibility batch** (carried from the first build): tap popovers have no `role="dialog"`/`aria-live` and no Escape/outside-click dismissal; lesson-row links share identical accessible names ("Lesson"/"Practice") across rows; React list keys use content strings, so duplicate lines in future content would warn.
- **"Unit 1.1" vocabulary appears in student-facing text** but the app never shows unit boundaries — the student sees a slide headed "Lesson 1.1" and a body referring to "Unit 1.1". Either surface units in the course map or drop the term from student text.
- **`/teach/<id>` is obscurity-only** and ships in the same static bundle as student pages. Fine for one student; needs real gating before any public/commercial launch.
- **`api.quran.com` v4 is a legacy endpoint** used for Phase 2–3 content sourcing; Quran Foundation may sunset it. Mitigation (bake data into static content at build time) is planned but not executed.
- **Owner-recorded letter audio.** 1,493 tap targets are `teacher-voice` practice cues because no openly licensed per-letter/harakat audio exists. Recording ~20–30 min of the owner's own voice would upgrade them to `qari-clip` with **no schema change** — the `AudioSource` union already supports it.
- **`docs/research/intro-motivation.md` hadith were verified via sunnah.com mirrors**, not sunnah.com itself (Cloudflare blocks automated fetches). Worth one human pass over the 8 citations in a real browser.
- **Dar Al-Maarifah vs Quranly colour legend.** Phase 3 will follow the Quranly app's tajweed colouring (owner decision); the exact rule→colour palette still needs to be pinned from a primary source at Phase 3 content build.
