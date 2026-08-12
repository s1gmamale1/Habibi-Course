# WISHLIST

Capture inbox. Nothing here is scheduled — scoped work gets promoted to `ROADMAP.md`.

> **Triaged 2026-08-11.** Every item below was checked against the code rather than
> carried forward on trust. Five were already done and have been removed; four were
> stale in their details and are corrected. What is left is open as of this date.
> The removals are listed at the bottom so the history is not simply lost.

---

## 2026-08-12 — Sound effects where relevant *(owner override of a recorded constraint)*

**Owner asked for this directly.** It reverses a line the practice-engine plan set deliberately, so both the original reasoning and the reversal are recorded here rather than quietly dropped.

**What the plan said** — `docs/superpowers/plans/2026-08-12-practice-engine.md:503`:

> No UI sound: the audio channel belongs to recitation, and a chirp competing with a madd example is actively harmful.

**Why that does not forbid all sound.** The stated reason is *collision with recitation*, not sound as such. That scopes the answer instead of contradicting it: sound is safe exactly where the audio channel is otherwise idle, and stays banned where it is not. "Where relevant" should be read as "where nothing is being recited."

**Where sound is safe:**

- Objective drills with no audio of their own — `letter-quiz`, `spot-the-letter`, `form-swap`, `word-builder`, `rule-identifier`, `family-sorter`. A short, quiet correct/incorrect tone.
- Session-level events in `SessionRunner`: a concept promoted to a new mastery band, the session completing.
- `DueToday` — arguably nothing; it is a status panel, not an interaction.

**Where sound must never play:**

- **Any drill that plays or will play recitation.** `TapToHear`, `listen-identify`, and every cue that becomes real audio when Phase 5 lands. A chirp over a madd example is the exact harm the original line named.
- **`GhunnahTimer` and `MaddCounter` while timing.** The learner is holding a sound and listening to themselves; a UI tone corrupts the very thing being measured.

**Constraints that carry over from the gamification research** — these are not negotiable just because the medium changed:

- **A wrong answer gets an informational tone, never a punishing one.** Same rule as the wording of the mastery bands: performance-contingent punishment is what undermines intrinsic motivation (d = −0.28, 128 studies). A neutral "not that one" is fine; a sad trombone is not.
- **No reward fanfare tied to a score**, because there is no score. Sound may mark *events*, never *earnings* — the same line that keeps XP, coins and badges out.
- **Off by default, or a visible mute that persists.** Respect `prefers-reduced-motion` as a proxy signal for reduced sensory load, and never autoplay on page load — browsers block it anyway and it would be a bug report rather than a feature.
- **Never a substitute for the visual verdict.** The feedback bar already names the rule and the violated condition; sound is redundant reinforcement, so a muted learner loses nothing.

**Implementation note.** Files must be tiny and self-hosted — no CDN, no third-party pack with an unverified licence. Licence gets recorded in `library/` like every other vendored asset. Openly-licensed UI sound is plentiful (CC0 sets exist), so this is not the acquisition problem the recitation audio is.

**Not scoped, not scheduled.** Blocked on nothing; it just has not been designed.

---

## 2026-08-12 — MANDATORY: a gamified check at the end of every lesson

**Owner requirement, not yet scoped.** Every lesson must end with a **compulsory** gamified test that establishes whether the learner actually learnt something — not an optional practice tab they can skip.

This is a genuinely different thing from the practice engine just built, and the difference matters:

| | Practice engine (built) | End-of-lesson check (this) |
|---|---|---|
| When | Any time, learner-initiated | **On finishing a lesson, compulsory** |
| Picks items by | What is *due* across all 47 concepts | **What this lesson just taught** |
| Purpose | Long-term retention | **Did this lesson land, right now** |
| Failure means | Schedule it sooner | Needs a decision — see below |

**The engine is most of the way there.** `planSession` already assembles a session and `SessionRunner` already runs one with a wrong-answer tail. What is missing is a lesson-scoped variant: draw exemplars from *this lesson's* concepts rather than from the due queue, and gate the lesson's completion on it.

**Design questions to settle before building**, none of which the practice engine answers:

- **What does failing mean?** Do not bolt on hearts or a lockout — the research is clear that punishing mistakes terminates the session at the moment of highest instructional value, and Duolingo abandoned hearts on exactly those grounds. Most likely: it cannot be failed, it simply keeps going until the concepts are answered, and a struggling learner leaves with those concepts flagged and scheduled sooner.
- **Does it gate the lesson checkbox?** `ProgressClient` currently lets a learner self-declare a lesson done. A compulsory check makes that declaration evidence-backed for the first time — which is a real improvement, but decide it deliberately.
- **It must not touch the human checkpoints.** Those are live oral gates with a teacher. This is a per-lesson check, and the two must not be confused.
- **It writes to the same ledger.** No second store, no separate "test score" concept. A checked answer is an attempt like any other, so it feeds the same scheduler.

---

## 2026-08-12 — bugs and findings from the practice-engine build

Every task in `docs/superpowers/plans/2026-08-12-practice-engine.md` reported what it found and deliberately left alone. Collected here so nothing is lost. **None blocks the branch**; all are known and none is a regression.

### Data honesty

- ~~**`scoreHold()` returns `correct: false` when uncalibrated**~~ — ✅ **fixed 2026-08-12** (`a0062d3`). Returns `null`. The render collapsed the same distinction by truthiness and would still have shown the learner "✗", so that was fixed alongside; `data-state` now reports `unscored` rather than `wrong`.
- ~~**Nothing validates that a `conceptId` is one of the 47.**~~ — ✅ **fixed 2026-08-12** (`f8546fa`). `isConceptId` at the append boundary; `appendAttempt` throws. **The guard was not hypothetical: four test fixtures already carried `"idgham"`**, which is not one of the 18. The check is asymmetric on purpose — rules against the closed list, letters structurally as one Arabic grapheme, because the 29 taught letters are derived per lesson behind `node:fs` and this must run in a browser. So a malformed id is caught and a wrong-but-well-formed letter is not. The read path stays permissive: a retired rule was still answered.
- **`family-sorter`'s `itemKey` is true only in the weak sense** that the fragment *was displayed* — its question is the whole board, so the row does not claim the attempt was about that fragment. Declared in the file with a test pinning it, so a future "fix" that narrows the board fails.

