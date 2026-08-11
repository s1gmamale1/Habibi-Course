---
type: rule
id: madd_arid_lissukun
arabic: المد العارض للسكون
translit: al-Madd al-ʿĀriḍ li's-Sukūn
english: Prolongation Due to Temporary Sukūn
family: madd
cpfair_key: madd_246
colour_b: "#4050FF"
harakat: 4
harakat_options: [2, 4, 6]
taught_in: "3-31"
prerequisites: [madd_tabii, waqf_types]
status: verified
sources: ["[[Tuhfat-al-Atfal]]", "[[Muqaddimah-Jazariyyah]]"]
examples:
  - ref: "1:2"
    text: "ٱلْعَٰلَمِينَ"
    note: "stop here and the nūn goes sākin, so the yāʾ stretches to 2, 4 or 6"
  - ref: "1:5"
    text: "نَسْتَعِينُ"
    note: "end of āyah — the commonest place a learner meets this rule"
  - ref: "2:5"
    text: "ٱلْمُفْلِحُونَ"
    note: "wāw madd + one letter + waqf"
  - ref: "1:3"
    text: "ٱلرَّحِيمِ"
    note: "joins as 2 counts, stops as 2/4/6"
  - ref: "112:1"
    text: "أَحَدٌ"
    note: "no madd letter here — contrast case: stopping gives qalqalah, not madd"
---

# Madd ʿĀriḍ li's-Sukūn — المد العارض للسكون

## ⚠ Teaching-order note — read this first

**This rule is *defined* by stopping.** It only exists at waqf: in wasl the same
word carries a plain 2-count [[Madd-Tabii]]. So it has a hard prerequisite on
knowing how to stop.

The classical arrangement puts madd before waqf — al-Jazariyyah treats madd in
chapter 11 and waqf in chapter 12 — and an earlier draft of this course's
syllabus inherited the same ordering bug. **The course fixes it: practical
stopping is taught early, in Unit 2 ([[Waqf-Types]], [[Waqf-Word-Changes]]),
before any madd farʿī appears in Unit 3.** The prerequisites on this note are
`madd_tabii` **and** `waqf_types`, and that is deliberate — do not reorder it
back.

## Definition

A madd letter followed by a letter whose sukūn exists **only because you stopped
there**.

## Condition

`madd letter + one letter + waqf`. Join to the next word and the rule vanishes.

## Length

**2, 4 or 6 ḥarakāt — all three are correct.**

| Count | Name | Character |
|---|---|---|
| 6 | ishbāʿ / ṭūl | full, used in slow tartīl |
| 4 | tawassuṭ | middle |
| 2 | qaṣr | short, used in ḥadr |

This is the reciter's own choice — but **hold one choice for the whole session**.
Switching between 2, 4 and 6 inside a single passage is the actual error; none of
the three lengths is.

Practical guidance for this course: pick **4** while learning, because it makes
the rule audible without being ponderous, and because it matches the tawassuṭ
most learners hear on the recordings.

## Stacking with other rules at waqf

- **Qalqalah kubrā** — if the final letter is a qalqalah letter, do both:
  ٱلْمَعَادْ gets the ʿāriḍ madd *and* the bounce.
- **[[Madd-Leen]]** — the same 2/4/6 choice applies when the letter before the
  final one is a *leen* wāw/yāʾ rather than a true madd letter.
- **[[Madd-Muttasil]]** — stopping on a word-final hamzah after a madd gives the
  muttaṣil its optional sixth count by exactly this mechanism.

## Common mistakes

1. Applying it in wasl — lengthening ٱلرَّحِيمِ when you are going straight on
   to ٱلرَّحِيمِ مَٰلِكِ.
2. Switching 2/4/6 within a single āyah.
3. Failing to release the final letter cleanly, so the stop sounds smeared.
4. Confusing it with [[Madd-Lazim]] — lāzim is 6 *always*, ʿāriḍ is a choice and
   only at waqf.

## cpfair coverage

Mapped to cpfair key `madd_246` — see [[cpfair-quran-tajweed]]. Note that the
dataset marks the *place*; it cannot know which of 2/4/6 the reciter will pick,
so the length is a teaching decision, not data.
