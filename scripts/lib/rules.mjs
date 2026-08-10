/** The 18 rule keys actually present in cpfair/quran-tajweed. */
export const CPFAIR_KEYS = new Set([
  "hamzat_wasl", "madd_2", "ikhfa", "ghunnah", "madd_246", "silent",
  "idghaam_ghunnah", "qalqalah", "madd_munfasil", "lam_shamsiyyah",
  "madd_muttasil", "idghaam_no_ghunnah", "idghaam_shafawi", "iqlab",
  "ikhfa_shafawi", "madd_6", "idghaam_mutajanisayn", "idghaam_mutaqaribayn",
]);

/** Rule families used for colour grouping and drill bucketing. */
export const RULE_FAMILIES = new Set([
  "preliminaries", "sifat", "tafkhim-tarqiq", "ra", "lam",
  "ghunnah", "meem-sakinah", "noon-sakinah", "idgham-theory",
  "madd", "qalqalah", "waqf", "orthography",
]);

export const NOTE_TYPES = new Set(["rule", "letter", "source", "lesson", "pedagogy", "index"]);
export const STATUSES = new Set(["draft", "needs-review", "verified"]);
export const MAKHRAJ_ZONES = new Set(["jawf", "halq", "lisan", "shafatan", "khayshum"]);
