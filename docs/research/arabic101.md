# Arabic101 YouTube Channel — Research Catalog

Research date: 2026-07-19
Channel: **Arabic 101** — https://www.youtube.com/@Arabic101
Channel ID: `UCEcQu_9GNDiGU_vqjVZXj3Q`
Canonical channel URL: https://www.youtube.com/channel/UCEcQu_9GNDiGU_vqjVZXj3Q
RSS feed: https://www.youtube.com/feeds/videos.xml?channel_id=UCEcQu_9GNDiGU_vqjVZXj3Q

Method: fetched `https://www.youtube.com/@Arabic101/playlists` and individual
`https://www.youtube.com/playlist?list=<ID>` pages with `curl` (desktop
User-Agent), parsed the embedded `ytInitialData` JSON blob with a Python
script, and extracted `lockupViewModel` nodes (YouTube's current — 2026 —
grid-item renderer for both playlists and playlist videos; the older
`gridPlaylistRenderer` / `playlistVideoRenderer` shapes no longer appear in
served HTML). Verified embeddability of a sample video via the public oEmbed
endpoint (`https://www.youtube.com/oembed?url=...&format=json`).

## Channel description (verbatim, from channel metadata)

> Want to learn Arabic/ Quran the right way? Do you want to be able to read
> AND understand the Noble Quran?
>
> Then you've come to the right place. Arabic 101 will take you by the hand
> starting from the alphabet to the intermediate levels. You'll learn how to
> read, write, speak and even properly listen to Arabic.
> Through Tajweed lessons you'll also be able to read the Holy Quran properly,
> in no time.
> All lessons are conducted by a professional teacher specialized in
> linguistics and teaching methodology, so if you are really serious about
> learning Arabic properly, click that red button to subscribe to my channel
> and learn more.

Channel is marked `isFamilySafe: true`, verified (checkmark badge present in
page header), owner URL `http://www.youtube.com/@Arabic101`.

## Licensing status — IMPORTANT for this course's hard constraints

- No Creative Commons / "reuse allowed" license marker was found on the
  sampled video page or in channel metadata (no `licensedForReuse`,
  `creativeCommon`, or `"license"` fields present in the scraped HTML/JSON).
  This means the channel is operating under the **Standard YouTube License**
  (all rights reserved to the creator), which is YouTube's default for
  uploads unless a creator explicitly opts into CC BY.
- **Implication for this course**: per the course's hard constraint ("every
  resource must be free and openly licensed, or merely linked, never
  re-hosted"), Arabic101 content does **not** qualify to be re-hosted,
  re-uploaded, downloaded-and-served, or have its audio clipped/rehosted in
  our app. It **can** be used exactly as the constraint's fallback allows:
  as a **link-out or embed pointing at youtube.com**, never as a locally
  hosted file.
- Embeddability check: the public oEmbed endpoint returned a valid
  `<iframe src="https://www.youtube.com/embed/hy8V7CsxaQk?feature=oembed">`
  response for a sampled video (`hy8V7CsxaQk`), confirming the channel has
  not disabled embedding. Example oEmbed call used:
  `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=hy8V7CsxaQk&format=json`
