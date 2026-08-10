---
type: source
id: muallimi-soniy
title: Muallimi Soniy — Tajvid darslari (Tajweed lessons)
playlist_title: Тажвид дарслари / Tajvid darslari / Tajweed lessons
playlist_id: PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu
channel_id: UCkMxuw12FFiA7FKDNAl0Uug
handle: "@MuallimiSoniy"
author: Shayx Alijon Qori
language: Uzbek (predominantly Cyrillic script)
licence: standard-youtube
vendored: metadata-only
url: https://www.youtube.com/playlist?list=PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu
retrieved: 2026-08-10
status: verified
---

# Muallimi Soniy — Tajvid darslari

The Uzbek-language tajweed course the learner this vault is built for actually
studied. It is the reference point for what he already knows, what he expects a
tajweed course to contain, and what vocabulary he will recognise. **Link and
embed only — never re-host.**

## Channel and teacher

| Field | Value |
|---|---|
| Playlist title | Тажвид дарслари / Tajvid darslari / Tajweed lessons |
| Playlist ID | `PLgrueUfOSy6toOuZQLtPe3N1PGhZdUsOu` |
| Channel | **Muallimi Soniy** |
| Channel ID | `UCkMxuw12FFiA7FKDNAl0Uug` |
| Handle | `@MuallimiSoniy` |
| Teacher | **Shayx Alijon Qori** — named in the titles of lessons 80, 81, 82 |
| Language | **Uzbek.** Titles predominantly Uzbek **Cyrillic**; a minority Uzbek Latin; 5 in English for SEO |
| Videos shown by YouTube | 97 |
| Videos actually retrievable | **96** |
| Total runtime | **22 h 33 m 55 s** |
| Mean lesson length | **14.1 min** (range 3:36 – 38:50) |

**Style.** Short single-topic lessons, heavily split into `N-ҚИСМ` ("part N") —
47 of the 82 tajweed lessons are part-*n* continuations. Titles are stuffed to
YouTube's 100-character cap with SEO keywords (`араб тилини урганамиз`,
`#TAJVID`, `мп3 скачат`); 25 of the 96 titles hit exactly 100 characters and are
cut off mid-word **by the author's own keyword stuffing, not by extraction** —
this was confirmed against the oEmbed API, which returns identical 100-character
strings.

---

# Correction to `docs/research/uzbek-channel.md`

> **The series is 82 lessons, numbered 1–82, gap-free and duplicate-free.
> `docs/research/uzbek-channel.md` claims the series "runs to at least 83
> lessons" and labels four items `(79)`–`(83)`. That is wrong.**

The four numbered items at the end of the playlist are lessons **79, 80, 81,
82**. **There is no lesson 83.** The error is an off-by-one from counting
playlist *positions* rather than reading the `N-ДАРС` number inside each title.
That file's §4b row "83 | Sujud at-tilawah supplication" is **not in this
playlist at all** — it belongs to a different playlist on the same channel.

**How this was established, so it can be re-checked:** the `N-ДАРС` numbers were
parsed out of the 96 retrieved titles and the resulting integer set compared
against `range(1, 83)`. Result: **1–82, zero gaps, zero duplicates.** Separately,
the `Quron o'qishni o'rganish` items number **1–14**, also gap-free.
82 + 14 = 96 = exactly the number of videos retrieved. The playlist is provably
complete on its own terms.

Everything else in `docs/research/uzbek-channel.md` was confirmed: every video ID
in its §4b table matches what was retrieved, in the same order. This note also
**adds** what that file lacked — the actual Uzbek titles (it had English
paraphrases only), all durations, total runtime, and lessons 66–78, which its
earlier fetch missed.

## The missing 97th video

YouTube's header reports 97 videos; exactly 96 render. There are 96
`lockupViewModel` entries, all with valid IDs and titles, **no placeholders and
no "Private video" / "Deleted video" markers anywhere in the HTML.** The missing
item is almost certainly private or deleted — YouTube counts such items but does
not render them. Supporting evidence that nothing pedagogically relevant is
missing: both numbered series are gap-free and sum to exactly 96.

---

# Structure: two interleaved series

The playlist is not one series.

| Positions | Content |
|---|---|
| 1–78 | Tajvid darslari 1–78, strictly sequential |
| 79–96 | Tajvid 79–82 **interleaved with** "Quron o'qishni o'rganish" 1–14 (applied surah reading) |

The interleave is by upload date — the teacher ran both series concurrently in
2022. **Pedagogically this is the interesting part:** applied surah recitation
begins **only after the entire theoretical rule set (lessons 1–78) is complete.**
Theory is front-loaded; application is a separate, later track. The 14 reading
lessons here are the first 14 of a 37-item series with its own playlist
(`PLgrueUfOSy6uYsDGmnz1uEFuEv1kFALAC`).

---

# All 96 videos

Uzbek titles are **verbatim as published** — copied byte-for-byte from the JSON
payload, never retyped. The **English translation** and **Topic** columns are
interpretation, not published by the channel: translation confidence is high
(the title vocabulary is formulaic and repeats across all 96 items); topic
confidence is high for named rules (idgham / iqlab / ikhfa / madd) and medium
where the title gives only a rule *number* (e.g. "Waqf rule 4").

