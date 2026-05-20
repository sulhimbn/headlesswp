import type { Preview } from "@storybook/nextjs-vite";
import '../src/app/globals.css';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      test: "todo",
    },

    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'hsl(var(--color-background))',
        },
        {
          name: 'dark',
          value: 'hsl(var(--color-background-dark))',
        },
      ],
    },

    nextjs: {
      router: {
        basePath: '/',
      },
    },
  },
};

export default preview;
