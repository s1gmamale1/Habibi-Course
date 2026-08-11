---
type: source
id: cpfair-quran-tajweed
title: cpfair/quran-tajweed — machine-readable tajweed annotations
licence: CC-BY-4.0
licence_source: README prose — there is no LICENSE file
vendored: full-text
url: https://github.com/cpfair/quran-tajweed
data_url: https://raw.githubusercontent.com/cpfair/quran-tajweed/master/output/tajweed.hafs.uthmani-pause-sajdah.json
text_url: https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt
annotations: 60057
rules: 18
ayahs: 6236
size_bytes: 5578730
retrieved: 2026-08-10
status: verified
---

# cpfair/quran-tajweed

The highest-value dataset in this project: a complete, machine-readable tajweed
annotation of the entire Qur'an, under an open licence that permits
redistribution. It is what makes per-rule highlighting, isolate-mode drills, and
auto-generated quizzes possible at all.

| Field | Value |
|---|---|
| Repository | `github.com/cpfair/quran-tajweed` |
| Data file | `output/tajweed.hafs.uthmani-pause-sajdah.json` |
| Size | 5,578,730 bytes (5.58 MB) |
| Coverage | **6,236 ayahs** — every ayah in the Qur'an (63 have zero annotations) |
| Annotations | **60,057** |
| Distinct rules | **18** |
| Offset units | **Unicode codepoints** — not bytes, not word indices |
| Last push | 2021-10-12 · 184 stars · README says "not actively maintained" |

Dormancy is not rot here. The Qur'an text does not change, so a frozen ruleset
is a frozen artefact, not a stale one.

## Format

Clean separation of text from annotation — the annotations are pure offset
ranges, re-serialisable into any markup. Real first record (1:1), verbatim:

```json
{
 "annotations": [
  {"end": 8,  "rule": "hamzat_wasl",    "start": 7},
  {"end": 16, "rule": "hamzat_wasl",    "start": 15},
  {"end": 17, "rule": "lam_shamsiyyah", "start": 16},
  {"end": 25, "rule": "madd_2",         "start": 24},
  {"end": 29, "rule": "hamzat_wasl",    "start": 28},
  {"end": 30, "rule": "lam_shamsiyyah", "start": 29},
  {"end": 36, "rule": "madd_246",       "start": 35}
 ],
 "ayah": 1,
 "surah": 1
}
```

---

# ⚠ The text-mismatch trap

> **These offsets are keyed to a specific pinned 2017 Tanzil snapshot. They are
> NOT valid against quran.com's `text_uthmani`. Mixing the two mis-highlights
> nearly every ayah in the Qur'an — silently, with no error and no crash.**

The repo's README says it outright: *"the encoding of the files available from
Tanzil.net has changed slightly since the annotations were generated, so please
use this copy."* The pinned copy is the 1.38 MB `quran-uthmani.txt` linked in
`text_url` above, 6,236 lines in `surah|ayah|text` form. It is vendored in this
vault at `99-Corpus/quran-uthmani.txt`.

**Three independent classes of difference** between the pinned text and
quran.com's `text_uthmani`, measured directly:

1. **U+0640 ARABIC TATWEEL inserted before superscript alef.** quran.com writes
   `ـٰ`, the pinned text writes bare `ٰ`. **+1 codepoint per occurrence, and
   there are 9,838 superscript alefs in the corpus.** Every offset after the
   first one in an ayah is wrong.
2. **Waqf and pause signs** (U+06D6, U+06D7, U+06DA, …) are present in
   quran.com's text and **absent** from the pinned text.
3. **Basmala handling.** The pinned text prefixes the basmala to ayah 1 of 113
   surahs; quran.com returns it separately.

Real diffs, computed against the live API:

```
--- 1:1     pinned len=38   quran.com len=39   identical=False
    insert  qcom[24:25] = U+0640 [ARABIC TATWEEL]

--- 2:255   pinned len=408  quran.com len=427  identical=False
    insert  qcom[17:18]   = U+0640 [ARABIC TATWEEL]
    insert  qcom[54:56]   = U+0020 U+06DA [SPACE, ARABIC SMALL HIGH JEEM]
    insert  qcom[93:95]   = U+06DA U+0020
    insert  qcom[145:147] = U+06D7 U+0020
    insert  qcom[251:253] = U+0020 U+06D6
    ... 11 insertions total

--- 96:1    pinned len=77   quran.com len=38   identical=False
    delete  pinned[0:39] = the full Basmala
```

**The rule: render the pinned text, or re-run the classifier. Never mix.** If a
future contributor swaps in quran.com text "because it's the same Qur'an", every
highlight in the app moves by a few characters and nobody will notice for
months. This is the single most likely way this dataset gets broken.

See [[Tanzil]] for the upstream text and its own licence.

---

# The 18 rule keys

Counts computed from the actual data file, not from the README.

| Rule key | Count | | Rule key | Count |
|---|---:|---|---|---:|
| `hamzat_wasl` | 13,252 | | `madd_munfasil` | 3,172 |
| `madd_2` | 9,028 | | `lam_shamsiyyah` | 2,733 |
| `ikhfa` | 5,301 | | `madd_muttasil` | 1,997 |
| `ghunnah` | 4,946 | | `idghaam_no_ghunnah` | 1,035 |
| `madd_246` | 4,543 | | `idghaam_shafawi` | 832 |
| `silent` | 4,174 | | `iqlab` | 562 |
| `idghaam_ghunnah` | 3,933 | | `ikhfa_shafawi` | 496 |
| `qalqalah` | 3,834 | | `madd_6` | 148 |
| | | | `idghaam_mutajanisayn` | 58 |
| | | | `idghaam_mutaqaribayn` | 13 |