### Session behaviour

- **A timed drill can be drawn into the tail.** `ghunnah-timer` costs 2 slots and needs three calibration holds; as a retry it is a long coda. No "prefer a non-timed exemplar for the tail" rule was added — deliberately unrequested scope, but worth a decision.
- **The tail is outside the 14-slot budget** — bounded by item count (6), not slots. A session with two timed retries runs longer than "14 slots" suggests, and the progress bar will show it.
- **`GhunnahTimer`'s two-slot cost is invisible to the progress bar** — `progress` counts items, not slots, so a held drill reads as one unit.
- **A drill's own "next" button advances rounds the session does not know about**, and those extra rows carry the planned `itemKey`. The planned question honours the exemplar; afterwards the drill chooses again. Pinned with a test rather than left to drift.
- **`submit` after completion is a silent no-op** — no row, no tail. If a late drill result should warn, the hook currently offers nothing to warn with.

### Reachability and wiring

- ~~**`DRILL_MODES` lists `word-flashcards`, which can never be planned**~~ — ✅ **fixed 2026-08-12** (`67bf1f2`). **Both** decks were dead by then, `letter-flashcards` having become unplannable when `UNGRADED_GAME_IDS` excluded it. The old test could not have caught this and admitted so in its own comment — `shapeOf` falls back to `recognition` for an absent id, exactly what the entries claimed — so the new tests assert on `DRILL_MODES`' keys against `UNGRADED_GAME_IDS` in both directions.
- **A lesson naming a letter drill in `games:` gets a duplicate tab** — the literal list shows it and the registry appends a second. Pinned with an assertion so wiring the tab list to the registry trips a test that explains itself. Nothing ships doubled today.
- **`GamePanel`'s literal tab list is still not wired to the registry** — deliberately out of scope throughout, but it is the change that would un-register the letter drills in silence if done carelessly.
- **`|| s.flagged` in Due Today's weak filter selects nothing today** — every flagged concept is already `isWeak`, so the two coincide numerically. Kept with a disclosure comment; what the flag *does* change is the **order**.

### Hygiene

- ~~**`SpanTapper` still uses `Date.now()` inline**~~ — ✅ **fixed 2026-08-12** (`8bb5618`). Injected `now`, matching the other ten drills. It mattered because `at` is what `orderedAttempts` sorts on and what `schedulesFromLedger` cuts on, so an uninjectable clock made that drill's scheduling consequences untestable.
- **`MaddCounter`'s `held` prop and `useSwapPuzzle`'s `shuffled` call `Math.random()` at mount**, inside effects. Would trip a purity guard of the kind `session.ts` already has.
- **No storage-quota handling.** `appendAttempt` rejects and `useSession` swallows-and-counts via `writeFailures`, which is the right failure mode — a lost row beats a lost session — but nothing surfaces it beyond one quiet line.
- **`derive()` and `schedule` grade the same attempt on two scales** (EWMA wrongness vs FSRS rating). They share `missRatio` and `TOLERANCE` and agree at 25%, but nothing enforces that they stay in step. If the weak list and the due queue ever visibly disagree, that is the seam.
- **Interval fuzz is deliberately off** — the schedule is replayed from the ledger on every load, so a randomised interval would put the learner somewhere different on each page load from the same history. Per-day load-balancing would need a seeded strategy, not `enable_fuzz`.
- **`ts-fsrs` deprecates `Card.elapsed_days`** for 6.0.0; `ConceptSchedule` inherits it. Nothing reads it — do not start.
- **`D7` (UTC vs local day boundary) is a no-op mutant on a UTC runtime.** The two-directional test kills it in any non-zero offset, and encoding an offset would make the suite machine-dependent. Worth knowing if CI ever runs in UTC — **it does**, on `ubuntu-latest`.

### The one follow-up that finishes the feature — ✅ **DONE 2026-08-12**

- ~~**Wire `DueToday`'s start button to launch a real planned session.**~~ Shipped as `src/components/practice/PracticeSession.tsx`. It was **larger than this entry claimed**: `SessionRunner` was rendered nowhere in `src/` at all, so the app wrote **zero ledger rows** and `DueToday` read an empty store on every load. The button was one of two missing connections, not the only one.

### Found by mounting it — still open

- **Free practice records nothing, and cannot without a decision.** `GameResult` carries no `conceptId` — the session knows the concept only because the *plan* assigned it. So a drill answered outside a session has no truthful concept to fold onto, and inventing one is exactly what the ledger's honesty rules forbid. The four objective letter drills produce real verdicts in free play and all of them are discarded. Closing it means widening `GameResult` so a drill reports what it asked about; that is an owner-visible design change, not a chore.
- **`letter-flashcards` advertises exemplars it cannot grade.** Excluded from session planning via `UNGRADED_GAME_IDS` (`src/practice/session.ts`), because `SessionRunner` gates its continue button on a verdict and a planned deck would strand the learner. The exclusion is right on the merits, but the registry entry still advertises exemplars that now serve only its `startId` targeting — worth either removing or documenting as that.

---

## 2026-08-11 — the next product, as three briefs

The owner's three ideas, written so a **dedicated agent can pick one up cold**. A fourth — an
AI assistant/tutor — is explicitly *future* and is kept separate at the end.

### Read this first: they are not independent, and they cannot share a worktree

**Dependency order is real, not preference:**

```
  IDEA 3 (Library)  ─── no dependencies ──────────────► shippable today
  IDEA 1 (Accounts) ─── needs the ADR-007 runtime flip ─┐
  IDEA 2 (Practice) ─── needs Idea 1's schema ──────────┘ persistence is the whole job
```

