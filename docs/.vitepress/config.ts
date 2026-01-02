import { defineConfig } from "vitepress";
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons";
import llms from "vitepress-plugin-llms";

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Ink Stepper",
  description: "A robust, flexible step-by-step wizard component for Ink CLI applications.",
  base: "/ink-stepper/", // Assuming deployment to GitHub Pages at this path

  markdown: {
    config(md) {
      md.use(groupIconMdPlugin);
    },
  },

  vite: {
    plugins: [
      groupIconVitePlugin(),
      llms({
        baseUrl: "https://archcorsair.github.io/ink-stepper",
        force: true,
      }),
    ],
  },

  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: "Home", link: "/" },
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/api/components" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "Introduction",
          items: [
            { text: "Getting Started", link: "/guide/getting-started" },
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
      ],
      "/api/": [
        {
          text: "API Reference",
          items: [
            { text: "Components", link: "/api/components" },
            { text: "Hooks", link: "/api/hooks" },
            { text: "Types", link: "/api/types" },
          ],
        },
      ],
    },

    socialLinks: [{ icon: "github", link: "https://github.com/archcorsair/ink-stepper" }],

    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright © 2023-present",
    },
  },
});
