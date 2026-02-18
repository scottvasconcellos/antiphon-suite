import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.mdx", "../stories/**/*.stories.tsx"],
  addons: ["@storybook/addon-essentials"],
  framework: "@storybook/react-vite",
};

export default config;
