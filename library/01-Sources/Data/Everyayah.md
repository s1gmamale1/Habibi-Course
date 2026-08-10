---
type: source
id: everyayah
title: everyayah.com — per-ayah recitation audio
licence: none-stated
licence_note: No explicit written licence exists. Tolerated custom, not a licence grant.
vendored: metadata-only
url: https://everyayah.com/data/
reference_voice: Husary_Muallim_128kbps
practice_voice: Minshawy_Teacher_128kbps
retrieved: 2026-08-10
status: needs-review
---

# everyayah.com

Per-ayah MP3 recitation audio, keyless, CORS-open, and free to stream.
**Stream and link only — never re-host, never bundle, never paywall.**

## URL pattern

```
https://everyayah.com/data/{Edition}/{SSS}{AAA}.mp3
```

Zero-padded 3-digit surah and ayah. This is a **pure function of (surah, ayah)**
— no runtime lookup, no API call, no key. Compute the URL at build time.

Verified live:

```
$ curl -sI https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3
HTTP/2 200
content-type: audio/mpeg
content-length: 126986
access-control-allow-origin: *          # CORS-open, <audio>-safe
cache-control: max-age=25600000
```

## The two voices, and why each was chosen

### Reference voice — `Husary_Muallim_128kbps`

Sheikh Mahmoud Khalil **al-Husary**, *mu'allim* (teaching) edition. Clean, slow,
single voice, deliberate. This is the **precision-drilling** voice: it is what
the student listens to when the question is "what exactly does this rule sound
like." Every rule example in the vault should point here unless there is a
reason not to.

Real file sizes:

| Ayah | Bytes | ≈ Duration |
|---|---:|---|
| 1:1 | 126,986 | ~8 s |
| 1:7 | 329,738 | ~21 s |
| 2:255 (Ayat al-Kursi) | 1,835,018 | ~115 s |
| 112:1 | 98,314 | ~6 s |
| 114:6 | 186,378 | ~12 s |

Rough budget: the hifz set (al-Fatiha + the last 10 surahs, ~90 ayahs) is
**12–18 MB streamed**. Negligible.

### Practice voice — `Minshawy_Teacher_128kbps`

Sheikh Mohamed Siddiq **al-Minshawi**, *mu'allim* (teacher) edition — the
classic teaching recitation **with student repetition**. The sheikh recites a
phrase, a child repeats it, and there is a **natural gap to imitate into.**

This is not a guess. The gaps are measurable:

```
112:1  Minshawy_Teacher   content-length: 89,582
112:1  Minshawy_Murattal  content-length: 51,537     # 1.74x smaller
```

**1.74× the length of the same ayah in the non-teaching Murattal edition** —
consistent with call-and-response repetition, not with a slower tempo alone.
Verified live: 001001 → 140,573 bytes; 112001 → 89,582; 114006 → 139,319.

> **Pedagogically this is the strongest audio asset found for a beginner**, and
> it was missed by the earlier research pass (which listed Minshawi Murattal and
> Mujawwad but not the Teacher edition). Use Husary Mu'allim for *reference*
> and Minshawi Teacher for *homework* — the built-in gap does the work that
> would otherwise need a custom player.

### The full teaching-edition inventory

```
/data/Husary_128kbps/
/data/Husary_128kbps_Mujawwad/
/data/Husary_64kbps/
/data/Husary_Muallim_128kbps/        <- reference voice
/data/Husary_Mujawwad_64kbps/
/data/Minshawy_Mujawwad_192kbps/
/data/Minshawy_Mujawwad_64kbps/
/data/Minshawy_Murattal_128kbps/
/data/Minshawy_Teacher_128kbps/      <- practice voice
```

## Per-word timings exist, for the same reciter, free

Word-level highlighting does **not** require per-word MP3s. quran.com exposes
per-word segment timings for Husary Mu'allim — recitation ID 12, the exact
reference voice above — keyless:

```
GET https://api.quran.com/api/v4/recitations/12/by_chapter/{n}?fields=segments
```

Segment format: `[wordIndex0, wordPosition1, startMs, endMs]`. Coverage verified
at **100%** across every surah sampled (1, 2, 18, 36, 55, 67, 78, 112, 114).

**Gotcha, learned the hard way:** the parameter is **`fields=segments`**.
Passing `segments=true` alone returns the same 200 and the same response shape
**with the segment data silently missing.** It is easy to ship a broken pipeline
without noticing.

The timings encode Husary's teaching pauses — in 2:2, word 5 ends at 4700 ms and
word 6 starts at 8400 ms, a 3.7-second gap. That is deliberate teaching silence,
not bad data; a naive "advance the highlight" loop will look broken unless it
accounts for it.

This unlocks word-synchronised highlighting, tap-a-word-to-seek, and "play just
this word" via `currentTime` plus a `timeupdate` stop — all with Husary's voice
throughout, rather than cutting to a different reciter mid-verse. Cache the
segments at build time; note that they come under quran.com's **developer
terms**, not under anything everyayah grants.

---

# ⚠ Licensing — state this honestly

> **There is no explicit written licence for any recording on everyayah.com.
> None. Not on everyayah, not on quranicaudio, not on islamic.network. What
> exists is tolerated custom, not a licence grant.**

This is a structural fact about the ecosystem, not a gap that more searching
would close. It was looked for and is not there.

**What is actually true:**

- The de-facto norm — relied on by Quran.com, alquran.cloud, and dozens of
  shipped apps — is free streaming and download for personal, educational and
  da'wah use, with the reciter named.
- alquran.cloud's terms state the position plainly: *"All audio files used on
  this website and third party libraries own and retain their respective
  copyrights"*, and note that reciters or their estates may request removal from
  commercial products.
- Al-Husary (d. 1980) and al-Minshawi (d. 1969) recordings are among the most
  universally redistributed in the Muslim world. The practical risk of linking
  them from a free educational tool is very low.
- **The legal position is nonetheless "tolerated custom", not "licensed".** Do
  not let the low practical risk get written up as permission.

## Rules this vault follows

1. **Stream and link. Never re-host, mirror, bundle, or cache audio into the
   repository.** URLs are computed; bytes stay on everyayah.
2. **Credit reciters by name**, every time — Sheikh Mahmoud Khalil al-Husary and
   Sheikh Mohamed Siddiq al-Minshawi. Not "everyayah", not "the reciter".
3. **Never put the audio behind a paywall**, and never make it a paid feature.
4. **If this course ever monetises meaningfully, this needs a real conversation
   with rights holders before launch, not after.** Flagged now so it cannot be
   discovered late.

`status: needs-review` reflects the licence position, not the technical facts —
the URL pattern, file sizes, CORS headers and edition list were all verified
live. What cannot be verified is permission, because no permission document
exists.

## Required credit

> Recitation: Sheikh Mahmoud Khalil Al-Husary (Mu'allim) and Sheikh Mohamed
> Siddiq al-Minshawi (Teacher), streamed via everyayah.com. Word timings via
> Quran.com / Quran Foundation.

See [[Source-Manifest]], [[Tanzil]], [[cpfair-quran-tajweed]].