| # | Title (Uzbek, verbatim) | English translation | Video ID | Duration | Tajweed topic |
|---|---|---|---|---|---|
| 1 | ТАЖВИД ДАРСЛАРИ 1-ДАРС / ФАТҲА , КАСРА , ДОММА , ЗАММА , АЛИФ ҲАРФИ #TAJWEED | Tajweed Lessons, Lesson 1 / Fatha, Kasra, Damma, Zamma, the letter Alif | `E_UHdPT5z9o` | 9:05 | Short vowels (harakat) + alif |
| 2 | ТАЖВИД ДАРСЛАРИ 2-ДАРС / МАД ТАБИИЙ / ЧЎЗИБ ЎҚИШ #TAJWEED | Lesson 2 / Madd Tabi'i / Reading with elongation | `zXlHApBpo9s` | 12:56 | Natural elongation (madd asli) |
| 3 | ТАЖВИД ДАРСЛАРИ 3-ДАРС / МАД ТАБИИЙ 2-ҚИСМ/ ЧЎЗИБ ЎҚИШ 2-ҚИСМ #TAJWEED | Lesson 3 / Madd Tabi'i part 2 / Reading with elongation part 2 | `BS7q7IIYBmY` | 11:25 | Natural elongation, cont. |
| 4 | ТАЖВИД ДАРСЛАРИ 4-ДАРС / МАД ТАБИИЙ 3-ҚИСМ/ ЧЎЗИБ ЎҚИШ 3-ҚИСМ #TAJWEED | Lesson 4 / Madd Tabi'i part 3 / Reading with elongation part 3 | `FWrBHIoQwvI` | 11:12 | Natural elongation, cont. |
| 5 | ТАЖВИД ДАРСЛАРИ 5-ДАРС / ТАШДИДЛИ ҲАРФЛАР 1-ҚИСМ #TAJWEED | Lesson 5 / Letters with shadda, part 1 | `9CZ4d1rOHgk` | 13:01 | Shadda (gemination) |
| 6 | ТАЖВИД ДАРСЛАРИ 6-ДАРС / ТАШДИДЛИ ҲАРФЛАР 2-ҚИСМ #TAJWEED | Lesson 6 / Letters with shadda, part 2 | `BiHMiHFA37Y` | 4:55 | Shadda, cont. |
| 7 | ТАЖВИД ДАРСЛАРИ 7-ДАРС / ТАНВИНЛИ ҲАРФЛАР 1-ҚИСМ #TAJWEED #TAJVID | Lesson 7 / Letters with tanwin, part 1 | `j52uaiDWcBY` | 10:57 | Tanwin |
| 8 | ТАЖВИД ДАРСЛАРИ 8-ДАРС / ТАНВИНЛИ ҲАРФЛАР 2-ҚИСМ #TAJWEED #TAJVID | Lesson 8 / Letters with tanwin, part 2 | `NyznkPtRTjk` | 5:18 | Tanwin, cont. |
| 9 | ТАЖВИД ДАРСЛАРИ 9-ДАРС / ТАНВИНЛИ ҲАРФЛАР 3-ҚИСМ УН ТАНВИНИ #TAJWEED #TAJVID | Lesson 9 / Letters with tanwin, part 3 — the '-un' tanwin | `F6Zjeo3F8tY` | 8:36 | Tanwin (dammatayn) |
| 10 | ТАЖВИД ДАРСЛАРИ 10-ДАРС / ТАНВИНЛИ ТАШДИД #TAJWEED #TAJVID | Lesson 10 / Shadda with tanwin | `42BjGwPYmYI` | 9:03 | Shadda + tanwin combined |
| 11 | ТАЖВИД ДАРСЛАРИ 11-ДАРС / АРАБ РАҚАМЛАРИ / arab raqamlari #TAJWEED #TAJVID | Lesson 11 / Arabic numerals | `LXG9e-kSO0s` | 3:36 | Arabic-Indic numerals (ayah numbers) |
| 12 | ТАЖВИД ДАРСЛАРИ 12-ДАРС / АЛИФ ВА ҲАМЗА 9 ТА ҲОЛАТИ #TAJWEED #TAJVID | Lesson 12 / Alif and Hamza — their 9 states | `NWcM83CfdH8` | 17:15 | Hamza/alif orthography |
| 13 | ТАЖВИД ДАРСЛАРИ 13-ДАРС / ТАИ МАРБУТА / ТАМАРБУТА / ta marbutah #TAJWEED | Lesson 13 / Ta Marbuta | `OGTYBm1peOI` | 6:15 | Ta marbuta |
| 14 | ТАЖВИД ДАРСЛАРИ 14-ДАРС ЧЎЗИБ ЎҚИШ БEЛГИЛАРИ 1-QISM #TAJWEED #TAJVID #ТАЖВИД | Lesson 14 / Elongation marks, part 1 | `WIcfficCdMk` | 9:11 | Madd symbols in the mushaf |
| 15 | ТАЖВИД ДАРСЛАРИ 15-ДАРС ЧЎЗИБ ЎҚИШ БEЛГИЛАРИ 2-QISM #TAJWEED #TAJVID #ТАЖВИД | Lesson 15 / Elongation marks, part 2 | `znGlTbfqA9Q` | 8:38 | Madd symbols, cont. |
| 16 | ТАЖВИД ДАРСЛАРИ 16-ДАРС АЛИФ ВА ЙА ҲАРИФЛАРИ ЧУЗИК АЛИФДЕК КЕЛИШИ #TAJWEED #TAJVID #ТАЖВИД | Lesson 16 / Alif and Ya letters occurring like a long alif | `V-KdtB8Pno8` | 11:46 | Alif maqsura / dagger alif |
| 17 | ТАЖВИД ДАРСЛАРИ 17-ДАРС ЁЗИЛСАДА ЎҚИЛМАЙДИГАН ҲАРФЛАР #TAJWEED #TAJVID #ТАЖВИД | Lesson 17 / Letters that are written but not pronounced | `iGn-_2x31mI` | 12:32 | Silent letters (rasm vs. pronunciation) |
| 18 | ТАЖВИД ДАРСЛАРИ 18-ДАРС АЛИФ ЛАМ 1-ҚОИДАСИ СЎЗ БОШИДА КEЛИШИ #TAJWEED #TAJVID #ТАЖВИД | Lesson 18 / Alif-Lam rule 1 — occurring at the start of a word | `t0f87xkY4zo` | 10:56 | Definite article al- (qamari/shamsi intro) |
| 19 | ТАЖВИД ДАРСЛАРИ 19-ДАРС АЛИФ ЛАМ 2-ҚОИДАСИ СЎЗ БОШИДА ТАШДИД БИЛАН КEЛСА #TAJWEED #TAJVID #ТАЖВИД | Lesson 19 / Alif-Lam rule 2 — when it comes with shadda at the start of a word | `0hwTTWn9YAA` | 12:20 | Lam shamsiyya (assimilating al-) |
| 20 | ТАЖВИД ДАРСЛАРИ 20-ДАРС АЛИФ ЛАМ 3-ҚОИДАСИ ВАСЛИЙ ҲАМЗА СЎЗ ЎРТАСИДА КEЛИШИ #TAJWEED #TAJVID #ТАЖВИД | Lesson 20 / Alif-Lam rule 3 — hamzat al-wasl occurring mid-word/mid-phrase | `KYgPpdj1vrE` | 12:19 | Hamzat al-wasl in continuation |
| 21 | ТАЖВИД ДАРСЛАРИ 21-ДАРС АЛИФ ЛАМ 4-ҚОИДАСИ АЛИФ ЛАМ СЎЗ ЎРТАСИДА КEЛСА  #TAJWEED #TAJVID #ТАЖВИД | Lesson 21 / Alif-Lam rule 4 — when Alif-Lam comes mid-phrase | `puke_Vsn1Aw` | 17:40 | al- in connected speech |
| 22 | ТАЖВИД ДАРСЛАРИ 22-ДАРС ВАСЛИЙ ҲАМЗА СЎЗ БОШИДА КEЛИШИ 1-ҚИСМ У ДEБ ЎҚИЛИШИ #TAJWEED #TAJVID #ТАЖВИД | Lesson 22 / Hamzat al-wasl at the start of a word, part 1 — read as 'u' | `O-NMjdqef4s` | 11:05 | Hamzat al-wasl vowelling (u) |
| 23 | ТАЖВИД ДАРСЛАРИ 23-ДАРС ВАСЛИЙ ҲАМЗА СЎЗ БОШИДА КEЛИШИ 2-ҚИСМ И ДEБ ЎҚИЛИШИ #TAJWEED #TAJVID #ТАЖВИД | Lesson 23 / Hamzat al-wasl at the start of a word, part 2 — read as 'i' | `ch5ZpUIBuAA` | 14:50 | Hamzat al-wasl vowelling (i) |
| 24 | ТАЖВИД ДАРСЛАРИ 24-ДАРС ВАСЛИЙ ҲАМЗА СЎЗ БОШИДА КEЛИШИ 3-ҚИСМ ТАШДИД БИЛАН #TAJWEED #TAJVID #ТАЖВИД | Lesson 24 / Hamzat al-wasl at the start of a word, part 3 — with shadda | `6Cyd-Mxn7hI` | 4:14 | Hamzat al-wasl + shadda |
| 25 | ТАЖВИД ДАРСЛАРИ 25-ДАРС ВАҚФ (ТЎХТАШ) 1-ҚОИДА #TAJWEED #TAJVID #ТАЖВИД | Lesson 25 / Waqf (stopping), rule 1 | `sn7R990kKVY` | 9:43 | Waqf rules |
| 26 | ТАЖВИД ДАРСЛАРИ 26-ДАРС ВАҚФ (ТЎХТАШ) 2-ҚОИДА #TAJWEED #TAJVID #ТАЖВИД | Lesson 26 / Waqf (stopping), rule 2 | `M2i8PwFrBio` | 5:56 | Waqf rules |
| 27 | ТАЖВИД ДАРСЛАРИ 27-ДАРС ВАҚФ (ТЎХТАШ) 2-ҚОИДА ТАМАРБУТА БИЛАН ТОХТАШ #TAJWEED #TAJVID #ТАЖВИД | Lesson 27 / Waqf (stopping), rule 2 — stopping on ta marbuta | `lQQBcxL5QrU` | 8:45 | Waqf on ta marbuta (-> ha sakin) |
| 28 | ТАЖВИД ДАРСЛАРИ 28-ДАРС ВАҚФ (ТЎХТАШ) 4-ҚОИДА #TAJWEED #TAJVID #ТАЖВИД | Lesson 28 / Waqf (stopping), rule 4 | `qVQ2OaTwpcY` | 5:48 | Waqf rules |
| 29 | ТАЖВИД ДАРСЛАРИ 29-ДАРС ВАҚФ (ТЎХТАШ) 5-ҚОИДА КИЧКИНА ВАВ ВА КИЧКИНА ЙА араб тилини урганамиз | Lesson 29 / Waqf (stopping), rule 5 — small waw and small ya | `x5PCe-hZryM` | 12:48 | Waqf with superscript waw/ya |
| 30 | ТАЖВИД ДАРСЛАРИ 30-ДАРС ЧЎЗИҚНИНГ ЧЎЗИЛМАСТЛИГИ 1-ҚИСМ араб тилини урганамиз | Lesson 30 / When an elongation is not elongated, part 1 | `2fnNTaiOWwc` | 12:26 | Cases where madd letters are not lengthened |
| 31 | ТАЖВИД ДАРСЛАРИ 31-ДАРС ЧЎЗИҚНИНГ ЧЎЗИЛМАСТЛИГИ 2-ҚИСМ араб тилини урганамиз learn quran | Lesson 31 / When an elongation is not elongated, part 2 | `rhEaMJsXync` | 11:35 | Same, cont. |
| 32 | ТАЖВИД ДАРСЛАРИ 32-ДАРС УЛАБ ЎҚИШ 1-ҚИСМ араб тилини урганамиз learn quran | Lesson 32 / Reading by joining (wasl), part 1 | `q1-fE0jUjLc` | 8:40 | Wasl / connecting words |
| 33 | ТАЖВИД ДАРСЛАРИ 33-ДАРС УЛАБ ЎҚИШ 2-ҚИСМ / ТАНВИН БИЛАН КЕЛИШИ /араб тилини урганамиз learn quran | Lesson 33 / Reading by joining, part 2 — occurring with tanwin | `vsirACsLNPk` | 9:36 | Wasl with tanwin |
| 34 | ТАЖВИД ДАРСЛАРИ 34-ДАРС ҒУННАСИЗ ИДҒОМ / СУКУНЛИ НУН ВА ТАНВИН /араб тилини урганамиз леарн қурана | Lesson 34 / Idgham without ghunnah — nun sakin and tanwin | `MLFEbaFVhvM` | 9:20 | Idgham bila ghunnah |
| 35 | ТАЖВИД ДАРСЛАРИ 35-ДАРС ҒУННАСИЗ ИДҒОМ / СУКУНЛИ НУН ВА ТАНВИН /араб тилини урганамиз леарн қурана | Lesson 35 / Idgham without ghunnah — nun sakin and tanwin | `Sp0TRX8RmC0` | 10:34 | Idgham bila ghunnah, cont. |
| 36 | ТАЖВИД ДАРСЛАРИ 36-ДАРС ҒУННАСИЗ ИДҒОМ ТАНВИН БИЛАН КУЛЛАНИЛИШИ араб тилини урганамиз леарн қурана | Lesson 36 / Idgham without ghunnah, its application with tanwin | `BremYrwgYJQ` | 11:52 | Idgham bila ghunnah + tanwin |
| 37 | ТАЖВИД ДАРСЛАРИ 37-ДАРС ҒУННАЛИ ИДҒОМ 1-КИСМ араб тилини урганамиз леарн қурана | Lesson 37 / Idgham with ghunnah, part 1 | `LgcM3PU4lx0` | 15:36 | Idgham bi-ghunnah |
| 38 | ТАЖВИД ДАРСЛАРИ 38-ДАРС ҒУННАЛИ ИДҒОМ 2-КИСМ араб тилини урганамиз леарн қурана | Lesson 38 / Idgham with ghunnah, part 2 | `Y4rg2PzjBSI` | 22:48 | Idgham bi-ghunnah, cont. |
| 39 | ТАЖВИД ДАРСЛАРИ 39-ДАРС ИҚЛОБ 1-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 39 / Iqlab, part 1 | `Dfgrb3yNrWI` | 13:21 | Iqlab |
| 40 | ТАЖВИД ДАРСЛАРИ 40-ДАРС ИҚЛОБ 2-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 40 / Iqlab, part 2 | `lHiZo-dvz1s` | 10:50 | Iqlab, cont. |
| 41 | ТАЖВИД ДАРСЛАРИ 41-ДАРС ИЗҲОР 1-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 41 / Izhar, part 1 | `MJcCVtkjwrY` | 14:21 | Izhar halqi |
| 42 | ТАЖВИД ДАРСЛАРИ 42-ДАРС ИЗҲОР 2-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 42 / Izhar, part 2 | `SO4tFFTjfVg` | 11:32 | Izhar halqi, cont. |
| 43 | ТАЖВИД ДАРСЛАРИ 43-ДАРС ИХФО 1-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 43 / Ikhfa, part 1 | `8vWDHlK-90A` | 20:36 | Ikhfa haqiqi |
| 44 | ТАЖВИД ДАРСЛАРИ 44-ДАРС ИХФО 2-ҚИСМ араб тилини урганамиз араб тили грамматикаси араб тили дарслиги | Lesson 44 / Ikhfa, part 2 | `fkigAEdo7P8` | 9:12 | Ikhfa haqiqi, cont. |
| 45 | ТАЖВИД ДАРСЛАРИ 45-ДАРС НУН ҚОИДАЛАРИ араб тилини урганамиз араб тили грамматикаси араб тили дарслиг | Lesson 45 / The rules of Nun | `ImRWh4mW-4I` | 7:22 | Summary: nun sakin & tanwin (4 rules) |
| 46 | ТАЖВИД ДАРСЛАРИ 46-ДАРС МИМ ҚОИДАЛАРИ / ИДҒОМ ШАФАВИЙЯ 1-ҚИСМ араб тилини урганамиз араб тили | Lesson 46 / The rules of Meem — Idgham Shafawiyya, part 1 | `pSjAa_5vGYg` | 8:13 | Meem sakin: idgham shafawi |
| 47 | ТАЖВИД ДАРСЛАРИ 47-ДАРС МИМ ҚОИДАЛАРИ / ИХФО ШАФАВИЙЯ 2-ҚИСМ араб тилини урганамиз араб тили | Lesson 47 / The rules of Meem — Ikhfa Shafawiyya, part 2 | `is63Px2Nxg0` | 7:43 | Meem sakin: ikhfa shafawi |
| 48 | ТАЖВИД ДАРСЛАРИ 48-ДАРС МИМ ҚОИДАЛАРИ / ИЗХОР ШАФАВИЙЯ 3-ҚИСМ араб тилини урганамиз араб тили | Lesson 48 / The rules of Meem — Izhar Shafawiyya, part 3 | `w3cc0-XFYpI` | 15:14 | Meem sakin: izhar shafawi |
| 49 | ТАЖВИД ДАРСЛАРИ 49-ДАРС МАД 1-ҚИСМ \|\| МАД ТАБИИЙ \|\| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 49 / Madd part 1 — Madd Tabi'i | `2tL8zs6KsXg` | 13:53 | Madd taxonomy: natural |
| 50 | ТАЖВИД ДАРСЛАРИ 50-ДАРС МАД 2-ҚИСМ \|\| МАД МУТТАСИЛ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 50 / Madd part 2 — Madd Muttasil | `6q5sj-eVFgA` | 21:17 | Madd muttasil |
| 51 | ТАЖВИД ДАРСЛАРИ 51-ДАРС МАД 3-ҚИСМ \|\| МАД МУНФАСИЛ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 51 / Madd part 3 — Madd Munfasil | `FfvkVuAX-_g` | 38:50 | Madd munfasil |
| 52 | ТАЖВИД ДАРСЛАРИ 52-ДАРС МАД 4-ҚИСМ \|\| МАД ЛОЗИМ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 52 / Madd part 4 — Madd Lazim | `SUmkaesajFY` | 20:09 | Madd lazim |
| 53 | ТАЖВИД ДАРСЛАРИ 53-ДАРС МАД 5-ҚИСМ \|\| МАД ОРИЗ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 53 / Madd part 5 — Madd 'Arid | `yrTLgULqb2k` | 18:43 | Madd 'arid lis-sukun |
| 54 | ТАЖВИД ДАРСЛАРИ 54-ДАРС МАД 6-ҚИСМ \|\| ЛИН ХАРФИ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 54 / Madd part 6 — the Lin letter | `ClqSSfSgyxc` | 6:39 | Huruf al-lin |
| 55 | ТАЖВИД ДАРСЛАРИ 55-ДАРС МАД 7-ҚИСМ \| МАД ЛИН ОРИЗ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 55 / Madd part 7 — Madd Lin 'Arid | `oyfpu0CUYo0` | 14:35 | Madd lin 'arid |
| 56 | ТАЖВИД ДАРСЛАРИ 56-ДАРС МАД 8-ҚИСМ \| МАД ЛИН ЛОЗИМ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 56 / Madd part 8 — Madd Lin Lazim | `TuayPhvRHU4` | 18:56 | Madd lin lazim |
| 57 | ТАЖВИД ДАРСЛАРИ 57-ДАРС АЛЛОҲ ЛАФЗИ 1-ҚИСМ \| араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 57 / The word 'Allah' (lafz al-jalalah), part 1 | `EY-tLJLodqg` | 15:24 | Tafkhim/tarqiq of lam in Allah |
| 58 | ТАЖВИД ДАРСЛАРИ 58-ДАРС АЛЛОҲ ЛАФЗИ 2-ҚИСМ \| ЛАА ЕКИ араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 58 / The word 'Allah', part 2 — 'laa' or ... | `RF73VqzoH6g` | 17:24 | Lafz al-jalalah, cont. |
| 59 | ТАЖВИД ДАРСЛАРИ 59-ДАРС АЛЛОҲ ЛАФЗИ 3-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 59 / The word 'Allah', part 3 | `UF0QMwGkCxU` | 9:23 | Lafz al-jalalah, cont. |
| 60 | ТАЖВИД ДАРСЛАРИ 60-ДАРС АЛЛОҲ ЛАФЗИ 4-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 60 / The word 'Allah', part 4 | `3GbvCIAFRW4` | 21:09 | Lafz al-jalalah, cont. |
| 61 | ТАЖВИД ДАРСЛАРИ 61-ДАРС ИДҒОМЛАР 1-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 61 / Idghams, part 1 | `XabLjlEvErM` | 15:33 | Idgham mutamathilayn/mutajanisayn/mutaqaribayn |
| 62 | ТАЖВИД ДАРСЛАРИ 62-ДАРС ИДҒОМЛАР 2-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 62 / Idghams, part 2 | `eA7V4Bq7my4` | 9:32 | Same, cont. |
| 63 | ТАЖВИД ДАРСЛАРИ 63-ДАРС ТЎХТАШ БEЛГИЛАРИ 1-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 63 / Stopping marks, part 1 | `3wkCBv_CFnw` | 14:04 | Waqf symbols in the mushaf |
| 64 | ТАЖВИД ДАРСЛАРИ 64-ДАРС ТЎХТАШ БEЛГИЛАРИ 2-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 64 / Stopping marks, part 2 | `o4fF2XhAMY8` | 10:31 | Waqf symbols, cont. |
| 65 | ТАЖВИД ДАРСЛАРИ 65-ДАРС ҲУРУФИ МУҚАТТАОТ 1-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 65 / Huruf Muqatta'at, part 1 | `rDyOrf45x8E` | 17:07 | Disjointed letters |
| 66 | ТАЖВИД ДАРСЛАРИ 66-ДАРС ҲУРУФИ МУҚАТТАОТ 2-ҚИСМ \|  араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 66 / Huruf Muqatta'at, part 2 | `8-cUYg5EZEQ` | 23:41 | Disjointed letters, cont. |
| 67 | ТАЖВИД ДАРСЛАРИ 67-ДАРС ИСТЕЪЛО ВА ИСТЕФОЛА ХАРФЛАРИ араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 67 / Isti'la and Istifala letters | `g1dHz9LrxFY` | 8:02 | Heavy vs. light letters |
| 68 | ТАЖВИД ДАРСЛАРИ 68-ДАРС Ро ҳарфининг юмшоқ ўқилиши араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 68 / The soft (light) pronunciation of the letter Ra | `-61Zav3OEIw` | 12:08 | Tarqiq of ra |
| 69 | ТАЖВИД ДАРСЛАРИ 69-ДАРС Ро ҳарфининг қаттиқ ўқилиши араб тилини урганамиз араб тили #TAJVID #ТАЖВИД | Lesson 69 / The hard (heavy) pronunciation of the letter Ra | `5XpfDhX2Xg8` | 11:40 | Tafkhim of ra |
| 70 | ТАЖВИД ДАРСЛАРИ 70-ДАРС КАЛИМАЛАР ТОЙЙИБА КАЛИМАСИ KALIMALAR TOYYIBA KALIMASI араб тилини урганамиз | Lesson 70 / The Kalimas — Kalima Tayyiba | `6mcgI9yBCjc` | 14:46 | Kalima 1 (applied recitation) |
| 71 | ТАЖВИД ДАРСЛАРИ 71-ДАРС калималар шаходат калимаси мп3 шаҳодат калимаси shahodat kalimasi mp3 скачат | Lesson 71 / The Kalimas — Kalima Shahada | `41r6vVfPAMQ` | 16:25 | Kalima 2 |
| 72 | ТАЖВИД ДАРСЛАРИ 72-ДАРС калималар тавҳид калимаси мп3 тавхид калимаси tavhid kalimasi mp3 скачат 6 d | Lesson 72 / The Kalimas — Kalima Tawhid | `_QO6lOPkmyg` | 24:26 | Kalima 3 |
| 73 | ТАЖВИД ДАРСЛАРИ 73-ДАРС калималар радди куфр калимаси мп3 скачат raddi kufr kalimasi mp3 скачат 6 d | Lesson 73 / The Kalimas — Kalima Radd al-Kufr | `hYxxk6NI7l4` | 17:00 | Kalima 4 |
| 74 | ТАЖВИД ДАРСЛАРИ 74-ДАРС калималар истиғфор калимаси калимаси мп3 скачат istig'for kalimasi mp3 скача | Lesson 74 / The Kalimas — Kalima Istighfar | `3yRu2_0389c` | 16:00 | Kalima 5 |
| 75 | ТАЖВИД ДАРСЛАРИ 75-ДАРС калималар тамжид калимаси калимаси мп3 скачат tamjid kalimasi mp3 скача | Lesson 75 / The Kalimas — Kalima Tamjid | `xyTQ4jcWZ1k` | 27:21 | Kalima 6 |
| 76 | ТАЖВИД ДАРСЛАРИ 76-ДАРС калималар мужмал имон мп3 скачат mujmal imon mp3 скача | Lesson 76 / The Kalimas — Iman Mujmal | `J5hojekC0jk` | 10:04 | Iman mujmal |
| 77 | ТАЖВИД ДАРСЛАРИ 77-ДАРС калималар муфассал имон мп3 скачат mufassal imon mp3 скачат 6 diniy kalima 7 | Lesson 77 / The Kalimas — Iman Mufassal | `0B61MHWC-as` | 11:08 | Iman mufassal |
| 78 | ТАЖВИД ДАРСЛАРИ 78-ДАРС \| Қуръондаги ёзувдаги фарқлар \| Qur’ondagi yozuvdagi farqlar | Lesson 78 / Differences in the script in the Qur'an | `qFmHM-2RX_o` | 9:22 | Rasm/orthographic variants |
| 79 | қурон ўқишни ўрганиш 1-дарс \| Аъузуни ўрганамиз Quron o'qishni o'rganish 1-dars \| A'uzuni o'rganamiz | Learning to read the Qur'an, Lesson 1 \| We learn the Ta'awwudh | `R3PpaKSp09g` | 18:00 | Applied reading: isti'adha |
| 80 | қурон ўқишни ўрганиш 2-дарс \| Бисмиллаҳни ўрганамиз Quron o'qishni o'rganish 2-dars \| Bismillahni | Learning to read the Qur'an, Lesson 2 \| We learn the Basmala | `_wDzCWhTFpA` | 21:38 | Applied reading: basmala |
| 81 | қурон ўқишни ўрганиш 3-дарс фотиҳа сураси матни 1-кисм Quron o'qishni o'rganish 3-dars fotiha surasi | Learning to read the Qur'an, Lesson 3 \| Text of Surah al-Fatiha, part 1 | `cmAe5ftLz0M` | 17:01 | Applied reading: al-Fatiha |
| 82 | Learning to read the Quran for beginners LESSON 4 : fatiha surah tajweed | Learning to read the Quran for beginners, Lesson 4: Surah al-Fatiha tajweed | `K6d8X2pFUWA` | 31:24 | Applied tajweed: al-Fatiha |
| 83 | Learning to read the Quran for beginners LESSON 5 : Surah An Nas | Learning to read the Quran for beginners, Lesson 5: Surah an-Nas | `XnRQOsGiLdA` | 23:32 | Surah 114 |
| 84 | Learning to read the Quran for beginners LESSON 6 : Surah Al Falaq | Learning to read the Quran for beginners, Lesson 6: Surah al-Falaq | `26GEIjYvDOQ` | 20:30 | Surah 113 |
| 85 | Learning to read the Quran for beginners LESSON 7 : Surah Al-Ikhlas | Learning to read the Quran for beginners, Lesson 7: Surah al-Ikhlas | `1asgeTvzvwo` | 14:58 | Surah 112 |
| 86 | ТАЖВИД ДАРСЛАРИ 79-ДАРС \| Ташдидли вақф 6-вақф \| Tashdidli vaqf 6-vaqf | Lesson 79 / Waqf on a shadda — the 6th waqf | `9bzX36upo3Q` | 14:06 | Waqf on a doubled letter |
| 87 | Learning to read the Quran for beginners LESSON 8 : Surat Al-Masad (The Palm Fiber, Flame) | Learning to read the Quran for beginners, Lesson 8: Surah al-Masad | `hz-Oo685yzE` | 20:54 | Surah 111 |
| 88 | ТАЖВИД ДАРСЛАРИ 80-ДАРС \|САКТА НИМА ҲАҚИДА - SAKTA NIMA HAQIDA MUALLIMI SONIY SHAYX ALIJON QORI 2022 | Lesson 80 / What Sakta is about | `t3-GTmZnNXA` | 18:45 | Sakta (brief pause without breath) |
| 89 | қурон ўқишни ўрганиш 9-дарс \| НАСР сурасини ўрганамиз 9-dars NASR surasi o'qilishi 110-SURA ALIJON | Learning to read the Qur'an, Lesson 9 \| We learn Surah an-Nasr | `TYd3qkN_Ee8` | 19:55 | Surah 110 |
| 90 | қурон ўқишни ўрганиш 10-дарс \| КАФИРУН сурасини ўрганамиз Quron o'qishni o'rganish 10-dars \| KAFIRUN | Learning to read the Qur'an, Lesson 10 \| We learn Surah al-Kafirun | `8Qdq1EOHtII` | 19:22 | Surah 109 |
| 91 | ТАЖВИД ДАРСЛАРИ 81-ДАРС \| ИМОЛА - ҚУРЪОНДАГИ "Э" ҲАРФИ MUALLIMI SONIY SHAYX ALIJON QORI 2022 IMOLA E | Lesson 81 / Imalah — the 'e' sound in the Qur'an | `EybdxJhmso0` | 13:42 | Imalah (Hud 11:41) |
| 92 | ТАЖВИД ДАРСЛАРИ 82-ДАРС ИШМОМ НИМА ISHMOM NIMA ЮСУФ СУРАСИ 11 ОЯТ  YUSUF SURASI 11 OYAT MUALLIMI SON | Lesson 82 / What Ishmam is — Surah Yusuf, verse 11 | `yQzLdD0XySU` | 8:26 | Ishmam |
| 93 | қурон ўқишни ўрганиш 11-дарс \| КАВСАР сурасини ўрганамиз Quron o'qishni o'rganish 11-dars \| KAVSAR | Learning to read the Qur'an, Lesson 11 \| We learn Surah al-Kawthar | `7XjAgvr8m4A` | 17:30 | Surah 108 |
| 94 | қурон ўқишни ўрганиш 12-дарс \| МАЪУН сурасини ўрганамиз Quron o'qishni o'rganish 12-dars MAUN SURASI | Learning to read the Qur'an, Lesson 12 \| We learn Surah al-Ma'un | `-OezgBOPbIA` | 21:18 | Surah 107 |
| 95 | қурон ўқишни ўрганиш 13-дарс \| КУРОЙШ сурасини ўрганамиз Quron o'qishni o'rganish 13-dars MAUN SURAS | Learning to read the Qur'an, Lesson 13 \| We learn Surah Quraysh | `lZZNMlNJc0U` | 17:40 | Surah 106 |
| 96 | қурон ўқишни ўрганиш 14-дарс \| ФИЛ сурасини ўрганамиз Quron o'qishni o'rganish 14-dars FIL SURASI | Learning to read the Qur'an, Lesson 14 \| We learn Surah al-Fil | `QvLIBuSpicc` | 27:06 | Surah 105 |

