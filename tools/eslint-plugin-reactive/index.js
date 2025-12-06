// tools/eslint-plugin-reactive/index.js
module.exports = {
  meta: {
    name: 'eslint-plugin-reactive',
    version: '0.0.1',
  },
  rules: {
    'no-hardcoded-colors': require('./rules/no-hardcoded-colors'),
    'no-barrel-exports': require('./rules/no-barrel-exports'),
    'require-accessible-controls': require('./rules/require-accessible-controls'),
    'tanstack-query-guardrails': require('./rules/tanstack-query-guardrails'),
    'require-colocated-test': require('./rules/require-colocated-test'),
  },
  configs: {
    recommended: {
      plugins: ['reactive'],
      rules: {
        'reactive/no-hardcoded-colors': 'error',
        'reactive/no-barrel-exports': 'error',
        'reactive/require-accessible-controls': 'error',
        'reactive/tanstack-query-guardrails': 'error',
        'reactive/require-colocated-test': 'warn',
      },
    },
  },
};
