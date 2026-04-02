import type { Meta, StoryObj } from '@storybook/react'
import Skeleton from '@/components/ui/Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'rounded'],
      description: 'The variant of the skeleton loader',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A skeleton loader component for loading states.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    className: 'h-32',
  },
}

export const Rounded: Story = {
  args: {
    variant: 'rounded',
    className: 'h-32',
  },
}

export const Circular: Story = {
  args: {
    variant: 'circular',
    className: 'h-12 w-12',
  },
}

export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-3/4',
  },
}

export const TextLines: Story = {
  render: () => (
    <div className="space-y-3 w-64">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-5/6" />
      <Skeleton variant="text" className="w-4/6" />
    </div>
  ),
}

export const CardSkeleton: Story = {
  render: () => (
    <div className="w-72 rounded-lg overflow-hidden border border-gray-200 p-4 space-y-3">
      <Skeleton variant="rounded" className="h-40 w-full" />
      <Skeleton variant="text" className="w-3/4" />
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-2/3" />
    </div>
  ),
}