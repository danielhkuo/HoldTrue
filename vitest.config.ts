import { defineConfig } from 'vitest/config'

// Every module under src/ is plain TypeScript with no Electron imports, so the whole
// suite runs in a plain Node environment. A module that needs Electron loaded to test
// has its seam in the wrong place — see AGENTS.md, Testing.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    // Coverage is a gap-finder, never a target: controlling for suite size its
    // correlation with fault detection is near zero. Low is signal, high is not.
    // Deliberately no `thresholds` key — a threshold would make it a target.
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
  },
})
