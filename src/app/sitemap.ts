import { MetadataRoute } from 'next';
import { enhancedPostService } from '@/lib/services/enhancedPostService';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

  let postUrls: MetadataRoute.Sitemap = [];

  try {
    const posts = await enhancedPostService.getAllPosts();
    
    postUrls = posts.map((post) => ({
      url: `${baseUrl}/berita/${post.slug}`,
      lastModified: new Date(post.modified || post.date),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Failed to generate sitemap posts:', error);
  }

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...postUrls,
  ];
}
