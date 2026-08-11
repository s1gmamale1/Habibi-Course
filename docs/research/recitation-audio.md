# Research: Verse and Word Recitation Audio Sources

**Date:** 2026-07-19 · **amended 2026-08-11**
**Scope:** Sourcing free, openly-licensed (or link-only) per-ayah and per-word Quran recitation audio for the Tajweed Course platform (tap-to-hear in slide decks, drill grids, homework pages). Covers everyayah.com, islamic.network/AlQuran Cloud CDN, QUL (Quranic Universal Library), Quran.com/Quran Foundation word-by-word audio, and secondary fallbacks (mp3quran.net). All URLs below were curled live during this research session (2026-07-19) and returned HTTP 200 unless noted.

> ## ⚠ Amendment 2026-08-11 — both primary sources are NON-COMMERCIAL ONLY
>
> **This changes the conclusion of §1.5 and sharpens §4.4. Read this before building on either.**
>
> **EveryAyah is CC BY-NC 2.5 Canada.** §1.5 below says no explicit licence for the audio
> could be found — that was **right about the live site and wrong about the record**. The
> licence page `versebyversequran.com/site/license` returned 200 from 2009 until 2012 and has
> 404'd since; the Wayback capture renders the licence in an iframe whose `src` **is** the
> licence, `creativecommons.org/licenses/by-nc/2.5/ca/`, identical across the 2009, 2011 and
> 2012 captures *(verified independently in this session)*. It covered **the MP3s, not merely
> the timing files**: each reciter folder carried a `000_license.html` reading *"use of these
> MP3s is only allowed if you comply with the license details."*
>
> **Quran.com's terms are stricter than §4.4 records.** Content is *"for your personal,
> non-commercial use only"*; the terms separately prohibit *"data mining, scraping, crawling…
> or compiling a collection of listings or data for any purpose"*, and forbid reproducing or
> **publicly displaying** Content without prior written consent. §5.1 vests all Content —
> explicitly including *"music, sound, and other files"* — as Quran.com's sole property.
> **Bulk-fetch-and-rehost is prohibited outright**, and "publicly display" arguably reaches
> embedding, so link-only remains right but is not risk-free.
>
> **What this means.** While the course is free, link-only use of both, with attribution,
> is fine. **If it is ever monetised, both are barred** — and the only clean path is the
> CC BY 4.0 `cpfair/quran-align` word timings applied to audio the project has rights to.
>
> **A warning about QUL.** Its word-by-word "dataset" ships **URLs, not audio** — a link
> index into Quran.com's CDN, so downloading it launders nothing. QUL has no licence of its
> own, and its `ResourcePermission` model defaults `permission_to_host` and
> `permission_to_share` to **`unknown`**, with export gated on `granted? || unknown?`.
> **Presence on QUL is not evidence that anyone cleared the rights.**

---

## 1. everyayah.com

### 1.1 Directory structure

Root data directory: `https://everyayah.com/data/` — a plain Apache/BunnyCDN-style directory listing, one folder per reciter+edition+bitrate combination, e.g.:

```
https://everyayah.com/data/Abdul_Basit_Murattal_128kbps/
https://everyayah.com/data/Husary_128kbps/
https://everyayah.com/data/Husary_128kbps_Mujawwad/
https://everyayah.com/data/Husary_64kbps/
https://everyayah.com/data/Husary_Muallim_128kbps/          <-- the teacher edition (see 1.2)
https://everyayah.com/data/Husary_Mujawwad_64kbps/
https://everyayah.com/data/Alafasy_128kbps/
... (~60 reciter/bitrate folders total, including translation-audio folders for Persian, Urdu, Bosnian, Azerbaijani, English)
```

There is also a browsable reciter/edition landing page: https://everyayah.com/recitations_ayat.html, and a legacy index at https://everyayah.com/old_index.html.

### 1.2 All Husary editions found (confirmed via directory listing)

Curled `https://everyayah.com/data/` and grep'd for "Husary":

```
/data/Husary_128kbps/
/data/Husary_128kbps_Mujawwad/
/data/Husary_64kbps/
/data/Husary_Muallim_128kbps/      <- Mu'allim / "teacher" slow-recitation edition — PRIMARY for this course
/data/Husary_Mujawwad_64kbps/
```

