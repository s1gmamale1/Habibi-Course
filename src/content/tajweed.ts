/**
 * The span-colour palette for rendering ayat — NOT the concept space.
 *
 * Five of these ids (`madd_2`, `madd_246`, `madd_6`, `qalqalah`, `silent`)
 * have no library note and are taught by no lesson: they are colouring
 * categories. The scheduler's concepts live in `@/generated/concepts`, which is
 * generated from the library and holds all 59 taught rules. Conflating the two
 * is what made a madd lesson generate vocabulary questions about `ا`.
 */
export const TAJWEED_RULES = [
  "hamzat_wasl", "madd_2", "ikhfa", "ghunnah", "madd_246", "silent",
  "idghaam_ghunnah", "qalqalah", "madd_munfasil", "lam_shamsiyyah",
  "madd_muttasil", "idghaam_no_ghunnah", "idghaam_shafawi", "iqlab",
  "ikhfa_shafawi", "madd_6", "idghaam_mutajanisayn", "idghaam_mutaqaribayn",
] as const;
export type RuleId = (typeof TAJWEED_RULES)[number];
export type Family = "madd" | "ghunnah" | "idgham" | "ikhfa" | "qalqalah" | "silent";

export const RULE_META: Record<RuleId, {
  ar: string; translit: string; en: string; family: Family; harakat?: number;
}> = {
  hamzat_wasl:          { ar: "همزة الوصل", translit: "Hamzat al-Waṣl", en: "Connecting Hamza", family: "silent" },
  silent:               { ar: "حرف ساكن", translit: "Ḥarf Sākin", en: "Silent", family: "silent" },
  lam_shamsiyyah:       { ar: "لام شمسية", translit: "Lām Shamsiyyah", en: "Solar Lam", family: "silent" },
  madd_2:               { ar: "مد طبيعي", translit: "Madd Ṭabīʿī", en: "Natural Prolongation", family: "madd", harakat: 2 },
  madd_246:             { ar: "مد عارض للسكون", translit: "Madd ʿĀriḍ", en: "Incidental Prolongation", family: "madd" },
  madd_munfasil:        { ar: "مد منفصل", translit: "Madd Munfaṣil", en: "Separated Prolongation", family: "madd", harakat: 4 },
  madd_muttasil:        { ar: "مد متصل", translit: "Madd Muttaṣil", en: "Connected Prolongation", family: "madd", harakat: 4 },
  madd_6:               { ar: "مد لازم", translit: "Madd Lāzim", en: "Necessary Prolongation", family: "madd", harakat: 6 },
  ghunnah:              { ar: "غنة", translit: "Ghunnah", en: "Nasalisation", family: "ghunnah", harakat: 2 },
  ikhfa:                { ar: "إخفاء", translit: "Ikhfāʾ", en: "Concealment", family: "ikhfa", harakat: 2 },
  ikhfa_shafawi:        { ar: "إخفاء شفوي", translit: "Ikhfāʾ Shafawī", en: "Labial Concealment", family: "ikhfa", harakat: 2 },
  idghaam_ghunnah:      { ar: "إدغام بغنة", translit: "Idghām bi-Ghunnah", en: "Merging with Nasalisation", family: "idgham", harakat: 2 },
  idghaam_no_ghunnah:   { ar: "إدغام بلا غنة", translit: "Idghām bilā Ghunnah", en: "Merging without Nasalisation", family: "idgham" },
  idghaam_shafawi:      { ar: "إدغام شفوي", translit: "Idghām Shafawī", en: "Labial Merging", family: "idgham", harakat: 2 },
  idghaam_mutajanisayn: { ar: "إدغام متجانسين", translit: "Idghām Mutajānisayn", en: "Homogeneous Merging", family: "idgham" },
  idghaam_mutaqaribayn: { ar: "إدغام متقاربين", translit: "Idghām Mutaqāribayn", en: "Close Merging", family: "idgham" },
  iqlab:                { ar: "إقلاب", translit: "Iqlāb", en: "Conversion", family: "ghunnah", harakat: 2 },
  qalqalah:             { ar: "قلقلة", translit: "Qalqalah", en: "Echoing", family: "qalqalah" },
};

/** Family B — the course default. Matches the Quranly app. Verified live. */
export const PALETTE_B: Record<RuleId, string> = {
  hamzat_wasl: "#AAAAAA", silent: "#AAAAAA", lam_shamsiyyah: "#AAAAAA",
  madd_2: "#537FFF", madd_munfasil: "#4050FF", madd_muttasil: "#000EBC", madd_246: "#537FFF", madd_6: "#2144C1",
  qalqalah: "#DD0008",
  ikhfa: "#9400A8", ikhfa_shafawi: "#D500B7",
  idghaam_shafawi: "#58B800", idghaam_ghunnah: "#169777", idghaam_no_ghunnah: "#169200",
  idghaam_mutajanisayn: "#8A8A8A", idghaam_mutaqaribayn: "#8A8A8A",
  iqlab: "#26BFFD", ghunnah: "#FF7E1E",
};

/**
 * Family A — Dar al-Ma'rifah printed mushaf. Red = madd, green = ghunnah.
 *
 * These hex values were NEVER sampled from a physical mushaf — the archive.org
 * scan 503s. They are faithful approximations of the *documented semantics*
 * (red madd, green ghunnah, light-blue qalqalah, grey silent), not measured
 * colours. Do not cite them as the real Dar al-Ma'rifah values; sampling the
 * actual print remains an open item.
 */
export const PALETTE_A: Record<RuleId, string> = {
  hamzat_wasl: "#9E9E9E", silent: "#9E9E9E", lam_shamsiyyah: "#9E9E9E",
  madd_2: "#C81E1E", madd_munfasil: "#C81E1E", madd_muttasil: "#C81E1E", madd_246: "#C81E1E", madd_6: "#C81E1E",
  qalqalah: "#4FA8D8",
  ikhfa: "#2E8B36", ikhfa_shafawi: "#2E8B36",
  idghaam_shafawi: "#2E8B36", idghaam_ghunnah: "#2E8B36", idghaam_no_ghunnah: "#9E9E9E",
  idghaam_mutajanisayn: "#9E9E9E", idghaam_mutaqaribayn: "#9E9E9E",
  iqlab: "#2E8B36", ghunnah: "#2E8B36",
};

/**
 * Redundant channel — survives colour-blindness and greyscale printing.
 *
 * Colour is deliberately not the only channel. 18 rules (14 visually distinct
 * ones) cannot be encoded in colour alone: categorical colour tops out around
 * 8–10 distinguishable hues, fewer under deuteranopia, and on this app's dark
 * background `#000EBC` scores 1.71 contrast, which is unreadable. So each rule
 * *family* also gets a distinct `text-decoration-style`, and the information
 * survives when the hue does not.
 */
export const UNDERLINE: Record<Family, string> = {
  madd: "solid", ghunnah: "wavy", idgham: "double",
  ikhfa: "dotted", qalqalah: "dashed", silent: "none",
};