Every video: `https://www.youtube.com/watch?v=<Video ID>`

---

# Implied rule ordering

Grouping the 82 tajweed lessons into blocks:

| Block | Lessons | Topic | Videos |
|---|---|---|---|
| A | 1 | Harakat (fatha/kasra/damma) + alif | 1 |
| B | 2–4 | Madd tabi'i / elongation | 3 |
| C | 5–6 | Shadda | 2 |
| D | 7–10 | Tanwin, incl. tanwin + shadda | 4 |
| E | 11 | Arabic numerals | 1 |
| F | 12–13 | Hamza/alif's 9 states; ta marbuta | 2 |
| G | 14–17 | Madd symbols, dagger alif, silent letters | 4 |
| H | 18–24 | Alif-Lam (4 rules) + hamzat al-wasl (3 parts) | 7 |
| I | 25–29 | **Waqf — first pass** (rules 1, 2, 2, 4, 5) | 5 |
| J | 30–33 | Non-elongation cases; wasl (joining) | 4 |
| K | **34–45** | **Nun sakin & tanwin: idgham → iqlab → izhar → ikhfa → summary** | 12 |
| L | 46–48 | Meem sakin (idgham / ikhfa / izhar shafawi) | 3 |
| M | **49–56** | **Madd — full taxonomy** (tabi'i, muttasil, munfasil, lazim, 'arid, lin ×3) | 8 |
| N | 57–60 | Lafz al-jalalah (tafkhim/tarqiq of the lam in "Allah") | 4 |
| O | 61–62 | The other idghams (mutamathilayn etc.) | 2 |
| P | 63–64 | Waqf symbols in the mushaf — **second pass** | 2 |
| Q | 65–66 | Huruf muqatta'at | 2 |
| R | 67–69 | Isti'la / istifala; tafkhim & tarqiq of ra | 3 |
| S | 70–77 | The six Kalimas + Iman Mujmal / Mufassal | 8 |
| T | 78–79 | Rasm variants; waqf on shadda | 2 |
| U | 80–82 | Sakta, Imalah, Ishmam | 3 |

