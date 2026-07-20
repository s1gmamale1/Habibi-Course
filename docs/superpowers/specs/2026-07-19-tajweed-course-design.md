# Tajweed Course — Design Spec

**Date:** 2026-07-19
**Status:** Approved design, pending implementation plan

## What this is

A complete beginner-to-tajweed Quran reading course, taught live by the course owner to one student (a friend), delivered through a small web platform. Designed so the content can later scale into a public/global course without rework.

## Learner & teaching context

- **Student:** one adult, absolute beginner — cannot yet recognize Arabic letters. Native language is not English but learns in English.
- **Teacher:** the course owner. Reads tajweed at self-assessed 80–90% accuracy; not a scholar. The materials therefore encode authoritative references (pro qari audio, documented rules, listen-for checklists) so teaching leans on sources, not memory.
- **Lessons:** live (in person or call), 3×/week (Mon/Wed/Sat), ~45–60 min, using the platform's slide decks. Homework between lessons: 15–20 min/day using practice pages.
- **Course language:** English. Arabic terms transliterated and explained (ikhfa, madd, etc.).

## End goals (all four define "course complete")

1. Read any page of the mushaf with clean tajweed, unaided.
2. Memorize al-Fatiha + the last 10 surahs (al-Fil through an-Nas), recited with tajweed. Extendable further back if pace allows.
3. Know the tajweed rules by name and explain them (izhar vs ikhfa, madd types, etc.).
4. Read from a standard color-coded tajweed mushaf, knowing what each color demands.

## Curriculum — 3 sequential phases with checkpoint gates

Architecture: classic Qaida-first (Noorani Qaida model). Strictly sequential; hifz begins in Phase 3. Calendar is *suggested* — checkpoint gates decide actual advancement. Any lesson repeatable anytime; a failed checkpoint triggers targeted revision of weak units + retest, never a restart.

### Phase 1 — Letters & Sounds (~4 weeks, 12 lessons)

- **Unit 1.1 — The 28 letters:** isolated forms, names, sounds. Taught in shape-family groups (ب ت ث / ج ح خ / د ذ / ر ز…). Correct makhraj from day one, simply explained, imitating qari audio. Recognition + pronunciation only; no writing requirement.
- **Unit 1.2 — Letter forms & joining:** initial/medial/final shapes; reading letters inside connected clusters.
- **Unit 1.3 — Short vowels:** fatha, kasra, damma; full qaida grid (every letter × every vowel), then 2–3 syllable combinations.
- **Checkpoint 1 (live):** instant recognition of any letter in any position; acceptable makhraj for every letter; read any voweled syllable.

### Phase 2 — Reading Mechanics (~5 weeks, 14 lessons)

- Progression: tanwin → sukun (clusters) → shadda → madd letters (ا و ي long vowels) → hamzatul-wasl basics → real words → phrases → fully-voweled sentences (style modeled on the Uzbek reference channel's sentence-reading sequence).
- Ends with slow-but-correct sentence reading and first exposure to a real mushaf page (reading only, no rules).
- **Checkpoint 2 (live):** read unseen fully-voweled words and sentences correctly, unaided. The biggest gate in the course.

### Phase 3 — Tajweed & Quran (~9 weeks, 26 lessons, two parallel strands)

- **Rules strand:** noon sakinah & tanwin (izhar, idgham, iqlab, ikhfa) → meem sakinah → qalqalah → madd family (tabee'i, muttasil, munfasil, 'aarid, lazim) → lam of Allah & ra rules (tafkheem/tarqeeq) → waqf/stopping basics. Each rule is mapped to its color the day it is taught. **Color convention (owner decision 2026-07-19): follow the Quranly app's tajweed coloring style** — exact rule-to-color palette to be researched and pinned at Phase 3 content build (supersedes the earlier Dar Al-Maarifah default in research/syllabus docs; note goal 4's physical-mushaf transfer is checked against this choice then).
- **Hifz strand:** al-Fatiha first, then short surahs from an-Nas backward, memorized with the rules being learned, from qari audio.
- **Final checkpoint (live), four tests matching the four end goals:** (1) unseen mushaf page with tajweed; (2) recitation of memorized surahs; (3) oral quiz naming/explaining rules; (4) color-mushaf reading with color explanations.

**Total: ~18 weeks (~4.5 months), 52 lessons.**

## Platform

**Stack:** Next.js (App Router), static-first, deployed to Vercel. One link sent to the student; works on phone and laptop. **No accounts, no backend, no database in v1.** Progress lives in localStorage; the teacher is the real gradebook. (Chosen over React Native for speed and no-app-store delivery.)

### Page types

1. **Course map (home):** whole journey visible — 3 phases, lessons as nodes, checkpoints as gates, done/current state. Locking is visual only; nothing is actually blocked.
2. **Lesson pages:** each lesson is an in-app fullscreen slide deck (swipe/arrow keys): concept slides + drill slides. Used live by the teacher and re-opened at home by the student. Every Arabic item is tap-to-hear. Tap-to-hear resolves to one of three states per item — a licensed qari clip, a timestamped YouTube cue, or a teacher-voice practice cue — declared explicitly per item in the content schema (see `docs/research/addenda/gap-1.md`); no item is silently non-functional.
3. **Practice pages:** per-lesson homework — drill grids (letter × vowel tables, word lists) with tap-audio, shadow-this-recording loops, daily practice checklist. Print-friendly CSS so any drill sheet becomes a paper handout.
4. **Checkpoint pages:** test script per gate — what to ask, reading passages, scoring rubric (pass / revise-these-units), space to note results.

