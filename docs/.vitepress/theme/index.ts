import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";
import "virtual:group-icons.css";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    // Custom enhancements can go here
  },
} satisfies Theme;
