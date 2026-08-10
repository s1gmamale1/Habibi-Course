---
type: rule
id: silent_letters
arabic: الحروف غير المنطوقة
translit: al-Ḥurūf ghayr al-Manṭūqah
english: Silent Letters
family: orthography
cpfair_key: silent
colour_b: "#AAAAAA"
taught_in: "3-35"
prerequisites: [hamzat_wasl]
status: draft
sources: ["[[Muqaddimah-Jazariyyah]]"]
examples:
  - ref: "18:39"
    text: "أَنَا۠ أَقَلَّ"
    note: "small round zero — the alif is never pronounced in wasl; at waqf it is"
  - ref: "2:5"
    text: "أُو۟لَٰٓئِكَ"
    note: "small round zero on the wāw — never pronounced at all"
  - ref: "76:4"
    text: "سَلَٰسِلَا۟"
    note: "small oval — silent in wasl, pronounced (2 counts) at waqf"
  - ref: "33:10"
    text: "ٱلظُّنُونَا۠"
    note: "same pattern: waqf with the alif, wasl without"
  - ref: "53:51"
    text: "وَثَمُودَا۟"
    note: "the alif appears only when stopping"
  - ref: "18:38"
    text: "لَّٰكِنَّا۠"
    note: "waqf: lākinnā · wasl: lākinna huwa"
  - ref: "1:2"
    text: "ٱلْحَمْدُ"
    note: "the waṣl alif itself — silent whenever you join"
---

# Silent Letters — الحروف غير المنطوقة

Some letters are **written but not recited**. In the Uthmānī orthography this is
never an error or an archaism to be ignored — the mushaf marks each case
explicitly, and the mark tells you *when* the letter is silent.

## The three sources of silence

### 1. Hamzat al-waṣl — silent when joining

The connecting hamzah ٱ is dropped every time you join from a previous word. It
is the most frequent silent letter in the Qurʾān. Full treatment in
[[Hamzat-Wasl]].

### 2. The small round zero — الصفر المستدير — **never** pronounced

`○` above an [[Alif|alif]] or [[Waw|wāw]] means the letter is silent **in wasl and in waqf
alike**. It is pure spelling.

- **أُو۟لَٰٓئِكَ** — the wāw is never sounded: `ulāʾika`
- **لَّٰكِنَّا۠** (18:38) at wasl — `lākinna huwa`

### 3. The small oval / vertical zero — الصفر المستطيل القائم — silent **only in wasl**

`٘` above an alif means: **drop it when joining, pronounce it (2 counts) when
stopping**.

| Word | Ref | Wasl | Waqf |
|---|---|---|---|
| سَلَٰسِلَا۟ | 76:4 | `salāsila` | `salāsilā` |
| قَوَارِيرَا۠ | 76:15 | `qawārīra` (with tanwīn) | `qawārīrā` |
| ٱلظُّنُونَا۠ | 33:10 | `aẓ-ẓunūna` | `aẓ-ẓunūnā` |
| ٱلرَّسُولَا۠ | 33:66 | `ar-rasūla` | `ar-rasūlā` |
| ٱلسَّبِيلَا۠ | 33:67 | `as-sabīla` | `as-sabīlā` |
| وَثَمُودَا۟ | 53:51 | `thamūda` | `thamūdā` |

### أَنَا — the word to learn by heart

**أَنَا۠** occurs some sixty times. Its final alif is **written, silent in wasl,
and pronounced for 2 counts at waqf**. So: `ana aqallu` when joining (18:39),
but `anā` if you stop on it. Learners who read `anā` mid-sentence are adding a
madd that is not there.

## Contrast: silence vs. an unmarked letter

A letter carrying **no mark at all** is not silent — it is **merged (mudgham) or
hidden (mukhfā)**, and it is still doing acoustic work. The absence of a sukūn is
itself information. Do not confuse a bare letter with a zeroed one.

## Common mistakes

1. Pronouncing the wāw of أُو۟لَٰٓئِكَ.
2. Ignoring the ○ vs ٘ distinction — treating أَنَا۠ and سَلَٰسِلَا۟ the same way.
3. Pronouncing the waṣl hamzah when joining.
4. Reading an unmarked (merged/hidden) letter as if it carried a sukūn.

## Related

Most of the oval-zero words are also entries in [[Hafs-Special-Words]], because
their [[Waqf-Types|waqf]]/wasl behaviour is transmitted, not derivable.

## cpfair coverage

Mapped to cpfair key `silent` — see [[cpfair-quran-tajweed]]. The dataset marks
letters that are not sounded **in the joined reading**, so the oval-zero words are
marked silent there even though they are pronounced at a stop. Anything
waqf-specific is hand-authored.