**Idea 3 depends on nothing** and runs on the current static export. **Idea 2's substance is
persistence**, so it inherits whatever Idea 1 decides. Starting 2 before 1 means inventing a
storage layer twice.

**File ownership, to stop three agents colliding.** Each writing agent gets its **own
worktree** and only these paths. Anything outside its list, it proposes rather than edits:

| Idea | Owns | Must not touch |
|---|---|---|
| **1 Accounts** | `next.config.ts`, `middleware.ts`, `src/app/(auth)/**`, `src/server/**`, `src/db/**` | `src/components/games/**`, `content/**`, `library/**` |
| **2 Practice** | `src/components/games/**`, `src/games/**`, practice routes | `next.config.ts`, auth/session code, `content/**` |
| **3 Library** | `src/app/library/**`, its own components | everything above, `content/**`, `library/**` |

**Nobody edits `content/` or `library/`.** Those are the vault and its transcriptions, governed
by ADR-003 and the `check:library` gate. A feature agent that "fixes" a lesson JSON silently
desynchronises it from its note.

**Every agent must leave `npm test`, `npm run lint` and `npm run check:library` green**, and
must not weaken a gate to pass. 423 tests, 0 lint errors, 0 library errors is the floor.

---

### IDEA 1 — Accounts: registration, login, account management

**Goal.** People can register, log in, and see their own progress on any device.

**The blocking prerequisite.** This is the commit that flips `output: "export"` →
`"standalone"` per **ADR-007**. The migration is already **proven** — built, served, five
routes 200, all 230 pages still SSG — so this is a three-line config change, not a project.
Read `docs/deploy/vps.md` first; it contains the one gotcha (`.next/static` and `public/` are
not copied automatically) that makes a standalone deploy look broken for unrelated reasons.

**Scope.**
- Session cookies — `HttpOnly`, `Secure`, `SameSite=Lax`. Password hashing with **argon2id**.
- **SQLite** at `/srv/habibi/data/habibi.db`, outside the git checkout so a redeploy cannot
  clobber it. Not a hedge — correct at this scale.
- **Migrate the existing localStorage progress**, do not strand it. `ProgressClient.tsx`
  currently holds a `{done: string[]}` key; a returning student must not lose her history to
  the upgrade. This is a first-class requirement, not a nicety.
- **Gate `/teach/<id>`.** It currently ships **all 74 teacher notes as public static pages**.
  Once there is a session this is a middleware check. Today it is obscurity-only.

**Constraint that shapes the data model — decide it before the first migration.** This course
teaches children Qurʾānic recitation, so registrations **will include minors**. GDPR-K and
COPPA-style obligations attach to names, emails and progress records. Design in: **parent-held
accounts**, minimal fields, and a **deletion path**. All three are far cheaper now than
retrofitted, and the deletion path in particular is near-impossible to add credibly later.

**Explicitly out of scope:** payments, roles beyond student/teacher, social login, email
verification flows. Get one student logging in and keeping her progress first.

**Done when:** a user registers, logs in on a second device and sees the same progress; an
existing localStorage user is migrated without loss; `/teach` 404s or 403s for a
non-teacher; the deploy recipe still works end to end.

---

### IDEA 2 — Practice and gamification, Quizlet-style

**Goal.** Practice that remembers — what she has seen, what she keeps getting wrong, what is
due today.

**Start by reading the code, because the engine is further along than it looks.** **14 games
already ship** behind a `GameRegistry`: 7 general (`Flashcards`, `FormSwap`, `WordBuilder`,
`LetterQuiz`, `SpotTheLetter`…) and 7 tajweed-specific (`SpanTapper`, `MaddCounter`,
`GhunnahTimer`, `RuleIdentifier`, `FamilySorter`, `ConditionBuilder`, `ListenIdentify`).

**So the missing piece is not games. It is memory of them.** Nothing records a result, so every
session starts from zero and no card is ever "due". That is the work:
- A **result record** per attempt (item, game, correct/incorrect, timestamp)
- **Spaced repetition** over items — SM-2 or a simpler leitner box; pick one and justify it
- A **due-today** view and a **weak-items** view
- Score history a student can actually see

**Depends on Idea 1** for where results live. **Do not invent a second storage layer.** If Idea
1 is not merged yet, build against an interface and a localStorage implementation, so swapping
in the real one is a single module.

**A domain constraint a general-purpose agent will not guess.** Some drills are *timed by
design* — `GhunnahTimer` and `MaddCounter` measure held duration in ḥarakāt, because the
duration **is** the pedagogical content. Do not "optimise" these into instant-answer quizzes,
and do not score them as simply right/wrong.

**Also do not:** add new Arabic content, change any example word, or touch `content/`. If a
drill needs items it does not have, say so — do not author them. Every Qurʾānic string in this
project is sliced from a pinned corpus and verified by a gate; hand-typed Arabic is the
highest-severity error class available here.

**Done when:** an attempt is recorded and survives a reload; a due-today list is populated by
past performance rather than by order; the timed drills still measure duration; tests cover
the scheduling logic.

---

### IDEA 3 — A library tab: sources, extra materials, embedded video

**Goal.** One place to browse everything the course is built on.

**Ship this first. It is the only one of the three with no architectural fork** — no accounts,
no server, no new licensing. It runs on the current static export as-is.

**The content already exists and is already validated:**
- **183 vault notes** in `library/` — 59 rules, 29 letters, 74 lessons, plus indices
- **5 vendored classical sources** — al-Jazariyyah, Tuhfat al-Atfal, ash-Shatibiyyah,
  as-Sajawandi, Nihayat al-Qawl al-Mufid
- **182 `youtube-cue` entries** already in lesson JSON and already schema-validated

This is a **routing and presentation job over material that is written, sourced and gated.**

**Licensing rules that are not negotiable:**
- **YouTube is linked or embedded, never re-hosted.** Both course channels are Standard
  YouTube License. Do not download, extract audio, or proxy.
