# Gap 1 — Tap-to-hear behavior for Phase 1 letter/harakat drill grids

**Date:** 2026-07-19
**Status:** Decision made this session. Not yet applied to spec/content-schema files (main session applies edits).
**Depends on:** `docs/research/letter-audio.md`, `docs/research/verified-resources.md` §4 (both re-confirmed below, no new sourcing needed — the missing piece was a UI/schema *decision*, not more searching).

---

## 1. The conflict, restated precisely

- Spec: "Every Arabic item is tap-to-hear" (lesson pages) and practice pages have "tap-audio" on "drill grids (letter × vowel tables...)".
- Research (re-confirmed this session, see §2): **no openly-licensed, full-coverage, per-cell audio exists** for the 28-letter alphabet, the 84-cell letter×harakat grid (fatha/kasra/damma), or isolated 2–3-letter qaida syllable combos. This is exhaustively searched and closed as a dead end, not a gap to keep researching.
- Nothing in the spec or research said what "tap-to-hear" *does* when there is no licensed mp3 for that specific cell. That's the undesigned conflict this doc closes.

## 2. Re-confirmed source reality (no new gap found, just re-verified live)

- `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=-YrfRpwFMe8&format=json` → 200, returns a valid embeddable `<iframe>` snippet. Confirms the Arabic101 Makharij Lesson 1 video is embeddable.
- `https://www.youtube.com/embed/-YrfRpwFMe8?start=10` → HTTP 200. Confirms the `embed/<id>?start=<seconds>` URL pattern used for timestamp-linking works mechanically.
- Everything else (no per-letter/per-harakat open audio anywhere: HF datasets, Wikimedia Commons, Internet Archive, commercial qaida apps/sites, QUL) stands as already exhaustively documented in `letter-audio.md` and `verified-resources.md` §4. Not re-litigated here.

## 3. Decision — three-tier audio-source model, one schema field per drill item

Every tap-to-hear item in the content schema (slides *and* practice-page drill grids) gets an explicit `audioSource` object. The renderer's tap-to-hear component branches on `audioSource.type`. There is **no item with an undefined/implicit audio state** — every item must declare one of the three types below, so "nothing to tap" is always an explicit authoring choice, never a silent bug.

```ts
type AudioSource =
  | { type: "qari-clip"; url: string; reciter: string }
    // A real, licensed audio file exists and resolves (everyayah.com Husary
    // Muallim ayah/word audio, or audio.qurancdn.com per-word audio).
    // Used for: all of Phase 2 word/sentence drills, all of Phase 3,
    // and any Phase 1 item where a short real Quranic word cleanly
    // isolates the target letter+harakat as its first syllable
    // (per letter-audio.md §8's word-substitution route).

  | { type: "youtube-cue"; videoId: string; startSeconds: number; title: string }
    // No standalone clip exists; bind the tap to a specific timestamp in a
    // vetted, embeddable YouTube video (Arabic101 makharij series or a
    // teacher-auditioned Noorani Qaida harakat-grid video). Embed only
    // (`youtube.com/embed/<id>?start=<s>`), never download.

  | { type: "teacher-voice" }
    // No licensed clip AND no suitable YouTube cue exists for this exact
    // cell (this is the actual state of most of the 84-cell harakat grid).
    // The tap icon is NOT hidden — see §4 UI behavior — it opens a
    // "practice cue" panel instead of playing audio.
```

This directly answers the critic's suggested action ("suppress the tap icon... or bind it to a YouTube-embed timestamp... encode that choice in the content schema") by doing **both**, selectively, per item, rather than picking one fallback for the whole grid.

## 4. UI behavior per tier (what actually happens when the student taps)

