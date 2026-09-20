const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'dist/*',
      'dist-e2e/*',
      'scripts/*',
      '.expo/*',
      'e2e/*',
      'playwright-report/*',
      'src/core/api/schema.d.ts',
    ],
  },
  {
    // Layering: core and shared never reach into features; features never reach into routes.
    files: ['src/core/**/*.{ts,tsx}', 'src/shared/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/features/*', '@/app/*'],
              message: 'core and shared must not depend on features or routes.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/features/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [{ group: ['@/app/*'], message: 'features must not depend on routes.' }],
        },
      ],
    },
  },
]);
