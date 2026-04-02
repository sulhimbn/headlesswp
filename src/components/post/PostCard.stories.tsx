import type { Meta, StoryObj } from '@storybook/react';
import PostCard from './PostCard';
import type { WordPressPost } from '@/types/wordpress';

const mockPost: WordPressPost = {
  id: 1,
  title: {
    rendered: 'Breaking News: Important Update',
  },
  content: {
    rendered: '<p>This is the content of the article...</p>',
  },
  excerpt: {
    rendered: '<p>This is a short excerpt of the article that provides a summary of what the article is about...</p>',
  },
  slug: 'breaking-news-important-update',
  date: '2025-04-02T10:00:00Z',
  modified: '2025-04-02T12:00:00Z',
  author: 1,
  featured_media: 123,
  categories: [1, 2],
  tags: [3, 4],
  status: 'publish',
  type: 'post',
  link: 'https://example.com/berita/breaking-news-important-update',
};

const meta: Meta<typeof PostCard> = {
  title: 'Post/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  argTypes: {
    mediaUrl: {
      control: 'text',
    },
    priority: {
      control: 'boolean',
    },
  },
  args: {
    post: mockPost,
  },
};

export default meta;
type Story = StoryObj<typeof PostCard>;

export const Default: Story = {
  args: {
    post: mockPost,
    mediaUrl: 'https://picsum.photos/800/600',
  },
};

export const NoImage: Story = {
  args: {
    post: {
      ...mockPost,
      featured_media: 0,
    },
    mediaUrl: null,
  },
};

export const Priority: Story = {
  args: {
    post: mockPost,
    mediaUrl: 'https://picsum.photos/800/600',
    priority: true,
  },
};

export const LongTitle: Story = {
  args: {
    post: {
      ...mockPost,
      title: {
        rendered: 'This is a very long title that might span multiple lines and should be handled gracefully by the PostCard component',
      },
    },
    mediaUrl: 'https://picsum.photos/800/600',
  },
};

export const MultiplePosts: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <PostCard
        post={mockPost}
        mediaUrl="https://picsum.photos/800/600"
      />
      <PostCard
        post={{
          ...mockPost,
          id: 2,
          title: { rendered: 'Another News Article' },
          slug: 'another-news-article',
        }}
        mediaUrl="https://picsum.photos/800/601"
      />
    </div>
  ),
};