**`Husary_Muallim_128kbps` is the exact folder name for the Husary Mu'allim (teacher) edition** — Sheikh Mahmoud Khalil Al-Husary's letter-by-letter, deliberately slow "teaching" recitation, recorded specifically for reading instruction. This is the single best-suited public-domain-style audio source for absolute beginners and is the spec's designated primary reciter.

Other Husary styles present for reference/fallback:
- `Husary_128kbps` — standard Murattal (moderate pace), 128kbps
- `Husary_64kbps` — standard Murattal, 64kbps (smaller files)
- `Husary_128kbps_Mujawwad` / `Husary_Mujawwad_64kbps` — Mujawwad (melodic/embellished) style, not teaching-paced — not recommended for beginner drills but fine for later "listen to a beautiful reciter" exposure.

### 1.3 Per-ayah URL pattern (confirmed live)

Pattern: `https://everyayah.com/data/{EditionFolder}/{SSS}{AAA}.mp3`
where `SSS` = 3-digit zero-padded surah number, `AAA` = 3-digit zero-padded ayah-in-surah number (both 1-indexed, no separator between them).

Verified resolving (HTTP 200, `audio/mpeg`, served via BunnyCDN with `access-control-allow-origin: *` — safe for direct browser `<audio>` tag use / CORS-friendly):

- `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3` — al-Fatiha 1:1, 126,986 bytes ✅
- `https://everyayah.com/data/Husary_Muallim_128kbps/114006.mp3` — an-Nas 114:6 (last ayah of the Quran) ✅
- `https://everyayah.com/data/Husary_128kbps/001001.mp3` — standard (non-teacher) edition, also resolves ✅

Directory listing of `Husary_Muallim_128kbps/` also shows:
```
000_checksum.md5
000_versebyverse.zip      <- full bulk-download zip of every ayah, all in this edition
PageMp3s/                 <- exists but currently EMPTY for this edition (no per-mushaf-page files)
merged/                   <- per-surah merged files (not yet inspected in depth; likely one mp3 per full surah)
zips/                     <- likely per-surah zip bundles
```
So per-surah "merged" files may exist for full-surah playback (useful for hifz-strand review listening), but the **per-page** convenience folder is empty for the Muallim edition — the course cannot rely on ready-made per-page mp3s from this edition and would need to concatenate ayah files client-side or use the whole-surah files if a "listen to full surah" feature is wanted.

### 1.4 Bitrates available

Per-reciter, bitrate is baked into the folder name, not selectable per request. For Husary specifically: 64kbps and 128kbps are both available (see 1.2); no 192kbps Husary folder was found in the listing (192kbps folders exist for other reciters, e.g. Sudais, Basfar, Hani Rifai, Minshawy Mujawwad). 128kbps is entirely adequate for spoken-word teaching audio (this is not music) and keeps file sizes reasonable for a mobile-first, homework-driven course.

### 1.5 License / usage terms

- No explicit, unambiguous top-level license page for the **audio files themselves** was found on everyayah.com. The `recitations_ayat.html` browsing page carries no visible copyright/terms notice.
- The only explicit license text found on the site concerns the **timing/segment files**, not the audio itself: `https://everyayah.com/data/timings_files/000_disclaimer.txt`:
  > "(C) VerseByVerseQuran.com — You must link back to our site from your product and web-site to use these timings. Full License at http://versebyversequran.com/site/license" (that license URL currently 301-redirects and did not resolve to readable content during this session — flagged as an open question below).
- everyayah.com's own audio corpus is widely mirrored on the Internet Archive as an openly downloadable/streamable dataset: https://archive.org/details/quran-every-ayah and companion parts (e.g. https://archive.org/details/quran-everyayah-part-2, `-part-9`), which is strong secondary evidence the corpus is broadly treated as freely redistributable for non-commercial/educational Quran-study use — but this is not a substitute for an explicit license grant from everyayah.com itself.
- **Practical stance for this course:** everyayah.com is an extremely long-standing (15+ years), widely-used infrastructure project that virtually every open-source Quran app (Quran.com, AlQuran Cloud, dozens of GitHub projects) links to directly for verse audio, without re-hosting. Treat it the same way: **link/stream the mp3 URLs directly, do not re-host the files**, and keep the reciter's name + "audio via everyayah.com" attributed in teacher/credits notes. This matches the project's hard constraint ("or merely linked, never re-hosted").

---

## 2. islamic.network CDN / AlQuran Cloud (cdn.islamic.network + api.alquran.cloud)

