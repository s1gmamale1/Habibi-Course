---
type: rule
id: madd_iwad
arabic: مد العوض
translit: Madd al-ʿIwaḍ
english: Compensatory Prolongation
family: madd
colour_b: "#537FFF"
harakat: 2
taught_in: "3-35"
prerequisites: [madd_tabii, waqf_word_changes]
status: needs-review
sources: ["[[Tuhfat-al-Atfal]]", "[[Muqaddimah-Jazariyyah]]", "[[Shatibiyyah]]"]
examples:
  - ref: "110:2"
    text: "أَفْوَاجًا"
    note: "stop here and it becomes أَفْوَاجَا — 2 counts"
  - ref: "4:11"
    text: "عَلِيمًا حَكِيمًا"
    note: "end of āyah; stopping on حَكِيمًا gives ḥakīmā"
  - ref: "18:2"
    text: "أَجْرًا حَسَنًا"
    note: "tanwīn fatḥ at an āyah end — the standard place learners meet it"
  - ref: "2:31"
    text: "ٱلْأَسْمَآءَ كُلَّهَا"
    note: "contrast: a plain fatḥah, not tanwīn — no ʿiwaḍ if you stop"
  - ref: "2:25"
    text: "مُّطَهَّرَةٌ"
    note: "contrast: tanwīn ḍamm on a tāʾ marbūṭah — stops as مُطَهَّرَهْ, no madd"
---

# Madd al-ʿIwaḍ — مد العوض

## Definition

When you **stop** on a word ending in **tanwīn fatḥ** (ـً), the tanwīn is
dropped and **compensated** (ʿiwaḍ) by an [[Alif|alif]] of 2 counts.

عَلِيمًا → `ʿalīmā` · أَفْوَاجًا → `afwājā` · نَصْرًا → `naṣrā`

## Condition

[[Waqf-Types|Waqf]] on a word ending in tanwīn fatḥ. **Waqf only** — in wasl the tanwīn is
pronounced normally and there is no madd at all.

## Length

**2 ḥarakāt** — it is a plain [[Madd-Tabii]] in every respect once it appears.

> ### ⚠ Status: needs-review — attested, but never stated as a rule
>
> **No matn in this vault names this rule.** *ʿiwaḍ* does not occur once in
> [[Tuhfat-al-Atfal]], [[Muqaddimah-Jazariyyah]] or [[Shatibiyyah]]. That is not the
> same as the content being doubtful, and the distinction matters:
>
> **The mechanism is presupposed by [[Shatibiyyah]] v. 830**, which locates the sakt of
> al-Kahf **عَلَى أَلِفِ التَّنْوِينِ فِي عِوَجاً** — *"on the alif of the tanwīn in
> ʿiwajā"*. The matn can only speak of "the alif of the tanwīn" if stopping on tanwīn
> fatḥ yields an alif, which is exactly this rule. It is treated as assumed background
> a reciter already has, not as something to be taught.
>
> So: **the behaviour is classically attested; the name and the category are later
> pedagogy.** Verifying it properly needs a tajwīd manual that states it as a rule —
> not another matn. *(Found 2026-08-11.)*

## The exception: tāʾ marbūṭah

A word ending in **ـةً** does **not** take ʿiwaḍ. At waqf the tāʾ marbūṭah
becomes a sākin [[Ha-soft|hāʾ]] and the tanwīn simply disappears:

رَحْمَةً → **رَحْمَهْ** (`raḥmah`), **not** `raḥmatā`.

See [[Waqf-Word-Changes]] for the full set of transformations that fire when you
stop, and for the mushaf's open-tāʾ spellings (رَحْمَتَ, نِعْمَتَ) which stop as
a plain sākin تْ.

## The other two tanwīns

Only **tanwīn fatḥ** compensates. Tanwīn ḍamm and tanwīn kasr just go silent:

| Ending | At waqf |
|---|---|
| ـً | → alif, 2 counts (ʿiwaḍ) |
| ـٌ | → sukūn, no madd |
| ـٍ | → sukūn, no madd |

## Common mistakes

1. Applying it to tanwīn ḍamm or kasr — رَحِيمٌ stops as `raḥīm`, not `raḥīmū`.
2. Applying it to tāʾ marbūṭah.
3. Applying it in wasl, producing an intrusive alif mid-phrase.
4. Stretching it to 4 counts because it sits at an āyah end where the ear
   expects a long stop.

## Special-word interaction

Several of the [[Hafs-Special-Words]] hinge on exactly this rule — سَلَٰسِلَا۟
(76:4), ٱلظُّنُونَا۠ (33:10) and their siblings are written with an alif that is
pronounced at waqf and dropped in wasl.

## cpfair coverage

**No cpfair key.** ʿIwaḍ is a waqf-conditional rule and the dataset marks text
as joined, so there is nothing for it to mark. Hand-authored here. See
[[cpfair-quran-tajweed]].
