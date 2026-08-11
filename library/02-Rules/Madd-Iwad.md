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
status: verified
sources: ["[[Tuhfat-al-Atfal]]", "[[Muqaddimah-Jazariyyah]]", "[[Shatibiyyah]]", "[[Nihayat-al-Qawl-al-Mufid]]"]
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

> ### ✅ Status: verified 2026-08-11 — but the name means something else in the source
>
> **[[Nihayat-al-Qawl-al-Mufid]] states the mechanism directly**, printed page ٩٤,
> quoting *"some of the commentators on al-Jazariyyah"* on the alif sākinah:
> **وتكون عوضا عن التنوين المنصوب في حال الوقف** — *"and it stands as a compensation
> for the tanwīn manṣūb in the state of waqf."* That is this rule, in a citable classical
> source, which is what this note previously lacked.
>
> **The length is still derived, and honestly so.** That sentence assigns no count. The
> 2 ḥarakāt follow from the alif being sākinah with a fatḥah before it — the definition
> of a madd letter, hence [[Madd-Tabii]], which **is** in the vendored matns. The
> substitution is transmitted; the length comes from a transmitted definition.
>
> The earlier evidence still stands and agrees. [[Shatibiyyah]] v. 830 locates the sakt
> of al-Kahf **عَلَى أَلِفِ التَّنْوِينِ فِي عِوَجاً** — the matn can only speak of
> *"the alif of the tanwīn"* if stopping on tanwīn fatḥ yields an alif.
>
> ### ⚠ The source's own مد العوض is a different rule
>
> **[[Nihayat-al-Qawl-al-Mufid]] has a heading مد العوض** — item 20 of its madd taxonomy,
> printed page ١٩٥ — **and it is not this rule.** It is the hāʾ al-kināyah standing in
> compensation for a yāʾ that a jussive deleted, as in يُؤَدِّهِۦٓ إِلَيْكَ and
> نُوَلِّهِۦ مَا تَوَلَّىٰ. *ʿIwaḍ* means compensation, and the tradition uses the word
> for both compensations.
>
> **What this course teaches under the name is the modern usage** — what every
> contemporary manual, and every teacher the student will meet, also means by it.
> Nothing about the rule changes. But **cite page ٩٤ for it, never page ١٩٥**, and if a
> student meets the older sense somewhere, the collision is the explanation.

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