- Vendored sources are public-domain **full text**; in-copyright works are **citation-only
  notes**. Do not "helpfully" fill a citation-only note with text.
- Rules still at `needs-review` (3 of 59) **must display that status.** A library that presents
  an unverified rule as settled is worse than no library.

**Design note.** The vault is authored in Obsidian-flavoured markdown with `[[wikilinks]]`.
Those resolve inside the vault; a public library needs them to resolve as routes or be rendered
inert. Broken `[[Foo]]` text leaking to a student is the most likely visible defect here.

**Explicitly out of scope:** editing any note, changing verification status, adding sources.
The agent renders the vault; it does not curate it.

**Done when:** every rule, letter and source is reachable and readable; `needs-review` is
visible on the three rules that carry it; every wikilink either routes or renders as plain
text; no YouTube asset is re-hosted; `check:library` still passes.

---

### The fourth idea — an AI tutor — is deliberately not a brief yet

It needs Idea 1's runtime (an API key cannot ship in a static bundle) and is worth more once
Idea 2 knows what a student is weak at.

**One architecture constraint, recorded now because it is not a prompt-writing detail.** This
project's entire discipline is that **Qurʾānic text is never hand-typed and every rule cites a
vendored source.** A generative tutor that free-associates about tajwīd breaks that in the one
way no gate can catch — it would be the most authoritative-sounding wrong text in the app.
Whatever it becomes, it must be **grounded in the 183-note vault and the pinned corpus, and
unable to emit Qurʾānic text it did not retrieve.**

---

## From the PR #5 independent review — 2026-08-12

Two Important findings were **fixed in the PR** (Tanzil/cpfair attribution across all 230
pages; a corpus-verbatim gate over `content/lessons`), plus a Moderate (`DIACRITICS` omitted
U+0653–U+0655). These are what remain.

### Important — real defects in already-shipped code, not regressions

- **The seven tajweed drills are unreachable in the built app.** `SpanTapper`, `MaddCounter`,
  `GhunnahTimer`, `RuleIdentifier`, `FamilySorter`, `ConditionBuilder`, `ListenIdentify` all
  call `registerGame` at module level — but **nothing outside their own test files imports
  them**, so the modules never load and the registry is empty in production. `LessonSchema`
  has no `games` field and no caller passes `games` (`GamePanel.tsx:66`, `SlideDeck.tsx:99`,
  `practice/[id]/page.tsx:21`). **~2,200 lines plus tests, dead.** *Verified independently in
  this session.* **This is gamification task #1** — the games exist; reaching them is the work.
- **PPTX export silently drops five slide kinds.** `renderSlide` (`lessonToPptx.ts:168`) has
  cases for `title`/`concept`/`letter`/`drill`/`recap`/`homework` only. The branch adds `rule`,
  `ayah`, `contrast`, `legend`, `mistake` — **249 such slides exist in published content**
  (107 ayah, 55 rule, 45 mistake, 25 contrast, 17 legend) and export as bare coloured
  backgrounds. Every arm `return`s, so TypeScript flags nothing. Add renderers **and a `never`
  default**, so the next slide kind fails to compile instead of failing silently.
- **`homeworkNotes` renders structured `listenFor` as `[object Object]`**
  (`lessonToPptx.ts:194`). `schema.ts` allows the object form and Unit 2 lessons author it.
  Format it the way `teach/[id]/page.tsx` already does.

### Moderate / Minor

- **`check-library` aborts instead of reporting** (`check-library.mjs:109`): `data.id.split("-")`
  throws a TypeError on a lesson note that has a `# Lesson N-M` heading but no `id:`, killing
  the whole gate rather than adding the error it recorded 30 lines earlier.
- **`publishedLessonIds()` fails OPEN** (`check-library.mjs:20`): it swallows every error and
  returns an empty `Set`, silently disabling all publish-gated checks. The path is also
  cwd-relative while the vault argument is not. A gate that fails open is the wrong default —
  resolve via `fileURLToPath` as `corpus.mjs` correctly does, and make an unreadable course map
  a hard error. *Latent, not a demonstrated miss.*
- **`onRuleTap` is dead API** (`TajweedText.tsx:7`) — no caller; if wired it would put `onClick`
  on an `aria-hidden` span with no keyboard handler. Delete or implement properly.
- **`role="text"`** (`TajweedText.tsx:58`) is not a standard ARIA role. *Unverified with a real
  screen reader.*
- **`FamilySorter.tsx:252`** — the card key is identical for a first and second wrong drop, so
  the remount that restarts `game-shake` never happens on a repeat mistake.

### The finding that outlives this PR: there is no CI

`gh pr checks 5` reports no checks. **There is no `.github/` directory at all**, `check-runs`
total 0, and branch protection is unreadable on a free-tier private repo, so no required check
is even enforceable. **Every quality claim in this project — including the reviewer's — rests
on gates run by hand on one laptop, and nothing re-verifies any of it after merge.**

A minimal Actions workflow running `npm test`, `npm run lint`, `npm run check:library` and
`npm run build` is the **highest-value single item in this file.** It is also a prerequisite
for the three parallel agent sessions: without it, three branches merge into main with nothing
checking any of them.

## Left over from Phase 7 — small, and none of it blocking

- **Per-letter makhraj diagrams (7a).** 18 tongue letters still share one `lisan.jpg`, so ت,
  ض and ك look identical. **The largest fixable gap, and it is pedagogical.** Unblocked:
  `codex` CLI 0.147.0 is installed. Owner rejected line-art SVGs — match the existing raster
  style, and generate one or two for approval before committing to all ten.
- **Popover `role="dialog"`/`aria-modal` and dismissal.** `SlideDeck.tsx:223` handles Escape
  for navigation, not for popovers.
- **Lesson-row links share accessible names** — "Lesson"/"Practice" repeat across every row;
  `CourseMap.tsx` sets no `aria-label`.
