import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/api/config'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { cacheManager, CACHE_TTL, cacheKeys } from '@/lib/cache'
import { logger } from '@/lib/utils/logger'
import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/cari`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  const cachedSitemap = cacheManager.get<MetadataRoute.Sitemap>(cacheKeys.sitemap())
  if (cachedSitemap) {
    return cachedSitemap
  }

  try {
    const [postsResult, categoriesResult, tagsResult] = await Promise.all([
      standardizedAPI.getAllPosts({ per_page: 100 }),
      standardizedAPI.getAllCategories(),
      standardizedAPI.getAllTags(),
    ])

    const sitemapEntries: MetadataRoute.Sitemap = [...staticPages]

    if (isApiResultSuccessful(categoriesResult)) {
      const categories = categoriesResult.data as WordPressCategory[]
      const categoryUrls: MetadataRoute.Sitemap = categories.map((category) => ({
        url: `${baseUrl}/kategori/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      sitemapEntries.push(...categoryUrls)
    }

    if (isApiResultSuccessful(tagsResult)) {
      const tags = tagsResult.data as WordPressTag[]
      const tagUrls: MetadataRoute.Sitemap = tags.map((tag) => ({
        url: `${baseUrl}/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
      sitemapEntries.push(...tagUrls)
    }

    if (isApiResultSuccessful(postsResult)) {
      const posts = postsResult.data as WordPressPost[]
      const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
        url: `${baseUrl}/berita/${post.slug}`,
        lastModified: new Date(post.modified || post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
      sitemapEntries.push(...postUrls)
    }

    cacheManager.set(cacheKeys.sitemap(), sitemapEntries, CACHE_TTL.SITEMAP)
    return sitemapEntries
  } catch (error) {
    logger.error('Failed to generate sitemap', error, { module: 'sitemap' })
  }

  return staticPages
}