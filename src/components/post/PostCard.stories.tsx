import type { Meta, StoryObj } from '@storybook/react'
import PostCard from '@/components/post/PostCard'
import type { WordPressPost } from '@/types/wordpress'

const samplePost: WordPressPost = {
  id: 123,
  slug: 'sample-post',
  title: { rendered: 'Sample Post Title for Testing' },
  excerpt: { rendered: '<p>This is a sample excerpt for the post card component. It shows a brief description of the article content.</p>' },
  date: '2024-01-15T10:00:00',
  modified: '2024-01-15T12:00:00',
  featured_media: 1,
  author: 1,
  categories: [1, 2],
  tags: [3, 4],
  link: 'https://example.com/berita/sample-post',
}

const meta: Meta<typeof PostCard> = {
  title: 'Post/PostCard',
  component: PostCard,
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: 'boolean',
      description: 'Whether to prioritize loading the image',
    },
    mediaUrl: {
      control: 'text',
      description: 'URL for the featured media image',
    },
  },
  parameters: {
    docs: {
      description: {
        component: 'A card component for displaying WordPress posts.',
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof PostCard>

export const Default: Story = {
  args: {
    post: samplePost,
  },
}

export const WithImage: Story = {
  args: {
    post: samplePost,
    mediaUrl: 'https://picsum.photos/800/600',
  },
}

export const WithPriority: Story = {
  args: {
    post: samplePost,
    mediaUrl: 'https://picsum.photos/800/600',
    priority: true,
  },
}

export const WithoutFeaturedMedia: Story = {
  args: {
    post: {
      ...samplePost,
      featured_media: 0,
    },
  },
}

export const LongTitle: Story = {
  args: {
    post: {
      ...samplePost,
      title: {
        rendered: 'This is a Very Long Post Title That Should Demonstrate How the Component Handles Extended Titles Without Breaking the Layout',
      },
      excerpt: {
        rendered: '<p>This is a longer excerpt that contains more text to test how the component handles longer content and ensures proper line clamping behavior across different screen sizes.</p>',
      },
    },
    mediaUrl: 'https://picsum.photos/800/600',
  },
}

export const GridExample: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <PostCard post={samplePost} mediaUrl="https://picsum.photos/800/600" />
      <PostCard 
        post={{ ...samplePost, id: 124, slug: 'another-post', title: { rendered: 'Another Post' } }} 
        mediaUrl="https://picsum.photos/800/601" 
      />
      <PostCard 
        post={{ ...samplePost, id: 125, slug: 'third-post', title: { rendered: 'Third Post' } }} 
        mediaUrl="https://picsum.photos/800/602" 
      />
    </div>
  ),
}