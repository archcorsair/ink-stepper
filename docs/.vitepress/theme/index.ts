import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
// @ts-expect-error
import CopyOrDownloadAsMarkdownButtons from "vitepress-plugin-llms/vitepress-components/CopyOrDownloadAsMarkdownButtons.vue";
import { h } from "vue";
import "virtual:group-icons.css";

export default {
  extends: DefaultTheme,
  Layout() {
    return h(DefaultTheme.Layout, null, {
      "nav-bar-content-after": () => h(CopyOrDownloadAsMarkdownButtons),
    });
  },
  enhanceApp({ app }) {
    // Custom enhancements can go here
  },
} satisfies Theme;
