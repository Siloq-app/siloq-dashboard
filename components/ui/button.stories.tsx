import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'default',
        'destructive',
        'outline',
        'secondary',
        'ghost',
        'link',
      ],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon'],
    },
    asChild: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default button
export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
    asChild: false,
  },
};

// Secondary button
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary',
  },
};

// Destructive button
export const Destructive: Story = {
  args: {
    variant: 'destructive',
    children: 'Destructive',
  },
};

// Outline button
export const Outline: Story = {
  args: {
    variant: 'outline',
    children: 'Outline',
  },
};

// Ghost button
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost',
  },
};

// Link button
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link',
  },
};

// Small button
export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

// Large button
export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

// Icon button
export const Icon: Story = {
  args: {
    size: 'icon',
    children: '🔥',
  },
};

// With icon
export const WithIcon: Story = {
  args: {
    children: (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
        Button with Icon
      </>
    ),
  },
};

// As link
export const AsLink: Story = {
  args: {
    asChild: true,
    children: (
      <a href="https://ui.shadcn.com" target="_blank" rel="noopener noreferrer">
        Visit shadcn/ui
      </a>
    ),
  },
};

// Disabled state
export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled',
  },
};

// Loading state (simulated)
export const Loading: Story = {
  args: {
    children: (
      <>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="animate-spin"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
        </svg>
        Loading...
      </>
    ),
  },
};
