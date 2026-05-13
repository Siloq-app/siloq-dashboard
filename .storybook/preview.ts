import type { Preview } from '@storybook/nextjs-vite';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },

  // Custom styles for Storybook UI
  globalTypes: {
    theme: {
      description: 'Global theme for stories',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: ['light', 'dark'],
        dynamicTitle: true,
      },
    },
  },
};

// Inject custom styles into Storybook UI
const style = document.createElement('style');
style.innerHTML = `
  /* Storybook UI Custom Fonts */
  .sbdocs {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-content {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-title {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-subtitle {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-h1,
  .sbdocs-h2,
  .sbdocs-h3,
  .sbdocs-h4,
  .sbdocs-h5,
  .sbdocs-h6 {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-p {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-a {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
  }
  
  .sbdocs-li {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-code {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
  }
  
  .sbdocs-pre {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
  }
  
  .sbdocs-blockquote {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  .sbdocs-table {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
  
  /* Storybook sidebar and controls */
  .sidebar-container,
  .sidebar-content,
  .sidebar-header,
  .toc-item,
  .control-panel,
  .addon-panel {
    font-weight: 400;
    font-family: "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    letter-spacing: -0.01em;
    line-height: 1.0;
    color: rgb(0 0 0 / 80%);
  }
`;

// Add styles to head
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

export default preview;