## Six structural divergences from a standard syllabus

A conventional syllabus (Noorani Qa'ida → a matn such as [[Tuhfat-al-Atfal]],
and essentially every English-language course) runs roughly: makharij → sifat →
nun sakin/tanwin → meem sakin → lam rules → madd → ra'/lam tafkhim → waqf. This
course diverges in **six** substantive ways.

1. **Madd is taught twice, and the first time comes before everything.** Madd
   tabi'i is lessons **2–4** — before shadda, before tanwin, before any nun
   rule. The systematic 8-part madd taxonomy then returns much later at
   **49–56**. Standard syllabi teach madd *once*, late, after the nun/meem
   rules. This spiral (early practical → late theoretical) is the single biggest
   structural difference.
2. **Nun sakin rules come very late — lesson 34 of 82, about 40% in.** In an
   English course, nun sakin/tanwin is typically the *first* real tajweed topic.
   Here it is preceded by 33 lessons of orthography and reading mechanics.
3. **Nun rules are ordered idgham → iqlab → izhar → ikhfa.** The near-universal
   order is **izhar → idgham → iqlab → ikhfa** — the order of
   [[Tuhfat-al-Atfal]] and of [[Arabic101]]'s 30-day programme. Starting with
   idgham and putting izhar third is genuinely unusual and looks deliberate.