**Total: 60,057.** These 18 strings are the canonical `cpfair_key` values and are
enforced by the library validator (`scripts/lib/rules.mjs`) — a rule note whose
`cpfair_key` is not in this list fails the gate.

**Note the long tail.** `idghaam_mutaqaribayn` has **13** occurrences in the
entire Qur'an and `idghaam_mutajanisayn` has **58**. Any drill that samples
uniformly from the corpus will show these effectively never; they need
hand-picked examples or explicit oversampling.

**Better than the API formats on one real distinction:** it separates
`madd_muttasil` from `madd_munfasil`, where quran.com collapses both into
`madda_permissible`. Those are two different rules with two different rulings
(obligatory vs permissible — see [[Tuhfat-al-Atfal]] verses 43–44), and the
course teaches them separately.

**Not covered** — must be authored by hand for the lessons that need them:
tafkhim/tarqiq (heavy/light letters, including the ra' and lam rules),
madd al-badal, madd al-'iwad, sakt.

## Offset validation

All 60,057 offsets were checked against the pinned text: **zero out of range**,
and every extracted span is the correct letter for its rule. Spot-check of the
extracted span per rule:

```
ghunnah              2:3 -> "مَّ"    hamzat_wasl          1:1 -> "ٱ"
idghaam_ghunnah      2:5 -> "ًى مِّ"  idghaam_no_ghunnah   2:2 -> "ًى لِّ"
idghaam_shafawi      2:10 -> "م مَّ"  idghaam_mutajanisayn 2:233 -> "د"
idghaam_mutaqaribayn 4:158 -> "ل"    ikhfa                2:3 -> "نفِ"
ikhfa_shafawi        2:8 -> "م بِ"   iqlab                2:10 -> "ٌۢ ب"
lam_shamsiyyah       1:1 -> "ل"      madd_2               1:1 -> "ٰ"
madd_246             1:1 -> "ي"      madd_6               2:1 -> "لٓ"
madd_munfasil        2:4 -> "آ"      madd_muttasil        2:5 -> "ٰٓ"
qalqalah             2:3 -> "قْ"     silent               2:5 -> "و۟"
```

`hamzat_wasl`→ٱ, `lam_shamsiyyah`→ل, `qalqalah`→qalqalah letters with sukun,
`iqlab`→tanween + small meem + ب, `ikhfa`→noon followed by an ikhfa letter,
`madd_6`→the muqatta'at letters with maddah. **The dataset is trustworthy.**

## Two rendering hazards

The README warns: *"Annotations do not always start or stop on letter
boundaries."* Two consequences for anyone building the renderer:

1. **Normalise every span boundary outward to the nearest grapheme-cluster
   edge** before emitting markup — walk forward over any `Mn`-category
   codepoints. A base letter and its combining marks must never be split across
   two spans. This is the most likely source of rendering bugs.
2. **Flatten overlaps first.** Rules nest and overlap — `hamzat_wasl` sits
   inside a `lam_shamsiyyah` region in 1:1. Sweep the boundaries, emit one
   segment per distinct rule-set, then style by precedence (or layer the
   secondary rule as an underline). Naive nesting produces invalid markup and
   broken Arabic shaping.

## Why this and not the alternatives

| Source | Format | Machine-readable rule identity | Granularity | Licence | Vendorable |
|---|---|---|---|---|---|
| **cpfair/quran-tajweed** | offset JSON | **Yes, cleanest** | codepoint | **CC BY 4.0** | **Yes** |
| quran.com `text_uthmani_tajweed` | pseudo-HTML, unquoted attrs | Yes | substring | Developer terms | Not really |
| alquran.cloud `quran-tajweed` | bespoke bracket codes | Yes | substring | Non-commercial | Not really |
| QUL "QPC V4 Tajweed Font" | colour baked into glyphs | **No** | word glyph | KFGQPC | Unmodified only |

The COLRv1 tajweed font renders beautifully and is useless for teaching: you
cannot ask it *which rule applies here*, only display it. No isolate mode, no
quizzes, no tooltips, no screen-reader labels. cpfair is the only option that is
complete, offset-clean, finer-grained on madd, and licensed for redistribution.

---

# Licensing — read the caveat

**CC BY 4.0**, and the claim is **correct** — but it comes from **README prose,
not a LICENSE file**:

> This data file is licensed under a Creative Commons Attribution 4.0
> International License, while the original Tanzil.net text file linked above is
> made available under the Tanzil.net terms of use.

The GitHub API reports `license: null` for this repository because there is no
`LICENSE` file to detect.

> **Consequence: automated licence scanners will report this dependency as
> "unknown".** Anyone running a compliance review, an SBOM generator, or a CI
> licence gate will flag it. That is a tooling artefact, not a licence problem.
> Note it in the credits page and in any compliance review so it does not have
> to be re-litigated each time.

| Question | Answer |
|---|---|
| Attribution required? | **Yes** — CC BY 4.0 for the annotations, CC BY 3.0 for the underlying [[Tanzil]] text |
| Commercial use? | **Yes**, permitted by both licences |
| Self-host / vendor into the repo? | **Yes** — this is the only tajweed source that unambiguously permits it |

**Two attributions are required, not one.** The annotations and the text they
key to are separately licensed by separate parties. Crediting only cpfair is not
sufficient — see [[Tanzil]].

Required credit line:

> Tajweed annotations: cpfair/quran-tajweed, CC BY 4.0. Qur'an text: Tanzil
> Project (tanzil.net), CC BY 3.0.

See [[Source-Manifest]].
