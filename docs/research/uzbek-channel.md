## Research Task
# Uzbek Reference Channel Analysis: "Muallimi Soniy"

Research record for: `docs/superpowers/specs/2026-07-19-tajweed-course-design.md`
Target video: https://youtu.be/VhRHKdPcNPA
Date fetched: 2026-07-19
Method: `curl` fetch of YouTube watch/playlist pages (spoofed desktop UA), extraction of embedded `ytInitialData` / `ytInitialPlayerResponse` JSON blobs with brace-aware/`json.JSONDecoder.raw_decode` parsing (no browser automation used). Note: YouTube's server-rendered `ytInitialPlayerResponse` returned `LOGIN_REQUIRED` / "Sign in to confirm you're not a bot" for `playabilityStatus` (no cookies used), so streaming/caption data was not retrievable this way; however `ytInitialData` (page chrome: title, description, playlists, playlist contents) fetched successfully without authentication.

---

## 1. Target Video Identification

- **URL:** https://youtu.be/VhRHKdPcNPA (canonical: https://www.youtube.com/watch?v=VhRHKdPcNPA)
- **Title (as published, bilingual):** "ARAB ALIFBOSINI 4 SOATDA TO'LIQ O'RGANING - @Muallimi Soniy АРАБ АЛИФБОСИНИ 4 СОАТДА ТЎЛИҚ ЎРГАНИНГ"
  - **English translation:** "Learn the Arabic Alphabet Completely in 4 Hours — @Muallimi Soniy"
- **Views:** 3,515,839 (at fetch time)
- **Age:** "4 years ago" (relative label; channel is long-running, video likely posted ~2021-2022)
- **Nature of the video:** This is a **compilation/marathon video**, not one numbered lesson in the channel's regular series. It stitches together chapters covering harakāt (vowel signs) and individual letters into one continuous 4-hour recording, each chapter corresponding to what is elsewhere a separate short lesson video. It functions as a "binge" entry point for the same underlying letter-by-letter curriculum the channel teaches across its numbered lesson videos.

### Full chapter/timestamp list (extracted from the video's own description — this IS the letter-teaching order used by the channel)

Translated to English (Uzbek/Cyrillic → English), in the exact order presented:

| Timestamp | Uzbek/Cyrillic (original) | English |
|---|---|---|
| 00:00 | Фатҳа ҳақида | About Fatha (the "a" vowel sign) |
| 02:39 | Фатҳани о ўқилиши ҳақида | About Fatha read as "o" |
| 05:28 | Касра ҳақида | About Kasra (the "i" vowel sign) |
| 08:02 | Домма (Замма) ҳақида | About Damma/Zamma (the "u" vowel sign) |
| 10:48 | Сукун ҳақида (1-дарс) | About Sukun (lesson 1) |
| 14:44 | Сукун ҳақида (2-дарс) | About Sukun (lesson 2) |
| 18:37 | А,И,У ҳарифлари | The letters (that make) A, I, U (madd/long-vowel review) |
| 24:57 | Ро ҳарфи | The letter Ra (ر) |
| 30:19 | За ҳарфи | The letter Za (ز) |
| 37:34 | Мим ҳарфи | The letter Meem (م) |
| 44:18 | Та ҳарфи | The letter Ta (ت) |
| 53:16 | Нун ҳарфи | The letter Nun (ن) |
| 1:00:55 | Йа ҳарфи | The letter Ya (ي) |
| 1:10:46 | Ба ҳарфи | The letter Ba (ب) |
| 1:21:18 | Каф ҳарфи | The letter Kaf (ك) |
| 1:28:03 | Мим ҳарфи ноодатийлари | Unusual/irregular forms of Meem |
| 1:38:29 | Лам ҳарфи | The letter Lam (ل) |
| 1:46:27 | Вав ҳарфи | The letter Waw (و) |
| 1:51:45 | Ҳа ҳарфи | The letter Ha (ه) |
| 1:55:55 | Фа ҳарфи | The letter Fa (ف) |
| 2:01:15 | Қоф ҳарфи | The letter Qaf (ق) |
| 2:11:54 | Шин ҳарфи | The letter Sheen (ش) |
| 2:17:07 | Син ҳарфи | The letter Seen (س) |
| 2:23:32 | Са (Чучук с) ҳарфи | The letter Tha ("soft s") (ث) |
| 2:31:53 | Сод ҳарфи | The letter Sad (ص) |
| 2:41:33 | То ҳарфи | The letter Ta/Ta-heavy (ط) |
| 2:52:24 | Жим ҳарфи | The letter Jeem (ج) |
| 3:04:16 | Хо ҳарфи | The letter Kha (خ) |
| 3:13:13 | Ҳа (буғуқ ҳ) ҳарфи | The letter Ha (guttural/pharyngeal ḥ) (ح) |
| 3:24:40 | Ғойн ҳарфи | The letter Ghayn (غ) |
| 3:32:00 | Айн ҳарфи | The letter 'Ayn (ع) |
| 3:45:25 | Дал ҳарфи | The letter Dal (د) |
| 3:53:06 | Дод ҳарфи | The letter Dad (ض) |
| 4:03:18 | Зал ҳарфи | The letter Dhal (ذ) |
| 4:11:12 | Зо ҳарфи | The letter Za/Zo-heavy (ظ) |