- **Recommendation**: use Arabic101 videos in the course exclusively as
  "watch on YouTube" links (teacher-facing supplementary material / optional
  homework), or as a standard `<iframe>` YouTube embed (this is explicitly
  permitted by YouTube's embed feature and does not count as re-hosting
  since playback and monetization stay on YouTube's own servers). Do **not**
  download, transcode, splice, or bundle any Arabic101 audio/video into the
  app's asset pipeline. This channel should be treated as **supplementary
  teacher-training / student-enrichment material**, not as the primary
  tap-to-hear qari audio source (that role stays with Husary Muallim per the
  spec).

## All playlists on the channel (22 total)

Fetched from `https://www.youtube.com/@Arabic101/playlists`. Table below
lists every playlist found in the page's `ytInitialData`, in the order
YouTube renders them (which is a curated/pinned order, not strictly
chronological).

| # | Playlist title | Playlist URL |
|---|---|---|
| 1 | The Other 50% | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgq6HSz0cf5m6dPuyAGw8h1s |
| 2 | Quran Recitation Mastery | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgobWotOkJ0HQqNPB3gkga8M |
| 3 | Why Arabic is amazing | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrV9mhZYMPBvsxVvNmJf8IJ |
| 4 | Doubt-proof (Ramadan 2024) | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgqSWsTsWtkiUqZkbf-t0XR4 |
| 5 | Common mistakes | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgohhnt3tvdePEsbjhK8MozZ |
| 6 | Arabic101 Shorts | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrx6nYtIJre7h1avKfUz_HZ |
| 7 | (NOT) Lost in Translation - Balaghah | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrsrY9z5HHGDRcFzdmJ9wCs |
| 8 | Makharij & Sifaat Al-Huruf | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgpmlnN3EpkOec0tJ8OJZ5re |
| 9 | Tajweed Common Mistakes - From Good to Better | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgo_RLmIMYXxV8vWTv3P48ru |
| 10 | Advanced Tajweed Course | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgojGi2tiWQnXa2ELsBP36C1 |
| 11 | The BEST 30-day Tajweed Program (Intermediate) | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgoA27YCmZYMCQCX7EUkfyHp |
| 12 | STAGE III: Understand 85% of Quranic Vocabulary | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgr0FQHVC3yzL6TM9lOXHXc7 |
| 13 | Quranic Grammar | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrIX1jOhl5a67QAb4AQvTIa |
| 14 | Qur'anology | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgp9ADdmdfrEuBgD1e0IqqNB |
| 15 | Read & Understand Quranic Arabic from 50% - 65% (Stage TWO) | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrtqN60yWKuS6xvPDUx6cNZ |
| 16 | Read & Understand Quranic Arabic from 0% - 50% (Stage ONE) | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrYBl5c2LGoc1iwTPyYMMYH |
| 17 | Learn Tajweed Easily (Beginner) | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgqM4Uuu7iAhIeuSdF0v9yxo |
| 18 | Arabic-in-Context | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgoWfG4p-97KYOKwMyYb1gIl |
| 19 | Listen and Read Along | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrdj0VbmTAvVDYB9r2DTbER |
| 20 | How to speak Arabic like an Arab | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgqT350Oke2-5EtWDwm_79T2 |
| 21 | Understanding Arabic Vowels - The Full Story | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgqxKgGdSFB2yKfjk6Sep6tn |
| 22 | How to READ anything in Arabic - Arabic 101 - Arabic Literacy | https://www.youtube.com/playlist?list=PL6TlMIZ5ylgpLYKU_z1YxdAAw7wrTWvcQ |

Playlists **not** expanded into individual videos below (lower relevance to
this course's 3-phase Tajweed/hifz curriculum, but worth a note):
- **The Other 50%**, **Why Arabic is amazing**, **Doubt-proof (Ramadan
  2024)**, **Arabic101 Shorts**, **(NOT) Lost in Translation - Balaghah**,
  **STAGE III vocabulary**, **Quranic Grammar**, **Qur'anology**, **Stage
  TWO (50-65%)**, **Arabic-in-Context**, **Listen and Read Along**, **How to
  speak Arabic like an Arab**, **Understanding Arabic Vowels**, **Quran
  Recitation Mastery** — these are general Arabic-language / vocabulary /
  grammar / conversational-Arabic content, not core Tajweed mechanics. They
  could be mentioned to the student as optional post-course enrichment for
  broader Arabic literacy but are out of scope for the 52-lesson
  Letters→Reading→Tajweed sequence. Not expanded video-by-video here to keep
  this report focused; can be revisited on request.

## Playlist deep-dive: individual videos (the 6 most course-relevant playlists)

### A. "How to READ anything in Arabic - Arabic Literacy" (Phase 1 — Letters & Sounds)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgpLYKU_z1YxdAAw7wrTWvcQ

| Title | URL |
|---|---|
| Learn Arabic Alphabet in LESS THAN 3 MINUTES - Arabic 101 | https://www.youtube.com/watch?v=j9BwXWpzB1Y |
| How to READ ARABIC? - The alphabet - Lesson 1 - Arabic 101 | https://www.youtube.com/watch?v=c-7SVieC_04 |
| How to READ ARABIC? - The alphabet - Lesson 2 - Arabic 101 | https://www.youtube.com/watch?v=1AT7IMLcA58 |
| How to READ ARABIC? - The alphabet - Lesson 3 - Arabic 101 | https://www.youtube.com/watch?v=8pfQg26vfaA |
| How to READ ARABIC? - The alphabet - Lesson 4 - Arabic 101 | https://www.youtube.com/watch?v=LTwCmA6AjdI |
| How many can you guess?? Arabic alphabet - animal-themed | https://www.youtube.com/watch?v=jOtx72twv6Y |
| How good is your Arabic? - A challenge for Arabic learners | https://www.youtube.com/watch?v=xsKb2lS8q7o |
| How to write Arabic letters properly \| Arabic101 | https://www.youtube.com/watch?v=jyc7h5FoD5s |
| Is the Arabic alphabet 28 or 29 letters? \| Arabic101 | https://www.youtube.com/watch?v=JLee5VQvdIo |

### B. "Makharij & Sifaat Al-Huruf" (Phase 1 — articulation points/characteristics; also feeds Phase 3 tajweed depth)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgpmlnN3EpkOec0tJ8OJZ5re

Makharij (articulation-point) sub-series, lessons 1–14:

| Lesson | Title | URL |
|---|---|---|
| 1 | The EASIEST explanation for Makharij & Sifaat - Lesson 1 | https://www.youtube.com/watch?v=-YrfRpwFMe8 |
| 2 | The EASIEST explanation for Makharij ء + هـ Lesson 2 | https://www.youtube.com/watch?v=Bzz_wo6skWA |
| 3 | TWO TRICKS to master ع + ح sounds - Lesson 3 | https://www.youtube.com/watch?v=-oA0HfNUezI |
| 4 | AVOID these FOUR mistakes with غ + خ - Lesson 4 | https://www.youtube.com/watch?v=FzDyCoJCgIg |
| 5 | With THIS method, you'll get ق right EVERY time - Lesson 5 | https://www.youtube.com/watch?v=wwHmytGNi2M |
| 6 | How to pronounce the PROPER Arabic ج - Lesson 6 | https://www.youtube.com/watch?v=X-iZ4yZrltA |
| 7 | With THIS method, ANYONE can master ض - Lesson 7 | https://www.youtube.com/watch?v=gEBzZLbuo-4 |
| 8 | Avoid THIS mistake with ل - Lesson 8 | https://www.youtube.com/watch?v=-dPYDd4zNio |
| 9 | Why the PROPER ن MUST have TWO components? - Lesson 9 | https://www.youtube.com/watch?v=BDgw0fWZwMU |
| 10 | The ULTIMATE Guide to mastering ر - Lesson 10 | https://www.youtube.com/watch?v=ObYKEtceQbU |
| 11 | With this TRICK you can pronounce ط easily - Lesson 11 | https://www.youtube.com/watch?v=XeQ5cxhkzlE |
| 12 | The SIMPLEST way to learn ص like an Arab - Lesson 12 | https://www.youtube.com/watch?v=yhIFJiPqVqA |
| 13 | ANYONE can master ظ when learning it like THIS - Lesson 13 | https://www.youtube.com/watch?v=6_Qfe0g6uks |
| 14 | Easy letters with TRICKY mistakes ف و م ب - Lesson 14 | https://www.youtube.com/watch?v=sM27vvgq_os |

Sifaat (characteristics-of-letters) sub-series, lessons 1–7, plus 2 bonus ض deep-dives:

| Lesson | Title | URL |
|---|---|---|
| 1 | EASIEST 'Hams' Explanation \| Sifaat Al-huruf Lesson 1 | https://www.youtube.com/watch?v=ZwgM-1M_J7o |
| 2 | THAT's why Qalqalah exists \| Sifaat Lesson 2 | https://www.youtube.com/watch?v=LeWwxpm_Lzw |
| 3 | A Characteristic that can CHANGE the meaning if not done properly \| Lesson 3 | https://www.youtube.com/watch?v=QIxzLs1qGik |
| 4 | Why some HEAVY letters should be HEAVIER than others \| Lesson 4 | https://www.youtube.com/watch?v=I1BEoHQzK8E |
| 5 | These traits WILL affect your pronunciation \| Lesson 5 | https://www.youtube.com/watch?v=zy4GVrl3H94 |
| 6 | 90% of 'RA' mistakes, happen HERE \| Lesson 6 | https://www.youtube.com/watch?v=TBBMuGVy4mc |
| 7 | THIS Simple practical Exercise, can transform your Qalqalah - Lesson 7 | https://www.youtube.com/watch?v=ph9AB2CQbVo |
| bonus | Follow these SEVEN STEPS to pronounce ض correctly | https://www.youtube.com/watch?v=Nz7BUoOpcXA |
| bonus | Responding to FALSE information about the origin of ض | https://www.youtube.com/watch?v=BjP2ao0j99k |

### C. "Learn Tajweed Easily (Beginner)" (Phase 3 core rules — noon sakinah, madd, qalqalah, etc.)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgqM4Uuu7iAhIeuSdF0v9yxo

| Title | URL |
|---|---|
| TOO MANY Tajweed Rules? Here's the ultimate solution | https://www.youtube.com/watch?v=kklrHE85hHE |
| What do the symbols in Quran mean? | https://www.youtube.com/watch?v=meQsEM3V2m8 |
| What do the symbols in Quran mean? - PART II (ADVANCED) | https://www.youtube.com/watch?v=IOXzx2H5cT8 |
| What do the symbols in Quran mean? For Urdu + Turkish Mus'haf | https://www.youtube.com/watch?v=48KSABnA0D8 |
| How to PROPERLY stop/resume in longer Aya's in the Holy Quran | https://www.youtube.com/watch?v=j3AR6-BThPU |
| Madd (مد) in Quran MADE EASY | https://www.youtube.com/watch?v=Q737ZCSbC_g |
| How to pronounce Hamza Wasl (همزة وصل) VS. Hamza Qat' (همزة قطع) | https://www.youtube.com/watch?v=iS31xI9JF2k |
| How to PROPERLY pronounce the word (Allah) in the Holy Quran | https://www.youtube.com/watch?v=0paH22-NvzU |
| Learn the Quranic Noon Sakinah (نون ساكنه) in 10 MINUTES | https://www.youtube.com/watch?v=hy8V7CsxaQk |
| How to PROPERLY pronounce Meem (م) sakinah in the holy Quran? | https://www.youtube.com/watch?v=MAvDrZgWRTs |
| How to deal with Letters with NO TASHKEEL in the Holy Quran | https://www.youtube.com/watch?v=4g61PiwOQ2E |
| Quranic Qalqala (Echoing sounds) Explained - القلقلة | https://www.youtube.com/watch?v=thu6eZ-AeOA |
| Rules of (ر) in the Holy Quran - made simple | https://www.youtube.com/watch?v=-Uc5vkrTYnU |
| Letter FUSION in the Holy Quran | https://www.youtube.com/watch?v=NOCKyEcgW7U |
| The SECRETS of the SEPARATED LETTERS in the Quran & How to recite them | https://www.youtube.com/watch?v=6_gKg6PByOI |
| Read ANY difficult word in the Quran using THIS 'Sukoon method' | https://www.youtube.com/watch?v=kYti7Fa6Azc |
| You'll never be confused with this letter combination | https://www.youtube.com/watch?v=FxcIjAnbUVM |
| NEVER start reciting after this word in the Quran | https://www.youtube.com/watch?v=MaKZ3ZAE6gU |
| The SEVEN Ahrof & the TEN Qira'aat of Quran - EXPLAINED! | https://www.youtube.com/watch?v=8hj7u0F3yEg |
| WithOUT all these FOUR, your Qur'an recitation IS REJECTED | https://www.youtube.com/watch?v=-WsxJ3bIPys |
| You MUST learn these symbols, if you use this Mushaf? | https://www.youtube.com/watch?v=02vVE5uMqqw |
| You'll NEVER Forget the rules of ر, After learning THIS ONE RULE | https://www.youtube.com/watch?v=G8ZGHfCCjgc |
| Understanding Mushaf Differences – A Beginner's Guide | https://www.youtube.com/watch?v=h5JZIkzG3Hw |

### D. "Advanced Tajweed Course" (Phase 3 — deeper madd, ghunnah, reciter-comparison, edge cases)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgojGi2tiWQnXa2ELsBP36C1

| Title | URL |
|---|---|
| You may NOT recite the Quran like that - Recitation Speed | https://www.youtube.com/watch?v=xq4rm8Y-jlI |
| You will ALWAYS get your madd length correct, after watching this | https://www.youtube.com/watch?v=oZ5IjrW555c |
| The RAREST Tajweed rule in the Quran (Imala) | https://www.youtube.com/watch?v=-IBARGLjiDo |
| The ONE tajweed rule to AVOID: Reduction (اختلاس) | https://www.youtube.com/watch?v=WIjmaKX6t4U |
| Why does the word ٱئۡتُونِي have TWO pronunciations in the Quran? | https://www.youtube.com/watch?v=fJBDeF30U6s |
| How to stop at a word with shaddah PROPERLY | https://www.youtube.com/watch?v=_344AVeWcQI |
| What is 'Nabr'? How to apply it PROPERLY | https://www.youtube.com/watch?v=-obFnaUtZ-k |
| Three MISTAKES to avoid with 'Basmala' and 'Isthi'adha' | https://www.youtube.com/watch?v=80rDupPS2uc |
| Practice 95% of tajweed rules with ONE SINGLE Aya | https://www.youtube.com/watch?v=BfsRbY3F7IE |
| The tajweed rule you canNOT hear: Ishmam | https://www.youtube.com/watch?v=ZenswUTP6GQ |
| You'll NEVER mispronounce these three words | https://www.youtube.com/watch?v=ARkjnw7BnMU |
| Now you can PROPERLY stop at these words | https://www.youtube.com/watch?v=pdZ9613o_lY |
| There's a SPECIAL rule for this word in the Quran | https://www.youtube.com/watch?v=kt-_8QJk9w0 |
| NEVER read the Qur'an like this! | https://www.youtube.com/watch?v=pnqiSi2-N6Y |
| How to switch between HEAVY and LIGHT letters in one word EASILY | https://www.youtube.com/watch?v=mbwm1L_M9Ys |
| How to STOP at a 'madd' Properly | https://www.youtube.com/watch?v=vW1k3cEr-8w |
| Applying Raum & Ishmam in Al-Fatihah? | https://www.youtube.com/watch?v=din_Aycwi4s |
| Do you apply Madd At-Tamkeen on your recitation? | https://www.youtube.com/watch?v=k0h2_t-akdY |
| Do you apply (Glorifying Madd - مد التعظيم) in your recitations? | https://www.youtube.com/watch?v=z2vRvMG1M5k |
| THIS device will solve ALL your ghunnah problems | https://www.youtube.com/watch?v=qnnBANhzaSk |
| The INVISIBLE Letters in The Quran That You Must Pronounce | https://www.youtube.com/watch?v=lrtxuEKKrrc |
| The Surah Where You Should Ignore THIS Rule of Tajweed | https://www.youtube.com/watch?v=cU_okOigzN0 |
| Have Teachers been Teaching this Wrong? - Length of Ghunnah | https://www.youtube.com/watch?v=4YmGkk_m87o |
| Did Anyone Notice this Before in Sh. Husari's Recitation?? | https://www.youtube.com/watch?v=bXInneQA5IE |
| Why Are Famous Reciters Being Corrected in Al-Fatihah? | https://www.youtube.com/watch?v=XvMOM1ujnmU |
| The Advanced Tajweed Rule that Many People Didn't Learn | https://www.youtube.com/watch?v=jNAmUGc_ruc |
| The One Mistake Most People Make in the Shahadah | https://www.youtube.com/watch?v=HhHXNDpjjfI |
| The TRUTH About Shaikh Abdul-Basit & His Recitations | https://www.youtube.com/watch?v=96xaseFupmg |
| Why is Shaddah Missing in Some Ayat? | https://www.youtube.com/watch?v=dYGDSGQQDGs |
| Why did Shaikh Al-Husary Make It Sound like this? | https://www.youtube.com/watch?v=TtQKHVk4_f8 |
| A Rule Only Mastered by Advanced Learners \| Dammah Continuation | https://www.youtube.com/watch?v=x5YPUJONVhg |

Note the Husary-specific video ("Did Anyone Notice this Before in Sh. Husari's
Recitation??" and "Why did Shaikh Al-Husary Make It Sound like this?") is
directly relevant since Husary Muallim is this course's primary qari —
useful as teacher-prep material to pre-empt "why does the recording sound
like X" student questions.

### E. "The BEST 30-day Tajweed Program (Intermediate)" (Phase 3 — structured daily program, could map to review weeks)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgoA27YCmZYMCQCX7EUkfyHp

| Day | Title | URL |
|---|---|---|
| 1 | DAY 1 | https://www.youtube.com/watch?v=oC_LBcbNCPM |
| 2 | DAY 2 | https://www.youtube.com/watch?v=AOV5R4WlzqA |
| 3 | DAY 3 | https://www.youtube.com/watch?v=1nniAxaUGbo |
| 4 | DAY 4 | https://www.youtube.com/watch?v=lqMyIL3izYM |
| 5 | DAY 5 | https://www.youtube.com/watch?v=j1eHcChXYC8 |
| 6 | DAY 6 | https://www.youtube.com/watch?v=1IPzpRRFVOs |
| 7 | DAY 7 (Madd Q&A) | https://www.youtube.com/watch?v=yN_LZX_vgfg |
| 8 | DAY 8 | https://www.youtube.com/watch?v=9iibZwLFabI |
| 9 | DAY 9 | https://www.youtube.com/watch?v=BADF9CJUY-4 |
| 10 | DAY 10 | https://www.youtube.com/watch?v=5hcc7xpUKnM |
| 11 | DAY 11 | https://www.youtube.com/watch?v=A0lHGbe0K-M |
| 12 | DAY 12 | https://www.youtube.com/watch?v=zWZCtEtrkE8 |
| 13 | DAY 13 | https://www.youtube.com/watch?v=uY71Hi5j8_Q |
| 14 | DAY 14 | https://www.youtube.com/watch?v=32i4AROCrGE |
| 15 | DAY 15 | https://www.youtube.com/watch?v=OvMZu-em_TI |
| 16 | DAY 16 | https://www.youtube.com/watch?v=_YvAxTj6FEo |
| 17 | DAY 17 | https://www.youtube.com/watch?v=9Pl_waWlo1k |
| 18 | DAY 18 | https://www.youtube.com/watch?v=7o4Amtw_QFU |
| 19 | DAY 19 | https://www.youtube.com/watch?v=HEJ5__k_LFA |
| 20 | DAY 20 | https://www.youtube.com/watch?v=pTc77N87HuU |
| 21 | DAY 21 | https://www.youtube.com/watch?v=l9QKad5bnc0 |
| 22 | DAY 22 | https://www.youtube.com/watch?v=V2YlXVt4Ndw |
| 23 | DAY 23 | https://www.youtube.com/watch?v=QnyVUNJ5dXE |
| 24 | DAY 24 | https://www.youtube.com/watch?v=hGET_KnI1gk |
| 25 | DAY 25 | https://www.youtube.com/watch?v=KQIrz8zFuBU |
| 26 | DAY 26 | https://www.youtube.com/watch?v=wE0QWHGRJgo |
| bonus | Every Quran learner should master THIS skill - iltiqa sakinain - Noon Qutni | https://www.youtube.com/watch?v=mqvT07npi_M |
| bonus | You'll NEVER mis-pronounce ى in the Quran after watching this | https://www.youtube.com/watch?v=nk3wjTBluSo |
| bonus | How to pronounce words starting with 'shaddah' in the Quran | https://www.youtube.com/watch?v=ftB68_7QRz4 |
| bonus | You'll NEVER mis-pronounce Hamza أ or Alif ا in the Quran | https://www.youtube.com/watch?v=2uRtlsL8nTw |
| bonus | How to deal with the 'SEVEN Alifs' in the Qur'an properly? | https://www.youtube.com/watch?v=Z_DmlIcCCMk |
| bonus | The FOUR Actions of recitation that EVERY Muslim must know | https://www.youtube.com/watch?v=8uAtiaRy1jc |
| bonus | Letters with NO Tashkeel, How do you pronounce that? | https://www.youtube.com/watch?v=TF4UV_lYl_k |

### F. "Read & Understand Quranic Arabic from 0% - 50% (Stage ONE)" (vocabulary — outside core Tajweed scope but useful for meaning-aware hifz of the last 10 surahs)
Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgrYBl5c2LGoc1iwTPyYMMYH

| Title | URL |
|---|---|
| 7 STEPS to READ & UNDERSTAND the Holy Quran in Arabic - step-by-step GUIDE | https://www.youtube.com/watch?v=IuiTV5SEeGw |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 1 | https://www.youtube.com/watch?v=mChh2WwT4Tk |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 2 | https://www.youtube.com/watch?v=TYLmLq2b0gk |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 3 | https://www.youtube.com/watch?v=ed6-eLXrVL4 |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 4 | https://www.youtube.com/watch?v=szx4eT_0lig |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 5 | https://www.youtube.com/watch?v=7jUAvRa9BUw |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 6 | https://www.youtube.com/watch?v=FNx0DnjyH1E |
| Learn 50% of the Holy Quran with THIS Frequency list - Lesson 7 | https://www.youtube.com/watch?v=du6O1THwL9M |
| The most FLEXIBLE word in the Holy Quran | https://www.youtube.com/watch?v=dkWyIzr8u58 |
| Avoid THIS common mistake & learn how to understand/pronounce ما | https://www.youtube.com/watch?v=_nX9E2IdS-I |
| How to use Memrise to Learn & UNDERSTAND the Noble Quran | https://www.youtube.com/watch?v=0EGhggysALM |

### G. "Common mistakes" (general — mixed doctrinal/awareness content, cherry-pick only) & "Tajweed Common Mistakes - From Good to Better" (Phase 3 — 28-episode structured mistake series, HIGH VALUE for teacher's "listen-for mistake lists")
- Common mistakes (general, mixed): https://www.youtube.com/playlist?list=PL6TlMIZ5ylgohhnt3tvdePEsbjhK8MozZ
  — 26 videos, mostly about misconceptions/controversies/pop-culture Quran issues (e.g. TikTok trends, reciter controversies), NOT primarily tajweed mechanics. A few are directly useful:
  - ❗IMPORTANT❗How to achieve (Itqaan) in Surah Al-Fatihah — https://www.youtube.com/watch?v=td40V6Qi4Cc
  - Do You Pronounce Shaddah on Raa Wrong? — https://www.youtube.com/watch?v=sUkp2XivuvM
  - Most Common Qur'an Mistakes in South Asia (and How to Fix Them) — https://www.youtube.com/watch?v=hma_T8jw6fg
  - Basmalah vs Tasmiyah — A Mistake SO MANY Muslims Make — https://www.youtube.com/watch?v=lJDKhEro6uA
  (Rest of this playlist is largely doctrinal/awareness content — not needed for lesson mapping.)

- **Tajweed Common Mistakes - From Good to Better** (the one to mine heavily for teacher notes):
  Playlist: https://www.youtube.com/playlist?list=PL6TlMIZ5ylgo_RLmIMYXxV8vWTv3P48ru

| # | Title | URL |
|---|---|---|
| intro | From Good to Better at Tajweed - New Series (Ramadan 2022) | https://www.youtube.com/watch?v=ZK_AbettfH4 |
| 1 | When Tajweed becomes TOO MUCH | https://www.youtube.com/watch?v=DguwPUeUR7o |
| 2 | When you want to finish the Quran NOW!! | https://www.youtube.com/watch?v=y2H22hQ2A5U |
| 3 | Should you apply takrir (تكرير) to your ر | https://www.youtube.com/watch?v=xBn2qym9cZQ |
| 4 | Even some Arabs make THIS mistake in ج | https://www.youtube.com/watch?v=auCa_pqrvzQ |
| 5 | 3 mistakes you MUST avoid with hamza ء | https://www.youtube.com/watch?v=gBmcjTuJQMY |
| 6 | The MOST overlooked mistakes of هـ /h/ | https://www.youtube.com/watch?v=TZzd94Mfc7w |
| 7 | Avoid THIS these mistakes at ALL COST | https://www.youtube.com/watch?v=PgO-W7tLQ1M |
| 8 | These mistakes of و are very common among non-Arabs | https://www.youtube.com/watch?v=OPa9BJ_pQ3E |
| 9 | What is Nasalization? & How to avoid it? | https://www.youtube.com/watch?v=1LEtMZ62AJE |
| 10 | When stopping at a semi-vowel in the Quran, AVOID THIS | https://www.youtube.com/watch?v=qd7s6pnvPzw |
| 11 | Stopping at tanween fatha? Watch THIS | https://www.youtube.com/watch?v=TAF6hGTddm0 |
| 12 | MOST COMMON mistake in Al-fatiha | https://www.youtube.com/watch?v=cvUQ3xQTa_Y |
| 13 | When you are not consistent in Quran recitation | https://www.youtube.com/watch?v=f64MKLJSTwU |
| 14 | When you treat all Ghunnah's the same | https://www.youtube.com/watch?v=OFVUSVQMB-8 |
| 15 | What is "half kasra", and how to avoid it? | https://www.youtube.com/watch?v=67ZQttDcerE |
| 16 | When FUSING letters is not an option | https://www.youtube.com/watch?v=AIkUX4stJ-c |
| 17 | Doing Iqlaab? Gap or no Gap? | https://www.youtube.com/watch?v=W2VlWnotH1w |
| 18 | When Qalqalah is not needed | https://www.youtube.com/watch?v=7nFXTdBhR9k |
| 19 | When you misuse the س symbol | https://www.youtube.com/watch?v=qQH1IQue-j4 |
| 20 | Why some letters have NO TASHKEEL in the Quran | https://www.youtube.com/watch?v=2_FC0n0AEc4 |
| 21 | When performing Tafkheem WRONG | https://www.youtube.com/watch?v=EFmGAXsBD20 |
| 22 | Applying qalqalah (MORE EXAMPLES) | https://www.youtube.com/watch?v=DBLv2R4THbE |
| 23 | What is 'Ishbaa'? & When do we apply it? | https://www.youtube.com/watch?v=58gEdOCoSoo |
| 24 | When dealing with 'Silent Letter' symbols | https://www.youtube.com/watch?v=tz39tQ2sg7A |
| 25 | When you say the word 'QUR'AN' | https://www.youtube.com/watch?v=SDUd_oeU1iM |
| 26 | When you stop where you MUSTN'T | https://www.youtube.com/watch?v=O67Dhsa159k |
| 27 | When you START where you MUSTN'T | https://www.youtube.com/watch?v=RYf6uJRukAo |
| 28 | Saying صدق الله العظيم | https://www.youtube.com/watch?v=FznKJLiazuU |
| extra | Athan COMMON mistakes but they increasingly get more SERIOUS | https://www.youtube.com/watch?v=Bnfb4mZUJuA |

## Mapping table: Arabic101 videos → course lessons

This maps individual videos to the phase/lesson structure defined in the
spec (Phase 1: 12 letter/sound lessons; Phase 2: 14 reading-mechanics
lessons; Phase 3: 26 tajweed-rules + hifz lessons). All entries below are
**optional teacher-prep / supplementary student-enrichment links**, not
required primary materials (primary audio stays Husary Muallim; primary
letter/articulation teaching stays whatever the spec's Phase 1 core source
is). Use these to build the "teacher notes / listen-for-mistake" sidebars.

| Course topic | Best-fit Arabic101 video(s) | URL(s) |
|---|---|---|
| Phase 1: Arabic alphabet overview / orientation | Learn Arabic Alphabet in LESS THAN 3 MINUTES | https://www.youtube.com/watch?v=j9BwXWpzB1Y |
| Phase 1: reading the alphabet, lessons 1-4 | How to READ ARABIC? Lessons 1–4 | https://www.youtube.com/watch?v=c-7SVieC_04 , https://www.youtube.com/watch?v=1AT7IMLcA58 , https://www.youtube.com/watch?v=8pfQg26vfaA , https://www.youtube.com/watch?v=LTwCmA6AjdI |
| Phase 1: letter writing / handwriting form | How to write Arabic letters properly | https://www.youtube.com/watch?v=jyc7h5FoD5s |
| Phase 1: alifs / hamza distinction (28 vs 29 letters debate) | Is the Arabic alphabet 28 or 29 letters? | https://www.youtube.com/watch?v=JLee5VQvdIo |
| Phase 1: makharij — throat letters (hamza ء, haa هـ) | Makharij Lesson 2 | https://www.youtube.com/watch?v=Bzz_wo6skWA |
| Phase 1: makharij — ع and ح | Makharij Lesson 3 | https://www.youtube.com/watch?v=-oA0HfNUezI |
| Phase 1: makharij — غ and خ | Makharij Lesson 4 | https://www.youtube.com/watch?v=FzDyCoJCgIg |
| Phase 1: makharij — ق | Makharij Lesson 5 | https://www.youtube.com/watch?v=wwHmytGNi2M |
| Phase 1: makharij — ج | Makharij Lesson 6 | https://www.youtube.com/watch?v=X-iZ4yZrltA |
| Phase 1: makharij — ض (emphatic letters intro) | Makharij Lesson 7 + bonus 7-steps video | https://www.youtube.com/watch?v=gEBzZLbuo-4 , https://www.youtube.com/watch?v=Nz7BUoOpcXA |
| Phase 1: makharij — ل | Makharij Lesson 8 | https://www.youtube.com/watch?v=-dPYDd4zNio |
| Phase 1: makharij — ن (two-component articulation, feeds directly into Phase 3 noon sakinah) | Makharij Lesson 9 | https://www.youtube.com/watch?v=BDgw0fWZwMU |
| Phase 1/3: makharij — ر (also ties to "Rules of ر" and Common-mistakes #3) | Makharij Lesson 10 + Sifaat Lesson 6 | https://www.youtube.com/watch?v=ObYKEtceQbU , https://www.youtube.com/watch?v=TBBMuGVy4mc |
| Phase 1: makharij — ط | Makharij Lesson 11 | https://www.youtube.com/watch?v=XeQ5cxhkzlE |
| Phase 1: makharij — ص | Makharij Lesson 12 | https://www.youtube.com/watch?v=yhIFJiPqVqA |
| Phase 1: makharij — ظ | Makharij Lesson 13 | https://www.youtube.com/watch?v=6_Qfe0g6uks |
| Phase 1: makharij — ف و م ب (easy-looking but error-prone letters) | Makharij Lesson 14 | https://www.youtube.com/watch?v=sM27vvgq_os |
| Phase 1: sifaat — hams (whispered) vs jahr | Sifaat Lesson 1 | https://www.youtube.com/watch?v=ZwgM-1M_J7o |
| Phase 3: qalqalah rule (why it exists + practice) | Sifaat Lesson 2 + Sifaat Lesson 7 + Qalqala explainer + Common-mistakes #18 and #22 | https://www.youtube.com/watch?v=LeWwxpm_Lzw , https://www.youtube.com/watch?v=ph9AB2CQbVo , https://www.youtube.com/watch?v=thu6eZ-AeOA , https://www.youtube.com/watch?v=7nFXTdBhR9k , https://www.youtube.com/watch?v=DBLv2R4THbE |
| Phase 1/3: heavy (tafkheem) vs light (tarqiq) letters | Sifaat Lesson 4 + Common-mistakes #21 | https://www.youtube.com/watch?v=I1BEoHQzK8E , https://www.youtube.com/watch?v=EFmGAXsBD20 |
| Phase 1: general letter-characteristic overview | Sifaat Lesson 3 & 5 | https://www.youtube.com/watch?v=QIxzLs1qGik , https://www.youtube.com/watch?v=zy4GVrl3H94 |
| Phase 2: sukoon / letters with no tashkeel / reading unvocalized clusters | "Sukoon method" video + "Letters with NO TASHKEEL" (two versions) + Common-mistakes #20 | https://www.youtube.com/watch?v=kYti7Fa6Azc , https://www.youtube.com/watch?v=4g61PiwOQ2E , https://www.youtube.com/watch?v=TF4UV_lYl_k , https://www.youtube.com/watch?v=2_FC0n0AEc4 |
| Phase 2: letter fusion / idgham-like merging in plain reading | Letter FUSION in the Holy Quran + Common-mistakes #16 | https://www.youtube.com/watch?v=NOCKyEcgW7U , https://www.youtube.com/watch?v=AIkUX4stJ-c |
| Phase 2: Quran page symbols / stop signs / waqf marks | What do the symbols in Quran mean? (+ Part II Advanced, + Urdu/Turkish mushaf variant) | https://www.youtube.com/watch?v=meQsEM3V2m8 , https://www.youtube.com/watch?v=IOXzx2H5cT8 , https://www.youtube.com/watch?v=48KSABnA0D8 |
| Phase 2: mushaf differences (Uzbek student may see Hafs/Indo-Pak/Uthmani script variants) | Understanding Mushaf Differences – A Beginner's Guide + You MUST learn these symbols | https://www.youtube.com/watch?v=h5JZIkzG3Hw , https://www.youtube.com/watch?v=02vVE5uMqqw |
| Phase 2: where/how to stop mid-ayah (waqf practice) | How to PROPERLY stop/resume in longer Aya's + "NEVER start reciting after this word" + Common-mistakes #10/#11/#26/#27 | https://www.youtube.com/watch?v=j3AR6-BThPU , https://www.youtube.com/watch?v=MaKZ3ZAE6gU , https://www.youtube.com/watch?v=qd7s6pnvPzw , https://www.youtube.com/watch?v=TAF6hGTddm0 , https://www.youtube.com/watch?v=O67Dhsa159k , https://www.youtube.com/watch?v=RYf6uJRukAo |
| Phase 3: madd (elongation) — introductory | Madd (مد) in Quran MADE EASY | https://www.youtube.com/watch?v=Q737ZCSbC_g |
| Phase 3: madd — length accuracy / advanced madd types | You will ALWAYS get your madd length correct + How to STOP at a 'madd' Properly + Madd At-Tamkeen + Madd At-Ta'zeem (Glorifying Madd) | https://www.youtube.com/watch?v=oZ5IjrW555c , https://www.youtube.com/watch?v=vW1k3cEr-8w , https://www.youtube.com/watch?v=k0h2_t-akdY , https://www.youtube.com/watch?v=z2vRvMG1M5k |
| Phase 3: hamza wasl vs hamza qat' | How to pronounce Hamza Wasl VS. Hamza Qat' | https://www.youtube.com/watch?v=iS31xI9JF2k |
| Phase 3: pronunciation of the word "Allah" (tafkheem/tarqiq of laam) | How to PROPERLY pronounce the word (Allah) | https://www.youtube.com/watch?v=0paH22-NvzU |
| Phase 3: noon sakinah + tanween (izhar/idgham/iqlab/ikhfa) | Learn the Quranic Noon Sakinah in 10 MINUTES + Common-mistakes #17 (Iqlaab gap) + iltiqa sakinain/Noon Qutni (30-day bonus) | https://www.youtube.com/watch?v=hy8V7CsxaQk , https://www.youtube.com/watch?v=W2VlWnotH1w , https://www.youtube.com/watch?v=mqvT07npi_M |
| Phase 3: meem sakinah rules (ikhfa shafawi, idgham shafawi, izhar shafawi) | How to PROPERLY pronounce Meem sakinah | https://www.youtube.com/watch?v=MAvDrZgWRTs |
| Phase 3: ghunnah (nasalization) — duration and consistency | THIS device will solve ALL your ghunnah problems + Have Teachers been Teaching this Wrong? (Length of Ghunnah) + Common-mistakes #9 (nasalization) + #14 (treating all ghunnahs the same) | https://www.youtube.com/watch?v=qnnBANhzaSk , https://www.youtube.com/watch?v=4YmGkk_m87o , https://www.youtube.com/watch?v=1LEtMZ62AJE , https://www.youtube.com/watch?v=OFVUSVQMB-8 |
| Phase 3: rules of raa (ر) — tafkheem/tarqiq of raa | Rules of (ر) in the Holy Quran + "NEVER Forget the rules of ر" + Common-mistakes #3 (takrir) + Sifaat Lesson 6 (90% of RA mistakes) + Do You Pronounce Shaddah on Raa Wrong? | https://www.youtube.com/watch?v=-Uc5vkrTYnU , https://www.youtube.com/watch?v=G8ZGHfCCjgc , https://www.youtube.com/watch?v=xBn2qym9cZQ , https://www.youtube.com/watch?v=TBBMuGVy4mc , https://www.youtube.com/watch?v=sUkp2XivuvM |
| Phase 3: muqatta'at (disconnected/separated letters, appear at start of many surahs incl. last-10 surahs review) | The SECRETS of the SEPARATED LETTERS in the Quran | https://www.youtube.com/watch?v=6_gKg6PByOI |
| Phase 3: the seven ahruf / ten qira'aat (context/orientation, not core drilling) | The SEVEN Ahrof & the TEN Qira'aat of Quran - EXPLAINED! | https://www.youtube.com/watch?v=8hj7u0F3yEg |
| Phase 3: Fatiha-specific recitation mastery (Itqaan) — directly relevant since al-Fatiha is memorized in this course | ❗How to achieve (Itqaan) in Surah Al-Fatihah + MOST COMMON mistake in Al-fatiha + Applying Raum & Ishmam in Al-Fatihah + Why Are Famous Reciters Being Corrected in Al-Fatihah | https://www.youtube.com/watch?v=td40V6Qi4Cc , https://www.youtube.com/watch?v=cvUQ3xQTa_Y , https://www.youtube.com/watch?v=din_Aycwi4s , https://www.youtube.com/watch?v=XvMOM1ujnmU |
| Phase 3: basmala / isti'adha etiquette (recitation opening) | Three MISTAKES to avoid with 'Basmala' and 'Isthi'adha' + Basmalah vs Tasmiyah | https://www.youtube.com/watch?v=80rDupPS2uc , https://www.youtube.com/watch?v=lJDKhEro6uA |
| Phase 3: shaddah handling (doubled letters, stopping on shaddah, word-initial shaddah) | How to stop at a word with shaddah PROPERLY + How to pronounce words starting with 'shaddah' + Why is Shaddah Missing in Some Ayat? | https://www.youtube.com/watch?v=_344AVeWcQI , https://www.youtube.com/watch?v=ftB68_7QRz4 , https://www.youtube.com/watch?v=dYGDSGQQDGs |
| Phase 3: nabr (stress/emphasis) — a subtlety for a more advanced/fluent-sounding recitation | What is 'Nabr'? How to apply it PROPERLY | https://www.youtube.com/watch?v=-obFnaUtZ-k |
| Phase 3: consolidated practice / capstone before checkpoint test (single-ayah drill covering ~95% of rules) | Practice 95% of tajweed rules with ONE SINGLE Aya | https://www.youtube.com/watch?v=BfsRbY3F7IE |
| Phase 3: rare/edge-case tajweed for advanced awareness (not required, optional teacher background) | Imala + Ikhtilas (Reduction) + Ishmam + Raum | https://www.youtube.com/watch?v=-IBARGLjiDo , https://www.youtube.com/watch?v=WIjmaKX6t4U , https://www.youtube.com/watch?v=ZenswUTP6GQ |
| Phase 3: 30-day structured review program — can be assigned as parallel home-practice track running alongside the live Phase 3 lessons | The BEST 30-day Tajweed Program, Days 1–26 | see full table in section E above; playlist https://www.youtube.com/playlist?list=PL6TlMIZ5ylgoA27YCmZYMCQCX7EUkfyHp |
| Phase 3: consolidated "listen-for-mistake" bank for teacher notes across all 26 Phase-3 lessons | Tajweed Common Mistakes - From Good to Better, episodes 1–28 | full table in section G above; playlist https://www.youtube.com/playlist?list=PL6TlMIZ5ylgo_RLmIMYXxV8vWTv3P48ru |
| Reciter awareness — Husary-specific notes (this course's primary qari) | Did Anyone Notice this Before in Sh. Husari's Recitation?? + Why did Shaikh Al-Husary Make It Sound like this? | https://www.youtube.com/watch?v=bXInneQA5IE , https://www.youtube.com/watch?v=TtQKHVk4_f8 |

## Concrete recommendations for this course

1. **Do not embed/rehost any Arabic101 audio or video file.** Treat every
   URL in this document as a link-out only (either a plain hyperlink in
   teacher notes, or a standard YouTube `<iframe>` embed using the video's
   own ID, e.g. `https://www.youtube.com/embed/hy8V7CsxaQk`). This satisfies
   the course's "free and openly licensed, or merely linked, never
   re-hosted" constraint even though the channel's license is the Standard
   YouTube License (all rights reserved), because linking/embedding is not
   re-hosting.
2. **Primary use case: teacher notes / "listen-for-mistake" sidebars.**
   The "Tajweed Common Mistakes - From Good to Better" playlist (28
   episodes) is the single best-matched resource on the channel for this
   exact deliverable in the spec — it is already organized as one
   short video per common mistake, cross-referencing letters, rules, and
   the very phase-3 topics (qalqalah, ghunnah, tafkheem, iqlaab, raa rules)
   this course teaches. Recommend linking the matching episode directly
   from each Phase 3 lesson's teacher-notes page.
3. **Secondary use case: optional student enrichment links.** For
   Phase 1 letter lessons, the Makharij & Sifaat playlist (14 + 7 lessons)
   gives a second explanation angle per letter/characteristic; good as an
   optional "if still struggling, watch this" link per lesson, not a
   required watch.
4. **Al-Fatiha-specific cluster is directly load-bearing** for the hifz
   portion of Phase 3 (student memorizes al-Fatiha + last 10 surahs): the
   four Fatiha-specific videos (Itqaan, common mistake, Raum/Ishmam,
   reciter-correction) should be linked from whichever lesson covers
   al-Fatiha memorization/perfection.
5. **Do not use the general "Common mistakes" playlist wholesale** — most
   of its 26 videos are doctrinal/pop-culture commentary (TikTok trends,
   reciter controversies, "is this haram" content) rather than tajweed
   mechanics; only the 4 videos called out in section G are relevant.
6. **The 30-day program and the vocabulary-frequency-list playlist (Stage
   ONE) are good candidates for take-home / self-paced parallel tracks**
   for a motivated student, but should not be treated as required
   curriculum since they don't map 1:1 onto the spec's lesson numbering —
   present them as an appendix/optional-extension resource list rather than
   wiring them into the required 52-lesson sequence.
7. **Verify embeds before shipping**: spot-check the oEmbed endpoint (as
   done in this report) for any specific video actually wired into the app,
   since individual videos can have embedding disabled independently of the
   channel default. Example check command:
   `curl -s "https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<VIDEO_ID>&format=json"`
   — a JSON response (not an error) confirms the video is embeddable.
