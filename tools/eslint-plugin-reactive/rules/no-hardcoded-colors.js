// tools/eslint-plugin-reactive/rules/no-hardcoded-colors.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow hardcoded colors, sizes, fonts. Use Tailwind tokens.',
      recommended: true,
    },
    messages: {
      noHardcodedColor:
        'Hardcoded color "{{value}}" detected. Use Tailwind color token (e.g., bg-primary, text-muted-foreground).',
      noHardcodedSize:
        'Hardcoded size "{{value}}" detected. Use Tailwind spacing token (e.g., p-4, m-2, w-full).',
      noArbitraryValue:
        'Arbitrary Tailwind value "{{value}}" detected. Use design tokens instead.',
      noInlineStyle:
        'Inline style prop detected. Use Tailwind classes instead of inline styles.',
    },
    schema: [],
  },
  create(context) {
    // Patterns for hardcoded values
    const hexColorRegex = /#[0-9a-fA-F]{3,8}\b/;
    const rgbRegex = /rgba?\s*\([^)]+\)/;
    const hslRegex = /hsla?\s*\([^)]+\)/;
    const arbitraryRegex = /\[[\w#%().,-]+\]/; // Tailwind arbitrary values like [#fff] or [12px]

    function checkClassName(node, classValue) {
      if (!classValue || typeof classValue !== 'string') return;

      // Check for hex colors
      const hexMatch = classValue.match(hexColorRegex);
      if (hexMatch) {
        context.report({
          node,
          messageId: 'noHardcodedColor',
          data: { value: hexMatch[0] },
        });
      }

      // Check for rgb/hsl
      const rgbMatch = classValue.match(rgbRegex);
      const hslMatch = classValue.match(hslRegex);
      if (rgbMatch || hslMatch) {
        const match = rgbMatch || hslMatch;
        context.report({
          node,
          messageId: 'noHardcodedColor',
          data: { value: match[0] },
        });
      }

      // Check for Tailwind arbitrary values
      const arbitraryMatch = classValue.match(arbitraryRegex);
      if (arbitraryMatch) {
        context.report({
          node,
          messageId: 'noArbitraryValue',
          data: { value: arbitraryMatch[0] },
        });
      }
    }

    return {
      JSXAttribute(node) {
        // Check className attribute
        if (node.name.name === 'className') {
          if (!node.value) return;

          let classValue = '';
          if (node.value.type === 'Literal') {
            classValue = node.value.value;
          } else if (node.value.type === 'JSXExpressionContainer') {
            // Check template literals
            if (node.value.expression.type === 'TemplateLiteral') {
              classValue = node.value.expression.quasis
                .map((q) => q.value.raw)
                .join(' ');
            }
          }

          checkClassName(node, classValue);
        }

        // Check style prop for inline styles
        if (node.name.name === 'style') {
          context.report({
            node,
            messageId: 'noInlineStyle',
          });
        }
      },
    };
  },
};