4. **Makharij and sifat are effectively absent as a named block.** There is no
   points-of-articulation series. The only sifat content is lesson 67
   (isti'la/istifala) and 68–69 (ra'), arriving at the *end*. Articulation is
   handled in the channel's **separate** alphabet series (`Arab tilida yozish va
   o'qish`, 35 lessons) — i.e. makharij is treated as a **literacy** topic, not
   a **tajweed** topic. For an Uzbek learner who cannot read Arabic script at
   all, that split is rational. It is the exact opposite of
   [[Muqaddimah-Jazariyyah]], which opens with makharij.
5. **Waqf is taught in two passes and comes early.** Rules at 25–29, mushaf
   symbols at 63–64, plus a stray 6th waqf at lesson 79. Most English syllabi
   treat waqf as a single closing chapter.
6. **Lessons 70–77 (the six Kalimas + Iman Mujmal/Mufassal) are not tajweed at
   all** — they are Hanafi/Maturidi catechism texts. Their presence inside a
   tajweed playlist is a distinctly Central- and South-Asian Hanafi convention:
   the Kalimas are the standard memorisation set in that tradition and double as
   tajweed application drills. No Arabic-language or typical English tajweed
   course includes them.

## Regional pedagogical conventions observed

- **Cyrillic-first.** The default script is Uzbek Cyrillic, not Latin — this
  targets the over-30 generation schooled before the 1993 Latin switch. Any
  course modelled on this must not assume Latin transliteration.
