// tools/eslint-plugin-reactive/index.js
import noHardcodedColors from './rules/no-hardcoded-colors.js';
import noBarrelExports from './rules/no-barrel-exports.js';
import requireAccessibleControls from './rules/require-accessible-controls.js';
import tanstackQueryGuardrails from './rules/tanstack-query-guardrails.js';
import requireColocatedTest from './rules/require-colocated-test.js';

export default {
  meta: {
    name: 'eslint-plugin-reactive',
    version: '0.0.1',
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-barrel-exports': noBarrelExports,
    'require-accessible-controls': requireAccessibleControls,
    'tanstack-query-guardrails': tanstackQueryGuardrails,
    'require-colocated-test': requireColocatedTest,
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
