---
type: rule
id: madd_lazim
arabic: المد اللازم
translit: al-Madd al-Lāzim
english: Necessary Prolongation
family: madd
cpfair_key: madd_6
colour_b: "#2144C1"
harakat: 6
taught_in: "3-10"
prerequisites: [madd_tabii, madd_muttasil]
status: draft
sources: ["[[Tuhfat-al-Atfal]]", "[[Muqaddimah-Jazariyyah]]"]
examples:
  - ref: "1:7"
    text: "ٱلضَّآلِّينَ"
    note: "kalimī muthaqqal — madd alif followed by a shaddah in the same word"
  - ref: "80:33"
    text: "ٱلصَّآخَّةُ"
    note: "kalimī muthaqqal"
  - ref: "69:1"
    text: "ٱلْحَآقَّةُ"
    note: "kalimī muthaqqal"
  - ref: "2:164"
    text: "دَآبَّةٍ"
    note: "kalimī muthaqqal"
  - ref: "10:51"
    text: "ءَآلْـَٰٔنَ"
    note: "kalimī mukhaffaf — one of only two places in the whole Qurʾān"
  - ref: "10:91"
    text: "ءَآلْـَٰٔنَ"
    note: "kalimī mukhaffaf — the second and last place"
  - ref: "2:1"
    text: "الٓمٓ"
    note: "ḥarfī muthaqqal — the lām's final mīm merges into the mīm that follows"
  - ref: "68:1"
    text: "نٓ"
    note: "ḥarfī mukhaffaf — nūn, from نَقَصَ عَسَلُكُمْ, 6 counts"
  - ref: "19:1"
    text: "كٓهيعٓصٓ"
    note: "all three tiers in one word: kāf 6, hā 2, yā 2, ʿayn 4–6, ṣād 6"
---

# Madd Lāzim — المد اللازم

## Definition

A madd letter followed by a **permanent** sukūn — one that is there whether you
join or stop, in every recitation, always. Because the cause never goes away,
neither does the madd: **6 ḥarakāt, obligatory, with no alternative length.**

This is the only madd with a single non-negotiable count. Contrast
[[Madd-Arid-Lissukun]], whose sukūn is temporary and whose length is a choice.

## The four subtypes

|  | In a **word** (kalimī) | In a **letter-name** (ḥarfī) |
|---|---|---|
| **Heavy** (muthaqqal — the sukūn merges, i.e. a shaddah follows) | ٱلضَّآلِّينَ · ٱلصَّآخَّةُ · ٱلْحَآقَّةُ · دَآبَّةٍ | الٓمٓ · طسٓمٓ |
| **Light** (mukhaffaf — plain sukūn, no shaddah) | ءَآلْـَٰٔنَ only | نٓ · قٓ · صٓ |

### 1. Kalimī muthaqqal — the one you will meet constantly

A madd letter followed, in the same word, by a letter carrying a **shaddah**.
This is the taught default: `ٱلضَّآلِّينَ` at the end of al-Fātiḥah is the first
6-count madd almost every learner ever produces, and getting it to a true 6 is a
milestone.

### 2. Kalimī mukhaffaf — exactly two places in the Qurʾān

A madd letter followed, in the same word, by an **original sukūn with no
shaddah**. It occurs in **one word, in two places only**:

- **Yūnus 10:51** — ءَآلْـَٰٔنَ وَقَدْ كُنتُم بِهِۦ تَسْتَعْجِلُونَ
- **Yūnus 10:91** — ءَآلْـَٰٔنَ وَقَدْ عَصَيْتَ قَبْلُ

Both verified verbatim against the pinned [[Tanzil]] corpus.

> **Double classification, flagged.** The same word is also **[[Madd-Farq]]**,
> because its opening madd arises from an interrogative hamzah entering on a
> hamzat al-waṣl. Both labels are correct and both are taught by reputable
> teachers; the *recitation* is identical either way — 6 counts. Teach it as
> farq (the cause) and mention lāzim mukhaffaf (the form), or the reverse, but
> do not let the learner think there are two different sounds.

### 3 & 4. Ḥarfī — the muqaṭṭaʿāt

A letter of the disconnected openings whose **spelt name is three letters**, the
middle one a madd. **Muthaqqal** if its final sākin letter merges (idghām) into
what follows; **mukhaffaf** if it does not.

**The eight 6-count letters: ن ق ص ع س ل ك م — mnemonic نَقَصَ عَسَلُكُمْ.**

**Teach the muqaṭṭaʿāt as one three-tier rule:**

| Tier | Letters | Counts |
|---|---|---|
| Long | نَقَصَ عَسَلُكُمْ | **6** (ع is 4 or 6 — see below) |
| Short | حَيٌّ طَهُرْ (ح ي ط ه ر) | **2** — [[Madd-Tabii]] |
| None | ا (alif) | **no madd** |

**ع is the exception inside the exception.** In كٓهيعٓصٓ (19:1) and حمٓ عٓسٓقٓ the
ʿayn's madd is a *leen* madd, not a true madd letter, so it takes **4 or 6**,
not the flat 6 of its neighbours. See [[Madd-Leen]]. Sources note both counts as
transmitted; either is correct, held consistently.

## Common mistakes

1. Giving 4 counts to ٱلضَّآلِّينَ — the commonest error in al-Fātiḥah.
2. Losing the shaddah after the long madd, so the lām of ٱلضَّآلِّينَ arrives
   single.
3. Failing to recognise ءَآلْـَٰٔنَ, or under-counting it because it is rare.
4. Giving ص or ن two counts; giving alif a madd; giving ع only two.
5. Failing to make the idghām in الٓمٓ, so "lām-mīm" comes out as two units.

## cpfair coverage

Mapped to cpfair key `madd_6` — see [[cpfair-quran-tajweed]]. The dataset does
**not** distinguish the four subtypes; the muthaqqal/mukhaffaf and kalimī/ḥarfī
split is hand-authored here.