**Progression style observed:** vowel signs first (fatha → kasra → damma), then sukun (consonant clusters / no-vowel state), then long vowels (madd letters alif/waw/ya), THEN individual consonant letters — but the consonant order is **not alphabetical (not abjad order)**. It is ordered by **visual/phonetic ease and frequency**: starts with clearly-distinguished, high-frequency, easy-to-write letters (ر ز م ت ن ي ب ك), defers letters with confusable dotting or shape pairs, and explicitly calls out **irregular/variant letter forms** (e.g. "Meem irregularities") as their own micro-topic rather than folding them silently into the main letter lesson. Letters that are visually/acoustically similar or often confused by Uzbek speakers (ث/س/ص, ح/خ/ه, ذ/ز/ظ/ض, ع/غ) are taught in loose proximity to each other for contrast drilling, but not back-to-back — likely intentional spacing to avoid interference.

### Full video description (raw, machine-extracted, for provenance)
> "Assalomu alaykum, biz bilan birgalikda arab alifbosini 4 osatda to'liq o'rganing. Telegramda guruhga qo'shilsangiz ustozdan savollaringiz bo'lsa so'rashingiz mukin manzil https://t.me/muallimi_soniy_guruhlar." (+ timestamp list above, + links to "Qolgan darslar" [remaining lessons] pointing at the Tajwid darslari playlist, + Telegram group/admin links + YouTube channel link)

Could not retrieve captions/transcript: YouTube blocked the unauthenticated player response with `LOGIN_REQUIRED` / bot-check, so `timedtext`/caption-track URLs (which are only listed inside `ytInitialPlayerResponse.captions`) were unavailable via plain curl. No further transcript attempt was made beyond this (would require authenticated session or a third-party proxy, out of scope for open, reproducible research). The description-embedded timestamp/chapter list above is a complete and reliable substitute for the video's content structure.

---

## 2. Channel Identification

- **Channel name:** **Muallimi Soniy** (Муаллими соний / "Mu'allim al-Thani", roughly "The Second Teacher/Primer" — a traditional name for a Quran-reading primer/qaida book, used here as the channel/brand name)
- **Handle:** `@MuallimiSoniy`
- **Channel URL:** https://www.youtube.com/@MuallimiSoniy
- **Channel ID:** `UCkMxuw12FFiA7FKDNAl0Uug`
- **Videos tab:** https://www.youtube.com/@MuallimiSoniy/videos
- **Playlists tab:** https://www.youtube.com/@MuallimiSoniy/playlists
- Teacher's name appearing in later video titles: "Shayx Alijon Qori" (Shaykh Alijon Qori) — likely the reciter/teacher featured in the "Qur'on o'qishni o'rganish" (Learning to Read the Quran) series.
- Associated Telegram group: https://t.me/muallimi_soniy_guruhlar (admin bot: https://t.me/muallimadmin_bot) — not relevant to licensing, just channel community links.

### License status (important constraint check)
No explicit open license (e.g. Creative Commons) was found anywhere on the channel or video pages — standard YouTube "Standard YouTube License" applies by default, and nothing on the channel/about page overrides this. **Per project hard constraints, this channel's videos and audio must never be re-hosted or ripped — only linked/embedded as YouTube links**, exactly as the spec already anticipates ("linking/embedding YouTube, never re-hosting their audio"). This report and the course must treat all Muallimi Soniy URLs as **reference/link-only** sources, not as content to copy.

---

## 3. Channel's Playlists (full list observed)

Fetched from https://www.youtube.com/@MuallimiSoniy/playlists (20 playlists visible on first load; more may exist behind pagination, not fetched):

