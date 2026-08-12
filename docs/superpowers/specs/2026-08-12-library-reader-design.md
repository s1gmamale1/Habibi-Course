# Library Reader — Design

**Date:** 2026-08-12
**Status:** Approved by owner (scope: read-only reader first, teacher editor deferred to its
own spec; audience: student material only; status UX: two distinct signals; renderer: typed
frontmatter index + build-time markdown; classical matn: withheld; nav: global nav added)
**Branch:** `feat/library-reader`

## Problem

The course is built on a 183-note vault in `library/`, and **the app has never displayed a
single note.** Nothing in `src/` reads `library/` — the only references are prose comments in
`Credits.tsx` and `credits/page.tsx`. A student can take all 74 lessons without ever seeing
the rule notes, letter notes or classical sources the lessons were written from.

This spec covers a **read-only student Library**, rendered entirely at build time on the
existing static export. It is WISHLIST's "IDEA 3 — A library tab" with one deliberate
addition (`Glossary.md`) and one deliberate subtraction (the teacher-editing half of the
owner's original request, which is deferred — see *Deferred* below).

## Why read-only first

The owner's request was "a teacher can upload/edit the library and a student can read it."
That is two features across an architectural fork, and they were split deliberately:

- **The student reader needs no server.** It runs on `output: "export"` as-is.
- **The teacher editor needs the ADR-007 runtime flip**, plus auth, plus a write path into a
  vault governed by ADR-003 and the `check:library` gate. ADR-007 is explicit that the flip
  to `output: "standalone"` lands *"on the same commit as the first server-dependent feature,
  not before."*

Shipping the reader first also means the editor is designed against a Library that exists,
rather than one that is imagined.

## Scope — 101 notes

| Section | Notes | Type |
|---|---|---|
| `library/02-Rules/` | 60 | 59 `rule` + `Sifat.md` (`index`) |
| `library/03-Letters/` | 29 | `letter` |
| `library/01-Sources/` | 11 | `source` (Classical 5, Data 3, Video 2, + `Source-Manifest.md`) |
| `library/00-Index/Glossary.md` | 1 | `index` |
| **Total** | **101** | |

**Excluded, on purpose:** `04-Curriculum/` (74 teacher lesson notes — already public at
`/teach/[id]`, which WISHLIST wants *gated*, not surfaced twice), `05-Pedagogy/` (teacher
material), `00-Index/Verification-Log.md` (internal QA), `99-Corpus/` (raw data files, not
prose).

**Status across the 101:** 63 `verified` · 29 `draft` · 9 `needs-review`.
All 29 letters are `draft`; the 9 `needs-review` are 3 rules and 6 sources.

## New architectural edge — proposed ADR-009

This feature is **the first code path in `src/` that reads `library/`.** ADR-003 currently
describes the vault as an authoring surface whose only consumer is a human transcriber plus
the validator. That is no longer true after this change, and the roadmap should say so.

**Proposed ADR-009 — The vault is a read surface for the app, in one direction only.**
The app may *read* `library/` at build time. It must never write to it. Transcription into
`content/` stays a human act per ADR-003. The reader resolves links the way
`scripts/check-library.mjs` does, so the app and the gate cannot disagree about what a link
means.

The ADR is written as part of this work, in `ROADMAP.md`'s ADR section.

---

## 1. Module — `src/library/`

Mirrors `src/content/`'s conventions: sorted ids, zod-validated, throw-with-filename on
failure (`load.ts:7`'s `parseJsonFile` is the model).

```
src/library/
  load.ts          allNotes() / noteBySlug() / allSlugs()
  schema.ts        zod discriminated union on `type`
  frontmatter.ts   TS twin of scripts/lib/frontmatter.mjs, same throw contract
  routes.ts        slug ↔ basename map, reserved-segment guard
  markdown/
    parse.ts       marked lexer → tokens, raw HTML disabled
    render.tsx     tokens → React elements
    wikilinks.ts   resolver
    slug.ts        heading-id generator
```

### Reading the vault the way the gate does

Three behaviours copied deliberately from `scripts/check-library.mjs`, because divergence
means the app and the gate disagree:

- Skip dotfiles and dot-directories when walking (`check-library.mjs:49` — this is what
  excludes `library/.obsidian/`).
- Require a leading `---` frontmatter block; throw on missing or unterminated
  (`scripts/lib/frontmatter.mjs:11-14`).
- Resolve wikilinks **by bare basename, ignoring directory** (`check-library.mjs:62`).

### Dependencies

Two changes, both of which need stating because this repo's only prior supply-chain move
was to *remove* a dependency (ADR-006):

- **Add `marked`** (18.0.9). Chosen because it has **zero dependencies** — verified via
  `npm view`. `markdown-it` pulls 6 transitive packages, `micromark` 10+. `marked`'s lexer
  exposes a token tree, so we render React elements rather than HTML strings, and never
  touch `dangerouslySetInnerHTML`.
- **Promote `yaml` from `devDependencies` to `dependencies`.** It is currently dev-only
  (`package.json:43`) and used solely by `scripts/lib/frontmatter.mjs`. The moment `src/`
  imports it, a build run with `npm ci --omit=dev` breaks — which is exactly how a build on
  the ADR-007 VPS would run. This is a latent production break, not a tidiness point.

---

## 2. Schema — `src/library/schema.ts`

A zod discriminated union on `type`, with per-type shapes. Field presence below is measured,
not assumed.

**`rule`** (59 notes) — `id`, `arabic`, `translit`, `english`, `family`, `taught_in`,
`prerequisites`, `sources`, `examples` are **100% present**. Optional: `letters` (31),
`colour_b` (25), `harakat` (23), `cpfair_key` (19), `harakat_options` (5).

**`letter`** (29 notes) — 13 keys, **all 29/29**. The only fully uniform section in the vault.
`istila`/`qalqalah` are booleans, `sifat` an array, `makhraj` free text, `makhraj_zone` an enum.

**`source`** (11 notes) — the ragged one: 36 distinct keys, 15 appearing exactly once. Only
`type`/`status`/`id` are universal; `vendored`/`url`/`title`/`retrieved`/`licence` are present
on the 10 real sources (all absent from `Source-Manifest.md`). Everything beyond those is
optional and rendered only when present.

**`index`** (2 notes — `Sifat.md`, `Glossary.md`) — `type`, `id`, `status` only.

Closed vocabularies come from `scripts/lib/rules.mjs`, which the gate already enforces:
`STATUSES` (3), `RULE_FAMILIES` (13, 12 in use), `MAKHRAJ_ZONES` (5, 4 in use),
`CPFAIR_KEYS` (18).

`vendored` is **not** constrained by `rules.mjs` and takes **five** values in practice —
`full-text`, `partial`, `excerpts`, `citation-only`, `metadata-only` — while
`Source-Manifest.md` documents only three. The schema accepts all five.

`sources:` values are **wikilink strings** (`["[[Tuhfat-al-Atfal]]"]`), not plain names. The
schema strips the brackets; the renderer resolves them as links.

---

## 3. Routing

```
/library                landing — the four sections
/library/rules          59 rules, faceted by `family`
/library/letters        29 letters, faceted by `makhraj_zone`
/library/sources        11 sources, grouped Classical / Data / Video
/library/[slug]         101 detail pages
```

**105 new pages** (101 detail + 1 landing + 3 section indexes); the export goes from 231 to
**336**.

**Detail routes are flat and keyed by basename**, not nested under section. Three reasons:

1. The gate resolves links by basename ignoring directory, so a flat space means the app and
   the gate cannot disagree.
2. **Directory contradicts `type` in three places** — `02-Rules/Sifat.md` is `type: index`,
   not a rule. Nested routing forces a path decision those notes cannot answer.
3. All 183 vault basenames are globally unique and already URL-safe (`[A-Za-z0-9._-]`).

**Slugs are lowercased basenames** (`Ghunnah` → `/library/ghunnah`). A build-time assertion
checks that lowercasing preserves uniqueness **across all 183 vault basenames**, not just the
101 in scope, so adding a note later cannot silently collide. A second assertion guards the
reserved segments `rules`, `letters`, `sources` against a future note of that name.

**Section landings filter on `type`, never on directory.**

Route shape copies `src/app/lesson/[id]/page.tsx:6-12` exactly — a **sync**
`generateStaticParams` plus an **async** page component awaiting `params` (the Next 16
signature).

---

## 4. Data flow

```
library/*.md
   │
   ├─ frontmatter ──→ yaml → zod ──→ typed LibraryNote index
   │                                   └─→ listings, facets, badges, cross-links
   └─ body ─────────→ marked lexer ──→ React elements   (build time only)
                             ↑
                      wikilink resolver
                      (Map<basename, slug>, built from the index)
```

Zero markdown JS reaches the browser. Pages are pure server components with **no client
boundary** — the first genuinely static content in the app.

---

## 5. The renderer

### Required feature surface — measured, and small

**CommonMark + GFM tables + `[[wikilinks]]`. Nothing else.**

Present in scope: bold (2,635), tables (1,504 rows / 177 delimiter rows), wikilinks (1,110
body + ~137 frontmatter), unordered lists (875), inline code (800), italic (720), H2 (687),
blockquotes (374), aliased wikilinks (308), ordered lists (151), H1 (115), escapes (67),
H3 (33), rules (18), fences (18), external links (14), nested list items (10).

**Measured as exactly zero** — the renderer does not need any of these: footnotes, task
lists, images, embeds, strikethrough, nested blockquotes, Obsidian callouts, nested ordered
lists, relative links, in-page anchor links, HTML entities, hard breaks, indented code
blocks, setext headings, H4–H6.

**Raw HTML is disabled.** Only 2 `<…>` occurrences exist in scope and both are false
positives inside code spans (`<Video ID>` in `Muallimi-Soniy.md:213`, `<audio>` in
`Everyayah.md:36`). Disabling costs nothing and is the cheapest safety win available — and it
matters considerably more once a teacher editor can write into this pipeline.

### The five traps

Each is a real occurrence in a named file, and each produces a visible student-facing defect
if missed.

| # | Trap | Where | Failure |
|---|---|---|---|
| 1 | Wikilink spans two lines | `Ikhfa-Shafawi.md:46` | Literal `[[Izhar-Shafawi\|iẓhār` leaks to the student — the exact defect WISHLIST:146 names as most likely |
| 2 | 60 escaped pipes `\|` in one table | `Muallimi-Soniy.md` | 60 rows of the video catalogue shred |
| 3 | Empty-target heading link | `Idgham-Maal-Ghunnah.md:65` | `[[#The four-word exception — iẓhār muṭlaq]]` resolves to no note |
| 4 | `sources:` frontmatter values are wikilinks | 88 of 100 notes | Renders as literal `[[Tuhfat-al-Atfal]]` |
| 5 | Blockquote containing a heading | 7 notes | `> ### ⚠ Status: …` flattens, destroying the notes' own status warnings |

Trap 1 means the resolver **must operate on inline token text, not on lines.**
Trap 3 needs one extra branch: an empty target resolves as an anchor within the current page.

### Heading slugs

Headings carry `⚠`, em-dashes, Arabic script and combining marks
(`## ⚠ The count is disputed`, `## ط → ت is nāqiṣ`, `## بَابُ الْمَدِّ وَالْقَصْر`). The
generator must keep distinct headings distinct, produce stable ids across builds, and
deduplicate collisions with a numeric suffix. Trap 3's target heading — em-dash plus Arabic —
is the hardest live case and is a required test.

### Arabic

Arabic goes through the existing contract in `src/components/tajweed/TajweedText.tsx`:
`.quran` for scripture, `.arabic` for pedagogical Arabic, with `dir="rtl"` and `lang="ar"`.
Read that file's doc comment (`:6-22`) before writing any Arabic-rendering component — it
records why `role="text"` was tried and rejected.

The genuine difficulty is **bidi inside GFM table cells at volume**: 1,504 table rows across
84 of the 100 sectioned notes, frequently mixing Arabic, Latin transliteration with diacritics
(ẓ, ḥ, ā, ʾ) and hex colour codes in adjacent cells. This project has already been burned
here once — `UNDERLINE.silent = "none"` reached `text-decoration-style`, where `none` is not a
legal value, so the declaration was dropped and underlined 647 of 1,972 spans that were meant
to have none.

Only the 849 `examples[].ref` entries can carry tajweed colouring, because the pre-computed
spans in `src/generated/verses/` are keyed by `surah:ayah`. All other Arabic — mnemonic
couplets, contrast pairs, single letters in cells — is plain text needing correct font,
direction and shaping on its own. Those `examples[]` are already verified verbatim against
the pinned corpus by the gate, so they carry **no new verification burden**.

---

## 6. Status UI — two signals

| Signal | Count | Treatment |
|---|---|---|
| `needs-review` | 3 rules + 6 sources | Visible caution panel naming what is specifically missing |
| `draft` | 29 letters | Quiet factual line — "note not yet reviewed" — no alarm colour |

The two are **different facts and are shown differently.** `needs-review` means a sourcing
claim is unsettled, and WISHLIST:141 makes surfacing it mandatory: *"A library that presents
an unverified rule as settled is worse than no library."* `draft` describes the note's
authoring state — the 29 letters are all `draft` while being taught in live lessons today, so
stamping a warning on them would tell a student that material she has already been taught is
untrustworthy, which is both alarming and not what the field means.

Note that **`status` is not a publish signal in this vault** and must not be used as one.
`check-library.mjs:19-22` says so directly: *"every lesson note in the vault is still `draft`,
so gating on it would make those checks silently dead."* The only publish signal in the repo
is `content/course.json`, which covers lessons — out of this scope entirely.

Several `needs-review` notes already author their own `> ### ⚠ Status:` block (trap 5). The
renderer **styles those rather than duplicating them**, so no warning is shown twice.

Listings carry the same distinction as a compact marker, so arrival on a page is never a
surprise.

---

## 7. Sources — three display modes

`vendored` takes five values, so a binary "full text or citation" component is wrong.

**Withheld (`full-text`, `partial`, `excerpts`) — Jazariyyah, Tuhfah, Shatibiyyah, Nihayat.**
Render metadata, chapter structure, verse counts, metre, licence, provenance, the English
rendering, and the vault's own account of the known defects. Render a panel stating the matn
is withheld pending collation, linking to the public-domain original.

**"Withheld" means the Arabic *source text* only** — the vocalised matn verses and the
excerpt bodies. It does **not** mean stripping Arabic from the page. Arabic in metadata still
renders: `arabic_title`, `author_arabic`, chapter/bāb headings, the printed page numbers
(p. ٩٤), and any Arabic in the notes' own explanatory prose. The line is *"text a student
could memorise from"*, not *"characters in the Arabic block"*. A page that withheld every
Arabic glyph would be unreadable and would misrepresent the instruction.

This is not caution for its own sake — `Source-Manifest.md` gives a written instruction. On
Tuhfat al-Atfal it records *"visible vocalisation defects (missing shadda in verses 2 and 52,
a wrong vowel in verse 60, `ى` for final `ي` in several places)"* and states that *"since a
matn is memorised from the page, it must be collated against a printed critical edition
before being shown to a learner."* That covers 144 Arabic lines in Jazariyyah and 95 in
Tuhfah.

`Nihayat-al-Qawl-al-Mufid.md` carries the strongest wording of the four: it is **the only
Arabic in the entire vault typed by a human** rather than parsed by script — its own note
says the excerpts "were TRANSCRIBED BY READING THE PAGE IMAGE." It also records a name
collision (مد العوض at p. ١٩٥ is a different rule from madd al-ʿiwaḍ; *"Cite p. ٩٤, never
p. ١٩٥"*), which the page must not flatten away.

**Full (`citation-only`) — Sajawandi-Waqf.** Renders completely; it has no matn to withhold,
by design. It is a symbol table plus two sections of explicit scope-limiting prose.

**Full (`metadata-only`) — Everyayah, Arabic101, Muallimi-Soniy.** Catalogues, not scripture.
Between the two video notes: 221 distinct video IDs and 24 playlists.

### The sources index is generated, not rendered from the manifest

`Source-Manifest.md` lists **7 of the 11 sources** — Shatibiyyah, Sajawandi-Waqf and Nihayat
are absent — and it is `status: verified`, so nothing flags the omission. Rendering it as the
sources index would silently vanish three of the five classical sources. The index is built
from the notes themselves; the manifest is linked as a document.

Its staleness is filed to WISHLIST rather than fixed here, because this work must not edit
the vault.

### Licensing — conditions of use, not courtesies

- **YouTube is linked or embedded, never re-hosted.** No downloading, no audio extraction, no
  proxying. Both channels are Standard YouTube License.
- **Citation-only notes are never "helpfully" filled in** with source text.
- The `<Credits/>` footer must keep rendering on every page (`layout.tsx:21`). It discharges
  four separate attribution obligations from four different parties — Tanzil (CC BY 3.0, any
  Qur'an text), cpfair (CC BY 4.0, any tajweed highlighting), reciters by name (any audio),
  Quran.com (segmentation/timings). Crediting one does not cover another.

---

## 8. Navigation — global nav added

There is **no nav anywhere in the app.** `grep "<nav"` across `src/` returns nothing: no
header, no tab bar, no breadcrumb, no skip link. `/teach/*` is linked from nowhere at all,
and the only site-wide link that exists is the `Credits` footer.

This work adds a small persistent header in `src/app/layout.tsx` — **Course · Library ·
Credits** — in the Sigma glass style, with a skip link for keyboard users.

**This deliberately widens the file-ownership envelope.** WISHLIST:38 grants the Library
agent `src/app/library/**` and its own components; `layout.tsx` is outside that. It is
recorded here rather than done quietly, because the envelope exists to stop three parallel
agents colliding. `/teach` is **not** added to the nav — WISHLIST wants that route gated, not
discovered.

The existing print stylesheet (`globals.css:253-283`) already hides `nav` and `iframe`, so
the new header and any embedded video drop out of print correctly with no extra work.

---

## 9. Visual design

Sigma Designs, which is the house style and has a dedicated skill (`sigma-designs`). Reuse
the existing class layer in `globals.css` rather than inventing surfaces: `.glass` /
`.glass-strong` for cards, `.gradient-text` for h1, `.arabic` / `.quran` for Arabic,
`text-white/{90,75,60,50}` for hierarchy, `.rim-static` for dense grids.

Dark-only: there is no `prefers-color-scheme` block, no `data-theme`, no toggle, and no
light-mode fallback to inherit.

The house page shell is `<main className="mx-auto max-w-2xl p-6 pb-16">`. **Long-form prose
and 1,504 table rows argue for a wider measure on detail pages** — this is a deliberate
deviation, taken knowingly rather than by accident.

**Free win:** `public/images/makhraj/` holds 7 JPGs (~1.08 MB) that map one-to-one onto the
`makhraj_zone` facet, and **no note currently references them.** The 29 letter pages get their
diagram at no cost.

---

## 10. Cross-linking

- **`taught_in` → `/lesson/<id>`.** All 37 distinct lesson ids on in-scope notes resolve to
  live routes. Every rule and letter page links into the course it is taught in.
- **`prerequisites` → other rule pages.** Validated by the gate already.
- **`cpfair_key` → coloured spans.** Present on only 19 of 59 rules. The app's
  `TAJWEED_RULES` (18 cpfair keys) and the vault's 60 classical rule ids are **disjoint
  namespaces with different spellings** (`idgham_shafawi` vs `idghaam_shafawi`), bridged only
  by this field. Any "see this rule in a real ayah" affordance routes through `cpfair_key`
  and **degrades silently for the ~40 rules that lack it.** The mapping is not total and the
  UI must not imply it is.

---

## 11. Error handling

| Condition | Behaviour |
|---|---|
| Note fails zod | **Throw at build, with the filename** — matches `load.ts:7` |
| Malformed/missing frontmatter | Throw — matches `frontmatter.mjs:11-14` |
| Unresolvable wikilink | Render as **plain text**. Never throw, never leak `[[` |
| Slug collision | Throw at build |
| Missing makhraj image | Omit silently |

Fail loud on data, fail soft on links. The scope is link-closed **today** — all 1,247
wikilink occurrences resolve to one of the 100 distinct in-scope note targets, with 0 dangling
note references — so the plain-text fallback should be unreachable in practice. It exists so the property
survives a 102nd note, and a test asserts it is currently unreached.

---

## 12. Tests

Mirroring the existing split: component tests in `src/` (vitest + RTL), vault-reading tests as
`.mjs` in `tests/library/` alongside the existing `frontmatter`/`corpus`/`check-library` tests.

1. All 101 notes load and validate through the zod union.
2. **The invariant:** render all 101 notes, assert the substring `[[` appears **zero times**
   in the output. This makes WISHLIST's done-when executable.
3. **Link closure:** every resolved wikilink target is a real slug in `generateStaticParams`;
   assert the plain-text fallback is currently unreached.
4. One regression test per trap — including asserting `Muallimi-Soniy`'s table keeps all 96
   rows through the `\|` escapes, and that the two-line link in `Ikhfa-Shafawi.md` resolves.
5. Slug generator: `⚠` / em-dash / Arabic headings stay distinct, stable and deduped.
6. Slug uniqueness holds across **all 183** basenames after lowercasing; reserved segments
   are unclaimed.
7. No `needs-review` note renders without its caution; no `draft` note renders with an alarm.
8. **Matn withheld:** the four classical notes render none of their matn/excerpt verse
   bodies, while still rendering their `arabic_title`, `author_arabic` and bāb headings —
   both halves asserted, so a future over-correction that strips all Arabic also fails.
9. `generateStaticParams` yields exactly 101 slugs.
10. Arabic honours the `TajweedText` contract (`.quran`/`.arabic`, `dir="rtl"`, `lang="ar"`).

### Gate floor

All five CI gates green (`.github/workflows/ci.yml`): `npm run lint` → `npx tsc --noEmit` →
`npm test` → `npm run check:library` → `npm run build`. **There is no local `typecheck`
script**, so `npx tsc --noEmit` must be run by hand to match CI.

Verified baseline on `main` as of 2026-08-12: **535 tests / 52 files**, 0 lint errors
(3 pre-existing `no-img-element` warnings), library 0 errors / 3 warnings, 231 static pages,
`tsc` clean. None of these may regress, and **no gate may be weakened to pass.**
`check:library` is untouched because nothing here writes the vault.

If this work runs in a worktree, note `vitest.config.ts:21-28` excludes both `.worktrees/**`
and `.claude/worktrees/**` — that exclusion is what stops a 535-test run reporting 1,595
tests across three copies of the suite.

---

## 13. Out of scope

Teacher editor · authentication or roles · the ADR-007 runtime flip · **any edit to
`library/` or `content/`** · re-hosting any YouTube asset · fixing `Source-Manifest.md`'s
staleness · collating the classical matns · cross-linking the ~40 rules with no `cpfair_key`
· surfacing `/teach` in the nav.

## Deferred to its own spec

**The teacher editor.** The owner's original request included teacher upload/edit. It needs
the ADR-007 flip, authentication, and a write path into a gated vault — and per WISHLIST's
Idea 1, the accounts work carries GDPR-K/COPPA obligations (this course teaches children) that
should be settled before a schema is written, not after. It gets its own brainstorm and spec.

## Done when

- Every rule, letter and source is reachable and readable from `/library`.
- `needs-review` is visible on the 3 rules and 6 sources that carry it; `draft` is stated
  quietly on the 29 letters.
- Every wikilink either routes or renders as plain text — **zero `[[` reaches a student**,
  enforced by test 2.
- No classical matn is displayed; no YouTube asset is re-hosted.
- A student can reach the Library from any page via the new global nav.
- All five gates green, with test count above 535 and no gate weakened.

## Follow-ups to file (not done here)

- `Source-Manifest.md` lists 7 of 11 sources and is marked `verified`.
- WISHLIST.md is stale in ~7 places — the CI section is now flatly false, the "423 tests"
  floor is really 535, and five Moderate/Minor findings are fixed. Verified 2026-08-12.
- `allLessons()` is still O(N²) at build (`src/content/load.ts:32-34`), unmemoized.
- The seven tajweed drills are wired at `/practice/[id]` but **not** in-lesson —
  `src/app/lesson/[id]/page.tsx:13` has no barrel import, so the registry is empty on that
  route.