- **Arabic terms are naturalised into Uzbek phonology, not transliterated
  scientifically.** `ИХФО` (*ixfo*, not ikhfa), `ИЗҲОР` (*izhor*), `ИҚЛОБ`
  (*iqlob*), `МАД ЛОЗИМ` (*lozim*), `МАД ОРИЗ` (*oriz*). Arabic *ā* consistently
  surfaces as Uzbek **o** — the same shift that gives "Qur'on", "namoz",
  "Alloh".
- **`ДОММА` and `ЗАММА` are both given for damma** in lesson 1 — the local
  pronunciation alongside the standard one, a tell that the audience knows the
  sign by a regionally drifted name.
- **Rules are named by number where no local name exists** — "Alif-Lam rule
  1/2/3/4", "Waqf rule 1/2/4/5". The teacher invents a local numbering rather
  than importing *lam shamsiyya* / *lam qamariyya*. A student of this course
  would recognise "the 2nd alif-lam rule" but possibly not "lam shamsiyya".
- **Ghunnah is expressed as an Uzbek adjective pair** — `ҒУННАЛИ` (with) /
  `ҒУННАСИЗ` (without), using the Uzbek `-li`/`-siz` suffixes rather than the
  Arabic construction *idgham bi-ghunnah* / *bila ghunnah*.
