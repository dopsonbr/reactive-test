// tools/eslint-plugin-reactive/rules/no-barrel-exports.js
export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow barrel exports (export *) in feature folders.',
      recommended: true,
    },
    messages: {
      noBarrelExport:
        'Barrel export "export * from" is not allowed in feature folders. Use named exports.',
      preferDirectImport:
        'Prefer direct import from module instead of barrel index.',
    },
    schema: [
      {
        type: 'object',
        properties: {
          featureFolderPattern: { type: 'string' },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const options = context.options[0] || {};
    const featurePattern = new RegExp(
      options.featureFolderPattern || 'features/'
    );
    const filename = context.getFilename();

    // Only apply to feature folders
    const isFeatureFolder = featurePattern.test(filename);

    return {
      ExportAllDeclaration(node) {
        if (isFeatureFolder) {
          context.report({
            node,
            messageId: 'noBarrelExport',
          });
        }
      },
    };
  },
};
