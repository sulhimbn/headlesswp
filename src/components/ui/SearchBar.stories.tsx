import type { Meta, StoryObj } from '@storybook/react';
import SearchBar from './SearchBar';

const meta: Meta<typeof SearchBar> = {
  title: 'UI/SearchBar',
  component: SearchBar,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the search input',
    },
    isLoading: {
      control: 'boolean',
      description: 'Shows loading state',
    },
    debounceMs: {
      control: 'number',
      description: 'Debounce delay in milliseconds',
    },
    initialValue: {
      control: 'text',
      description: 'Initial value for the search input',
    },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for accessibility',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A search input component with debouncing. Uses design tokens from globals.css.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SearchBar>;

export const Default: Story = {
  args: {
    onSearch: () => {},
    placeholder: 'Search articles...',
  },
};

export const WithInitialValue: Story = {
  args: {
    onSearch: () => {},
    initialValue: 'Initial search query',
    placeholder: 'Search articles...',
  },
};

export const Loading: Story = {
  args: {
    onSearch: () => {},
    placeholder: 'Search articles...',
    isLoading: true,
  },
};

export const CustomDebounce: Story = {
  args: {
    onSearch: () => {},
    placeholder: 'Search with 500ms debounce...',
    debounceMs: 500,
  },
};

export const WithCustomLabel: Story = {
  args: {
    onSearch: () => {},
    placeholder: 'Search...',
    ariaLabel: 'Search for articles, pages, and more',
  },
};

export const Interactive: Story = {
  render: () => {
    const handleSearch = (_query: string) => {
      // Handle search in interactive mode
    };
    return (
      <div className="w-full max-w-md">
        <SearchBar onSearch={handleSearch} placeholder="Type to search..." />
      </div>
    );
  },
};

export const MultipleStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 w-full max-w-md">
      <SearchBar onSearch={() => {}} placeholder="Default state" />
      <SearchBar onSearch={() => {}} placeholder="Loading state" isLoading />
      <SearchBar onSearch={() => {}} placeholder="With value" initialValue="Example query" />
    </div>
  ),
};