- **Games test sweep** — duplicate-letter words, round-advance clicks, SpotTheLetter's
  fallback-to-glyph, empty-pool guards, single-letter `contextualGlyphs`. Effort: M.
- **`allLessons()` re-parses every lesson JSON per page at build** — O(N²), now 74 lessons and
  230 pages. Still fast; the premise has just changed. `src/content/load.ts`.
- **`/teach` gating** — see above; trivial today, mandatory the moment accounts exist.

---

## Audio — the real shape of the gap

> Superseded the old *"1,493 tap targets are teacher-voice"* line, which was wrong twice
> over: the count had grown to **6,966** as Units 2–4 shipped, and counting cues rather
> than distinct sounds overstated the recording job by more than four times.

**Measured 2026-08-11 across `content/lessons/`:** 7,194 audio-bearing items — 6,966
`teacher-voice`, 182 `youtube-cue`, 46 `qari-clip`. Those 6,966 cues carry only
**1,635 distinct Arabic payloads** (4.3× repetition), which split into four groups that
need completely different solutions:

| Group | Distinct | What it is | Route |
|---|---|---|---|
| **Qurʾānic words** | **254** exact, **575** normalised | matches to a word in the pinned corpus | Word-by-word CDN, link-only — but **blocked on a missing `ref` field**, see below |
| **Single letters** | **213** | the 29 letters across their harakat | The genuine recording gap |
| **Syllables** | **510** | 2–3 letter qāʿidah drill units | The genuine recording gap |
| **Ordinary vocabulary** | **535** | non-Qurʾānic words — ثعلب، خليج، قميص، حصان، بخار، كرسي | Only **7.7%** covered by open audio — see below |

> **Two numbers here were corrected after first measurement, both by testing rather than
> estimating.**
>
> **The Qurʾānic count was an undercount.** Exact string matching gives 254, but the corpus
> is Uthmānī (ٱلصِّرَٰطَ) while lessons often write standard orthography (صِرَاط).
> Normalising hamza forms and superscript alif recovers **321 more**, for **575**. *Caveat,
> and it matters: a normalised match is not proof of the same word **form**.* Serving the
> audio of ٱلصِّرَٰطَ against a slide reading صِرَاط would hand the student audio that does
> not match the text in front of her. **575 is an upper bound to be checked form-by-form,
> not a confirmed count.**
>
> **The vocabulary count therefore dropped** from 658 to **535** truly non-Qurʾānic words.

**Why this matters.** The project's standing conclusion — *"no openly-licensed,
full-coverage audio set exists"* — was reached about the course as a whole. Broken down,
it is only true of the middle two groups. **723 letter-and-syllable cues are the actual
irreducible recording job**, not 7,000, and at 4.3× reuse that is a much smaller ask than
the roadmap has been carrying.

- **[audio] Wire the 254 Qurʾānic-word cues to the word-by-word CDN.** Pattern and terms are
  already researched and confirmed live: `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3`,
  anonymous and CORS-open. **No new research is required, but this is NOT a drop-in swap —
  there is a real blocker first.**

  The CDN is addressed by surah, ayah **and word position**, and **no lesson item carries an
  ayah reference at all**: `ArabicItemSchema` (`src/content/schema.ts:32`) is
  `{arabic, name, translit, audio}`, and `"ref"` appears **zero times** across
  `content/lessons/`. Matching on the Arabic string alone cannot resolve it — a word like
  ٱلْحَمْدُ occurs many times, and the word's *index within its ayah* is needed too.

  **Coverage is confirmed whole-Qurʾān** *(tested directly 2026-08-11, not taken on trust)*:
  words sampled from surahs 1, 2, 12, 41, 52, 110 and 114 all return HTTP 200 with real
  audio, including last-word positions (`002_245_016`, word 16 of 16; `041_044_030`, 30 of
  30). Two responses had identical byte counts, which looked like a placeholder being served
  for missing words — **SHA-256 shows them genuinely distinct**, and a nonexistent position
  (`110_002_099`) returns a clean **404**. So HTTP 200 is a trustworthy existence test, and
  the filename list can be precomputed at build time with confidence.

  **The refs do exist, just on the other side of the pipeline:** the library notes carry
  **207 distinct `ref:` values across 780 example entries**, and ADR-003 makes the note the
  source of record. So the work is: add an optional `ref` to `ArabicItemSchema`, carry it
  through transcription, then resolve word position against the pinned corpus. Effort: **L,
  not M**, and it touches the schema.
- **[audio] The 723 letter/syllable cues.** Either an openly-licensed qāʿidah set or the
  owner's own voice. **DEFERRED by the owner** as far as his own recording goes; the
  open-set search is the live question.
- **[audio] The 658 ordinary-vocabulary cues.** These are reading-practice nouns, not
  Qurʾānic text, so both the licensing and the religious objections that block the other
  groups are weaker or absent here. Worth checking Lingua Libre, Wiktionary and Commons
  for coverage.

### Qurʾān audio: usable while free, barred if ever monetised — 2026-08-11

**`docs/research/recitation-audio.md` has been amended** — read its banner before building
anything on either source. The short version:

- **EveryAyah is CC BY-NC 2.5 Canada.** The licence page died in 2012 and the doc previously
  recorded "no explicit licence found", which was true of the live site and false of the
  record. Recovered from the Wayback capture and **verified independently here**. It governed
  the MP3s, not just the timing files.
- **Quran.com's terms are stricter than recorded**: personal non-commercial use only,
  no compiling collections, and no reproducing or **publicly displaying** Content without
  written consent. Bulk-fetch-and-rehost is prohibited outright.
- **So: link-only with attribution is fine while the course is free. If it is ever monetised,
  both sources are barred**, and the clean path is CC BY 4.0 `cpfair/quran-align` timings
  against audio the project holds rights to.
