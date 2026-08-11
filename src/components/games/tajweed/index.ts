/**
 * Side-effect barrel: importing this module runs each drill's `registerGame(...)` call.
 *
 * This exists because without it the seven tajweed drills were **unreachable in the built
 * app**. Each registers itself at module scope, but nothing outside their own test files
 * imported them — so the modules never loaded, the registry stayed empty, and the bundler
 * tree-shook roughly 2,200 lines out entirely. The tests passed the whole time, because a
 * test importing a component directly *does* fire its registration.
 *
 * 33 published lessons already name these drills in their `games:` field, so the content
 * side was never the gap. Found by an independent review of PR #5, 2026-08-11.
 *
 * Import it for its side effects only — `import "./tajweed"` — anywhere the registry is read.
 */
import "./SpanTapper";
import "./MaddCounter";
import "./GhunnahTimer";
import "./RuleIdentifier";
import "./FamilySorter";
import "./ConditionBuilder";
import "./ListenIdentify";

/** Every drill id this barrel registers, for tests and for validating lesson `games` fields. */
export const TAJWEED_GAME_IDS = [
  "span-tapper",
  "madd-counter",
  "ghunnah-timer",
  "rule-identifier",
  "family-sorter",
  "condition-builder",
  "listen-identify",
] as const;
