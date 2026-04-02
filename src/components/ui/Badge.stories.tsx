import type { Meta, StoryObj } from '@storybook/react'
import Badge from '@/components/ui/Badge'

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
      description: 'Optional link URL (renders as anchor)',
    },
    children: {
      control: 'text',
      description: 'Badge label text',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A badge component for displaying categories and tags.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: 'Default Badge',
    variant: 'default',
  },
}

export const Category: Story = {
  args: {
    children: 'Technology',
    variant: 'category',
  },
}

export const Tag: Story = {
  args: {
    children: 'JavaScript',
    variant: 'tag',
  },
}

export const AsLink: Story = {
  args: {
    children: 'Category Link',
    variant: 'category',
    href: '/category/technology',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Badge variant="default">Default</Badge>
      <Badge variant="category">Category</Badge>
      <Badge variant="tag">Tag</Badge>
    </div>
  ),
}