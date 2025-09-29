export default {
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [
      'src/polyfills.ts'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'coverage/**',
        'dist/**',
        '__tests__/**',
        '*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
        '**/*.d.ts',
        // types-only files (no runtime code)
        'src/**/types.ts',
        'src/@types/**',
        '**/node_modules/**',
        'vitest.config.ts',
        'rollup.config.js'
      ],
      include: [
        'src/**/*.{js,ts}'
      ]
    }
  }
}