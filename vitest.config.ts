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