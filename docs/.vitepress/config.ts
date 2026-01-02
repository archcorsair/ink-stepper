import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt, { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ink Stepper",
  description: "A robust, flexible step-by-step wizard component for Ink CLI applications.",
  base: "/ink-stepper/", // Assuming deployment to GitHub Pages at this path

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin);
      md.use(copyOrDownloadAsMarkdownButtons);
    },
  },

  vite: {
    plugins: [
      groupIconVitePlugin(),
      llmstxt({
        excludeIndexPage: false,
      }),
    ],
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Guide", link: "/" },
      { text: "API", link: "/api/components" },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [
          { text: "Getting Started", link: "/" },
          { text: "Basic Usage", link: "/guide/basic-usage" },
        ],
      },
      {
        text: "Advanced",
        items: [
          { text: "Validation", link: "/guide/validation" },
          { text: "Lifecycle Hooks", link: "/guide/lifecycle" },
          { text: "Input Coordination", link: "/guide/input-coordination" },
          { text: "Controlled Mode", link: "/guide/controlled-mode" },
          { text: "Customization", link: "/guide/customization" },
        ],
      },
      {
        text: "API Reference",
        items: [
          { text: "Components", link: "/api/components" },
          { text: "Hooks", link: "/api/hooks" },
          { text: "Types", link: "/api/types" },
        ],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/archcorsair/ink-stepper" }],

    search: {
      provider: "local",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present",
    },
  },
});
