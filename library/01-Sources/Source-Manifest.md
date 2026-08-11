---
type: source
id: source-manifest
status: verified
---

# Source Manifest

Every external source used by this course, with its licence and vendoring
status.

`vendored` is one of: `full-text` (public domain / open licence, text lives in
this vault), `metadata-only` (link-only; never re-hosted), `citation-only`
(in-copyright; we record what claim it supports, never its text).

| Source | Type | Licence | Vendored | Note status |
|---|---|---|---|---|
| [[Tuhfat-al-Atfal]] | classical matn | public domain | full-text | `needs-review` |
| [[Muqaddimah-Jazariyyah]] | classical matn | public domain | full-text | `needs-review` |
| [[Tanzil]] | Quran text | CC BY 3.0 (verbatim only) | full-text | `verified` |
| [[cpfair-quran-tajweed]] | tajweed annotations | CC BY 4.0 (README prose) | full-text | `verified` |
| [[Everyayah]] | recitation audio | **none stated** — tolerated custom | metadata-only | `needs-review` |
| [[Arabic101]] | video course (English) | Standard YouTube License | metadata-only | `verified` |
| [[Muallimi-Soniy]] | video course (Uzbek) | Standard YouTube License | metadata-only | `verified` |

## Why three notes are `needs-review`

**[[Tuhfat-al-Atfal]]** — the full 61-verse Arabic matn was obtained, but the
transcription carries visible vocalisation defects (missing shadda in verses 2
and 52, a wrong vowel in verse 60, `ى` for final `ي` in several places). Since a
matn is memorised from the page, it must be collated against a printed critical
edition before being shown to a learner. Safe to use now for **structure**
(chapter order, verse spans, mnemonics), which is what the course takes from it.
The English rendering is original and unreviewed.

**[[Muqaddimah-Jazariyyah]]** — the full 109-verse vocalised matn was obtained
and is in noticeably better shape than the Tuhfah transcription; no defects were
spotted, but none were systematically checked. The English rendering is
original and unreviewed, and chapters 8, 14 and 15 are **glossed rather than
translated** (they are dense Qur'anic word-lists compressed to fit metre).

**[[Everyayah]]** — every technical fact was verified live (URL pattern, file
sizes, CORS headers, edition inventory, the 1.74× size ratio proving the
Minshawi Teacher gaps). What cannot be verified is **permission**: no written
licence exists for any recording in this ecosystem. The status flags the licence
position, not the data.

## Attribution obligations

Four separate obligations, from four different parties. Crediting one does not
cover another.

| Obligation | Trigger |
|---|---|
| Tanzil Project + link to `tanzil.net`, CC BY 3.0 | Any display of Qur'an text |
| cpfair/quran-tajweed, CC BY 4.0 | Any tajweed highlighting |
| Reciters **by name** — al-Husary (Mu'allim), al-Minshawi (Teacher) | Any audio playback |
| Quran.com / Quran Foundation | Word segmentation and recitation timings |

Combined credit line:

> Qur'an text: Tanzil Project (tanzil.net), CC BY 3.0. Tajweed annotations:
> cpfair/quran-tajweed, CC BY 4.0. Word segmentation and recitation timings:
> Quran.com / Quran Foundation. Recitation: Sheikh Mahmoud Khalil Al-Husary
> (Mu'allim) and Sheikh Mohamed Siddiq al-Minshawi (Teacher), streamed via
> everyayah.com.

## Two traps recorded here so they are not rediscovered

1. **Never mix the pinned 2017 Tanzil snapshot with quran.com's
   `text_uthmani`.** The 60,057 annotation offsets are keyed to the pinned text;
   quran.com's differs by U+0640 TATWEEL insertions, waqf signs, and basmala
   handling. Mixing them mis-highlights nearly every ayah, silently. Full
   detail in [[cpfair-quran-tajweed]].
2. **[[cpfair-quran-tajweed]]'s CC BY 4.0 comes from README prose, not a LICENSE
   file.** Automated licence scanners and SBOM tools will report it as
   "unknown". The licence is real; the tooling is blind to it.
