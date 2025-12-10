import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Reactive Platform',
  description: 'Platform documentation for developers and AI agents',
  srcExclude: ['**/archive/**'],

  themeConfig: {
    nav: [
      { text: 'Standards', link: '/standards/' },
      { text: 'Plans', link: '/plans/active/' },
      { text: 'ADRs', link: '/ADRs/' },
      { text: 'Guides', link: '/end-user-guides/' },
      { text: 'Repo Explorer', link: '/repo-explorer/' },
    ],

    sidebar: {
      '/standards/': [
        {
          text: 'Standards',
          items: [
            { text: 'Overview', link: '/standards/' },
            { text: 'Code Style', link: '/standards/code-style' },
            { text: 'Documentation', link: '/standards/documentation' },
            {
              text: 'Backend',
              collapsed: false,
              items: [
                { text: 'Architecture', link: '/standards/backend/architecture' },
                { text: 'Caching', link: '/standards/backend/caching' },
                { text: 'Error Handling', link: '/standards/backend/error-handling' },
                { text: 'Models', link: '/standards/backend/models' },
                { text: 'Security', link: '/standards/backend/security' },
                { text: 'Validation', link: '/standards/backend/validation' },
              ],
            },
            {
              text: 'Frontend',
              collapsed: false,
              items: [
                { text: 'Architecture', link: '/standards/frontend/architecture' },
                { text: 'Components', link: '/standards/frontend/components' },
                { text: 'State Management', link: '/standards/frontend/state-management' },
                { text: 'Testing', link: '/standards/frontend/testing' },
              ],
            },
          ],
        },
      ],
      '/plans/': [
        {
          text: 'Plans',
          items: [
            { text: 'Active', link: '/plans/active/' },
            { text: 'Completed', link: '/plans/completed/' },
          ],
        },
      ],
      '/ADRs/': [
        {
          text: 'ADRs',
          items: [
            { text: 'Index', link: '/ADRs/' },
          ],
        },
      ],
      '/end-user-guides/': [
        {
          text: 'Guides',
          items: [
            { text: 'POS System', link: '/end-user-guides/pos-system/' },
            { text: 'Self-Checkout Kiosk', link: '/end-user-guides/self-checkout-kiosk/' },
          ],
        },
      ],
      '/repo-explorer/': [
        {
          text: 'Repository',
          items: [
            { text: 'Overview', link: '/repo-explorer/' },
          ],
        },
      ],
    },

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  ignoreDeadLinks: true,
});
