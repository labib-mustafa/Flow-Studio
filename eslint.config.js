import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

/**
 * Flat ESLint config for Flow Studio.
 *
 * Calibrated to pass on the current tree so CI is green from day one. A gate that is
 * red on arrival gets ignored, which is how this repo accumulated 27 type errors and
 * four competing palettes (see Docs/UI-UX-COMPLETENESS-PLAN.md §1.8).
 *
 * Rules are disabled *with a stated reason*, so re-enabling one is a deliberate
 * decision rather than an accident. The rules that catch real bugs stay as errors.
 */
export default tseslint.config(
  {
    ignores: [
      // Build output and packaging artifacts
      'dist/**',
      'dist-server/**',
      'release/**',
      'build-release/**',
      'FlowStudio-Production/**',
      'Flow-Studio-Windows-x64/**',
      'node_modules/**',
      'public/**',
      // One-off local exports / scratch dirs. Not project source.
      'Labib778/**',
      'Stitch/**',
      'Test it First/**',
      // AI assistant and IDE state (also gitignored)
      '.agents/**',
      '.kiro/**',
      '.cursor/**',
      '.buyer-execution-hooks/**',
    ],
  },

  // Plain JS / CommonJS: Electron main process, build helpers, config files.
  {
    files: ['**/*.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-empty': 'off',
      'no-constant-condition': 'warn',
      // main.cjs sanitises filenames with an intentional control-character range and an
      // escaped path separator. Both are deliberate; keep them visible but non-blocking.
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
    },
  },

  // TypeScript / TSX. JS recommended is deliberately NOT applied here: `no-undef`
  // does not understand type-only globals and produces false positives that would
  // bury real findings. TypeScript itself already catches undefined identifiers.
  ...tseslint.configs.recommended.map((c) => ({ ...c, files: ['**/*.{ts,tsx}'] })),

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.browser, ...globals.node },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // --- High-signal correctness rules. Keep as errors. ---
      // These caught two real "Rendered more hooks than during the previous render"
      // crashes (FileExplorer, ProjectHeader) and a no-op store assignment (teamStore).
      'react-hooks/rules-of-hooks': 'error',
      'no-self-assign': 'error',
      'no-constant-binary-expression': 'error',
      'no-unused-expressions': 'error',

      // --- Calibrated. Reason required if changed. ---
      'react-hooks/exhaustive-deps': 'warn',

      // `any` is used pervasively at store and tool boundaries. Enabling this today
      // yields hundreds of findings that would drown the signal. Tighten per-directory.
      '@typescript-eslint/no-explicit-any': 'off',

      // Never linted before, so unused-symbol noise is high and low-signal.
      // Warning keeps it visible without blocking the build.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // The Electron main process and a few dynamic-require paths legitimately use
      // require() inside TS files.
      '@typescript-eslint/no-require-imports': 'off',

      // ts-ignore/ts-expect-error count is being driven down by the type-error
      // cleanup; visible as a warning rather than a hard failure.
      '@typescript-eslint/ban-ts-comment': 'warn',

      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',

      // Lexical declarations in `case` blocks without braces. A real (if minor)
      // scoping footgun, but fixing it means touching 14 switch bodies' control flow.
      'no-case-declarations': 'warn',
      'no-control-regex': 'warn',
      'no-useless-escape': 'warn',
      'no-empty': 'off',
    },
  },
);