- **The word-by-word reciter is credited "Waseem Sharif"** — found only in QUL's exporter
  source, and absent from the API, any endpoint, and the ID3 tags. Credit exactly that and
  assert nothing further. Pace measured at **~1.09 s/word**, about double conversational
  speed: **well suited to isolated-word drills**.
- **Presence on QUL is not evidence rights were cleared** — its permission model defaults to
  `unknown` and it exports anyway.

### Open audio: the qāʿidah set is a dead end, and vocabulary nearly one — 2026-08-11

**(A) The 723 letters and syllables — searched to exhaustion, ~4% servable.**

Two open sets exist, and **both give bare letter identity only, never letter-plus-harakah**:

- **`elsanussi-s-mneina/arabic-alphabet-audio-speller-html-js`** (GitHub) — **MIT, re-hosting
  permitted**, 31 items covering all 28 letters plus ء ة ى, mp3 *and* ogg, **named by Unicode
  codepoint** so it joins cleanly to lesson data. The author states he recorded it himself,
  so provenance is claimed by the licensor rather than scraped. **But it is the letter
  *names* with tanwīn endings** (*bāʾun*, *tāʾun*), which is probably the wrong form for
  drills.
- **Lingua Libre speaker `AlNatiq` on Wikimedia Commons** — **CC0**, the cleanest licence
  possible, 48 kHz WAV. **23 of 28 letters**, each checked individually against the API.
  Missing **ب د ز ظ و**. Gaps are partly fillable from other speakers, but that means a
  different voice and dialect mid-alphabet; **ز and ظ were not found from any speaker.**

**Why that is only ~4% of 723.** The ~184 harakat variants (بَ بِ بُ بْ بّ بً) and all 510
joining drills have **nothing**. This was verified directly, not inferred: a Commons search
for audio tagged فتحة / كسرة / ضمة / سكون / شدة / تنوين returns **zero results**, and
`Category:Arabic diacritics` holds images and one video with **no audio at all**.

**Treat the open-set search for (A) as closed.** Open sources shrink the recording job by
about 29 items, not 213.

**Clean negatives worth keeping so nobody repeats the search:** Forvo relicensed its audio as
exclusive property in 2019 and forbids caching. Mozilla Common Voice is CC0 **but its terms
forbid re-hosting the dataset**, and it is read sentences with no letters anyway. Two
Archive.org alphabet items declare **no licence** (`opensource` collection membership is an
upload path, not a licence grant). ~20 GitHub "Noorani Qaida" repos are empty stubs or scans,
none licensed, none bundling audio. One repo tags 32 mp3s MIT with an empty readme and **no
authorship claim** — unusable. A Hugging Face set with 28 letters and 40,646 clips is **child
speakers**: an ASR training corpus, not audio a learner should imitate.

**(B) The 535 ordinary words — 7.7%, and the shortfall is not random.**

Lingua Libre is genuinely the right resource — the SPARQL endpoint is live, the licences are
clean and **re-hosting is permitted throughout** (CC0 for two speakers, CC BY-SA for the
majority; share-alike binds derivatives, so trimming or normalising a file keeps it BY-SA).

**But measured against this course's actual words rather than a generic list, it serves 41 of
535 — 7.7%.** The research estimated ~61% from an independent 80-word list of everyday
concrete nouns; running the real payloads against the full 7,842-row wordlist gives 7.7%.
**494 words are neither Qurʾānic nor in any open corpus.**

**The reason is the interesting part.** This course's vocabulary is not everyday nouns. It is
loaded with **minimal pairs chosen to drill the contested letters** — ضَعِيف، قِصَاص،
نَاضِرَة / نَاظِرَة، غَلِيظ، عَرِيض. **The words were selected precisely for the sounds that
general corpora under-serve and that MSA TTS flattens.** So both candidate solutions are
weakest exactly where this course needs them most. That is not bad luck; it follows from what
the course is for.

**And even the 7.7% has a voice problem.** Those hits come from ~9 speakers of different
nationalities whose native-language status is unknown — Commons file pages carry **no
speaker-language field**. For a course whose whole premise is correct articulation, a
vocabulary layer stitched from nine possibly-non-native, possibly-dialect-coloured voices is
arguably worse than silence. Lingua Libre's own speaker profiles *do* record native language,
so the filter exists — but it must be applied at their end, and it will cut 7.7% further.

**Nobody has listened to any of it.** Not one file in section (A) or (B) has been auditioned.

### Video: a complete 29-letter CC-BY series — 2026-08-11

**The one asset found that could be re-hosted rather than merely linked.**

**Reverts' Corner**, playlist *Arabic Language Learning*
(`youtube.com/playlist?list=PLTdaXsFaPmam2l6vRQaKhcK88A_tJVamw`) — **one dedicated video per
letter, all 29** from hamza ء to yāʾ ي, 55 s to 3 m 39 s each, English instruction, published
Oct 2024. One video per letter means **no timestamp deep-linking is needed** — the video *is*
the deep link. Each description also carries a written makhraj explanation usable as lesson
text.

**Licence verified twice — by the research agent, then independently in this session by
fetching all 29 watch pages and checking for YouTube's CC marker: 28 of 29 are CC-BY. The
sole exception is qāf ق (`pgchJET6o-o`), which is Standard.** A re-hosted set would have a
hole exactly at ق.

**What it does and does not cover.** Do not overstate this. It supplies the **29 base-letter
demonstrations** — pedagogically the most important sounds in the course, and the ones a
student cannot self-correct — but that is **~29 of 1,635 distinct payloads**. It does *not*
cover the 213 harakat variants, and it certainly does not cover the 510 letter-joining drills
(بت، تب، كل، لك): you cannot synthesise بَ from a recording of ب.

**Before re-hosting anything, one check is mandatory.** YouTube's CC tag is **self-declared
and unvalidated — the platform does not verify that the uploader owns what they are
licensing.** The research turned up a live example of the trap: *"Learn Arabic Letters with
Wisam Sharieff Part 1"* (`p2hiXRyVfJo`) is **tagged CC-BY while its own description says "no
copyright infringement intended"** — a third-party re-upload. I confirmed the CC tag is
really there. A CC tag applied by someone who does not hold the rights grants nothing.
**Do not use that video.** For Reverts' Corner, get written confirmation from the channel
before re-hosting; **linking/embedding needs no permission and carries no risk today.**

