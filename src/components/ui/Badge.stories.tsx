import type { Meta, StoryObj } from '@storybook/react';
import Badge from './Badge';

const meta: Meta<typeof Badge> = {
  title: 'UI/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['category', 'tag', 'default'],
      description: 'The visual style variant of the badge',
    },
    href: {
      control: 'text',
      description: 'Optional link URL (renders as anchor if provided)',
    },
    children: {
      control: 'text',
      description: 'Badge text content',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A badge component for displaying categories and tags. Uses design tokens from globals.css.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default Badge',
  },
};

export const Category: Story = {
  args: {
    children: 'Category',
    variant: 'category',
  },
};

export const Tag: Story = {
  args: {
    children: 'Tag',
    variant: 'tag',
  },
};

export const WithHref: Story = {
  args: {
    children: 'Clickable Badge',
    href: '/category/example',
  },
};

export const CategoryWithHref: Story = {
  args: {
    children: 'News',
    variant: 'category',
    href: '/category/news',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="category">Category</Badge>
      <Badge variant="tag">Tag</Badge>
    </div>
  ),
};

export const LinkableBadges: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="category" href="/category/technology">Technology</Badge>
      <Badge variant="category" href="/category/business">Business</Badge>
      <Badge variant="tag" href="/tag/featured">Featured</Badge>
      <Badge variant="tag" href="/tag/trending">Trending</Badge>
    </div>
  ),
};