1. **`qari-clip`** — standard behavior already designed elsewhere in the platform: tap → play mp3 inline, tap again → replay. No change.
2. **`youtube-cue`** — tap → opens a small inline player (or modal) embedding `https://www.youtube.com/embed/{videoId}?start={startSeconds}&autoplay=1`, with a visible "via {title} ↗" caption/link so the student always knows they left the course's own audio and is watching a linked third-party video. Never auto-advances past the relevant few seconds' intent (start param only — no end trim is possible via the embed API, so the caption should tell the student roughly what to expect, e.g. "makhraj of ح, ~0:45–1:20").
3. **`teacher-voice`** — **the tap icon is shown, not hidden**, but tapping it does not play audio. It opens a lightweight "practice cue" popover with:
   - The letter/syllable rendered large (Amiri font).
   - One line of plain-English articulation guidance pulled from the lesson's own teacher notes (e.g. "ح: mid-throat, breathy, no vibration — as taught live").
   - A "listen live with your teacher" reminder line, since Phase 1 is taught 3×/week with immediate correction — this is the pedagogically-defensible design point already established in `letter-audio.md` §"Headline finding."
   - No dead end, no silent no-op: the icon always does *something* when tapped, it's just not audio playback for this tier.

   **Why not suppress the icon entirely** (the critic's other suggested option): spec's hard rule is "every Arabic item is tap-to-hear" — a silently-suppressed icon on 60–70% of the 84-cell grid (the realistic share with neither a qari clip nor a good YouTube cue) would look broken/inconsistent on a phone-first UI, and QA would flag missing icons as bugs during the "every audio reference resolves" scripted check. Keeping the icon but redefining its guaranteed contract as "always yields *something* useful" (audio, embedded video, or a practice cue) is the design that satisfies both the letter of the spec and the resource reality.

## 5. Populating each tier — content-authoring rule of thumb, mapped to units

| Unit | Item type | Default tier | Notes |
|---|---|---|---|
| 1.1 Letters, isolated (28 items) | Letter name + sound | `youtube-cue` where a matching Arabic101/17-part makhraj video exists (most letters do — see letter-audio.md §7); else `teacher-voice` | Teacher must audition every `youtube-cue` video once before it ships (already required in letter-audio.md §10.2) |
| 1.2 Letter forms & joining | Same letter in initial/medial/final shape | `youtube-cue` (reuse the Unit 1.1 cue; shapes aren't separately filmed) or `teacher-voice` | No new sourcing needed — inherits Unit 1.1's mapping |
| 1.3 Full harakat grid (84 cells) | Letter × fatha/kasra/damma | `teacher-voice` for the great majority of cells (no per-cell source exists at all — confirmed exhaustively); `qari-clip` for the specific cells that happen to match the first syllable of a short, already-sourced Quranic word (opportunistic upgrade only, not a requirement — see letter-audio.md §8); optionally ONE `youtube-cue` at the **grid level** (not per-cell) pointing at a vetted full Noorani-Qaida harakat-grid video, exposed as a single "hear the whole grid" button above the table, separate from the per-cell tap icons | This is the cell where the spec/reality conflict was sharpest; resolved by making `teacher-voice` the honest default rather than pretending coverage exists |
| 1.3 tail / Phase 2 syllables & real words | 2–3 letter combos, real short words | `qari-clip` once real Quranic words appear (QUL/everyayah pipeline, already sourced) | This tier effectively takes over from Phase 2 onward — the gap "disappears" here as already noted in letter-audio.md §10.7 |

## 6. Recommended concrete file edits (for the main session to apply — not done here)

1. **`docs/superpowers/specs/2026-07-19-tajweed-course-design.md`** — under "Practice pages" / "Every Arabic item is tap-to-hear", add one clause: *"Tap-to-hear resolves to one of three states per item — a licensed qari clip, a timestamped YouTube cue, or a teacher-voice practice cue — declared explicitly per item in the content schema (see gap-1 addendum); no item is silently non-functional."*
2. **Content schema** (wherever the lesson/drill JSON/MDX shape is defined, e.g. a future `content/schema.ts` or the syllabus doc's per-lesson data shape) — add the `AudioSource` union type from §3 above as the required shape of every drill item's `audio` field.
3. **Syllabus doc for Lessons 1.1–1.3 / 1.10–1.12** (wherever the master syllabus enumerates per-lesson drills) — for each letter/cell, fill in the concrete `audioSource` value using §5's rule of thumb: pull the exact `videoId`/`startSeconds` from the Arabic101 makharij playlist (`https://www.youtube.com/playlist?list=PL6TlMIZ5ylgpmlnN3EpkOec0tJ8OJZ5re`, already VERIFIED OK in `verified-resources.md` §6) per letter, defaulting to `teacher-voice` where no matching video segment is identified.
4. **`docs/research/verified-resources.md` §4** — add a one-line pointer: *"UI/schema resolution of this gap: see `docs/research/addenda/gap-1.md`."* (no other change needed there; the resource facts in §4 remain accurate and are not altered by this decision).
5. **Teacher notes template** (`/teach` route content) — for every `teacher-voice` item, the listen-for-mistakes list already required by the spec should double as the copy shown in the practice-cue popover (§4.3) — reuse, don't duplicate-author.

## 7. Explicit answer to the critic's gap statement

- **Does the tap icon get suppressed?** No, not globally — kept everywhere, contract redefined as "always yields something," per §4.
- **Is it bound to a YouTube timestamp instead?** Yes, for items where a vetted video segment exists (most of Units 1.1/1.2); no per-cell YouTube coverage exists for the 84-cell grid itself, so most Unit 1.3 cells fall through to `teacher-voice`, with one grid-level (not per-cell) YouTube cue as a supplementary "hear the whole grid" replay option.
- **Is this encoded in the content schema?** Yes — the three-variant `AudioSource` type in §3, required (non-optional) on every drill item, is the concrete schema encoding requested.
