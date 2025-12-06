// tools/stylelint-plugin-tokens/index.js
import stylelint from 'stylelint';

const ruleName = 'reactive/no-arbitrary-values';
const messages = stylelint.utils.ruleMessages(ruleName, {
  rejected: (value) =>
    `Arbitrary value "${value}" is not allowed. Use design tokens.`,
});

const meta = {
  url: 'https://github.com/reactive-platform/docs/design-tokens',
};

const ruleFunction = (primaryOption) => {
  return (root, result) => {
    const validOptions = stylelint.utils.validateOptions(result, ruleName, {
      actual: primaryOption,
      possible: [true, false],
    });

    if (!validOptions || !primaryOption) return;

    // Pattern for Tailwind arbitrary values
    const arbitraryPattern = /\[[\w#%().,-]+\]/g;

    root.walkDecls((decl) => {
      const matches = decl.value.match(arbitraryPattern);
      if (matches) {
        matches.forEach((match) => {
          stylelint.utils.report({
            message: messages.rejected(match),
            node: decl,
            result,
            ruleName,
          });
        });
      }
    });

    // Also check @apply directives
    root.walkAtRules('apply', (atRule) => {
      const matches = atRule.params.match(arbitraryPattern);
      if (matches) {
        matches.forEach((match) => {
          stylelint.utils.report({
            message: messages.rejected(match),
            node: atRule,
            result,
            ruleName,
          });
        });
      }
    });
  };
};

ruleFunction.ruleName = ruleName;
ruleFunction.messages = messages;
ruleFunction.meta = meta;

export default stylelint.createPlugin(ruleName, ruleFunction);
