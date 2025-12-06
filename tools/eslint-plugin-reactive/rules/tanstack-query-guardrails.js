// tools/eslint-plugin-reactive/rules/tanstack-query-guardrails.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce TanStack Query best practices.',
      recommended: true,
    },
    messages: {
      missingQueryKey:
        'useQuery must have an explicit queryKey array as first element of options.',
      excessiveRetries:
        'Retry count {{count}} exceeds recommended maximum of {{max}}.',
      missingErrorType:
        'Query error handling should use typed ApiError. Import and use ApiError class.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          maxRetries: { type: 'number' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const maxRetries = options.maxRetries ?? 3;

    return {
      CallExpression(node) {
        const calleeName = node.callee.name;
        if (calleeName !== 'useQuery' && calleeName !== 'useMutation') {
          return;
        }

        const args = node.arguments;
        if (args.length === 0) return;

        const optionsArg = args[0];
        if (optionsArg.type !== 'ObjectExpression') return;

        const properties = optionsArg.properties;

        // Check for queryKey (useQuery only)
        if (calleeName === 'useQuery') {
          const hasQueryKey = properties.some(
            (p) =>
              p.type === 'Property' &&
              p.key &&
              (p.key.name === 'queryKey' ||
                (p.key.type === 'Literal' && p.key.value === 'queryKey'))
          );
          if (!hasQueryKey) {
            context.report({
              node,
              messageId: 'missingQueryKey',
            });
          }
        }

        // Check retry count
        const retryProp = properties.find(
          (p) =>
            p.type === 'Property' &&
            p.key &&
            (p.key.name === 'retry' ||
              (p.key.type === 'Literal' && p.key.value === 'retry'))
        );
        if (retryProp && retryProp.value && retryProp.value.type === 'Literal') {
          const retryCount = retryProp.value.value;
          if (typeof retryCount === 'number' && retryCount > maxRetries) {
            context.report({
              node: retryProp,
              messageId: 'excessiveRetries',
              data: { count: retryCount, max: maxRetries },
            });
          }
        }
      },
    };
  },
};
