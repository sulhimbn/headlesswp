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
    },
    href: {
      control: 'text',
    },
  },
};

export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Default Badge',
    variant: 'default',
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

export const WithLink: Story = {
  args: {
    children: 'Category Link',
    variant: 'category',
    href: '/category/example',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="default">Default</Badge>
      <Badge variant="category">Category</Badge>
      <Badge variant="tag">Tag</Badge>
    </div>
  ),
};

export const CategoryList: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="category" href="/category/technology">Technology</Badge>
      <Badge variant="category" href="/category/business">Business</Badge>
      <Badge variant="category" href="/category/lifestyle">Lifestyle</Badge>
    </div>
  ),
};

export const TagList: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
      <Badge variant="tag">News</Badge>
      <Badge variant="tag">Update</Badge>
      <Badge variant="tag">Featured</Badge>
    </div>
  ),
};
