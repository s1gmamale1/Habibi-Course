import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local agent-tooling dirs (ruflo/claude-flow), not project code:
    ".claude/**",
    ".claude-flow/**",
    ".swarm/**",
    // Git worktrees live at .worktrees/<branch>/ inside the repo, so each is a
    // second full copy of the project. Linting them means this branch's gate
    // reports another branch's errors — misleading, and it hides your own.
    // A worktree lints itself from its own root, where this pattern does not match.
    ".worktrees/**",
  ]),
]);

export default eslintConfig;