**Also unverified: nobody has watched these.** Teaching accuracy, tajwīd soundness and the
presenter's qualifications are entirely unassessed — the licence check read metadata, not
content. A small channel is now the candidate spine for the course's letter audio. **Someone
qualified must watch all 29 before they are used**, whether linked or re-hosted.

**Runners-up.**
- *AMAU — A Brief Introduction to Tajweed* (Ustadh AbdulRahman Hassan), English, 13 parts,
  established institution — **CC-BY on 12 of 13; Part 3 (`NoyJnRezaL0`) is Standard.** Same
  per-video gap pattern.
- *The Arabic Coach — Arabic Alphabet Pronunciation* (`8_60iWXl7dw`), 8 m 51 s, 4.36 M views,
  **28 per-letter timestamps in the description** so `&t=` deep-linking works out of the box.
  **Standard licence — embed/link only**, verified. Best zero-risk option for today.

**Negative result worth keeping:** no openly-licensed Arabic *articulatory* video dataset
exists that is usable here. The IEEE DataPort Arabic MRI set covers only 12 letters, declares
no formal licence and sits behind a subscription; the USC RT-MRI set is genuinely CC BY 4.0
but is English speech and raw MRI — research data, not teachable material.

**One discrepancy to resolve:** this research reports **EveryAyah's recitation audio as
CC-BY-NC**, which would bar commercial use. `docs/research/recitation-audio.md` §1.5 says no
explicit licence for the audio could be found at all. Both cannot be right, and it only
matters if the course is ever monetised — but it should be settled rather than left as two
contradicting notes.

### TTS assessment — 2026-08-11

Researched on the owner's request. **The answer is different per category**, which is why
the project's earlier flat rejection of "Arabic TTS" was too coarse.

**Cost is not the obstacle.** ElevenLabs' free tier is **10,000 credits/month** at 1 credit
per character (Multilingual v2). The entire distinct-payload set is roughly **7,800
credits** — 723 letters/syllables at ~3.5 chars plus 658 words at ~8 chars. **The whole
corpus fits in one free month**, about $0.78 of compute at API rates.

**Licensing is a $6 problem, and it has one trap.** Free-tier output is
**non-commercial + attribution-required**, and the licence is **fixed at generation time —
paying later does not retroactively license audio already generated**. So the correct move
is one month of the paid entry tier, generate, cancel; paid-tier rights are reported to
survive cancellation. **Never publish free-tier output.** *(The perpetuity-after-cancellation
point is UNVERIFIED — the vendor's help articles 403'd and it is not in the ToS body.
Confirm in-account before relying on it.)*

**Verdicts by category:**

- **254 Qurʾānic words — TTS inappropriate.** Not contested. The CDN supplies real qurrāʾ.
- **723 letters and syllables — REJECT**, and on a better argument than makhraj. **A bare
  one-to-three-character input is out-of-distribution for every TTS system on the market** —
  they are trained on running speech. Two predicted failures: the model may pronounce the
  letter's *name* (*ṣād*) rather than its sound /sˤ/, and Arabic TTS front-ends work by
  **predicting diacritics from context**, of which a single character has none. This
  argument's virtue is that it **survives a listening test**: a ص inside a sentence may
  sound fine, while a bare one fails audibly.
- **658 ordinary MSA words — CONDITIONAL, gated on a cheap test.** In their favour: these
  are in-distribution for MSA TTS, the religious objection does not apply to non-scripture,
  and the correct articulation of each letter is **established elsewhere** — by the time a
  student meets قميص, ص was taught with human audio, so TTS reinforces an existing model
  rather than being the source of truth. Against: MSA newsreader register **systematically
  flattens tafkhīm**, and a beginner cannot tell shallow-ص from correct-ص — she will simply
  internalise the shallow one, which *contradicts* the drill she just finished. **Decide it
  with a ~20-word probe** loaded with contested letters (قميص، حصان، بخار, plus ض/د، ط/ت،
  ق/ك contrasts) — ~160 credits, judged by someone with tajwīd training.
- **English instructional narration — unobjectionable.** Zero makhraj exposure, no religious
  question. **This was never the contested case and should not have been caught by the
  original Arabic-focused rejection.**

**One claim from the research that this repo contradicts.** The assessment argued the
syllable cues are "largely madd drills (بَا/بِي/بُو) where the duration IS the pedagogical
content." **Checked against the content: it is not so.** Of 606 distinct two-to-three-letter
payloads only **127** contain a madd letter at all, and several of those are ordinary words
(بيت، عين، فيل). The actual set is **letter-joining drills** — بت، تب، كل، لك، من، نم. The
rejection stands regardless, and arguably harder: nonsense joining pairs are *further*
out-of-distribution than madd syllables.

**On the evidence base, stated plainly:** no published evaluation of TTS *output* on the
emphatic contrasts appears to exist. The case rests on inference from adjacent evidence —
notably that **Arabic TTS is scored by MOS and PESQ, none of which measure articulation-point
correctness**, so a system can top every leaderboard while producing س for ص. The
durational features (madd counted in ḥarakāt, ghunnah, qalqalah) are the **more durable**
objection than the emphatics, because no system attempts them and no metric rewards them.

**Religious positions found — more permissive than expected, and not independently verified
by me.** The research reports IslamQA 512399 permitting synthesised recitation subject to
the voice owner's permission; IslamWeb 510187 setting the operative test as expert
endorsement that a teaching program is *free from errors*; and notes that Al-Azhar's
Sept 2024 statement concerned **musical accompaniment, not AI synthesis**, so it should not
be cited against TTS. **Verify these before relying on any of them.** The practical upshot:
the rulings do not forbid TTS — they set an expert-verification bar no vendor currently
claims to clear.