### Teacher layer

Separate `/teach` route (not sent to the student, no auth — obscurity is fine for v1): per-lesson talking script, **listen-for list** (the documented beginner mistakes for that lesson's content, e.g. ح vs ه, ع vs أ), and homework to assign.

### Arabic rendering

- Quran text: KFGQPC Uthmanic font. Qaida/drills: Amiri or Noto Naskh.
- Full harakat rendering; per-letter color coding via spans, following standard tajweed color-mushaf conventions (so end goal 4 is trained by the UI from Phase 3 day one).

### Content model

Every lesson is a structured content file (MDX/JSON): slides, drills, audio refs, teacher notes. The renderer is separate from the content, making the curriculum portable to future formats (pptx export, mobile app, paid platform) without rewriting.

## Content sourcing (all free; licenses verified during research step)

- **Quran text:** Tanzil or QUL (Quranic Universal Library) Uthmani text with full harakat. Quran text is NEVER hand-typed.
- **Verse & word audio:** everyayah.com / QUL verse-by-verse recordings. Primary qari: Husary Mu'allim (teacher edition, recorded for learners); alternate: Minshawi. Word-by-word audio from QUL for Phase 2–3 drills.
- **Letter/qaida audio:** openly licensed qaida audio sets where available; gaps covered by linking timestamps in Arabic101 videos and the Uzbek reference channel (linking/embedding YouTube, never re-hosting their audio).
- **Fonts:** KFGQPC Uthmanic (free/official), Amiri, Noto Naskh (open).
- **Curriculum references:** Noorani Qaida progression as Phase 1–2 backbone; cross-checked against Arabic101 playlists (https://www.youtube.com/@Arabic101/playlists) and the Uzbek channel Muallimi Soniy (@MuallimiSoniy). Note: https://youtu.be/VhRHKdPcNPA is that channel's 4-hour alphabet/harakat compilation (Phase 1 reference); the sentence-to-Quran reading sequence is its "Qur'on o'qishni o'rganish" playlist (PLgrueUfOSy6uYsDGmnz1uEFuEv1kFALAC) — see `docs/research/uzbek-channel.md`.

## Build order (teaching starts before the course is fully built)

1. **Research & syllabus:** survey sources, produce the full 52-lesson syllabus (every lesson's contents, drills, audio refs), verify licenses. → *Deliverable: syllabus doc (master blueprint).*
2. **Platform skeleton:** course map, slide-deck engine, tap-audio player, fonts, print CSS, Vercel deploy, one sample lesson. → *Deliverable: the live link.*
3. **Phase 1 content:** all 12 lessons + drills + teacher notes + Checkpoint 1 kit. → *Deliverable: teaching begins.* 🎯
4. **Phase 2 content built while student is in Phase 1; Phase 3 while in Phase 2.** Content stays ahead of the learner; early lessons inform later ones.

## Quality checks

- Scripted check: every audio reference resolves; every Quran string matches the verified source text.
- Phone-screen QA pass per lesson (student is mobile-first).
- Teacher listen-for lists sourced from references, not from memory.

## Out of scope for v1 (deliberate)

- Accounts, auth, payments, multi-student support, analytics — v2 if the course goes global.
- Uzbek/other language versions (content model should not preclude them).
- Recording original audio.
- Writing/calligraphy instruction (recognition and recitation only). **Superseded 2026-07-20 — see Owner revisions below: notebook writing practice is now in scope.**
- Advanced tajweed (qira'at variants, advanced waqf) beyond the listed rules.

## Owner revisions (2026-07-20)

Feedback from the course owner after the platform skeleton and Phase 1 content were reviewed live. These override the corresponding sections above.

- **Homework model changed:** notebook WRITING practice (e.g. 4 rows per letter + memorize) replaces the print-flashcard homework described earlier, and writing is now **in scope** — this supersedes the "Writing/calligraphy instruction... recognition and recitation only" line under Out of scope for v1. Printable drill/flashcard sheets remain available as an optional aid, not the primary homework mechanism.
- **Timestamp policy tightened:** `youtube-cue` audio (see `AudioSourceSchema`, `src/content/schema.ts`) is allowed **only** for videos dedicated to a single letter, cued at `startSeconds: 0`. Deep-link timestamps into multi-letter compilation videos are **disabled pending human audit** — spot-checking found several landed on unrelated moments in the source video. Existing compilation-timestamp references should be treated as unverified until re-checked by a human against the actual video.
- **Every Arabic term gets an inline translation on first use** — no bare transliteration or Arabic term introduced without a plain-English gloss alongside it.
- **Drill instructions address the student directly** ("Point to each letter and say its name," not teacher-facing phrasing).
- **Letter slides show positional forms + a real example word:** the `letter` slide now carries an optional `forms` object (isolated/initial/medial/final) and an optional `example` word (`arabic` + `translit` + `meaning`), rendered in `SlideDeck`. See `src/content/schema.ts` and `src/components/SlideDeck.tsx`.
- **Makhraj slides carry diagrams:** `letter` and `concept` slides gained an optional `image` field, expected to point at `/images/makhraj/*.svg`, rendered above/within the slide.
- **Lessons show their video links in a visible section:** the `/lesson/[id]` page previously passed `videos` only to `/teach`, leaving them "nowhere to see" per the owner — it now renders a "Videos for this lesson" section beneath the slide deck when a lesson has videos.
