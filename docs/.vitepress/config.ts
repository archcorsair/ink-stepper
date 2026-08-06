import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llmstxt, { copyOrDownloadAsMarkdownButtons } from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ink Stepper",
  description: "A step-by-step wizard/stepper component for Ink terminal applications",
  base: "/ink-stepper/",
  lastUpdated: true,
  sitemap: { hostname: "https://archcorsair.github.io/ink-stepper/" },

  head: [
    [
      "link",
      {
        rel: "icon",
        href: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3E%3Ctext y='13' font-size='13'%3E%E2%97%89%3C/text%3E%3C/svg%3E",
      },
    ],
    ["meta", { name: "theme-color", content: "#6b7280" }],
    ["meta", { property: "og:title", content: "Ink Stepper" }],
    [
      "meta",
      { property: "og:description", content: "A step-by-step wizard/stepper component for Ink terminal applications" },
    ],
    ["meta", { property: "og:url", content: "https://archcorsair.github.io/ink-stepper/" }],
  ],

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

    editLink: {
      pattern: "https://github.com/archcorsair/ink-stepper/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2026-present archcorsair",
    },
  },
});
