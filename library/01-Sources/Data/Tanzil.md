---
type: source
id: tanzil
title: Tanzil Project — Quran Uthmani text
licence: CC-BY-3.0
licence_terms_url: https://tanzil.net/docs/Text_License
vendored: full-text
url: https://tanzil.net
snapshot: 2017 Tanzil Uthmani, as pinned by cpfair/quran-tajweed
snapshot_url: https://github.com/cpfair/quran-tajweed/files/7281388/quran-uthmani.txt
snapshot_size_bytes: 1376504
ayahs: 6236
retrieved: 2026-08-10
status: verified
---

# Tanzil

**The text of record for this vault.** Tanzil is the reference digital Uthmani
Qur'an text; effectively every other open Qur'an dataset derives from it,
including quran.com's, alquran.cloud's, and GlobalQuran's.

| Field | Value |
|---|---|
| Project | Tanzil Project — `tanzil.net` |
| Text used | **Uthmani**, full diacritics |
| Licence | **CC BY 3.0**, with a verbatim-only condition |
| Licence page | `tanzil.net/docs/Text_License` (verified reachable, HTTP 200) |
| Canonically verified | Yes — this is the reference text others derive from |
| Word-level segmentation | No — Tanzil is per-ayah only |
| Vendored in this vault | `99-Corpus/quran-uthmani.txt` — 1,376,504 bytes, 6,266 lines, `surah\|ayah\|text` |

Sample of the vendored file:

```
1|1|بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
1|2|ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ
```

## Which snapshot, and why it matters

The copy vendored here is **not a fresh download from tanzil.net**. It is the
**pinned 2017 snapshot** redistributed by [[cpfair-quran-tajweed]], because that
is the exact text its 60,057 annotation offsets are computed against. Tanzil's
current download differs slightly in encoding, and the cpfair README says so
explicitly: *"the encoding of the files available from Tanzil.net has changed
slightly since the annotations were generated, so please use this copy."*

> **Do not "update" this file to a newer Tanzil release.** It is pinned on
> purpose. Refreshing it silently breaks every tajweed highlight in the app.
> The full failure mode, and the specific codepoint differences involved, are
> documented in [[cpfair-quran-tajweed]].

## Licence terms — CC BY 3.0 plus a no-changes clause

Two obligations, both real:

1. **Attribution with a link.** Credit the Tanzil Project and link back to
   `tanzil.net`. Attribution alone without the link does not satisfy the terms.
2. **Verbatim only — no modification of the text.** This is the condition that
   goes beyond plain CC BY 3.0. The text may be redistributed, but not altered.

**What "no changes" permits and forbids in practice:**

| Operation | Allowed? |
|---|---|
| Redistribute the file as-is | **Yes** |
| Commercial use | **Yes**, with attribution |
| Wrap ayahs in markup / spans for display and highlighting | **Yes** — presentation, not alteration of the text |
| Extract single ayahs or ranges for lessons | **Yes** |
| Normalise, re-encode, strip or add diacritics, "fix" orthography | **No** |
| Substitute a differently-encoded Uthmani text and still call it Tanzil | **No** |

The verbatim condition and the pinned-snapshot requirement point the same way,
which is convenient: **do not touch the bytes.**

## Why not the alternatives

| Source | Redistribution | Verdict |
|---|---|---|
| **Tanzil.net** | **CC BY 3.0**, verbatim, attribution + link | **Text of record** |
| quran.com API v4 | Developer terms; non-commercial OK, commercial needs written licence | Word data and timings only — see [[Everyayah]] |
| alquran.cloud | Non-commercial free; commercial with acknowledgement | Fallback only |
| QUL (qul.tarteel.ai) | Per-resource terms, not a blanket open licence | Fonts / glyph data only |
| Quranic Arabic Corpus | **GPL** — copyleft, viral | Avoid: wrong licence, and morphology not display |
| KFGQPC text | Own site unreachable (`qurancomplex.gov.sa` returns HTTP 000) | Reach via QUL / Quran Foundation |

Tanzil is the only one that is simultaneously canonical, openly licensed for
commercial use, and safe to vendor into the repository.

## Required credit

> Qur'an text: Tanzil Project — [tanzil.net](https://tanzil.net) — CC BY 3.0.

This must appear on the credits page **in addition to** the
[[cpfair-quran-tajweed]] attribution. Two separately licensed works by two
different parties; one credit does not cover both.

See [[Source-Manifest]].