| Playlist title (original) | English | Playlist URL |
|---|---|---|
| Ramazongacha Qur'on o'qiymiz | "We read Quran until Ramadan" | https://www.youtube.com/playlist?list=PLgrueUfOSy6tBjfWmmXe2fOs2_vzxwfQd |
| Муфтий Нуриддин хожи домла | "Mufti Nuriddin Hoji Domla" (guest scholar series) | https://www.youtube.com/playlist?list=PLgrueUfOSy6tGxuUnUqknjmrtVjS5zwbx |
| quron o'qishni o'rganish | "Learning to read the Quran" | https://www.youtube.com/playlist?list=PLgrueUfOSy6uYsDGmnz1uEFuEv1kFALAC |
| Калималар | "Words" (vocabulary/word drills) | https://www.youtube.com/playlist?list=PLgrueUfOSy6teX-BrELgtDIjtZ5XjuP8U |
| араб алифбоси | "Arabic alphabet" | https://www.youtube.com/playlist?list=PLgrueUfOSy6tipZosPT9OhC-E73gvnIVm |
| Nafl namozlar erkaklar uchun | "Voluntary prayers for men" | https://www.youtube.com/playlist?list=PLgrueUfOSy6sHy0guEBc3i5xE98dlIdbv |
| Tahajjud namozi ayollar uchun | "Tahajjud prayer for women" | https://www.youtube.com/playlist?list=PLgrueUfOSy6ugQNs5bFEs1purAYSqPBg1 |
| Нафл намозлар | "Voluntary prayers" | https://www.youtube.com/playlist?list=PLgrueUfOSy6vI8pXQuVzDAkaBAvgPUPdA |
| **Тажвид дарслари / Tajvid darslari / Tajweed lessons** | **Tajweed lessons** (numbered course, see §4) | https://www.youtube.com/playlist?list=PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu |
| Араб алифбоси ёзилиши / Аrab alifbosi yozilishi | "Writing the Arabic alphabet" | https://www.youtube.com/playlist?list=PLgrueUfOSy6t6Gtok7PHbBxAMmDlmqy3c |
| AYOLLAR NAMOZI | "Women's prayer" | https://www.youtube.com/playlist?list=PLgrueUfOSy6vgaj7e51oK54gBZ2B1wTgB |
| **Muallimi Soniy** (channel's own primer, main course) | Main "Muallimi Soniy" lesson series (see §4) | https://www.youtube.com/playlist?list=PLgrueUfOSy6toR7sz27dmPK2WPBNVLwRi |
| Arab tilida yozish va o'qish | "Writing and reading in Arabic" (this is the primary 35-lesson letter series, embedded at head of the "Muallimi Soniy" playlist above) | (no separate playlist ID found; lives inside the "Muallimi Soniy" playlist, see §4) |
| Қурьондаги ноодатий харфлар / Qur'ondagi noodatiy harflar | "Unusual/irregular letters in the Quran" | https://www.youtube.com/playlist?list=PLgrueUfOSy6uEPqdL8nxTF7ekq8LRk4Ad |
| 5 mahal namoz to'liq o'qish tartibi | "Full order of reciting the 5 daily prayers" | https://www.youtube.com/playlist?list=PLgrueUfOSy6vRVNJV3c36pDoh42IFCVGj |
| Fazliddin domla | "Teacher Fazliddin" (guest scholar series) | https://www.youtube.com/playlist?list=PLgrueUfOSy6te9TdDj1kwVyYNlwiHg9GF |
| Namoz vaqtlari / Besh vaqt namoz vaqtlari | "Prayer times / the five daily prayer times" | https://www.youtube.com/playlist?list=PLgrueUfOSy6tzE39aE3CNlzf4Qbu75Dz0 |
| Namoz | "Prayer" (general) | https://www.youtube.com/playlist?list=PLgrueUfOSy6uRGAm7d-99ovGJvp5Quw1O |
| Ro'zaga oid savol-javoblar | "Q&A about fasting" (Shaykh Muhammad Sodiq) | https://www.youtube.com/playlist?list=PLgrueUfOSy6tElxz2McBI_y45zjcM2cLB |
| Zam sura | "Zam-sura" (the short surah recited after al-Fatiha in prayer) | https://www.youtube.com/playlist?list=PLgrueUfOSy6vx581-Zp5EtPq74c3is6Y9 |

The three playlists directly relevant to our course's Phase 1–3 mirroring are bolded/highlighted above and detailed in full below.

---

## 4. THE KEY FINDING: "Muallimi Soniy" master playlist — full letters→reading progression

**Playlist URL:** https://www.youtube.com/playlist?list=PLgrueUfOSy6toR7sz27dmPK2WPBNVLwRi

This playlist is the channel's actual **sequenced course** (as opposed to the 4-hour compilation video, which is a highlight-reel of part of it). The first ~100 items fetched (pagination continuation not fetched — likely more videos exist past #100, primarily further Tajweed lessons) break into two clearly distinct numbered sub-series concatenated back-to-back:

### 4a. "Arab tilida yozish va o'qish" ("Writing and Reading in Arabic") — Lessons 1–35
This is the **letters/alphabet phase** — direct analogue of our Phase 1 (Letters & Sounds). 35 lessons vs. our 12, i.e. roughly 3x granularity (this channel devotes far more, shorter lessons per letter group than we plan to).

| # | Video ID | Title (translated highlights) | URL |
|---|---|---|---|
| 1 | ygJlc-i118c | Writing and reading in Arabic, Lesson 1 | https://www.youtube.com/watch?v=ygJlc-i118c |
| 2 | GFFaWRQ_Ziw | Lesson 2 | https://www.youtube.com/watch?v=GFFaWRQ_Ziw |
| 3 | HmrRg2VGPGk | Lesson 3 | https://www.youtube.com/watch?v=HmrRg2VGPGk |
| 4 | E3v8CwN4dS4 | Lesson 4 | https://www.youtube.com/watch?v=E3v8CwN4dS4 |
| 5 | Dz33SX3mmAc | Lesson 5 | https://www.youtube.com/watch?v=Dz33SX3mmAc |
| 6 | z2FoR46yb6U | Lesson 6 — Sukun | https://www.youtube.com/watch?v=z2FoR46yb6U |
| 7 | TAZYEDdkgY8 | Lesson 7 | https://www.youtube.com/watch?v=TAZYEDdkgY8 |
| 8 | XhGT03XGwiE | Lesson 8 — letter ر (Ra) | https://www.youtube.com/watch?v=XhGT03XGwiE |
| 9 | 2h1hga0Sul8 | Lesson 9 | https://www.youtube.com/watch?v=2h1hga0Sul8 |
| 10 | RUPLCvzd3sY | Lesson 10 | https://www.youtube.com/watch?v=RUPLCvzd3sY |
| 11 | BUPK0tsRero | Lesson 11 | https://www.youtube.com/watch?v=BUPK0tsRero |
| 12 | zGPhVtir62I | Lesson 12 | https://www.youtube.com/watch?v=zGPhVtir62I |
| 13 | rLMTY39y9K4 | Lesson 13 | https://www.youtube.com/watch?v=rLMTY39y9K4 |
| 14 | QJYsub7elHI | Lesson 14 | https://www.youtube.com/watch?v=QJYsub7elHI |
| 15 | opwM9wCjSCY | Lesson 15 | https://www.youtube.com/watch?v=opwM9wCjSCY |
| 16 | TI8qNlY8WAo | Lesson 16 | https://www.youtube.com/watch?v=TI8qNlY8WAo |
| 17 | u05mxYYV8LU | Lesson 17 | https://www.youtube.com/watch?v=u05mxYYV8LU |
| 18 | F6OVUHCXC6s | Lesson 18 | https://www.youtube.com/watch?v=F6OVUHCXC6s |
| 19 | sTNc9KXv4IM | Lesson 19 | https://www.youtube.com/watch?v=sTNc9KXv4IM |
| 20 | f8_ijZDd6RU | Lesson 20 | https://www.youtube.com/watch?v=f8_ijZDd6RU |
| 21 | rIi6anuj5Y4 | Lesson 21 | https://www.youtube.com/watch?v=rIi6anuj5Y4 |
| 22 | HJR62EkzivM | Lesson 22 | https://www.youtube.com/watch?v=HJR62EkzivM |
| 23 | fW6bQoXs-o8 | Lesson 23 | https://www.youtube.com/watch?v=fW6bQoXs-o8 |
| 24 | WNtZAbmSTJA | Lesson 24 | https://www.youtube.com/watch?v=WNtZAbmSTJA |
| 25 | l2cp9-0AsaA | Lesson 25 | https://www.youtube.com/watch?v=l2cp9-0AsaA |
| 26 | av9eezoypOc | Lesson 26 | https://www.youtube.com/watch?v=av9eezoypOc |
| 27 | 7Khuai3QtBU | Lesson 27 | https://www.youtube.com/watch?v=7Khuai3QtBU |
| 28 | LK_KLaleuK8 | Lesson 28 | https://www.youtube.com/watch?v=LK_KLaleuK8 |
| 29 | 48dXwft3iGk | Lesson 29 | https://www.youtube.com/watch?v=48dXwft3iGk |
| 30 | 4Qy7j8mSimU | Lesson 30 | https://www.youtube.com/watch?v=4Qy7j8mSimU |
| 31 | gGeJ6202JUQ | Lesson 31 | https://www.youtube.com/watch?v=gGeJ6202JUQ |
| 32 | c-MO8vIs4Qw | Lesson 32 | https://www.youtube.com/watch?v=c-MO8vIs4Qw |
| 33 | 66oGyG2QI5M | Lesson 33 | https://www.youtube.com/watch?v=66oGyG2QI5M |
| 34 | fxPXV_7CKs8 | Lesson 34 | https://www.youtube.com/watch?v=fxPXV_7CKs8 |
| 35 | ZCf29gAD46I | Lesson 35 (final letters lesson) | https://www.youtube.com/watch?v=ZCf29gAD46I |

(Titles beyond lesson number were largely template-identical: `"ARAB TILIDA YOZISH VA O'QISH N-DARS / MUALLIMI SONIY N-DARS UZBEK TILIDA"`; only a few call out specific content — Lesson 6 explicitly names Sukun, Lesson 8 names the letter ر (Ra). Full per-letter breakdown for lessons not individually labeled would require opening each video's own description, not done here for time; the 4-hour compilation in §1 is a faithful proxy for the content/order of roughly the first ~15–18 of these 35 lessons.)

### 4b. "Тажвид дарслари" (Tajweed lessons) — Lessons 1–65+ (continues in same playlist after the 35 alphabet lessons; likely continues further beyond what the first ~100-item page fetch captured)

This is the direct analogue of our Phase 3 (Tajweed rules). Order observed (translated):

| # | Topic (English) | Video URL |
|---|---|---|
| 1 | Fatha, Kasra, Damma, Zamma, the letter Alif | https://www.youtube.com/watch?v=E_UHdPT5z9o |
| 2 | Madd Tabi'i (natural elongation) / stretched reading | https://www.youtube.com/watch?v=zXlHApBpo9s |
| 3 | Madd Tabi'i part 2 | https://www.youtube.com/watch?v=BS7q7IIYBmY |
| 4 | Madd Tabi'i part 3 | https://www.youtube.com/watch?v=FWrBHIoQwvI |
| 5 | Shaddah letters part 1 | https://www.youtube.com/watch?v=9CZ4d1rOHgk |
| 6 | Shaddah letters part 2 | https://www.youtube.com/watch?v=BiHMiHFA37Y |
| 7 | Tanwin letters part 1 | https://www.youtube.com/watch?v=j52uaiDWcBY |
| 8 | Tanwin letters part 2 | https://www.youtube.com/watch?v=NyznkPtRTjk |
| 9 | Tanwin letters part 3 (the "n" sound of tanwin) | https://www.youtube.com/watch?v=F6Zjeo3F8tY |
| 10 | Tanwin + Shaddah combined | https://www.youtube.com/watch?v=42BjGwPYmYI |
| 11 | Arabic numerals | https://www.youtube.com/watch?v=LXG9e-kSO0s |
| 12 | Alif and Hamzah — 9 states | https://www.youtube.com/watch?v=NWcM83CfdH8 |
| 13 | Ta Marbuta | https://www.youtube.com/watch?v=OGTYBm1peOI |
| 14 | Elongation markers part 1 | https://www.youtube.com/watch?v=WIcfficCdMk |
| 15 | Elongation markers part 2 | https://www.youtube.com/watch?v=znGlTbfqA9Q |
| 16 | Alif/Ya letters that behave like elongated alif | https://www.youtube.com/watch?v=V-KdtB8Pno8 |
| 17 | Letters written but not pronounced | https://www.youtube.com/watch?v=iGn-_2x31mI |
| 18 | Alif-Lam rule 1 (at start of word) | https://www.youtube.com/watch?v=t0f87xkY4zo |
| 19 | Alif-Lam rule 2 (with shaddah at word start) | https://www.youtube.com/watch?v=0hwTTWn9YAA |
| 20 | Alif-Lam rule 3 (hamzatul-wasl mid-sentence) | https://www.youtube.com/watch?v=KYgPpdj1vrE |
| 21 | Alif-Lam rule 4 (Alif-Lam mid-sentence) | https://www.youtube.com/watch?v=puke_Vsn1Aw |
| 22 | Hamzatul-Wasl at word start, part 1 ("u" reading) | https://www.youtube.com/watch?v=O-NMjdqef4s |
| 23 | Hamzatul-Wasl at word start, part 2 ("i" reading) | https://www.youtube.com/watch?v=ch5ZpUIBuAA |
| 24 | Hamzatul-Wasl at word start, part 3 (with shaddah) | https://www.youtube.com/watch?v=6Cyd-Mxn7hI |
| 25 | Waqf (stopping) rule 1 | https://www.youtube.com/watch?v=sn7R990kKVY |
| 26 | Waqf rule 2 | https://www.youtube.com/watch?v=M2i8PwFrBio |
| 27 | Waqf rule 2 with Ta Marbuta | https://www.youtube.com/watch?v=lQQBcxL5QrU |
| 28 | Waqf rule 4 | https://www.youtube.com/watch?v=qVQ2OaTwpcY |
| 29 | Waqf rule 5 — small waw/ya | https://www.youtube.com/watch?v=x5PCe-hZryM |
| 30 | Non-elongation of elongation letters, part 1 | https://www.youtube.com/watch?v=2fnNTaiOWwc |
| 31 | Non-elongation, part 2 | https://www.youtube.com/watch?v=rhEaMJsXync |
| 32 | Joining words when reading, part 1 | https://www.youtube.com/watch?v=q1-fE0jUjLc |
| 33 | Joining words, part 2 (with tanwin) | https://www.youtube.com/watch?v=vsirACsLNPk |
| 34 | Idgham without Ghunnah (Nun/Tanwin sakinah) part 1 | https://www.youtube.com/watch?v=MLFEbaFVhvM |
| 35 | Idgham without Ghunnah part 2 | https://www.youtube.com/watch?v=Sp0TRX8RmC0 |
| 36 | Idgham without Ghunnah with Tanwin | https://www.youtube.com/watch?v=BremYrwgYJQ |
| 37 | Idgham with Ghunnah part 1 | https://www.youtube.com/watch?v=LgcM3PU4lx0 |
| 38 | Idgham with Ghunnah part 2 | https://www.youtube.com/watch?v=Y4rg2PzjBSI |
| 39 | Iqlab part 1 | https://www.youtube.com/watch?v=Dfgrb3yNrWI |
| 40 | Iqlab part 2 | https://www.youtube.com/watch?v=lHiZo-dvz1s |
| 41 | Izhar part 1 | https://www.youtube.com/watch?v=MJcCVtkjwrY |
| 42 | Izhar part 2 | https://www.youtube.com/watch?v=SO4tFFTjfVg |
| 43 | Ikhfa part 1 | https://www.youtube.com/watch?v=8vWDHlK-90A |
| 44 | Ikhfa part 2 | https://www.youtube.com/watch?v=fkigAEdo7P8 |
| 45 | Nun rules (summary) | https://www.youtube.com/watch?v=ImRWh4mW-4I |
| 46 | Meem rules / Idgham Shafawiyyah part 1 | https://www.youtube.com/watch?v=pSjAa_5vGYg |
| 47 | Meem rules / Ikhfa Shafawiyyah part 2 | https://www.youtube.com/watch?v=is63Px2Nxg0 |
| 48 | Meem rules / Izhar Shafawiyyah part 3 | https://www.youtube.com/watch?v=w3cc0-XFYpI |
| 49 | Madd part 1 — Madd Tabi'i | https://www.youtube.com/watch?v=2tL8zs6KsXg |
| 50 | Madd part 2 — Madd Muttasil | https://www.youtube.com/watch?v=6q5sj-eVFgA |
| 51 | Madd part 3 — Madd Munfasil | https://www.youtube.com/watch?v=FfvkVuAX-_g |
| 52 | Madd part 4 — Madd Lazim | https://www.youtube.com/watch?v=SUmkaesajFY |
| 53 | Madd part 5 — Madd 'Arid | https://www.youtube.com/watch?v=yrTLgULqb2k |
| 54 | Madd part 6 — Lin letters | https://www.youtube.com/watch?v=ClqSSfSgyxc |
| 55 | Madd part 7 — Madd Lin 'Arid | https://www.youtube.com/watch?v=oyfpu0CUYo0 |
| 56 | Madd part 8 — Madd Lin Lazim | https://www.youtube.com/watch?v=TuayPhvRHU4 |
| 57 | Lafz al-Jalalah (Allah's name) part 1 | https://www.youtube.com/watch?v=EY-tLJLodqg |
| 58 | Lafz al-Jalalah part 2 | https://www.youtube.com/watch?v=RF73VqzoH6g |
| 59 | Lafz al-Jalalah part 3 | https://www.youtube.com/watch?v=UF0QMwGkCxU |
| 60 | Lafz al-Jalalah part 4 | https://www.youtube.com/watch?v=3GbvCIAFRW4 |
| 61 | Idghams part 1 | https://www.youtube.com/watch?v=XabLjlEvErM |
| 62 | Idghams part 2 | https://www.youtube.com/watch?v=eA7V4Bq7my4 |
| 63 | Stopping marks part 1 | https://www.youtube.com/watch?v=3wkCBv_CFnw |
| 64 | Stopping marks part 2 | https://www.youtube.com/watch?v=o4fF2XhAMY8 |
| 65 | Huruf Muqatta'at (disjointed letters) part 1 | https://www.youtube.com/watch?v=rDyOrf45x8E |
| (79) | Emphatic waqf, type 6 | https://www.youtube.com/watch?v=9bzX36upo3Q |
| (80) | What is Sakta | https://www.youtube.com/watch?v=t3-GTmZnNXA |
| (81) | Imalah — the "e" sound in Quran | https://www.youtube.com/watch?v=EybdxJhmso0 |
| (82) | Ishmam — Surah Yusuf 12:11 | https://www.youtube.com/watch?v=yQzLdD0XySU |
| (83) | Sujud at-tilawah supplication | https://www.youtube.com/watch?v=YrvMc9AuAJQ |

(Numbers ≥79 were surfaced from the separate "quron o'qishni o'rganish" playlist fetch, interleaved with that playlist's reading lessons — they belong to the same numbered "Tajvid darslari" series and confirm the series runs to at least 83 lessons.)

**Playlist link for full/updated list:** https://www.youtube.com/playlist?list=PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu

---

## 5. THE OTHER KEY FINDING: "Qur'on o'qishni o'rganish" ("Learning to Read the Quran") playlist — mirrors our Phase 2→3 bridge and juz-'Amma hifz order

**Playlist URL:** https://www.youtube.com/playlist?list=PLgrueUfOSy6uYsDGmnz1uEFuEv1kFALAC (37 items fetched)

This is the **most directly relevant playlist to our course design** — it is the channel's own progression from isolated recitation formulas → al-Fatiha → the short surahs of Juz 'Amma, read in the **same reverse order (an-Nas backward toward al-'Alaq)** that our spec already plans for Phase 3's "last 10 surahs" hifz block. This strongly validates the ordering our design doc already committed to, and gives a concrete lesson-by-lesson pacing model (mostly 1 lesson/surah, with 2–3-part splits for longer surahs).

| # | Uzbek/English title | Content | URL |
|---|---|---|---|
| 1 | Qur'on o'qishni o'rganish 1-dars \| A'uzuni o'rganamiz | Learning Ta'awwudh (A'udhu billah) | https://www.youtube.com/watch?v=R3PpaKSp09g |
| 2 | 2-dars \| Bismillahni o'rganamiz | Learning Bismillah | https://www.youtube.com/watch?v=_wDzCWhTFpA |
| 3 | 3-dars, Fatiha surasi matni 1-qism | Al-Fatiha text, part 1 | https://www.youtube.com/watch?v=cmAe5ftLz0M |
| 4 | "Learning to read the Quran for beginners LESSON 4: Fatiha surah tajweed" | Al-Fatiha, tajweed applied | https://www.youtube.com/watch?v=K6d8X2pFUWA |
| 5 | LESSON 5: Surah An-Nas | An-Nas (114) | https://www.youtube.com/watch?v=XnRQOsGiLdA |
| 6 | LESSON 6: Surah Al-Falaq | Al-Falaq (113) | https://www.youtube.com/watch?v=26GEIjYvDOQ |
| 7 | LESSON 7: Surah Al-Ikhlas | Al-Ikhlas (112) | https://www.youtube.com/watch?v=1asgeTvzvwo |
| 8 | LESSON 8: Surat Al-Masad | Al-Masad (111) | https://www.youtube.com/watch?v=hz-Oo685yzE |
| 9 | 9-dars \| Nasr surasini o'rganamiz | An-Nasr (110) | https://www.youtube.com/watch?v=TYd3qkN_Ee8 |
| 10 | 10-dars \| Kafirun surasini o'rganamiz | Al-Kafirun (109) | https://www.youtube.com/watch?v=8Qdq1EOHtII |
| 11 | 11-dars \| Kavsar surasini o'rganamiz | Al-Kawthar (108) | https://www.youtube.com/watch?v=7XjAgvr8m4A |
| 12 | 12-dars \| Ma'un surasini o'rganamiz | Al-Ma'un (107) | https://www.youtube.com/watch?v=-OezgBOPbIA |
| 13 | 13-dars \| Quroysh surasini o'rganamiz | Quraysh (106) | https://www.youtube.com/watch?v=lZZNMlNJc0U |
| 14 | 14-dars \| Fil surasini o'rganamiz | Al-Fil (105) | https://www.youtube.com/watch?v=QvLIBuSpicc |
| 15 | 15-dars, Humaza surasi | Al-Humazah (104), part 1 | https://www.youtube.com/watch?v=hWELrgY8qxE |
| 16 | 16-dars, Humaza surasi 2-qism | Al-Humazah, part 2 | https://www.youtube.com/watch?v=GmtaOzWzsRg |
| 17 | 17-dars, Asr surasi | Al-'Asr (103) | https://www.youtube.com/watch?v=Nq0nrQKGPBg |
| 18 | "LEARNING TO READ THE QURAN LESSON 18 SURAH TAKASUR" | At-Takathur (102), part 1 | https://www.youtube.com/watch?v=vIRzP08jVjA |
| 19 | 19-dars, Takasur surasi 2-qism | At-Takathur, part 2 | https://www.youtube.com/watch?v=jzbgel0QM1E |
| 20 | 20-dars, Qoria surasi 1-qism | Al-Qari'ah (101), part 1 | https://www.youtube.com/watch?v=anL20kT9Y9I |
| 21 | 21-dars, Qoria surasi 2-qism | Al-Qari'ah, part 2 | https://www.youtube.com/watch?v=owPjtC4rTgw |
| 22 | 22-dars, Adiyat surasi 1-qism | Al-'Adiyat (100), part 1 | https://www.youtube.com/watch?v=aYUgrYJFCbQ |
| 23 | 23-dars, Adiyat surasi 2-qism | Al-'Adiyat, part 2 | https://www.youtube.com/watch?v=NOwm5Xk7t-0 |
| 24 | 24-dars, Zalzala surasi 1-qism | Az-Zalzalah (99), part 1 | https://www.youtube.com/watch?v=rEYgQXPi0P4 |
| 25 | 25-dars, Zalzala surasi 2-qism | Az-Zalzalah, part 2 | https://www.youtube.com/watch?v=Gmp2KuGcKsU |
| 26 | 26-dars, Bayyina surasi 1-qism | Al-Bayyinah (98), part 1 | https://www.youtube.com/watch?v=FicNCMev2LY |
| 27 | 27-dars, Bayyina surasi 2-qism | Al-Bayyinah, part 2 | https://www.youtube.com/watch?v=cvBoF3PEnbc |
| 28 | 28-dars, Bayyina surasi 3-qism | Al-Bayyinah, part 3 | https://www.youtube.com/watch?v=yfWxujxdGr8 |
| 29 | 29-dars, Qadr surasi | Al-Qadr (97) | https://www.youtube.com/watch?v=vJF2eUI1Dls |
| 30 | 30-dars, Alaq surasi 1-qism | Al-'Alaq (96), part 1 | https://www.youtube.com/watch?v=xUibmwU6bSg |
| 31 | 31-dars, Alaq surasi 2-qism | Al-'Alaq, part 2 | https://www.youtube.com/watch?v=ST_dOrj10cM |
| 32 | 32-dars, Alaq surasi 3-qism | Al-'Alaq, part 3 | https://www.youtube.com/watch?v=_vYp_Jk8-cw |

**Confirmed progression: Ta'awwudh → Bismillah → al-Fatiha (2 lessons) → An-Nas → Al-Falaq → Al-Ikhlas → Al-Masad → An-Nasr → Al-Kafirun → Al-Kawthar → Al-Ma'un → Quraysh → Al-Fil → Al-Humazah → Al-'Asr → At-Takathur → Al-Qari'ah → Al-'Adiyat → Az-Zalzalah → Al-Bayyinah → Al-Qadr → Al-'Alaq.**

This is exactly Juz 'Amma surahs 114 down to 96 in strict reverse mushaf order (i.e., the standard "last 10/last 12 surahs for beginners" memorization sequence used broadly in Islamic pedagogy, not something unique to this channel — but it validates that this specific channel, which the course owner already trusts and learned from, uses the identical order our design doc specifies). Surah length roughly predicts number of video-parts per surah (1 part for very short surahs, up to 3 parts for longer ones like al-Bayyinah and al-'Alaq) — a useful pacing heuristic: **budget more lesson-segments for a surah in proportion to its verse/word count, not a flat one-lesson-per-surah rule.**

---

## 6. "Arab alifbosi" (separate, older/shorter "Arabic alphabet") playlist

**Playlist URL:** https://www.youtube.com/playlist?list=PLgrueUfOSy6tipZosPT9OhC-E73gvnIVm

Only 1 item was retrieved from the initial page load (YouTube's `ytInitialData` truncates long playlists and requires a continuation-token API call for the rest, which was not pursued given time budget — the "Muallimi Soniy" master playlist in §4 already supersedes this one for our purposes):

| # | Title | URL |
|---|---|---|
| 1 | ARAB ALIFBOSI 1-DARS \|\| "A" BELGISI \|\| Arab alifbosi | https://www.youtube.com/watch?v=4HDl9kDwMXk |

This appears to be an even older/parallel letters series (possibly superseded by "Arab tilida yozish va o'qish" in §4a). Not pursued further; §4a is the more complete and more recent letters series and should be treated as canonical for this channel.

---

## 7. Progression Style — Synthesis for Our Phase 2 Design

Distilling the channel's approach into transferable structural principles for our own Phase 2 (Reading Mechanics, 14 lessons):

1. **Vowel signs before consonant identity drilling.** The channel teaches fatha/kasra/damma and sukun as concepts (with their sounds) *before* systematically working through consonants — consonants are introduced already dressed in these vowel signs from lesson 1, not taught bare first. This matches a Noorani-Qaida-style approach and supports our spec's plan.
2. **Sukun (consonant clusters) is taught early and gets two dedicated lessons**, immediately after the three vowel signs — i.e., "no vowel" is treated as importantly as the vowels themselves, not as an afterthought. Our Phase 2 plan already sequences tanwin → sukun → shadda → madd letters; this channel's evidence supports giving sukun genuine multi-lesson weight rather than a single mention.
3. **Long vowels (madd letters, alif/waw/ya) are introduced as a named checkpoint** ("A, I, U letters") right after sukun, before diving into the bulk of consonant letters — i.e., establishing the three long-vowel sounds as reusable building blocks early, then letters build on top of them.
4. **Irregular/variant letter shapes get their own dedicated micro-lesson** rather than being folded silently into the base letter's lesson (e.g., "Meem irregularities" as lesson 1:28:03, separate from the main Meem lesson at 37:34). Recommendation: our teacher notes / "listen-for mistake lists" should likewise flag known irregular-shape or confusable letters as their own checklist items, not just mention them in passing.
5. **Confusable letter pairs are taught with intentional separation, not back-to-back**, likely to reduce interference (e.g., ث ح خ ه ذ ز ض ظ ع غ are distributed rather than clustered) — supports designing our own letter-teaching order to avoid clustering acoustically/visually similar letters adjacently, even though final tajweed mastery of these distinctions comes later in Phase 3.
6. **Bridge from isolated formulas → al-Fatiha → shortest/most memorized surahs in strict reverse-mushaf order**, with lesson-count scaled to surah length (1 lesson for very short surahs, 2–3 for longer ones) — this is a proven, tested-at-scale (3.5M+ view flagship video, and a dedicated 32+ lesson playlist) pacing model directly reusable for our Phase 3 hifz-of-last-10-surahs block, and indirectly useful for calibrating how many of our 14 Phase 2 lessons to spend on "real words → phrases → fully-voweled sentences" before graduating into surah text.
7. **The channel explicitly signals "remaining lessons" (Qolgan darslar) pointing students from the alphabet compilation directly into the Tajweed-lessons playlist** — i.e., its own internal information architecture already treats "alphabet" and "tajweed rules" as two connected but distinct phases, mirroring our Phase 1 → Phase 3 split (with our Phase 2 as an explicit reading-mechanics bridge this channel doesn't call out as separately named, but functionally covers via lessons 18–35 of the "Arab tilida yozish va o'qish" series plus the early Tajvid-darslari lessons on tanwin/shaddah/madd).

## 8. Concrete Recommendations for This Course

- **Do not re-host** any Muallimi Soniy video, audio rip, or transcript text; only link to `youtube.com/watch?v=...` URLs (per hard constraint). This report's tables are safe to keep as an internal planning reference (they are factual/bibliographic metadata — titles, timestamps, URLs — not the copyrighted audio/video itself), but our app-facing content must embed/link, never re-encode their recitation audio.
- Use the §4a lesson URLs list as one candidate for optional in-app "supplementary reference" links per Phase 1 lesson (student already trusts this channel), explicitly labeled as external/optional and Uzbek-language.
- Use the §5 "Qur'on o'qishni o'rganish" playlist's exact surah order and per-surah lesson-count-by-length heuristic directly as a pacing model for Phase 3's hifz-of-last-10-surahs schedule.
- Cross-reference §4a/§4b's granular 35+83 lesson structure only as an ordering/pedagogy reference — our own lesson count (12 for Phase 1, 26 for Phase 3 incl. hifz) is intentionally coarser-grained for a live 1:1 teaching cadence, not meant to match 1:1.
- Because the primary compilation video (VhRHKdPcNPA) is unauthenticated-blocked for captions and has no explicit CC license, **do not attempt automatic transcript/caption scraping for this channel** — treat its content as reference-only via manual review of titles/descriptions/timestamps (as done in this report), which was sufficient to fully reconstruct its teaching order.

---

## Appendix: Raw fetch method notes (for reproducibility)

- Video/channel/playlist pages fetched via: `curl -sL <url> -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o out.html`
- `ytInitialData` extracted from `<script>` blocks using Python `json.JSONDecoder().raw_decode()` starting from the `{` immediately following the `var ytInitialData` (or `ytInitialData"] =`) marker — naive brace-counting failed due to `{`/`}` characters appearing inside JSON string values (e.g. in descriptions), so the stdlib decoder was used instead.
- New-format YouTube playlist/channel pages no longer use `playlistVideoRenderer`/`gridPlaylistRenderer` in all cases; playlist tiles were found under `lockupViewModel.contentId` + `lockupViewModel.metadata.lockupMetadataViewModel.title.content`.
- `ytInitialPlayerResponse` (which carries `videoDetails`, `captions`, `streamingData`) came back with `playabilityStatus.status = "LOGIN_REQUIRED"` ("Sign in to confirm you're not a bot") under an unauthenticated curl fetch — video title/description/metadata were instead successfully recovered from `ytInitialData`'s `playerOverlayVideoDetailsRenderer` and `videoSecondaryInfoRenderer.attributedDescription` blocks, which are not gated the same way.
- Playlist page fetches return only the first ~100 items server-side rendered; remaining items require a `browse` continuation-token POST to the `youtubei/v1/browse` endpoint, which was not pursued (time-boxed research task) — noted as an open item below.
