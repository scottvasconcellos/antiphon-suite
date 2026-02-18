/** @type {import('tailwindcss').Config} */
import designSystemConfig from '@antiphon/design-system/tailwind.config.js';

export default {
  ...designSystemConfig,
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    // Include design system components
    '../../packages/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
};