- **Elongation has a plain-Uzbek name used alongside the Arabic one** —
  `ЧЎЗИБ ЎҚИШ` ("reading by stretching") appears next to `МАД ТАБИИЙ` in lessons
  2–4, then is dropped once the Arabic term is established. **Concept first in
  the mother tongue, Arabic label attached after.** This is a technique worth
  copying directly.

**One numbering oddity, reported as found:** the waqf lessons are labelled
1-qoida, 2-qoida, **2-qoida** (ta marbuta), 4-qoida, 5-qoida. There is no lesson
titled "3-qoida"; lesson 27 repeats "2-qoida". This is most likely the author's
own labelling slip (27 is probably rule 3), but the videos were not watched, so
the labels are reported verbatim rather than silently renumbered.

---

# Uzbek → Arabic → English glossary

Every Uzbek term below was **extracted from the retrieved titles**. The Arabic
and English columns are mapping, not quotation.

## Rule names

| Uzbek (as written) | Latin | Arabic | English |
|---|---|---|---|
| ТАЖВИД | tajvid | تجويد | Tajweed |
| ФАТҲА | fatha | فتحة | Fatha |
| КАСРА | kasra | كسرة | Kasra |
| ДОММА / ЗАММА | domma / zamma | ضمة | Damma |
| ТАШДИД | tashdid | شدّة | Shadda |
| ТАНВИН | tanvin | تنوين | Tanwin |
| СУКУНЛИ НУН | sukunli nun | نون ساكنة | Nun sakin |
| МАД ТАБИИЙ | mad tabiiy | مدّ طبيعي | Madd Tabi'i (natural) |
| МАД МУТТАСИЛ | mad muttasil | مدّ متّصل | Madd Muttasil |
| МАД МУНФАСИЛ | mad munfasil | مدّ منفصل | Madd Munfasil |
| МАД ЛОЗИМ | mad lozim | مدّ لازم | Madd Lazim |
| МАД ОРИЗ | mad oriz | مدّ عارض | Madd 'Arid |
| ЛИН ХАРФИ | lin harfi | حرف اللين | Lin letter |
| ҒУННАЛИ ИДҒОМ | g'unnali idg'om | إدغام بغنّة | Idgham with ghunnah |
| ҒУННАСИЗ ИДҒОМ | g'unnasiz idg'om | إدغام بلا غنّة | Idgham without ghunnah |
| ИҚЛОБ | iqlob | إقلاب | Iqlab |
| ИЗҲОР | izhor | إظهار | Izhar |
| ИХФО | ixfo | إخفاء | Ikhfa |
| ИДҒОМ ШАФАВИЙЯ | idg'om shafaviyya | إدغام شفوي | Idgham Shafawi |
| ИХФО ШАФАВИЙЯ | ixfo shafaviyya | إخفاء شفوي | Ikhfa Shafawi |
| ИЗХОР ШАФАВИЙЯ | izhor shafaviyya | إظهار شفوي | Izhar Shafawi |
| ВАСЛИЙ ҲАМЗА | vasliy hamza | همزة الوصل | Hamzat al-wasl |
| АЛИФ ЛАМ | alif lam | ال (التعريف) | The definite article al- |
| ТАИ МАРБУТА | tai marbuta | تاء مربوطة | Ta marbuta |
| ВАҚФ (ТЎХТАШ) | vaqf (to'xtash) | وقف | Waqf (stopping) |
| САКТА | sakta | سكتة | Sakta |
| ИМОЛА | imola | إمالة | Imalah |
| ИШМОМ | ishmom | إشمام | Ishmam |
| ҲУРУФИ МУҚАТТАОТ | hurufi muqattaot | حروف مقطّعات | Huruf Muqatta'at |
| ИСТЕЪЛО | iste'lo | استعلاء | Isti'la (elevation → heavy) |
| ИСТЕФОЛА | istefola | استفالة | Istifala (lowering → light) |
| АЛЛОҲ ЛАФЗИ | Alloh lafzi | لفظ الجلالة | Lafz al-Jalalah |
| КАЛИМА | kalima | كلمة | Kalima (creedal formula) |
| АЪУЗУ | a'uzu | أعوذ / استعاذة | Ta'awwudh |
| БИСМИЛЛАҲ | bismillah | بسملة | Basmala |

## Structural and everyday vocabulary

Needed to parse any title on this channel.

| Uzbek | Latin | English |
|---|---|---|
| ДАРС / N-ДАРС | dars | lesson / Lesson N |
| ҚИСМ / N-ҚИСМ | qism | part / part N |
| ҚОИДА | qoida | rule |
| ҲАРФ / ҲАРФЛАР | harf / harflar | letter / letters |
| ЧЎЗИБ ЎҚИШ | cho'zib o'qish | reading with elongation |
| ЧЎЗИҚ | cho'ziq | elongation, long vowel |
| УЛАБ ЎҚИШ | ulab o'qish | joining while reading (wasl) |
| ТЎХТАШ БЕЛГИЛАРИ | to'xtash belgilari | stopping marks |
| СЎЗ БОШИДА | so'z boshida | at the start of a word |
| СЎЗ ЎРТАСИДА | so'z o'rtasida | in the middle of a word/phrase |
| ЁЗИЛСАДА ЎҚИЛМАЙДИГАН | yozilsa-da o'qilmaydigan | written but not pronounced |
| ЮМШОҚ ЎҚИЛИШИ | yumshoq o'qilishi | soft/light pronunciation (tarqiq) |
| ҚАТТИҚ ЎҚИЛИШИ | qattiq o'qilishi | hard/heavy pronunciation (tafkhim) |
| КИЧКИНА ВАВ / КИЧКИНА ЙА | kichkina vav / kichkina ya | small (superscript) waw / ya |
| ҲОЛАТИ | holati | state, case |
| ҚУРЪОНДАГИ | Qur'ondagi | in the Qur'an |
| СУРАСИНИ ЎРГАНАМИЗ | surasini o'rganamiz | "we learn Surah ___" |
| АРАБ РАҚАМЛАРИ | arab raqamlari | Arabic numerals |

**Transliteration policy for this vault:** where Uzbek terms are surfaced to the
learner, use *his* forms (ixfo, izhor, iqlob, mad lozim), **not** scholarly
ALA-LC (ikhfāʾ, iẓhār, iqlāb, madd lāzim). The scholarly forms are unfamiliar
noise to him.

---

# What this means for the course

1. **His mental model of "tajweed" includes the six Kalimas.** Lessons 70–77 are
   in the playlist he learned from. If the syllabus omits them he may perceive a
   gap — worth an explicit decision rather than a silent omission.
2. **He learned the nun rules as idgham-first, izhar-third.** If we teach the
   standard izhar-first order, expect friction. Either match his order or flag
   the difference explicitly when introducing the block.
3. **He met madd early (lessons 2–4) and formally late (49–56).** A single
   mid-course madd chapter will feel *late* against his intuition and *thin*
   against the 8-part treatment he saw.
4. **He may not know the terms `lam shamsiyya` / `lam qamariyya`** — his course
   numbered these as "alif-lam rules 1–4". Introduce the standard names as **new
   vocabulary**, not as review.
5. **Pacing benchmark:** 14.1 min mean, 82 lessons, 22.5 h for rules alone
   (excluding the alphabet series). Our plan is far coarser by design; this is
   the granularity he is calibrated to.

## Retrieval method and confidence

`curl` with a desktop user-agent → extract the `var ytInitialData = {...}` blob →
parse with Python's `json.JSONDecoder().raw_decode()`. Titles, IDs and durations
live in `lockupViewModel`; the older `playlistVideoRenderer` schema is entirely
absent from this page. Playlist order below is the playlist's own render order.
A continuation-token POST to `youtubei/v1/browse` returned 0 additional items,
consistent with all available videos being on page 1.

**Not retrieved:** video descriptions and chapter timestamps (would need 96
individual watch-page fetches — **this is the highest-value follow-up**, since
per-video descriptions would upgrade the Topic column from inferred to
retrieved); captions and transcripts (`ytInitialPlayerResponse` returns
`LOGIN_REQUIRED` for this channel under unauthenticated curl); per-video view
counts and upload dates (not present in the playlist payload — the only date
evidence is `2022` appearing literally in the titles of lessons 80–82).

## Licensing

**Standard YouTube License.** No Creative Commons.

- **Link and embed only.** Never download, re-host, mirror, or bundle a video or
  its audio.
- The metadata in this note — titles, video IDs, durations, playlist and channel
  IDs — is **bibliographic** and safe to keep and display.
- The English translations and topic mappings in the table are original to this
  vault.

See [[Source-Manifest]].
