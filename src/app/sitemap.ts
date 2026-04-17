import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/api/config'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { cacheManager, CACHE_TTL, cacheKeys } from '@/lib/cache'
import { logger } from '@/lib/utils/logger'

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
    const [postsResult, categoriesResult, tagsResult, authorsResult] = await Promise.all([
      standardizedAPI.getAllPosts({ per_page: 100 }),
      standardizedAPI.getAllCategories(),
      standardizedAPI.getAllTags(),
      standardizedAPI.getAllAuthors(),
    ])

    const sitemapEntries: MetadataRoute.Sitemap = [...staticPages]

    if (isApiResultSuccessful(categoriesResult)) {
      const categoryUrls: MetadataRoute.Sitemap = categoriesResult.data.map((category) => ({
        url: `${baseUrl}/kategori/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }))
      sitemapEntries.push(...categoryUrls)
    }

    if (isApiResultSuccessful(tagsResult)) {
      const tagUrls: MetadataRoute.Sitemap = tagsResult.data.map((tag) => ({
        url: `${baseUrl}/tag/${tag.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      }))
      sitemapEntries.push(...tagUrls)
    }

    if (isApiResultSuccessful(authorsResult)) {
      const authorUrls: MetadataRoute.Sitemap = authorsResult.data.map((author) => ({
        url: `${baseUrl}/author/${author.slug || author.id}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.5,
      }))
      sitemapEntries.push(...authorUrls)
    }

    if (isApiResultSuccessful(postsResult)) {
      const postUrls: MetadataRoute.Sitemap = postsResult.data.map((post) => ({
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
