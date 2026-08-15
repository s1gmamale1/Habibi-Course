/**
 * Resolve a `content/lessons/*.json` `kind: "rule"` slide's `ruleId` to a
 * canonical rule concept (an id `RULE_CONCEPTS` in `src/generated/concepts.ts`
 * carries).
 *
 * The lesson JSON was authored against the render palette (the
 * `cpfair-quran-tajweed` dataset), not the library's canonical ids —
 * `"ikhfa"` in a lesson means `ikhfa_haqiqi`, `"madd_2"` means `madd_tabii`,
 * and so on. Every rule note that needs this translation documents it in its
 * own frontmatter as `cpfair_key:`, and the library is the source (ADR-003),
 * so `cpfairByKey` is built by `build-concepts.mjs` straight from that
 * frontmatter rather than typed out by hand here — a hand-typed copy is
 * exactly the kind of thing that drifts from the library silently.
 *
 * @param {string} rawId the slide's `ruleId`, as written in the lesson JSON
 * @param {string} lessonId the lesson carrying the slide, e.g. `"4-05"`
 * @param {string} sourceFile the lesson JSON path, for the error message
 * @param {ReadonlySet<string>} ruleIds every canonical rule id
 * @param {ReadonlyMap<string, {id: string, taughtIn: string | null}[]>} cpfairByKey
 * @returns {string} a canonical rule id
 */
export function resolveRuleSlideId(rawId, lessonId, sourceFile, ruleIds, cpfairByKey) {
  if (ruleIds.has(rawId)) return rawId;
  const candidates = cpfairByKey.get(rawId);
  if (!candidates || candidates.length === 0) {
    // Fail loudly: a silent drop here is how the previous concept space
    // (`TAJWEED_RULES`, the span-colour palette) went stale in the first
    // place — a lesson quietly lost credit for a rule it actually taught.
    throw new Error(
      `build-concepts: ${sourceFile} (lesson ${lessonId}) has a rule slide with ` +
        `ruleId "${rawId}", which is neither a canonical rule id nor a known ` +
        `cpfair_key alias in library/02-Rules. Add \`cpfair_key: ${rawId}\` to the ` +
        `rule note it means, or fix the lesson JSON.`,
    );
  }
  if (candidates.length === 1) return candidates[0].id;
  // Ambiguous key (only "qalqalah" today: qalqalah_sughra and qalqalah_kubra
  // both declare `cpfair_key: qalqalah`, because the upstream dataset
  // doesn't distinguish the two degrees). Prefer the candidate this exact
  // lesson introduces — its own `taught_in` names this lesson. Otherwise
  // default to whichever candidate was taught in the earliest lesson: every
  // other lesson's rule-slide text for "qalqalah" describes the
  // earlier-taught degree (mid-word, no pause), verified by reading each one.
  const ownIntro = candidates.find((c) => c.taughtIn === lessonId);
  if (ownIntro) return ownIntro.id;
  return [...candidates].sort((a, b) => (a.taughtIn ?? "").localeCompare(b.taughtIn ?? ""))[0].id;
}
