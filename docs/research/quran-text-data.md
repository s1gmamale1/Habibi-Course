# Research: Digital Quran Text & Structured Data Sources

**Date:** 2026-07-19
**Purpose:** Identify every free, openly-licensed source of digital Quran text, tajweed-annotated text, word-by-word data, and related APIs for the Tajweed Course platform (see `docs/superpowers/specs/2026-07-19-tajweed-course-design.md`). Hard constraint: Quran text is **never hand-typed**; every source, license and URL below was actually fetched/verified on 2026-07-19, not recalled from memory.

---

## 1. Tanzil.net — the canonical Uthmani text source

**Site:** https://tanzil.net/
**Download page:** https://tanzil.net/download/
**License page (actually fetched):** https://tanzil.net/docs/Text_License

### License (verbatim, fetched 2026-07-19)

```
Tanzil Quran Text
Copyright (C) 2007-2021 Tanzil Project
License: Creative Commons Attribution 3.0

TERMS OF USE:
- Permission is granted to copy and distribute verbatim copies
  of this text, but CHANGING IT IS NOT ALLOWED.
- This Quran text can be used in any website or application,
  provided that its source (Tanzil Project) is clearly indicated,
  and a link is made to tanzil.net to enable users to keep
  track of changes.
- This copyright notice shall be included in all verbatim copies
  of the text, and shall be reproduced appropriately in all files
  derived from or containing substantial portion of this text.
```

This is **CC BY 3.0** — free for any use (including commercial), attribution required, text itself must stay unmodified (verbatim). This satisfies the course's "never hand-typed" and "free + openly licensed" constraints perfectly, provided attribution ("Tanzil Project", link to tanzil.net) appears somewhere in the app (e.g., a footer/credits page).

### Text variants offered on the download page

