/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: "stories/**/*.stories.tsx",
  outDir: "dist-ladle",
  addons: {
    a11y: { enabled: true },
    action: { enabled: true },
    control: { enabled: true },
    ladle: { enabled: true },
    mode: { enabled: true },
    rtl: { enabled: true },
    source: { enabled: true },
    theme: { enabled: true },
    width: { enabled: true },
  },
};
