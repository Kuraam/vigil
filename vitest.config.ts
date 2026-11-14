import { defineConfig } from 'vitest/config'

// Unit tests cover the pure domain layer (types, data, lib), so no React or Tailwind plugins are needed.
// Run via `npm test` (scripts/vitest.mjs) so the Windows drive-letter fix applies.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
})