### 2.1 Editions list endpoint

`https://api.alquran.cloud/v1/edition?format=audio` returns all audio editions. Confirmed via live curl. Husary-relevant entries returned:

```json
{"identifier":"ar.husary","englishName":"Husary","type":"versebyverse"}
{"identifier":"ar.husarymujawwad","englishName":"Husary (Mujawwad)","type":"versebyverse"}
{"identifier":"ar.husary-2","englishName":"Husary","type":"versebyverse"}
{"identifier":"ar.husarymujawwad-2","englishName":"Husary (Mujawwad)","type":"versebyverse"}
```

**Important finding: there is no `ar.husarymuallim` (teacher/Mu'allim edition) on this CDN.** Only the standard Murattal (`ar.husary`) and Mujawwad (`ar.husarymujawwad`) styles are exposed here, each with a `-2` alternate-recording variant. **This means islamic.network/AlQuran Cloud cannot serve the Husary Mu'allim teaching edition — only everyayah.com's `Husary_Muallim_128kbps` folder currently provides that specific recording.** This makes islamic.network a good *general fallback CDN* (different infrastructure, JSON API, guaranteed CORS) but not a substitute source for the teacher-paced recitation itself.

### 2.2 Per-ayah endpoint pattern (confirmed live)

Two ways to get audio:

**(a) Direct CDN file pattern** (fastest, no API round-trip):
```
https://cdn.islamic.network/quran/audio/{bitrate}/{edition}/{globalAyahNumber}.mp3
```
- `{bitrate}` ∈ {192, 128, 64, 48, 40, 32} kbps (per the CDN's published bitrate list; not every edition has every bitrate — check https://raw.githubusercontent.com/islamic-network/cdn/master/info/cdn.txt, though a grep for "husary" on that file returned no lines during this session, i.e. Husary's exact per-bitrate matrix isn't itemized there and should be spot-checked per bitrate before relying on anything other than 128kbps).
- `{globalAyahNumber}` is the **global 1–6236 ayah index across the whole Quran**, NOT surah:ayah — this is a materially different addressing scheme from everyayah.com's `SSSAAA` per-surah/per-ayah naming, so any code touching both sources needs a surah/ayah → global-number lookup table (widely available, e.g. from Tanzil metadata or the API itself).
- Verified: `https://cdn.islamic.network/quran/audio/128/ar.husary/1.mp3` → HTTP 200, `audio/mpeg`, 82,558 bytes (ayah #1 = al-Fatiha 1:1). ✅

**(b) JSON API wrapper** (returns text + metadata + audio URL together — convenient for the content pipeline, e.g. auto-generating drill JSON):
```
https://api.alquran.cloud/v1/ayah/1/ar.husary
```
Verified live: returns `"audio":"https://cdn.islamic.network/quran/audio/128/ar.husary/1.mp3"` plus `"audioSecondary":["https://cdn.islamic.network/quran/audio/64/ar.husary/1.mp3"]`, Arabic text, surah/juz/page/ruku/hizb metadata — genuinely useful if the content pipeline wants one call to fetch text+audio+page number together, though the project's Quran-text source of record should remain Tanzil/QUL per the spec (never hand-typed), with this API used only for audio-URL lookups if convenient.

Full surah stream: `https://api.alquran.cloud/v1/surah/1/ar.husary` (also documented, not separately curled here but same pattern).

### 2.3 License / terms

Fetched `https://alquran.cloud/terms-and-conditions` directly (live, 2026-06-14 "last updated" per the page). Key clauses:
- "AlQuran.cloud is part of the Islamic Network... made available... WITHOUT ANY WARRANTY."
- **"The Quran text and audio provided has been originally retrieved from GlobalQuran.com. All audio files used on this website and third party libraries own and retain their respective copyrights."**
- Section II (fair use of Quranic text): sourced from Tanzil.net and Quran Academy; "You may reproduce, embed, store and display the text freely, for any non-commercial purpose." Commercial reproduction (printed copies for sale, paid offline apps) "requires no permission... but a respectful acknowledgement."
- This is consistent with the course's intended use: **a free, non-commercial, one-student teaching tool that only links/streams the audio** — squarely inside the permitted use, no license purchase needed. Recommend keeping "audio via cdn.islamic.network (Islamic Network), original recordings via GlobalQuran.com" in the credits/teacher notes.

### 2.4 Word-by-word audio on islamic.network?

Not found. The `format=audio&type=versebyverse` edition list returned 31 verse-by-verse editions and no word-level segmentation; islamic.network/AlQuran Cloud is a verse-level (not word-level) audio CDN. For word-by-word audio, see Section 4 (Quran.com / Quran Foundation) which is the correct source.

---

## 3. QUL (Quranic Universal Library, qul.tarteel.ai)

- Home: https://qul.tarteel.ai/ · Resources index: https://qul.tarteel.ai/resources · Audio/segments page: https://qul.tarteel.ai/resources/recitation · GitHub: https://github.com/TarteelAI/quranic-universal-library
- QUL exposes **133 recitations** as downloadable datasets (JSON or SQLite), tagged by attributes: 59 include word/segment-level timestamp data ("With segments"), 44 are Hafs riwayah, 35 Murattal, 5 Mujawwad, **2 tagged "Muallim"** (teaching recitations — worth checking by name for whether one of the two is Husary's, since QUL's own tagging surfaced this independently of everyayah), 2 "kids repeat" versions, 1 "Ijazah"-certified.
- Reciters explicitly listed on the page included Abdul Basit Abdul Samad, Mishari Rashid al-`Afasy, and **Mahmoud Khalil Al-Husary** among "numerous others."
- **Nature of the data:** QUL's recitation resource is fundamentally a **timestamp/segmentation dataset** layered on top of existing recitation audio (ayah-by-ayah or surah-by-surah segment boundaries, in JSON/SQLite), used to drive word-highlighting during playback — **not** a alternate mp3-hosting service in its own right for most entries. Whether QUL bundles direct downloadable mp3s per recitation vs. only timestamp metadata pointing at externally-hosted files was not fully resolved by page-level fetch alone (the fetch tool could not confirm raw-mp3-URL presence with certainty) — **this needs a follow-up: sign up for a free QUL account and inspect one dataset's actual JSON/SQLite export** to see whether it embeds absolute audio URLs (likely pointing back at everyayah.com/cdn.islamic.network-style hosts) or only local segment offsets into an mp3 the course must already have.
- **Signup required:** "Anyone can sign up" to browse/download — i.e. QUL is not a bare anonymous-curl API; use of QUL resources will require creating a free account, unlike everyayah.com/islamic.network which are fully open.
- **License:** not pinned down to an explicit license text during this session (QUL's "Terms of use" and "Privacy Policy" links exist but were not individually fetched/quoted). **Open question — verify before building any pipeline dependency on QUL's own hosted audio; the underlying recitations are the same reciters as everyayah/other CDNs, so worst case the course keeps using everyayah/islamic.network for the raw mp3s and only uses QUL, if at all, for word-timestamp metadata to build karaoke-style highlighting.**

### 3.1 Where the course's actual word-by-word audio should come from

QUL is **not** the load-bearing word-by-word audio source for this course — see Section 4, which found a concrete, curl-verified, anonymous, CORS-open per-word mp3 CDN. QUL is more relevant as a potential text/timestamp data source for Quran text/metadata (per the spec's mention of QUL as a Quran-text option) than as the primary word-audio host.

---

## 4. Word-by-word audio: Quran.com / Quran Foundation CDN (audio.qurancdn.com)

This is the strongest concrete finding for Phase 2–3 word drills.

### 4.1 URL pattern (confirmed live)

```
https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3
```
- `SSS` = 3-digit surah number, `AAA` = 3-digit ayah number, `WWW` = 3-digit word position within the ayah (all zero-padded, underscore-separated — different separator convention from everyayah's concatenated `SSSAAA`, so don't assume one code path handles both).

Verified live:
- `https://audio.qurancdn.com/wbw/001_001_001.mp3` — al-Fatiha 1:1, word 1 ("Bismi") → HTTP 200, `audio/mpeg`, 44,975 bytes, `access-control-allow-origin: *` (CORS-open, browser `<audio>`-safe) ✅
- `https://audio.qurancdn.com/wbw/001_001_004.mp3` — word 4 of the same ayah ("ar-Raheem") → HTTP 200, 70,031 bytes ✅

### 4.2 How to discover the word count / audio_url per ayah (API)

`https://api.quran.com/api/v4/verses/by_key/1:1?words=true&word_fields=audio_url` — confirmed live, returns each word object with `"audio_url":"wbw/001_001_001.mp3"` (a **relative** path — must be prefixed with `https://audio.qurancdn.com/` to get the playable URL) plus `text`, `translation`, and `transliteration` per word — directly useful for building word-by-word drill cards (Arabic + transliteration + gloss + tap-to-hear, in one API response). Example full response captured for 1:1 includes all 4 real words + the end-of-ayah marker (which correctly has `audio_url: null`, since it's not a recitable word).

This api.quran.com v4 endpoint responded successfully **without any auth headers** during this session, though Quran Foundation's newer documentation portal (api-docs.quran.foundation) frames the modern Content API v4.0.0 as requiring registration/OAuth client credentials for general content access — **the raw `audio.qurancdn.com/wbw/...mp3` file CDN itself is explicitly described in Quran Foundation's own docs as "public CDN assets, not authenticated Content API endpoints,"** i.e. the mp3s can be linked/played with no auth even if the metadata-lookup API eventually requires a free developer key. **Recommendation: hardcode/precompute the `SSS_AAA_WWW.mp3` filenames from the (already-necessary) verified Quran text + word count per ayah, rather than depending on live authenticated API calls at runtime** — this sidesteps any auth requirement entirely and fits the "static Next.js, no backend" architecture.

### 4.3 Which reciter is the word-by-word audio?

Not conclusively identified by name in this session (searches turned up general "Quran.com word by word" feature-announcement pages, not an explicit credits/reciter-attribution page). This is an **open question to resolve before shipping Phase 2 word drills** — the course should confirm the reciter identity/style (it is a dedicated single-word recording set, not a "sliced from continuous recitation" artifact, based on the clean short clips retrieved) and decide whether its pace/style is suitable to sit alongside Husary Mu'allim ayah audio, or whether it's used purely for isolated-word pronunciation practice (which is likely fine regardless of which qari it is, since the pedagogical goal in Phase 2 is correct word-level pronunciation, not qira'ah matching).

### 4.4 License

Fetched Quran Foundation's developer terms (`https://api-docs.quran.foundation/legal/developer-terms/`) via search-result synthesis (direct WebFetch to `quran.com/en/terms-and-conditions` failed with a connection reset mid-session and was not successfully re-fetched — **flagged as needing a manual re-check**). Key points surfaced:
- Non-exclusive, revocable, non-transferable, non-sublicensable license to use the API/content "to develop and operate applications that provide beneficial Quranic experiences to end users."
- Personal/non-commercial use: view, use, copy, distribute for individual, non-commercial, informational purposes.
- **Commercial redistribution or resale of content/raw API data requires a separate written commercial license.**
- Content must not be cached/stored longer than 1 week unless expressly permitted (relevant if the course ever considers bulk-downloading and re-hosting these files — reinforces the "link/stream, don't re-host" approach already mandated by the project's hard constraints).
- This is a free, non-commercial, single-student educational tool — well within the permitted non-commercial use; **link/stream directly from `audio.qurancdn.com`, do not bulk-download and re-host.**

---

## 5. Other free per-ayah / per-word sources found (secondary/fallback candidates)

### 5.1 mp3quran.net (per-surah, not per-ayah — noted for completeness/fallback only)
- JSON reciters API: `https://www.mp3quran.net/api/v3/reciters?language=eng` (confirmed live, 200 OK, 158,909 bytes, full JSON reciter+moshaf catalogue).
- Husary entries found in this API (all **per-surah** file servers, not per-ayah):
  - `Rewayat Hafs A'n Assem - Murattal` → `https://server13.mp3quran.net/husr/` (verified: `https://server13.mp3quran.net/husr/001.mp3` → HTTP 200, 935,074 bytes, i.e. the entire surah al-Fatiha as one file)
  - `Almusshaf Al Mojawwad` → `https://server13.mp3quran.net/husr/Almusshaf-Al-Mojawwad/`
  - Also Warsh/Qalon/Aldori riwayat variants (not relevant — course uses Hafs 'an 'Asim).
  - Interesting adjacent find: a **different** reciter, "Alhusayni Al-Azazi," is tagged `Almusshaf Al Mo'lim` (teacher mus-haf) at `https://server8.mp3quran.net/3zazi/` — a second "teaching style" option if ever wanting a second teacher-paced reciter, but not Husary, so not a substitute for the everyayah Husary_Muallim recordings.
- **Verdict:** mp3quran.net is per-surah only (one mp3 per whole chapter), not per-ayah/per-word — **not suitable as primary or fallback for this course's tap-a-single-ayah/word UI**, but could be a nice-to-have "listen to the whole surah" link for the hifz strand (Phase 3) where students memorize whole short surahs and might want continuous playback.

### 5.2 archive.org mirrors of everyayah's corpus
- https://archive.org/details/quran-every-ayah and multi-part companions (`-part-2` through at least `-part-9`) — full bulk mirrors of the everyayah per-ayah dataset, useful only as a disaster-recovery/offline-bulk-download fallback if everyayah.com ever goes down; not needed for the live tap-to-hear UI, which should hit everyayah.com directly (or islamic.network as CDN fallback).

### 5.3 QuranicAudio.com
- https://quranicaudio.com/ — attempted live curl during this session returned connection status `000` (DNS/connect failure at time of testing) — **could not verify live; treat as unconfirmed/secondary until independently re-checked**, not recommended as a load-bearing dependency given the failure.

### 5.4 GlobalQuran.com
- Origin source credited by AlQuran Cloud's terms page for its audio corpus (see §2.3). Confirmed reachable (`https://globalquran.com/` → HTTP 200) but not independently explored for a separate API/URL pattern in this session, since AlQuran Cloud already re-exposes the same underlying recordings through a clean, verified, CORS-open CDN. No need to integrate GlobalQuran.com directly.

---

## 6. Recommendations for this course

### (a) Slow teaching recitation per ayah (Phase 1–3 tap-to-hear, checkpoints, hifz strand)
- **Primary:** everyayah.com, `Husary_Muallim_128kbps` folder.
  Pattern: `https://everyayah.com/data/Husary_Muallim_128kbps/{SSS}{AAA}.mp3` (3-digit surah + 3-digit ayah, no separator, zero-padded, 1-indexed).
  This is the exact Husary Mu'allim "teacher" edition the design spec calls for, at a bitrate (128kbps) entirely sufficient for speech, CORS-open, and free to link.
- **Fallback #1 (same reciter, different infrastructure):** islamic.network CDN, standard Husary edition (`ar.husary`) — NOT the Mu'allim/teacher pace, but same qari, different CDN (BunnyCDN vs. Ceph/nginx), useful if everyayah.com has downtime.
  Pattern: `https://cdn.islamic.network/quran/audio/128/ar.husary/{globalAyahNumber}.mp3` (requires a surah:ayah → 1–6236 global-index lookup table — different addressing than everyayah).
- **Fallback #2 (different qari, spec's named alternate):** Minshawy — available on everyayah.com as `Minshawy_Murattal_128kbps` (and Mujawwad at 192kbps) per the reciter list gathered in §1.2/WebFetch of the recitations page; same `SSSAAA.mp3` pattern.
- Build the audio-URL-resolution as a **pure function of (surah, ayah) → URL string**, never fetched at runtime from a listing API, so the static Next.js site has zero external API dependency at build or runtime beyond the `<audio src>` tag itself.

### (b) Word-by-word audio (Phase 2–3 word drills — the crucial gap the spec flags)
- **Primary:** Quran.com / Quran Foundation CDN.
  Pattern: `https://audio.qurancdn.com/wbw/{SSS}_{AAA}_{WWW}.mp3` (3-digit surah, 3-digit ayah, 3-digit word position, underscore-separated, zero-padded).
  Confirmed anonymous, CORS-open, no auth required for the mp3 files themselves. Get the word count/order per ayah once (from the verified Quran text source — Tanzil/QUL — or a one-time metadata pull from `api.quran.com/api/v4/verses/by_key/{surah}:{ayah}?words=true&word_fields=audio_url`) and precompute the filename list at build time; do not depend on the API being reachable at runtime.
  License: non-commercial educational use is within Quran Foundation's terms; do not bulk-download/cache beyond short-term and do not resell — pure link/stream use (already the project's rule) is safe.
- **Fallback:** if audio.qurancdn.com is ever unreachable, degrade word drills to **ayah-level audio only** (reuse the Husary Mu'allim ayah mp3 and have the teacher/student isolate the word live) rather than depending on a second word-level CDN — no other genuinely per-word, anonymously-curlable mp3 CDN was found in this research pass. (QUL may fill this gap later once its dataset export is inspected — see open questions.)

### Attribution / credits line (suggested, for a `/credits` or teacher-notes footer)
> Verse audio: Sheikh Mahmoud Khalil Al-Husary (Mu'allim edition), via everyayah.com. Alternate CDN mirror: Islamic Network (cdn.islamic.network), original recordings via GlobalQuran.com. Word-by-word audio: Quran Foundation / Quran.com (audio.qurancdn.com). Quran text: Tanzil.net / QUL, never hand-typed.

---

## 7. Open questions / follow-ups before build

> **All six closed 2026-08-11.** Answers inline below; see the amendment banner at the top
> for the two that changed the plan.
>
> 1. **RESOLVED — CC BY-NC 2.5 Canada**, recovered from the Wayback capture. It governed the
>    MP3s, not only the timings. See the banner.
> 2. **RESOLVED — QUL ships URLs, not audio**, and publishes when permission is `unknown`.
>    See the banner.
> 3. **PARTLY RESOLVED — the word-by-word reciter is credited "Waseem Sharif"**, found in
>    QUL's own `lib/exporter/downloadable_resources.rb`. It appears **nowhere in the delivery
>    path**: the API returns a bare `audio_url` with no reciter field, no wbw-reciter endpoint
>    exists, and the ID3 tags carry no artist. A plausible identification with a known qari
>    exists but **does not reconcile on file count and is UNVERIFIED — credit "Waseem Sharif"
>    as QUL records it and assert nothing further.** Pace measured from frame headers:
>    320 kbps, 44.1 kHz, eight clips spanning 0.73–1.46 s, **mean ~1.09 s per word** — about
>    double conversational pace, i.e. deliberate isolated articulation. **Suitable for
>    word drills.**
> 4. **RESOLVED — stricter than recorded.** See the banner.
> 5. **RESOLVED — rule QuranicAudio out.** Not a DNS failure: it resolves and TCP-connects on
>    443, then **resets during the TLS handshake**. Archived terms permit personal use only,
>    bar commercial use, and admit many files are *"hand ripped from cds"*.
> 6. **RESOLVED — no.** `Husary_Muallim_128kbps/merged/` exists but holds **exactly one
>    file**, al-Baqara 97–103. `001.mp3`, `105.mp3` and `114.mp3` all 404, and
>    `Husary_128kbps/merged/` 404s entirely — a stray leftover, not a convention. **Whole-surah
>    playback must be concatenated client-side from per-ayah files.**
>
> **New, and not previously asked: word-by-word coverage is the whole Qurʾān.** Across
> **175 verses** (all 55 of surahs 1 and 105–114 plus a 120-verse random sample) the count of
> word files per verse matched the pinned Tanzil word count **175 of 175 exactly**, once waqf
> marks and the prepended basmala are excluded — so the indexing is compatible with the pinned
> text, which is the property that actually matters here. Independently spot-checked in this
> session across surahs 1, 2, 12, 41, 52, 110 and 114, including final word positions.
> A nonexistent position returns a clean **404**, so HTTP 200 is a sound existence test.
> *(Identical byte counts across different words are a red herring — the files are 320 kbps
> CBR, so equal duration gives equal size; SHA-256 confirms they differ.)*

### The original list, as written 2026-07-19

1. **versebyversequran.com/site/license** 301-redirected to an unreadable page during this session — re-fetch and read the actual timing-file license terms (only matters if the course ever uses everyayah's ayah *timing/segment* files, not the ayah audio itself).
2. **QUL's actual audio dataset export** (JSON/SQLite) was not opened (requires free signup) — confirm whether it embeds direct mp3 URLs (and if so, to which host) or only timestamp offsets, and pin down QUL's own license/terms page text.
3. **Word-by-word audio reciter identity** on audio.qurancdn.com was not confirmed by name — identify who recorded it and confirm pace/style suits Phase 2 isolated-word drills.
4. **quran.com/en/terms-and-conditions** direct fetch failed (connection reset) — redo this fetch to get Quran.com's own (as opposed to Quran Foundation's developer-terms) plain-language terms for completeness.
5. **QuranicAudio.com** connection failed during this session (status 000) — re-check reachability if ever considered as a fallback.
6. Confirm whether everyayah's `Husary_Muallim_128kbps/merged/` folder (per-surah merged files) actually contains full-surah Mu'allim-edition mp3s usable for "listen to the whole surah" hifz-review playback — not yet inspected file-by-file, only its existence was noted.