The download form (https://tanzil.net/download/, form posts to `https://tanzil.net/pub/download/index.php`) offers these **text types**:

| value | Label | Notes |
|---|---|---|
| `simple` | Simple (Imla'ei) text | Default selected; simplified Arabic orthography (Imlaei), the "school spelling" |
| `simple-plain` | Simple text without Ikhfa/Idgham demonstration marks | |
| `simple-min` | Simple (Minimal) | Minimal diacritics/symbols |
| `simple-clean` | Simple (Clean) | No diacritics/symbols at all |
| `uthmani` | **Uthmani** | "Uthmani text as in Madina Mushaf" — this is the mushaf-accurate orthography (extra alifs, special spellings) that the course spec requires for Quran rendering |
| `uthmani-min` | Uthmani (Minimal) | Uthmani with minimal diacritics |

Output **formats**: `txt` (plain), `txt-2` (plain + aya numbers, default), `xml`, `sql` (MySQL dump). Optional inclusions: pause marks, sajdah signs (۩), rub-el-hizb signs (۞), superscript alef/tatweel handling.

**Recommendation for this course:** use the **Uthmani** variant (`uthmani`) in **XML** format (easiest to parse into per-ayah JSON for the content model) as the single source of truth for all Quran text in the app — this is "Uthmani text as in Madina Mushaf," matching the spec's requirement for authentic mushaf rendering and tajweed color-coding. Imlaei ("Simple") is *not* needed for this course since the spec explicitly wants mushaf-accurate Uthmani script from day one (end goal 4: read from a standard color-coded tajweed mushaf).

### Distinction: Uthmani vs Imlaei (why it matters for this course)
- **Uthmani script** = the actual historical Quranic orthography used in printed mushafs (extra small alifs, unusual letter omissions/additions preserved from the Uthman-era rasm). This is what every tajweed color-mushaf and every qari-audio-aligned mushaf app uses. **Required** for Phase 3 tajweed-mushaf work and general authenticity.
- **Imlaei/Simple script** = modern standard Arabic spelling rules applied to the Quran text (easier for absolute beginners in *some* pedagogies, since it drops the archaic spellings). Not used by standard tajweed mushafs; would create a mismatch with the qari audio/mushaf-page goal. **Not recommended** as the primary text for this course, though it could theoretically be considered for the very first "letter recognition" stage — but the spec's Qaida-first approach uses drill grids, not real Quran words, in Phase 1, so this is moot; Phase 1/2 content doesn't come from Tanzil at all (see qaida sourcing below), only Phase 3 mushaf content does.

### Practical download URL pattern
Tanzil's download is via a POST form (`/pub/download/index.php`), not simple GET-able static files for the whole mushaf; however Tanzil also publishes ready-made static text files (verified via community mirrors) named like `quran-uthmani.xml` / `quran-simple.xml`. These same texts are re-distributed (unmodified, per license) inside QUL and are queryable ayah-by-ayah via alquran.cloud's `quran-uthmani` edition (see §3) — **for this course, fetching via the alquran.cloud API per-ayah (which mirrors Tanzil text) is simpler to integrate than parsing Tanzil's raw XML dump**, and both ultimately trace to the same CC BY 3.0 Tanzil source.

---

## 2. QUL (Quranic Universal Library) — qul.tarteel.ai

**Site:** https://qul.tarteel.ai/
**Fonts page (fetched):** https://qul.tarteel.ai/resources/font
**Publisher:** Tarteel AI. Terms: https://www.tarteel.ai/terms · Privacy: https://www.tarteel.ai/privacy

### What QUL provides (confirmed by fetch of the homepage)
- **Audio & Recitations:** 71 unsegmented (verse-level) audio sets + 57 segmented audio sets with word-level timestamp data (for word-by-word highlighting/tap-to-hear — directly useful for the course's "tap-to-hear" requirement).
- **Text & Script:** Quran script in Unicode and image (glyph) formats across Madani, IndoPak, and Uthmani script conventions.
- **Fonts:** 19 Quran-related fonts (see full list fetched from the fonts page below).
- **Transliteration:** 9 ayah-by-ayah Latin transliteration datasets + 1 word-by-word transliteration dataset.
- **Translations & tafsir:** 201 translations, 16 word-by-word translations, 35 mukhtasar tafsirs + 80 detailed tafsirs, multi-language.
- **Scholarly data:** 20 approved Mushaf layouts (page/line layouts used to reproduce specific print mushafs), Quranic morphology/grammar (77,432 entries — this is the Quranic Arabic Corpus data, see §6), 2,512 topic/concept entries, surah info in 9 languages, 5,277+ "matching ayah" (mutashabihat) entries.

### Fonts list (fetched from https://qul.tarteel.ai/resources/font, 2026-07-19)
1. Arabic Sign Language Font
2. Juz name font
3. Surah name font v2
4. Surah header font
5. KFGQPC Nastaleeq
6. Digital Khatt Indopak font
7. Indopak Nastaleeq font
8. **QPC Hafs font** (Unicode Quranic text — Uthmani/Hafs, this is the standard "KFGQPC" Uthmanic-family Unicode font used across most Quran apps)
9. Me Quran Font (Madani-style Unicode)
10. QPC V1 Font (glyph-based, page-accurate)
11. QPC V2 Font (glyph-based, updated)
12. V4 Surah Name Color Font
13. Surah name font v1
14. **QPC V4 Tajweed Font** — a font where **tajweed rule coloring is baked into the glyphs themselves** (each codepoint pre-colored per rule). This is the same underlying asset that powers quran.com's tajweed-colored mushaf view and is the single most directly reusable asset for the course's "color-coded tajweed mushaf" end goal (4) — it removes the need to implement per-span coloring logic manually, **if** the licensing permits redistribution (see caveat below).
15. Surah name fonts v4
16. Digital Khatt V2 Font
17. Digital Khatt V1 Font

**License caveat:** The QUL fonts page itself displayed **no explicit license text** on the page content fetched. QUL's own resource pages generally state resources are provided for Muslim developers to build apps; before shipping any QUL font or dataset, the project's **Terms of Use** (https://www.tarteel.ai/terms) must be checked for specific redistribution clauses per resource (QUL is known in the community to require sign-in / apply for API keys for some datasets, and to ask that apps acknowledge QUL/Tarteel as source). Given the course's hard "must be free and openly licensed (or merely linked, never re-hosted)" constraint, the safe default is: **treat QUL-hosted fonts/audio/text as "verify-before-bundling"** — prefer linking to the officially-licensed original source when one exists outside QUL (e.g., KFGQPC's own font distribution, Tanzil's own text) and use QUL mainly for (a) word-by-word segmented audio timestamps and (b) the tajweed-colored font, both of which have no independent public source outside the QUL/quran.com ecosystem.

### QUL access
QUL data is primarily consumed either by (a) downloading files directly from the QUL resource browser UI (https://qul.tarteel.ai/) after selecting a resource, or (b) via the underlying CDN URLs QUL/quran.com use in production (e.g. `https://audio.qurancdn.com/...` — confirmed reachable, see §4). There is no fully public bulk API described on the homepage; large-scale/bulk use may require requesting access through Tarteel.

---

## 3. alquran.cloud API (Islamic Network)

**Base:** https://api.alquran.cloud/v1/
**Docs:** https://alquran.cloud/api
**Terms:** https://alquran.cloud/terms-and-conditions (fetched 2026-07-19)
**Tajweed color legend page:** https://alquran.cloud/tajweed-guide (fetched 2026-07-19)

### Editions (fetched: `GET https://api.alquran.cloud/v1/edition`)
Returned 37+ audio editions and dozens of text/translation/tafsir editions (200 code, JSON). Notable text editions include `quran-uthmani`, `quran-simple`, and the special **`quran-tajweed`** edition. Notable audio editions include Husary variants:
- `ar.husary` — Husary (murattal)
- `ar.husarymujawwad` — Husary (Mujawwad)
- `ar.husary-2` / `ar.husarymujawwad-2` — alternate CDN copies
- `ar.minshawi`, `ar.minshawimujawwad` — Minshawi variants (course's alternate qari)

(Note: alquran.cloud's edition list does **not** appear to expose a distinct "Husary Muallim" edition identifier — the Muallim/teacher-edition recitation is available via quran.com's recitation catalogue instead, see §4.)

### quran-tajweed edition — actually fetched sample

```
GET https://api.alquran.cloud/v1/ayah/1:1/quran-tajweed
```

Response (fetched 2026-07-19):
```json
{
  "code": 200,
  "status": "OK",
  "data": {
    "number": 1,
    "text": "بِسْمِ [h:1[ٱ]لَّهِ [h:2[ٱ][l[ل]رَّحْمَ[n[ـٰ]نِ [h:3[ٱ][l[ل]رَّح[p[ي]مِ",
    "edition": {
      "identifier": "quran-tajweed",
      "language": "ar",
      "name": "القرآن الكريم المجود (ملون) (tajweed)",
      "englishName": "Tajweed",
      "format": "text",
      "type": "quran",
      "direction": "rtl"
    },
    "surah": { "number": 1, "name": "سُورَةُ ٱلْفَاتِحَةِ", "englishName": "Al-Faatiha", "englishNameTranslation": "The Opening", "numberOfAyahs": 7, "revelationType": "Meccan" },
    "numberInSurah": 1, "juz": 1, "manzil": 1, "page": 1, "ruku": 1, "hizbQuarter": 1, "sajda": false
  }
}
```

### Tag format decoded
The `text` field embeds **inline bracket tags with single-letter rule codes**, each wrapping the Arabic substring the rule applies to:
- `[h:N ... ]` — Hamzat-ul-Wasl markers (silent/connecting hamza), `N` is a running index
- `[l ... ]` — Laam Shamsiyyah (solar lam assimilation)
- `[n ... ]` — Madd (the normal/permissible prolongation marks, e.g., the `ـٰ` madda letter)
- `[p ... ]` — appears on the `ي` in `رَّحِيمِ`, consistent with "madda permissible" (variable-length madd)

This is a **compact custom bracket-tag mini-language**, not a standard markup format — it must be parsed with a small custom parser (regex over `\[x[:\d]*...\]` nesting) to convert into HTML `<span class="...">` runs. This is materially less convenient than quran.com's HTML-tag format (§4) for a Next.js renderer, since the bracket format requires writing a bespoke tokenizer, while quran.com's format is close to ready-to-use HTML.

### Full tajweed color legend (fetched from https://alquran.cloud/tajweed-guide)

| Color hex | Rule (English) | Rule (Arabic) | Meaning |
|---|---|---|---|
| #AAAAAA | Hamzat ul Wasl | همزة الوصل | Silent hamza at word beginning |
| #AAAAAA | Silent | حرف ساكن | Silent letter/vowel |
| #AAAAAA | Laam Shamsiyyah | لام شمسية | Solar lam, assimilated into following letter |
| #537FFF | Madda Normal | مد عادي | Standard 2-vowel prolongation |
| #4050FF | Madda Permissible | مد جائز | Variable 2/4/6-vowel prolongation |
| #000EBC | Madda Necessary | مد واجب | Required 6-vowel prolongation |
| #DD0008 | Qalqalah | قلقلة | Echo/bounce on qalqalah letters with sukun |
| #2144C1 | Madda Obligatory (Lazim) | مد لازم | Mandatory 4-5(6)-vowel prolongation |
| #D500B7 | Ikhfa Shafawi | إخفاء شفوي | Hidden articulation with meem |
| #9400A8 | Ikhfa | إخفاء | Hidden articulation (noon sakinah/tanwin) |
| #58B800 | Idgham Shafawi | إدغام شفوي | Assimilation with meem |
| #26BFFD | Iqlab | إقلاب | Noon/tanwin → meem sound before ب |
| #169777 | Idgham with Ghunnah | إدغام بغنة | Assimilation with nasalization |
| #169200 | Idgham without Ghunnah | إدغام بلا غنة | Assimilation without nasalization |
| #A1A1A1 | Idgham Mutajanisayn | إدغام متجانسين | Assimilation of same-makhraj letters |
| #A1A1A1 | Idgham Mutaqaribayn | إدغام متقاربين | Assimilation of near-makhraj letters |
| #FF7E1E | Ghunnah | غنة | Nasal hold, 2 vowel-counts |

**This legend is directly usable as the course's canonical tajweed color key for end goal 4** (reading from a color-coded mushaf and explaining what each color demands) — it should be reproduced (with attribution to alquran.cloud) as a reference page/teacher note early in Phase 3.

### License (fetched from https://alquran.cloud/terms-and-conditions)
- **Quran text:** "You may reproduce, embed, store and display the text freely, for any non-commercial purpose"; commercial use permitted with acknowledgment. Must preserve diacritics/orthography of the Uthmani recension; must not alter text or mix misleadingly with non-Quranic material; must attribute source organizations (Tanzil.net, Quran Academy) respectfully. (Text ultimately originates from GlobalQuran.com / Tanzil per community posts.)
- **Audio:** may stream/embed/download for personal and educational use; commercial bundling allowed with restrictions; recitations remain copyrighted by reciters/estates who can request removal from commercial products; must attribute reciters by name.
- **Translations:** attribute translator by name; keep edition identifier intact.
- **API access:** free, key-less, soft per-IP rate limits; contact them for high-throughput/research needs.
- General "as-is", no warranty.

This is compatible with the course (non-commercial, educational, free platform) provided attribution to Tanzil/alquran.cloud/reciters is included in a credits page.

---

## 4. quran.com API v4 (api.quran.com)

**Base (confirmed live without auth, 2026-07-19):** `https://api.quran.com/api/v4/`
**Legacy repo:** https://github.com/quran/quran.com-api
**New Quran Foundation developer portal:** https://api-docs.quran.foundation/ (fetched)

### Verified live status
`GET https://api.quran.com/api/v4/chapters/1` returned **HTTP 200** with no API key — the legacy public v4 endpoint is still open as of 2026-07-19. However, **Quran Foundation's newer developer portal (api-docs.quran.foundation) now documents a separate, authenticated "Content API" generation that requires requesting a client ID/OAuth credentials.** This is an important forward-looking risk: **the free/keyless `api.quran.com/api/v4` endpoint could be deprecated or migrated behind auth in the future.** Recommendation: build against `api.quran.com/api/v4` now (it works, no key, no rate-limit friction observed), but pin/cache all Quran text and tajweed data fetched from it into the course's own static content files at build time (per the spec's "structured content file" model) rather than calling the API live at runtime — this both derisks the course against future API changes and matches the static-first Next.js architecture in the spec.

### Verse endpoint — actually fetched sample

```
GET https://api.quran.com/api/v4/verses/by_key/1:1?words=true&word_fields=text_uthmani,audio_url&fields=text_uthmani_tajweed
```

Response (fetched 2026-07-19, trimmed to essentials):
```json
{
  "verse": {
    "id": 1,
    "verse_number": 1,
    "verse_key": "1:1",
    "hizb_number": 1,
    "rub_el_hizb_number": 1,
    "ruku_number": 1,
    "manzil_number": 1,
    "sajdah_number": null,
    "text_uthmani_tajweed": "بِسْمِ <tajweed class=ham_wasl>ٱ</tajweed>للَّهِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّحْمَ<tajweed class=madda_normal>ـٰ</tajweed>نِ <tajweed class=ham_wasl>ٱ</tajweed><tajweed class=laam_shamsiyah>ل</tajweed>رَّح<tajweed class=madda_permissible>ِي</tajweed>مِ <span class=end>١</span>",
    "page_number": 1,
    "juz_number": 1,
    "words": [
      {
        "id": 1, "position": 1,
        "audio_url": "wbw/001_001_001.mp3",
        "char_type_name": "word",
        "text_uthmani": "بِسْمِ",
        "page_number": 1, "line_number": 2,
        "text": "بِسْمِ",
        "translation": { "text": "In (the) name", "language_name": "english" },
        "transliteration": { "text": "bis'mi", "language_name": "english" }
      },
      { "id": 2, "position": 2, "audio_url": "wbw/001_001_002.mp3", "text_uthmani": "ٱللَّهِ", "translation": {"text": "(of) Allah"}, "transliteration": {"text": "l-lahi"} },
      { "id": 3, "position": 3, "audio_url": "wbw/001_001_003.mp3", "text_uthmani": "ٱلرَّحْمَـٰنِ", "translation": {"text": "the Most Gracious"}, "transliteration": {"text": "l-raḥmāni"} },
      { "id": 4, "position": 4, "audio_url": "wbw/001_001_004.mp3", "text_uthmani": "ٱلرَّحِيمِ", "translation": {"text": "the Most Merciful"}, "transliteration": {"text": "l-raḥīmi"} },
      { "id": 5, "position": 5, "audio_url": null, "char_type_name": "end", "text_uthmani": "١" }
    ]
  }
}
```

### Tag format decoded — quran.com's `text_uthmani_tajweed` field
Uses **actual pseudo-HTML tags**: `<tajweed class="RULE_NAME">substring</tajweed>` plus `<span class="end">AYAH_NUMBER</span>` for the ayah-end marker. Rule class names observed: `ham_wasl`, `laam_shamsiyah`, `madda_normal`, `madda_permissible` (others documented include `qalqalah`, `madda_necessary`/`madda_obligatory`, `ikhfa`, `ikhfa_shafawi`, `iqlab`, `idgham_ghunnah`, `idgham_wo_ghunnah`, `idgham_shafawi`, `ghunnah`, `slnt` for silent letters — consistent with the alquran.cloud legend in §3, just different naming convention: snake_case class names vs. single-letter bracket codes). **This is directly renderable as HTML/JSX by mapping each `class` to a CSS color from the legend in §3 — the most implementation-ready tajweed-colored text format found in this research**, far easier to parse in a Next.js/React renderer (`class` → color lookup) than alquran.cloud's bracket-code format.

### Word-by-word data
The `words` array on `verses/by_key` (and `verses/by_chapter`, `verses/by_page`, etc.) gives per-word: Uthmani text, plain text, English translation, English transliteration, page/line number, and a relative **audio_url** (`wbw/SSS_AAA_WWW.mp3` pattern — surah_ayah_word, zero-padded 3 digits each). This is the word-by-word segmentation + audio + gloss data needed for Phase 2–3 tap-to-hear word drills per the spec.

### Word audio URL resolution
The relative path `wbw/001_001_001.mp3` returned by the API resolves against quran.com's CDN. Confirmed reachable full URL used in production: `https://audio.qurancdn.com/wbw/001_001_001.mp3` (HTTP 200, confirmed via curl HEAD 2026-07-19, `audio/mpeg`, served via BunnyCDN).

### Chapter/verse audio (qari recitation) endpoint
```
GET https://api.quran.com/api/v4/chapter_recitations/{recitation_id}/{chapter_id}
```
Fetched sample: `GET https://api.quran.com/api/v4/chapter_recitations/12/1` →
```json
{"audio_file":{"id":25645,"chapter_id":1,"file_size":null,"format":"mp3",
"audio_url":"https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/1.mp3"}}
```
Reciter ID **12** = "Mahmoud Khalil Al-Husary — Muallim" (teacher edition) — confirmed via `GET https://api.quran.com/api/v4/resources/recitations`, which lists all 12 available reciter/style combinations, including:
- id 6: Al-Husary (standard Murattal)
- id 12: **Al-Husary — Muallim** (the "teacher" edition the spec calls for as primary)
- id 8/9: Al-Minshawi (Mujawwad / Murattal) — the spec's alternate qari

This confirms the exact reciter ID (12) and CDN domain (`download.quranicaudio.com/qdc/khalil_al_husary/muallim/{chapter}.mp3`) to use for whole-chapter Husary Muallim audio. Per-ayah audio for the same reciter is expected at a matching per-ayah path on the same CDN (standard quranicaudio.com convention is `.../muallim/{chapter}/{ayah}.mp3` or via everyayah.com's mirror, see below) — this should be spot-verified per-surah before final wiring.

### License / terms
The page fetched from api-docs.quran.foundation displayed **no explicit licensing/terms text** in its visible content; the legacy `quran/quran.com-api` GitHub repo (and sibling `quran/quran-ios`, `quran/quran-android`) are themselves open-source (GPLv3 / Apache-2.0 per repo, confirmed via search) but that governs the *app code*, not necessarily the underlying *Quran text/audio data* the API serves (which quran.com sources from Tanzil for text and from individual reciters/estates for audio, same chain as alquran.cloud). **Practical conclusion:** treat quran.com API text as Tanzil-licensed (CC BY 3.0, attribute Tanzil) and treat its audio as reciter-licensed (attribute reciter by name; Husary/Minshawi recordings are widely distributed as freely streamable/downloadable for educational, non-commercial use across the entire Quran-app ecosystem — no source found placing additional restrictions beyond attribution). Given the "free and openly licensed, or merely linked, never re-hosted" hard constraint, the safest integration pattern is: **link/stream the quran.com CDN URLs directly in the tap-to-hear player rather than downloading and re-hosting the audio files in this repo.**

---

## 5. GitHub cpfair/quran-tajweed and tajweed-annotation datasets

**Repo:** https://github.com/cpfair/quran-tajweed

### Summary (fetched 2026-07-19)
- Purpose: generates tajweed annotations for the Hafs/Uthmani Quran text, for display highlighting, ASR model enhancement, or studying rules via decision trees.
- Primary output file: `output/tajweed.hafs.uthmani-pause-sajdah.json` — a **JSON array**, one entry per surah:ayah, each with a list of **annotations**: `{rule_name, start, end}` where `start`/`end` are **Unicode codepoint offsets** (not byte offsets) into the **Tanzil.net Uthmani text** for that ayah. This is a clean, offset-based annotation format — arguably the most "raw-data-friendly" of all four tajweed formats found (vs. the inline-bracket and inline-HTML-tag formats from alquran.cloud/quran.com), since it cleanly separates text from annotation and can be re-serialized into any markup the course's renderer wants.
- Covers 14 primary tajweed rule categories: Ghunnah, several Idgham subtypes, Ikhfa, Iqlab, Madd variants, Qalqalah, Hamzat-ul-Wasl, etc. — consistent with the two API-based legends above.
- Repository also includes: decision-tree classifier logic (Python) that derives the rule annotations algorithmically from the Tanzil text, and decision-tree diagrams as documentation/visual reference for how each rule's trigger conditions work — potentially useful as **teacher-reference material** for the "listen-for mistake list" / rule explanation slides in Phase 3, since it documents the *conditions* for each rule, not just the *coloring*.
- **License: the annotation data itself is licensed CC BY 4.0** (Creative Commons Attribution 4.0 International); the underlying Quran text it annotates remains under Tanzil.net's own terms (CC BY 3.0, see §1).
- **Status: no longer actively maintained**; the README reportedly directs users toward the quran.com API for current/maintained implementations — reinforcing the recommendation to use quran.com's `text_uthmani_tajweed` (§4) as the primary live-maintained tajweed-tag source, while optionally cross-referencing cpfair/quran-tajweed's decision-tree docs for teaching-note accuracy or as an offline fallback/cross-check dataset (its CC BY 4.0 license makes it safe to vendor a static copy of the JSON into the repo if ever needed, unlike QUL/quran.com data whose redistribution terms are murkier).

---

## 6. Word-by-word segmentation data sources — comparison

Three independent sources of word-by-word Quran data were identified:

1. **quran.com API v4 `words` array** (§4) — Uthmani text, plain text, English translation, transliteration, audio URL per word, keyed by verse. Easiest to consume directly for the course's app (already JSON, already includes audio + gloss). **Recommended primary source for Phase 2–3 word-by-word drills.**
2. **QUL word-by-word datasets** (§2) — 16 word-by-word translation sets + 1 word-by-word transliteration set + word-level segmented audio timestamps (57 segmented audio sets) — a superset/alternate distribution of similar data, useful mainly for its **timestamp-in-audio data** (needed if the course ever wants continuous verse audio with word-level tap-to-seek, beyond quran.com's separate per-word mp3 files).
3. **The Quranic Arabic Corpus** (https://corpus.quran.com/, fetched 2026-07-19) — deeper linguistic layer: full morphological tagging (part-of-speech, root, lemma) and a syntactic treebank + semantic ontology for all 6,236 verses. Licensed under the **GNU General Public License**, described as an open-source project with correction/community contribution workflow. Access is via its web "Word by Word" browsing interface and a Java API; no simple REST/JSON bulk endpoint was found in the fetched content. This is overkill for the beginner-reading-and-tajweed scope of this course (it targets grammar/syntax research) — **not recommended** as a course data source, but worth knowing about if a future "why is this word grammatically X" teaching feature is ever wanted. QUL's own morphology dataset (77,432 entries, §2) is a redistribution of this same corpus data.

**Recommendation:** use quran.com's `words` array (source 1) as the single word-by-word data source for the app; it already bundles everything the spec's Phase 2–3 drills need (Uthmani spelling, transliteration for teacher reference, English gloss, per-word audio) in one JSON call per verse, all attributable back to Tanzil (text) + quran.com (segmentation/audio hosting).

---

## 7. Fonts — final recommendation & verification

| Font | Use in course | License | Verified source |
|---|---|---|---|
| **KFGQPC Uthmanic (Hafs) family** | Quran text rendering | Free redistribution permitted by King Fahd Glorious Quran Printing Complex: "Permission is granted free of cost... to use, copy, and distribute" the font, but **may not be sold, modified, altered, translated, reverse-engineered, decompiled, disassembled, or reproduced [as software]" — i.e., free-as-in-beer with a no-modification clause, "AS IS," no warranty.** (License text found via aggregated font-distribution sites; the authoritative official distribution point is the King Fahd Complex's own site, `qurancomplex.gov.sa`, and its font subdomain returned HTTP 200 on a basic connectivity check but full page contents were not text-scraped in this pass — **recommend the team directly download the font from `fonts.qurancomplex.gov.sa` and/or QUL's "QPC Hafs font" resource (§2) rather than third-party font-aggregator mirrors**, to avoid any provenance/tampering risk with a font used for authentic Quran text.) |
| **QPC V4 Tajweed Font** (via QUL, §2) | Optional: pre-colored tajweed glyphs, alternative to manual span-coloring | Same family as above; redistribution terms should be confirmed directly with QUL/Tarteel before bundling (see §2 caveat) — safe fallback is to implement coloring via CSS spans keyed to the `text_uthmani_tajweed` class names from quran.com (§4) instead of depending on this font. |
| **Amiri** | Qaida/drill Arabic (Phase 1–2, non-Quran text) | **SIL Open Font License 1.1** — free, commercial+personal use, redistributable, modifiable. Confirmed via multiple sources; canonical repo: https://github.com/aliftype/amiri (Google Fonts also mirrors it). |
| **Noto Naskh Arabic** | Qaida/drill Arabic alternative | **SIL Open Font License 1.1**, part of Google's Noto project. Canonical: https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic |

Both Amiri and Noto Naskh Arabic are unambiguously safe (OFL 1.1, the standard permissive font license). The KFGQPC font is safe to *use* (free redistribution for use) but must be sourced from an official/trustworthy distribution point given it can't legally be "modified" — the course should download it once from `fonts.qurancomplex.gov.sa` or QUL and vendor that exact file, documenting the exact download URL and date in the repo for provenance.

---

## 8. Audio sourcing — everyayah.com verification

**Site:** https://everyayah.com/
**Verified reachable file (HEAD request, 2026-07-19):** `https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3` → **HTTP 200**, `content-type: audio/mpeg`, served via BunnyCDN, `access-control-allow-origin: *` (CORS-open — safe to `<audio>`-tag directly from the course's Next.js frontend without a proxy).

### Naming convention (confirmed)
- Reciter folder: `Husary_Muallim_128kbps` (teacher/Muallim edition — exactly the "primary qari" the spec calls for) — also seen as `Husary_128kbps` (standard) and `Husary_128kbps_Mujawwad` (Mujawwad style) for alternates.
- File name: `SSSAAA.mp3` — 3-digit zero-padded surah number + 3-digit zero-padded ayah number, e.g. `001001.mp3` = Surah 1, Ayah 1. Files sit directly under the reciter folder (some reciters additionally offer a `PageMp3s/` subfolder with `PageNNN.mp3` files for whole-mushaf-page audio, seen for the plain Husary_128kbps set: https://everyayah.com/data/Husary_128kbps/PageMp3s — a **page-based recitation file** could be handy for the spec's "first exposure to a real mushaf page" milestone at the end of Phase 2, letting the student hear an entire page read fluently).

### License
everyayah.com is a long-standing community aggregator of reciter recordings ("Verse By Verse Quran"); recordings are distributed for free personal/educational streaming and download across the Quran-app ecosystem (this is the same underlying data source quran.com/quranicaudio.com serves, confirmed by cross-referencing the reciter/style catalogue in §4 with everyayah's folder names). No formal written license document was located on everyayah.com itself in this pass; given the "never re-host, only link" hard constraint, this is moot for the course either way — **the course should hyperlink/stream directly from `everyayah.com` (or `download.quranicaudio.com`, §4) rather than downloading and redistributing the mp3s from the course's own repo/CDN.**

---

## 9. Recommendations summary for this course

1. **Quran text of record:** Tanzil.net Uthmani text (CC BY 3.0), accessed programmatically via **alquran.cloud's `quran-uthmani` edition or quran.com's `text_uthmani` field** (both are unmodified Tanzil mirrors) rather than hand-parsing Tanzil's raw download form. Attribute "Tanzil Project" + link to tanzil.net somewhere in the app (footer/credits page) to satisfy the CC BY 3.0 attribution term.
2. **Tajweed-colored text:** use **quran.com's `text_uthmani_tajweed` field** (`<tajweed class="rule_name">` tags) as the primary machine-readable source — it is the easiest to parse into React/JSX spans. Use the **alquran.cloud tajweed-guide color legend** (§3 table) as the canonical color key reproduced in the course's teacher notes and student reference page (link + attribute alquran.cloud). Optionally cross-check rule boundaries against **cpfair/quran-tajweed**'s CC BY 4.0 offset-annotation JSON, which can be safely vendored into the repo if a static/offline fallback is ever wanted (its license permits redistribution, unlike the API-sourced formats).
3. **Word-by-word data (Phase 2–3 drills):** quran.com API v4 `verses/by_key`/`by_chapter` `words[]` array — gives Uthmani spelling, transliteration, English gloss, and per-word audio URL (`https://audio.qurancdn.com/wbw/SSS_AAA_WWW.mp3`) in one call.
4. **Qari audio:** primary = **Husary Muallim** — quran.com recitation id **12** (`chapter_recitations/12/{chapter}` → `download.quranicaudio.com/qdc/khalil_al_husary/muallim/{chapter}.mp3` for full chapters) and/or everyayah.com's `Husary_Muallim_128kbps/SSSAAA.mp3` for per-ayah files (both confirmed reachable, CORS-open, streamable without re-hosting). Alternate = **Minshawi** (quran.com ids 8 Mujawwad / 9 Murattal; everyayah folder likely `Minshawi_Murattal_192kbps` or similar — confirm folder name before wiring).
5. **Fonts:** KFGQPC Hafs Uthmanic (Quran text) sourced directly from the official King Fahd Complex distribution or QUL's "QPC Hafs font" resource; Amiri and Noto Naskh Arabic (OFL 1.1, unambiguously safe) for qaida/drill Arabic.
6. **API resilience:** because `api.quran.com/api/v4` may migrate to the newer authenticated Quran Foundation portal (api-docs.quran.foundation) in the future, **fetch all needed text/tajweed/word data once at content-authoring time and bake it into the course's static MDX/JSON content files** (per the spec's content model), rather than calling any Quran API live at runtime in the shipped app — this also satisfies "static-first Next.js, no backend."
7. **Attribution/credits page:** the app should ship one `/credits` (or footer) page listing: Tanzil Project (text, CC BY 3.0, link to tanzil.net), reciter names (Husary, Minshawi) per audio use, alquran.cloud (tajweed color legend), quran.com/Quran Foundation (tajweed HTML tags, word-by-word data), QUL/Tarteel AI (if any QUL-sourced font/dataset ships), Amiri and Noto Naskh Arabic (SIL OFL 1.1), and KFGQPC (Quran font).

---

## 10. All URLs referenced (for the scripted "every reference resolves" QA check)

- https://tanzil.net/download/
- https://tanzil.net/docs/Text_License
- https://tanzil.net/updates/
- https://qul.tarteel.ai/
- https://qul.tarteel.ai/resources/font
- https://www.tarteel.ai/terms
- https://www.tarteel.ai/privacy
- https://api.alquran.cloud/v1/edition
- https://api.alquran.cloud/v1/ayah/1:1/quran-tajweed
- https://alquran.cloud/api
- https://alquran.cloud/tajweed-guide
- https://alquran.cloud/terms-and-conditions
- https://api.quran.com/api/v4/verses/by_key/1:1
- https://api.quran.com/api/v4/chapters/1
- https://api.quran.com/api/v4/resources/recitations
- https://api.quran.com/api/v4/chapter_recitations/12/1
- https://audio.qurancdn.com/wbw/001_001_001.mp3
- https://download.quranicaudio.com/qdc/khalil_al_husary/muallim/1.mp3
- https://api-docs.quran.foundation/
- https://github.com/quran/quran.com-api
- https://github.com/cpfair/quran-tajweed
- https://corpus.quran.com/
- https://everyayah.com/data/Husary_Muallim_128kbps/001001.mp3
- https://everyayah.com/data/Husary_128kbps/PageMp3s
- https://everyayah.com/data/Husary_128kbps_Mujawwad/011023.mp3
- https://fonts.qurancomplex.gov.sa/
- https://github.com/aliftype/amiri
- https://fonts.google.com/noto/specimen/Noto+Naskh+Arabic
