import tseslint from 'typescript-eslint';
export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/.expo/**', '**/.nx/**', '**/bundle/**'] },
  ...tseslint.configs.recommended,
  { files: ['packages/native/src/**/*.ts', 'apps/*/src/**/*.ts'], rules: {
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-restricted-imports': ['error', { paths: ['@neural-ui/core', 'zone.js', '@angular/platform-browser', '@angular/animations'] }],
  } },
);
