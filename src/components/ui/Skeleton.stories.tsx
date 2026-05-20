import type { Meta, StoryObj } from '@storybook/react';
import Skeleton from './Skeleton';

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['text', 'circular', 'rectangular', 'rounded'],
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Skeleton>;

export const Text: Story = {
  args: {
    variant: 'text',
    className: 'w-64',
  },
};

export const Circular: Story = {
  args: {
    variant: 'circular',
    className: 'w-12 h-12',
  },
};

export const Rectangular: Story = {
  args: {
    variant: 'rectangular',
    className: 'w-64 h-32',
  },
};

export const Rounded: Story = {
  args: {
    variant: 'rounded',
    className: 'w-64 h-32',
  },
};

export const CustomWidth: Story = {
  args: {
    variant: 'text',
    className: 'w-96',
  },
};

export const MultipleLines: Story = {
  render: () => (
    <div className="space-y-2">
      <Skeleton variant="text" className="w-full" />
      <Skeleton variant="text" className="w-4/5" />
      <Skeleton variant="text" className="w-3/5" />
    </div>
  ),
};