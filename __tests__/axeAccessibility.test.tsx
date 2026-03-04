import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import HomePage from '@/app/page';
import { enhancedPostService } from '@/lib/services/enhancedPostService';

jest.mock('@/lib/services/enhancedPostService');
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
}));

const mockPost = {
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
  mediaUrl: 'https://example.com/image.jpg',
};

describe('Accessibility Tests (axe-core)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (enhancedPostService.getLatestPosts as jest.Mock).mockResolvedValue([mockPost]);
    (enhancedPostService.getCategoryPosts as jest.Mock).mockResolvedValue([mockPost]);
  });

  it('HomePage should have no accessibility violations', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('HomePage should have proper heading hierarchy', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'heading-order': { enabled: true },
      },
    });
    const headingOrderViolations = results.violations.filter((v: { id: string }) => v.id === 'heading-order');
    expect(headingOrderViolations).toHaveLength(0);
  });

  it('HomePage should have proper image alt text', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'image-alt': { enabled: true },
      },
    });
    const imageAltViolations = results.violations.filter((v: { id: string }) => v.id === 'image-alt');
    expect(imageAltViolations).toHaveLength(0);
  });

  it('HomePage should have proper ARIA attributes', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'aria-valid-attr': { enabled: true },
        'aria-required-attr': { enabled: true },
      },
    });
    const ariaViolations = results.violations.filter((v: { id: string }) => 
      v.id.includes('aria')
    );
    expect(ariaViolations).toHaveLength(0);
  });

  it('HomePage should have proper color contrast', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });
    const contrastViolations = results.violations.filter((v: { id: string }) => v.id === 'color-contrast');
    expect(contrastViolations).toHaveLength(0);
  });

  it('HomePage should have proper link names', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'link-name': { enabled: true },
      },
    });
    const linkNameViolations = results.violations.filter((v: { id: string }) => v.id === 'link-name');
    expect(linkNameViolations).toHaveLength(0);
  });

  it('HomePage should have proper button names', async () => {
    const Page = await HomePage();
    const { container } = render(Page);
    const results = await axe(container, {
      rules: {
        'button-name': { enabled: true },
      },
    });
    const buttonNameViolations = results.violations.filter((v: { id: string }) => v.id === 'button-name');
    expect(buttonNameViolations).toHaveLength(0);
  });
});