**Also unverified:** whether a per-request minimum credit charge exists (1,381 tiny requests
could cost far more than the character math implies — this is the one number that could
break the estimate); and whether an unmonetised educational site counts as "non-commercial",
which the terms nowhere define.

---

## Content and pedagogy

- **Per-letter makhraj diagrams instead of 5 zone diagrams.** 18 tongue letters still share
  one `lisan.jpg` with the same highlight, so ت (tip), ض (side) and ك (back) look identical.
  The owner asked for diagrams so the student "wouldn't have to guess"; for tongue letters
  she still does. Needs ~10 more images (tongue sub-zones) plus a per-letter mapping.
- **Frame-by-frame makhraj animations** (owner request, 2026-07-22). The owner wants actual
  MOVEMENT per letter — tongue and lip motion during pronunciation. Options when picked up:
  (a) deep-link licensed/embeddable animated makharij videos per zone, (b) coherent
  multi-frame or video generation when available, (c) CSS/SVG micro-animations over the
  annotated stills. The annotated raster stills are the current baseline.
- **4 example words silently excluded from all games** — the word filter admits only fully
  taught base letters, so words containing ة or standalone ء never qualify: ضَوْء، لُغَة،
  بَقَرَة، وَرْدَة. Correct per spec but silent. **Owner decision needed:** mapping ة→ه/ء
  would be linguistically dubious; the alternatives are teaching those letterforms or
  dropping the words. `src/games/derive.ts` + `src/games/arabic.ts` `BASE_MAP`.
- **"Unit 1.1" vocabulary appears in student-facing text** (confirmed still present in
  `content/lessons/1-01`, `1-04`, `1-06`) but the app never shows unit boundaries — the
  student sees a slide headed "Lesson 1.1" whose body refers to "Unit 1.1". Either surface
  units in the course map or drop the term from student text.
- **`docs/research/intro-motivation.md` hadith were verified via sunnah.com mirrors**, not
  sunnah.com itself (Cloudflare blocks automated fetches). Worth one human pass over the 8
  citations in a real browser.

## Access and infrastructure

- **`/teach/<id>` is obscurity-only** and ships in the same static bundle as student pages.
  Fine for one student; needs real gating before any public or commercial launch.
- **`api.quran.com` v4 is a legacy endpoint**, used at `scripts/fetch-word-timings.mjs:11`.
  Quran Foundation may sunset it. The mitigation is already designed and written down —
  precompute filenames at build time rather than calling the API at runtime
  (`docs/research/recitation-audio.md` §4.2) — but not executed.

## Accessibility — mostly closed 2026-08-11

- ✅ **DONE** — locked/solved tiles in `FormSwap` and `LetterQuiz` now carry `aria-disabled`.
  Deliberately **not** `disabled`, which would drop them out of the tab order mid-round and
  move focus unexpectedly; they stay reachable for review while announcing that they no
  longer act. Fixing this also surfaced a real bug: **a wrong pick's shake outlived the guess
  it belonged to**, persisting through the winning pick.
- ✅ **DONE** — `ExportPptxButton` has a visually-hidden `role="status"` region. A label
  change on a focused control is not announced, and export runs for seconds and can fail.

## PPTX export

- ✅ **DONE 2026-08-11** — recap columns now fill right-to-left, matching the rest of the deck.
- ✅ **DONE 2026-08-11** — the 14-item overflow is closed. Threshold set to **13, not the 12
  this note originally proposed**: 13 lines fit at 20pt and 13 is the largest recap in real
  content, so 12 would have shrunk a recap that was fine. Tests pin both ends.

## Code hygiene

- ✅ **DONE 2026-08-11** — `drill.grid` now bounds the inner row as well as the outer array,
  so `[[]]` no longer validates into a 0-column table. Both declarations patched.
- ✅ **DONE 2026-08-11** — extracted `isCorrect(values, order, slot)`. The rule had drifted
  into **five** near-identical inline forms, not four: `FormSwap.tsx` held a fifth copy the
  original note missed.
- ✅ **DONE 2026-08-11** — `FormSwap` imports `FormKey` from `derive.ts`, and `FORM_LABELS` is
  now `Record<FormKey, string>`, so adding a form upstream fails here until it gets a label.
- ✅ **DONE 2026-08-11** — `Flashcards` keys its back-face lines by index.
- **Games coverage gaps** (behaviourally corroborated but unasserted): duplicate-letter word
  in WordBuilder/useSwapPuzzle; Next-word/Next-question round-advance clicks; SpotTheLetter
  fallback-to-glyph when a pool item lacks `name`; empty-pool guards; empty-string and
  single-letter `contextualGlyphs`. One test-sweep pass. Effort: M. **Open.**
- **`allLessons()` re-parses all lesson JSON for every page at build** — O(N²) in lesson
  count. **The old note called this "negligible at N=12"; it is now 74 lessons and 230 static
  pages.** Still fast enough, but the premise has changed. `src/content/load.ts`. Effort: S.
  **Open.**

---

## Removed 2026-08-11 — verified already done

- **Makhraj SVGs are dark-theme only** — moot. There are no makhraj SVGs left; all seven are
  raster `.jpg` under `public/images/makhraj/`.
- **`overview.svg` head outline is two subpaths** — same reason; it is `overview.jpg` now.
- **Regenerate all makhraj visuals as raster via codex imagine** (was blocked on a quota
  resetting 2026-07-25) — done. All seven exist as annotated rasters.
- **Dar al-Maʿrifah vs Quranly colour legend** — decided and shipped. ADR-002 pins Family B
  (red = qalqalah) as the default. The one live remnant, sampling Dar al-Maʿrifah's exact hex
  values from print, is tracked in `ROADMAP.md` Phase 6, not here.
- **`useSwapPuzzle` / games items assumed stale** — re-checked and genuinely still open, so
  they stayed above. Recorded here only to note they were verified, not assumed.
