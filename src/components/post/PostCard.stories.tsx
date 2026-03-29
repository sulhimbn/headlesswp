import type { Meta, StoryObj } from '@storybook/react';
import type { WordPressPost } from '@/types/wordpress';
import PostCard from './PostCard';

const meta: Meta<typeof PostCard> = {
  title: 'Post/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: 'boolean',
    },
  },
};

export default meta;

type Story = StoryObj<typeof PostCard>;

const samplePost: WordPressPost = {
  id: 1,
  title: {
    rendered: 'Sample Article Title Here',
  },
  content: {
    rendered: '<p>Content goes here</p>',
  },
  excerpt: {
    rendered: '<p>This is a short excerpt of the article that gives readers a preview of the content...</p>',
  },
  slug: 'sample-article-title',
  date: '2024-01-15T10:00:00Z',
  modified: '2024-01-15T10:00:00Z',
  author: 1,
  featured_media: 123,
  categories: [1, 2],
  tags: [3, 4],
  status: 'publish',
  type: 'post',
  link: 'https://example.com/sample-article-title',
};

export const Default: Story = {
  args: {
    post: samplePost,
  },
};

export const WithMedia: Story = {
  args: {
    post: samplePost,
    mediaUrl: 'https://picsum.photos/800/600',
  },
};

export const WithPriority: Story = {
  args: {
    post: samplePost,
    mediaUrl: 'https://picsum.photos/800/600',
    priority: true,
  },
};

export const NoFeaturedMedia: Story = {
  args: {
    post: {
      ...samplePost,
      featured_media: 0,
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
      <PostCard
        post={{
          ...samplePost,
          id: 1,
          title: { rendered: 'First Article Title' },
          slug: 'first-article',
        }}
        mediaUrl="https://picsum.photos/800/600?random=1"
      />
      <PostCard
        post={{
          ...samplePost,
          id: 2,
          title: { rendered: 'Second Article Title' },
          slug: 'second-article',
        }}
        mediaUrl="https://picsum.photos/800/600?random=2"
      />
      <PostCard
        post={{
          ...samplePost,
          id: 3,
          title: { rendered: 'Third Article Title' },
          slug: 'third-article',
        }}
        mediaUrl="https://picsum.photos/800/600?random=3"
      />
    </div>
  ),
};
