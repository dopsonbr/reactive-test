import nx from '@nx/eslint-plugin';
import reactivePlugin from './tools/eslint-plugin-reactive/index.js';

export default [
  {
    files: ['**/*.json'],
    // Override or add rules here
    rules: {},
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
      "ignores": [
        "**/dist",
        "**/build",
        "**/node_modules",
        "**/target",
        "**/out-tsc",
        "**/vite.config.*.timestamp*",
        "**/vitest.config.*.timestamp*"
      ]
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Type-based constraints
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
                'type:model',
              ],
            },
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: [
                'type:feature',
                'type:ui',
                'type:data-access',
                'type:util',
                'type:model',
              ],
            },
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util', 'type:model'],
            },
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: [
                'type:data-access',
                'type:util',
                'type:model',
              ],
            },
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util', 'type:model'],
            },
            {
              sourceTag: 'type:model',
              onlyDependOnLibsWithTags: ['type:model'],
            },
            // Scope-based constraints
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['scope:shared'],
            },
            {
              sourceTag: 'scope:ecommerce',
              onlyDependOnLibsWithTags: ['scope:ecommerce', 'scope:shared'],
            },
            {
              sourceTag: 'scope:pos',
              onlyDependOnLibsWithTags: ['scope:pos', 'scope:shared'],
            },
            {
              sourceTag: 'scope:admin',
              onlyDependOnLibsWithTags: ['scope:admin', 'scope:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  // Custom reactive plugin for frontend guardrails
  {
    plugins: {
      reactive: reactivePlugin,
    },
  },
  // Apply custom rules to TypeScript/JavaScript files
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      // Design tokens - warn for now to allow gradual adoption
      'reactive/no-hardcoded-colors': 'warn',

      // Barrel exports (feature folders only)
      'reactive/no-barrel-exports': [
        'error',
        {
          featureFolderPattern: 'features/',
        },
      ],

      // Accessibility
      'reactive/require-accessible-controls': 'warn',

      // TanStack Query
      'reactive/tanstack-query-guardrails': [
        'error',
        {
          maxRetries: 3,
        },
      ],

      // Feature test co-location (warn only)
      'reactive/require-colocated-test': 'warn',
    },
  },
  // Stricter rules for UI libs
  {
    files: ['libs/frontend/shared-ui/**/*.tsx'],
    rules: {
      'reactive/no-hardcoded-colors': 'error',
      // UI libs should never have barrel exports
      'reactive/no-barrel-exports': 'error',
    },
  },
];
