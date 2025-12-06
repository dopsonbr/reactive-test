// tools/eslint-plugin-reactive/rules/require-accessible-controls.js
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce accessibility patterns for interactive controls.',
      recommended: true,
    },
    messages: {
      missingRole:
        'Element with onClick handler must have a role attribute (e.g., role="button").',
      missingAriaLabel:
        'Interactive element missing accessible label. Add aria-label or aria-labelledby.',
      unsafeBlankTarget:
        'Links with target="_blank" must include rel="noopener noreferrer" for security.',
      clickableNonInteractive:
        'Non-interactive element "{{element}}" has onClick. Use <button> or add role.',
    },
    schema: [],
  },
  create(context) {
    const interactiveElements = new Set([
      'button',
      'a',
      'input',
      'select',
      'textarea',
      'Button',
    ]);

    function hasAttribute(node, name) {
      return node.attributes.some(
        (attr) => attr.type === 'JSXAttribute' && attr.name.name === name
      );
    }

    function getAttributeValue(node, name) {
      const attr = node.attributes.find(
        (attr) => attr.type === 'JSXAttribute' && attr.name.name === name
      );
      if (!attr || !attr.value) return null;
      if (attr.value.type === 'Literal') return attr.value.value;
      return true; // Expression exists
    }

    return {
      JSXOpeningElement(node) {
        const elementName = node.name.name;
        if (!elementName || typeof elementName !== 'string') return;

        const hasOnClick = hasAttribute(node, 'onClick');
        const hasRole = hasAttribute(node, 'role');
        const isInteractive = interactiveElements.has(elementName);

        // Rule: onClick on non-interactive element needs role
        if (hasOnClick && !isInteractive && !hasRole) {
          context.report({
            node,
            messageId: 'clickableNonInteractive',
            data: { element: elementName },
          });
        }

        // Rule: target="_blank" needs rel
        if (elementName.toLowerCase() === 'a') {
          const target = getAttributeValue(node, 'target');
          const rel = getAttributeValue(node, 'rel');

          if (target === '_blank') {
            if (!rel || (typeof rel === 'string' && !rel.includes('noopener'))) {
              context.report({
                node,
                messageId: 'unsafeBlankTarget',
              });
            }
          }
        }
      },
    };
  },
};
