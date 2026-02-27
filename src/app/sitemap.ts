import { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/api/config'
import { standardizedAPI } from '@/lib/api/standardized'
import { isApiResultSuccessful } from '@/lib/api/response'
import { cacheManager, CACHE_TTL, cacheKeys } from '@/lib/cache'

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
    const postsResult = await standardizedAPI.getAllPosts({ per_page: 100 })

    if (isApiResultSuccessful(postsResult)) {
      const postUrls: MetadataRoute.Sitemap = postsResult.data.map((post) => ({
        url: `${baseUrl}/berita/${post.slug}`,
        lastModified: new Date(post.modified || post.date),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))

      const sitemap = [...staticPages, ...postUrls]
      cacheManager.set(cacheKeys.sitemap(), sitemap, CACHE_TTL.SITEMAP)
      return sitemap
    }
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
  }

  return staticPages
}
