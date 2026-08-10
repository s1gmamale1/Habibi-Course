---
type: index
id: verification-log
status: verified
---

# Verification Log

`npm run check:library` proves what a script can prove: schema shape, resolvable links,
and that every quoted Qur'anic example occurs verbatim in the pinned corpus. **It cannot
prove that a rule is described correctly.** That is what this log is for — the human half.

A note is `status: verified` only when a person has checked it against its cited source
and recorded that here.

## Machine-verified

| Date | What | Method | Result |
|---|---|---|---|
| 2026-08-10 | Pinned corpus integrity | byte size + line count on download | `quran-uthmani.txt` 1,376,504 bytes, 6,266 lines, 6,236 ayahs — matches upstream exactly |
| 2026-08-10 | Annotation set integrity | byte size + record count | `tajweed.hafs.json` 5,578,730 bytes, 6,236 records, 7 annotations on 1:1 |
| 2026-08-10 | The 18 cpfair rule keys | counted every `ann.rule` in the 5.58 MB dataset and diffed against `scripts/lib/rules.mjs` | **identical in both directions**, 60,057 annotations. No invented keys |
| 2026-08-10 | Syllabus example words | 12 words from `phase-3-tajweed.md` checked against the pinned corpus | **12/12 verbatim.** Confirms that syllabus's claim its Arabic was pulled programmatically, never hand-typed |
| 2026-08-10 | The gate bites | authored a note citing `وَتَبَّ` at 112:1 (it is 111:1) | exits 1 and names the mismatch; removing it returns exit 0 |
| 2026-08-10 | Rule dependency graph | every rule's `prerequisites` resolved against existing rule notes | **all 59 resolve.** The graph the Jazariyyah ordering exists to fix is sound |
| 2026-08-10 | Lesson id format | `taught_in` / `id` checked against `/^\d-\d{2}$/` | caught two real violations — [[Qalqalah-Sughra]] and [[Qalqalah-Kubra]] wrote `"3-6"`/`"3-7"`, which the content schema would silently fail to match. Fixed, and the gate now rejects it |

## Human-verified

| Date | What | Against | By | Result |
|---|---|---|---|---|
| 2026-08-10 | Quranly colour palette | direct observation of the app rendering al-Isrāʾ 17:1 | owner | **Family B.** Red = qalqalah (بْ in سُبْحَٰنَ and بِعَبْدِهِ, قْ in ٱلْأَقْصَا), blue = madd (ٱلَّذِىٓ, ءَايَٰتِنَآ), green = idghām maʿal ghunnah (لَيْلًا مِّنَ). **Contradicts Dar al-Maʿrifah, where red = madd** |
| 2026-08-10 | Uzbek series length | re-scraped the playlist | agent | **82 lessons, gap-free.** `docs/research/uzbek-channel.md`'s claim of 83 is wrong |
| 2026-08-10 | Qalqalah letter split | قطب جد against the two letter-note batches | agent | Corrected an error in the dispatch brief: ج was assigned to the wrong batch |

## Open — a script cannot settle these

| # | Item | Why it is stuck | Blocks |
|---|---|---|---|
| 1 | Exact Dar al-Maʿrifah hex values | the archive.org scan 503s in every attempt; needs a photographed physical copy | the Family A palette toggle only — Family B is the default and is pinned |
| 2 | Waqf-sign positions per ayah | **neither vendored dataset carries them.** The pinned Tanzil text omits waqf signs by design, and cpfair does not annotate them | the waqf-placement drill, and any in-mushaf sign rendering |
| 3 | Letter / qaida audio | ~1,493 `teacher-voice` cues are silent. Exhaustive search confirmed **no openly-licensed, full-coverage set exists**. Arabic TTS is not acceptable — it optimises for intelligibility, not makhraj, so it would teach errors | audio drills; ~20–30 min of owner-recorded audio fixes all of it with no schema change |
| 4 | يَبْصُۜطُ — sīn or ṣād | sources genuinely differ; ṣād predominates for Hafs/Shāṭibiyyah, some regional traditions read sīn | [[Hafs-Special-Words]], held at `needs-review` until checked against a Madinah mushaf **and** a licensed teacher |
| 5 | Every rule note's substance | 59 notes were authored from the research corpus and are `status: draft` | **nothing may be transcribed into a lesson until its rule note is `verified`.** The validator warns on this |

## Carried forward

- **`taught_in` numbers are provisional.** They were assigned per-batch by independent
  agents against no shared lesson map, because the lesson notes did not exist yet. They
  must be re-mapped against the final 36-lesson Unit 3 before any lesson is transcribed.
- **The hifz lesson→surah mapping in `phase-3-tajweed.md` §2.2 was built for 26 lessons.**
  Unit 3 now has 36. It must be regenerated, not copied.
## Unit 2 scope reconciliation — 2026-08-10

Checked against Phase 1 as shipped at commit `c385ad0` (15 lessons; Unit 1.4 =
`1-13`…`1-15`). Phase 1 went further than the Unit 2 plan assumed:

| Already taught in Phase 1 | Where | Consequence for Unit 2 |
|---|---|---|
| Sukūn as a closed syllable | `1-13` | `2-03`/`2-04` **extend** to multi-sukūn clusters; do not introduce |
| The five qalqalah letters, named and bounced | `1-13` | Unit 3.4 **revisits as a rule**, not as new letters |
| Hamza in all five seats; waṣl vs qaṭʿ at beginner level | `1-13` | `2-09` teaches the **full waṣl vowelling rules**, framed as "you met this in 1-13" |
| Tafkhīm sustained through the letter, **heard in the neighbouring vowel** | `1-14` | Unit 3.6 formalises the *ṣifah* behind a cue already given |
| ط bounces vs ظ is held | `1-14` | qalqalah/istiṭālah contrast already primed |
| ٱلضَّآلِّينَ with a held shadda and a six-count madd | `1-14` | shadda and madd lāzim are **previewed**; `2-05`–`2-08` systematise them |

**What remains genuinely new to Unit 2:** tanwīn (`2-01`, `2-02`) · shadda as a system
(`2-05`, `2-06`) · the three madd letters and leen (`2-07`, `2-08`) · full hamzat al-waṣl
vowelling (`2-09`) · and the application ladder — words → phrases → sentences → first
mushaf page (`2-10`–`2-14`), which is where **practical stopping** enters.

**Re-run this check if Phase 1 grows again.** It has grown once already, mid-plan.
