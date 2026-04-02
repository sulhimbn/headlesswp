import type { Meta, StoryObj } from '@storybook/react';
import Icon, { type IconType } from './Icon';

const meta: Meta<typeof Icon> = {
  title: 'UI/Icon',
  component: Icon,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['facebook', 'twitter', 'instagram', 'close', 'menu', 'search', 'loading', 'sun', 'moon'] as IconType[],
    },
    className: {
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Icon>;

export const Facebook: Story = {
  args: {
    type: 'facebook',
    className: 'h-6 w-6',
  },
};

export const Twitter: Story = {
  args: {
    type: 'twitter',
    className: 'h-6 w-6',
  },
};

export const Instagram: Story = {
  args: {
    type: 'instagram',
    className: 'h-6 w-6',
  },
};

export const Close: Story = {
  args: {
    type: 'close',
    className: 'h-6 w-6',
  },
};

export const Menu: Story = {
  args: {
    type: 'menu',
    className: 'h-6 w-6',
  },
};

export const Search: Story = {
  args: {
    type: 'search',
    className: 'h-6 w-6',
  },
};

export const Loading: Story = {
  args: {
    type: 'loading',
    className: 'h-6 w-6',
  },
};

export const Sun: Story = {
  args: {
    type: 'sun',
    className: 'h-6 w-6',
  },
};

export const Moon: Story = {
  args: {
    type: 'moon',
    className: 'h-6 w-6',
  },
};