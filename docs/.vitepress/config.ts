import { defineConfig } from 'vitepress';
import { generateSidebar } from 'vitepress-sidebar';
import { generateRepoExplorerSidebar } from '../../tools/docs-explorer/generate-sidebar.js';

// Generate sidebars for non-repo-explorer sections
const baseSidebar = generateSidebar([
  {
    documentRootPath: '/docs',
    scanStartPath: 'standards',
    resolvePath: '/standards/',
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
    useFolderLinkFromIndexFile: true,
    sortMenusByFrontmatterOrder: true,
    collapsed: false,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'plans/completed',
    resolvePath: '/plans/completed/',
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
    sortMenusByName: true,
    collapsed: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'plans/active',
    resolvePath: '/plans/active/',
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
    sortMenusByName: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'ADRs',
    resolvePath: '/ADRs/',
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
    sortMenusByName: true,
  },
  {
    documentRootPath: '/docs',
    scanStartPath: 'end-user-guides',
    resolvePath: '/end-user-guides/',
    useTitleFromFileHeading: true,
    useFolderTitleFromIndexFile: true,
    useFolderLinkFromIndexFile: true,
    collapsed: false,
  },
]);

// Custom sidebar for repo-explorer with collapsed paths
const repoExplorerSidebar = await generateRepoExplorerSidebar();

// Merge all sidebars
const sidebar = {
  ...baseSidebar,
  ...repoExplorerSidebar,
};

export default defineConfig({
  title: 'Reactive Platform',
  description: 'Platform documentation for developers and AI agents',
  srcExclude: ['**/archive/**'],

  themeConfig: {
    nav: [
      { text: 'Standards', link: '/standards/' },
      { text: 'Plans', link: '/plans/completed/' },
      { text: 'ADRs', link: '/ADRs/' },
      { text: 'Guides', link: '/end-user-guides/' },
      { text: 'Repo Explorer', link: '/repo-explorer/' },
    ],

    sidebar,

    search: {
      provider: 'local',
    },

    outline: {
      level: [2, 3],
    },
  },

  ignoreDeadLinks: true,
});
