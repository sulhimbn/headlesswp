import { enhancedPostService } from '@/lib/services/enhancedPostService';
import { notFound } from 'next/navigation';
import HomePage from '@/app/page';
import BeritaPage from '@/app/berita/page';
import CariPage from '@/app/cari/page';
import PostPage from '@/app/berita/[slug]/page';
import type { PostWithDetails, PostWithMediaUrl } from '@/lib/services/IPostService';
import { render, screen } from '@testing-library/react';
import { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress';

jest.mock('@/lib/services/enhancedPostService');

const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  pathname: '/',
  query: {},
  asPath: '/'
};

jest.mock('next/navigation', () => ({
  notFound: jest.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  useRouter: () => mockRouter
}));

describe('Page Components - Critical Path Testing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('HomePage (src/app/page.tsx)', () => {
    const mockPost: PostWithMediaUrl = {
      id: 1,
      title: { rendered: 'Test Post' },
      content: { rendered: '<p>Test content</p>' },
      excerpt: { rendered: 'Test excerpt' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [],
      featured_media: 10,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post',
      mediaUrl: 'https://example.com/image.jpg'
    };

    it('should render featured and latest posts sections', async () => {
      (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([mockPost]);
      (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([mockPost]);

      const Page = await HomePage();
      render(Page);

      const featured = screen.getAllByText('Berita Utama');
      const latest = screen.getAllByText('Berita Terkini');
      expect(featured.length).toBeGreaterThan(0);
      expect(latest.length).toBeGreaterThan(0);
    });

    it('should render posts in grid layout', async () => {
      (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([mockPost]);
      (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([mockPost]);

      const Page = await HomePage();
      render(Page);

      const postElements = screen.getAllByText('Test Post');
      expect(postElements).toHaveLength(2);
    });

    it('should fetch latest posts and category posts in parallel', async () => {
      (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([mockPost]);
      (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([mockPost]);

      await HomePage();

      expect(enhancedPostService.getLatestPosts).toHaveBeenCalledTimes(1);
      expect(enhancedPostService.getCategoryPosts).toHaveBeenCalledTimes(1);
    });

    it('should handle empty post lists gracefully', async () => {
      (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([]);
      (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([]);

      const Page = await HomePage();
      render(Page);

      const featured = screen.getAllByText('Berita Utama');
      const latest = screen.getAllByText('Berita Terkini');
      expect(featured.length).toBeGreaterThan(0);
      expect(latest.length).toBeGreaterThan(0);
    });

    it('should include Header and Footer components', async () => {
      (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([mockPost]);
      (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([mockPost]);

      const Page = await HomePage();
      render(Page);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('BeritaPage (src/app/berita/page.tsx)', () => {
    const mockPosts: PostWithMediaUrl[] = [
      {
        id: 1,
        title: { rendered: 'News Post 1' },
        content: { rendered: '<p>Content 1</p>' },
        excerpt: { rendered: 'Excerpt 1' },
        slug: 'news-post-1',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1],
        tags: [],
        featured_media: 10,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/news-post-1',
        mediaUrl: 'https://example.com/image1.jpg'
      }
    ];

    it('should render news heading and subtitle', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 1
      });

      const Page = await BeritaPage({ searchParams: { page: '1' } });
      render(Page);

      const headings = screen.getAllByText('Semua Berita');
      const subtitles = screen.getAllByText('Kumpulan berita terkini dari Mitra Banten News');
      expect(headings.length).toBeGreaterThan(0);
      expect(subtitles.length).toBeGreaterThan(0);
    });

    it('should render posts in grid layout', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 1
      });

      const Page = await BeritaPage({ searchParams: { page: '1' } });
      render(Page);

      const posts = screen.getAllByText('News Post 1');
      expect(posts.length).toBeGreaterThan(0);
    });

    it('should render pagination when totalPages > 1', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 5
      });

      const Page = await BeritaPage({ searchParams: { page: '2' } });
      render(Page);

      const paginationElements = screen.getAllByLabelText(/page/i);
      expect(paginationElements.length).toBeGreaterThan(0);
    });

    it('should not render pagination when totalPages = 1', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 1
      });

      const Page = await BeritaPage({ searchParams: { page: '1' } });
      render(Page);

      expect(screen.queryByLabelText(/page/i)).not.toBeInTheDocument();
    });

    it('should show empty state when no posts available', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: [],
        totalPages: 0
      });

      const Page = await BeritaPage({ searchParams: { page: '1' } });
      render(Page);

      expect(screen.getByText(/Tidak ada berita/i)).toBeInTheDocument();
    });

    it('should handle invalid page parameter gracefully (defaults to 1)', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 1
      });

      const Page = await BeritaPage({ searchParams: {} });
      render(Page);

      expect(enhancedPostService.getPaginatedPosts).toHaveBeenCalledWith(1, expect.any(Number));
    });

    it('should parse page parameter from searchParams', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 5
      });

      const Page = await BeritaPage({ searchParams: { page: '3' } });
      render(Page);

      expect(enhancedPostService.getPaginatedPosts).toHaveBeenCalledWith(3, expect.any(Number));
    });

    it('should include Header and Footer components', async () => {
      (enhancedPostService.getPaginatedPosts as jest.Mock).mockResolvedValue({
        posts: mockPosts,
        totalPages: 1
      });

      const Page = await BeritaPage({ searchParams: { page: '1' } });
      render(Page);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('CariPage (src/app/cari/page.tsx)', () => {
    const mockSearchResults: PostWithMediaUrl[] = [
      {
        id: 1,
        title: { rendered: 'Search Result 1' },
        content: { rendered: '<p>Content 1</p>' },
        excerpt: { rendered: 'Excerpt 1' },
        slug: 'search-result-1',
        date: '2024-01-01T00:00:00',
        modified: '2024-01-01T00:00:00',
        author: 1,
        categories: [1],
        tags: [],
        featured_media: 10,
        status: 'publish',
        type: 'post',
        link: 'https://example.com/search-result-1',
        mediaUrl: 'https://example.com/image1.jpg'
      }
    ];

    it('should show empty state when no query provided', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue([]);

      const Page = await CariPage({ searchParams: {} });
      render(Page);

      const matches = screen.getAllByText('Masukkan kata kunci');
      expect(matches.length).toBeGreaterThan(0);
      expect(enhancedPostService.searchPosts).not.toHaveBeenCalled();
    });

    it('should show empty state when query is empty string', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue([]);

      const Page = await CariPage({ searchParams: { q: '' } });
      render(Page);

      const matches = screen.getAllByText('Masukkan kata kunci');
      expect(matches.length).toBeGreaterThan(0);
      expect(enhancedPostService.searchPosts).not.toHaveBeenCalled();
    });

    it('should show empty state when query is only whitespace', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue([]);

      const Page = await CariPage({ searchParams: { q: '   ' } });
      render(Page);

      const matches = screen.getAllByText('Masukkan kata kunci');
      expect(matches.length).toBeGreaterThan(0);
      expect(enhancedPostService.searchPosts).not.toHaveBeenCalled();
    });

    it('should search posts when valid query provided', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue(mockSearchResults);

      const Page = await CariPage({ searchParams: { q: 'test query' } });
      render(Page);

      expect(enhancedPostService.searchPosts).toHaveBeenCalledWith('test query');
    });

    it('should display search results when found', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue(mockSearchResults);

      const Page = await CariPage({ searchParams: { q: 'test' } });
      render(Page);

      const headings = screen.getAllByText('Hasil pencarian: "test"');
      expect(headings.length).toBeGreaterThan(0);
      const results = screen.getAllByText('Search Result 1');
      expect(results.length).toBeGreaterThan(0);
    });

    it('should show no results empty state when search returns empty', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue([]);

      const Page = await CariPage({ searchParams: { q: 'nonexistent' } });
      render(Page);

      expect(screen.getByText('Tidak ada hasil')).toBeInTheDocument();
      expect(screen.getByText(/Tidak ada berita yang cocok dengan "nonexistent"/i)).toBeInTheDocument();
    });

    it('should trim whitespace from query', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue(mockSearchResults);

      const Page = await CariPage({ searchParams: { q: '  test query  ' } });
      render(Page);

      expect(enhancedPostService.searchPosts).toHaveBeenCalledWith('test query');
    });

    it('should include Header and Footer components', async () => {
      (enhancedPostService.searchPosts as jest.Mock).mockResolvedValue(mockSearchResults);

      const Page = await CariPage({ searchParams: { q: 'test' } });
      render(Page);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });
  });

  describe('PostPage (src/app/berita/[slug]/page.tsx)', () => {
    const mockCategory: WordPressCategory = {
      id: 1,
      name: 'Politics',
      slug: 'politics',
      description: 'Politics category',
      parent: 0,
      count: 10,
      link: 'https://example.com/category/politics'
    };

    const mockTag: WordPressTag = {
      id: 10,
      name: 'Government',
      slug: 'government',
      description: 'Government tag',
      count: 5,
      link: 'https://example.com/tag/government'
    };

    const mockPost: PostWithDetails = {
      id: 1,
      title: { rendered: 'Test Post Title' },
      content: { rendered: '<p>Test content</p>' },
      excerpt: { rendered: 'Test excerpt' },
      slug: 'test-post',
      date: '2024-01-01T00:00:00',
      modified: '2024-01-01T00:00:00',
      author: 1,
      categories: [1],
      tags: [10],
      featured_media: 10,
      status: 'publish',
      type: 'post',
      link: 'https://example.com/test-post',
      mediaUrl: 'https://example.com/image.jpg',
      categoriesDetails: [mockCategory],
      tagsDetails: [mockTag]
    };

    it('should render post with full details', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const article = screen.getByRole('article');
      expect(article.innerHTML.includes('Test Post Title')).toBe(true);
      expect(article.innerHTML.includes('Politics')).toBe(true);
      expect(article.innerHTML.includes('#Government')).toBe(true);
    });

    it('should call notFound when post does not exist', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(null);

      await expect(PostPage({ params: { slug: 'nonexistent-post' } })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalledTimes(1);
    });

    it('should call notFound when post.title.rendered is missing', async () => {
      const invalidPost: PostWithDetails = {
        ...mockPost,
        title: { rendered: '' }
      };

      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(invalidPost);

      await expect(PostPage({ params: { slug: 'test-post' } })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalledTimes(1);
    });

    it('should call notFound when post.content.rendered is missing', async () => {
      const invalidPost: PostWithDetails = {
        ...mockPost,
        content: { rendered: '' }
      };

      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(invalidPost);

      await expect(PostPage({ params: { slug: 'test-post' } })).rejects.toThrow('NEXT_NOT_FOUND');
      expect(notFound).toHaveBeenCalledTimes(1);
    });

    it('should render breadcrumb navigation', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const navs = screen.getAllByRole('navigation');
      expect(navs.length).toBeGreaterThan(0);
      const breadcrumbLink = navs.find(nav => nav.innerHTML.includes('Berita'));
      expect(breadcrumbLink).toBeTruthy();
    });

    it('should render featured image when media exists', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const image = screen.getByAltText('Test Post Title');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src');
      const src = image.getAttribute('src');
      expect(src).toContain('https%3A%2F%2Fexample.com%2Fimage.jpg');
    });

    it('should not render featured image when media does not exist', async () => {
      const postWithoutMedia: PostWithDetails = {
        ...mockPost,
        featured_media: 0,
        mediaUrl: null
      };

      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(postWithoutMedia);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const image = screen.queryByAltText('Test Post Title');
      expect(image).not.toBeInTheDocument();
    });

    it('should display post content with sanitization', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    it('should render category badges when categories exist', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const categories = screen.getAllByText('Politics');
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should not render category badges when categories do not exist', async () => {
      const postWithoutCategories: PostWithDetails = {
        ...mockPost,
        categories: [],
        categoriesDetails: []
      };

      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(postWithoutCategories);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const article = screen.getByRole('article');
      expect(article.innerHTML.includes('Politics')).toBe(false);
    });

    it('should render tag badges when tags exist', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const tags = screen.getAllByText('#Government');
      expect(tags.length).toBeGreaterThan(0);
    });

    it('should not render tag badges when tags do not exist', async () => {
      const postWithoutTags: PostWithDetails = {
        ...mockPost,
        tags: [],
        tagsDetails: []
      };

      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(postWithoutTags);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const article = screen.getByRole('article');
      expect(article.innerHTML.includes('#Government')).toBe(false);
    });

    it('should render back to home link', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      const backLink = screen.getByRole('link', { name: /Kembali ke Beranda/i });
      expect(backLink).toBeInTheDocument();
      expect(backLink).toHaveAttribute('href', '/');
    });

    it('should include Header and Footer components', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      const Page = await PostPage({ params: { slug: 'test-post' } });
      render(Page);

      expect(screen.getByRole('banner')).toBeInTheDocument();
      expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    });

    it('should fetch post by correct slug', async () => {
      (enhancedPostService.getPostBySlug as jest.Mock).mockResolvedValue(mockPost);

      await PostPage({ params: { slug: 'test-slug-123' } });

      expect(enhancedPostService.getPostBySlug).toHaveBeenCalledWith('test-slug-123');
    });
  });
});
