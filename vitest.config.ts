import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
  test: {
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    globals: true,
    // Git worktrees live at .worktrees/<branch>/ INSIDE the repo, so each one is a
    // second full copy of src/ and tests/. Without this, `npm test` runs both trees:
    // the file count doubles and another branch's failures redden this branch's gate,
    // which is both slow and actively misleading. A worktree's own runs are unaffected
    // — it has its own copy of this config and resolves the pattern from its own root.
    // Agent worktrees land in `.claude/worktrees/`, NOT the `.worktrees/` this originally
    // listed — so two agent worktrees turned one 535-test run into 1,595 tests across three
    // copies of the suite, reporting failures from branches that were not being tested.
    // Both paths are excluded because both are in use.
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.worktrees/**",
      "**/.claude/worktrees/**",
      "**/out/**",
      "**/.next/**",
    ],
  },
});
