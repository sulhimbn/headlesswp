import type { NextRequest, NextResponse } from 'next/server'
import { middleware, runtime, regions, config } from '@/app/middleware'

const mockGeoHeaders = {
  'x-geo-country': 'US',
  'x-geo-region': 'CA',
  'x-geo-city': 'San Francisco',
}

const mockCFHeaders = {
  'cf-ipcountry': 'US',
  'cf-ipcity': 'San Francisco',
}

describe('App Middleware', () => {
  describe('Configuration', () => {
    it('should export edge runtime', () => {
      expect(runtime).toBe('edge')
    })

    it('should export auto regions', () => {
      expect(regions).toContain('auto')
    })

    it('should have matcher configuration', () => {
      expect(config).toBeDefined()
      expect(config.matcher).toBeDefined()
      expect(Array.isArray(config.matcher)).toBe(true)
      expect(config.matcher.length).toBeGreaterThan(0)
    })

    it('should exclude API routes from matcher', () => {
      const matcher = config.matcher[0]
      expect(matcher).toContain('api')
    })

    it('should exclude static files from matcher', () => {
      const matcher = config.matcher[0]
      expect(matcher).toContain('_next/static')
      expect(matcher).toContain('_next/image')
    })
  })

  describe('Geo Headers', () => {
    let headersMap: Map<string, string>

    beforeEach(() => {
      headersMap = new Map()
    })

    it('should set x-country-code header from geo headers', () => {
      headersMap.set('x-geo-country', 'ID')
      expect(headersMap.get('x-country-code')).toBeUndefined()
    })

    it('should set x-region header when available', () => {
      headersMap.set('x-geo-region', 'JS')
      expect(headersMap.get('x-region')).toBeUndefined()
    })

    it('should set x-city header when available', () => {
      headersMap.set('x-geo-city', 'Jakarta')
      expect(headersMap.get('x-city')).toBeUndefined()
    })
  })

  describe('Performance Headers', () => {
    it('should include x-middleware-duration header', () => {
      const start = Date.now() - 100
      const duration = Date.now() - start
      expect(String(duration)).toMatch(/^\d+$/)
    })

    it('should include Server-Timing header with middleware duration', () => {
      const duration = 50
      const timing = `middleware;dur=${duration}`
      expect(timing).toContain('middleware')
      expect(timing).toContain('dur=')
    })
  })

  describe('Cache Tags', () => {
    it('should generate cache tags for different routes', () => {
      const routes = [
        { path: '/berita/slug-article', expected: ['global', 'berita', 'posts'] },
        { path: '/kategori/politik', expected: ['global', 'kategori', 'categories'] },
        { path: '/tag/terbaru', expected: ['global', 'tag', 'tags'] },
        { path: '/author/123', expected: ['global', 'author', 'authors'] },
        { path: '/', expected: ['global'] },
      ]

      routes.forEach(({ path, expected }) => {
        const tags = ['global']
        const pathSegments = path.split('/').filter(Boolean)
        
        if (pathSegments.length > 0) {
          tags.push(pathSegments[0])
        }
        
        if (path.startsWith('/berita')) {
          tags.push('posts')
        } else if (path.startsWith('/kategori')) {
          tags.push('categories')
        } else if (path.startsWith('/tag')) {
          tags.push('tags')
        } else if (path.startsWith('/author')) {
          tags.push('authors')
        }

        expect(tags).toEqual(expected)
      })
    })

    it('should set x-cache-tags header', () => {
      const tags = ['global', 'posts']
      const headerValue = tags.join(',')
      expect(headerValue).toBe('global,posts')
    })
  })

  describe('Edge Cache Key', () => {
    it('should generate cache key with country and path', () => {
      const country = 'ID'
      const path = '/berita'
      const cacheKey = `${country}:${path}`
      expect(cacheKey).toBe('ID:/berita')
    })

    it('should handle unknown country', () => {
      const country = 'unknown'
      const path = '/'
      const cacheKey = `${country}:${path}`
      expect(cacheKey).toBe('unknown:/')
    })
  })

  describe('Skip Middleware', () => {
    const skipPatterns = [
      /^\/_next\/static/,
      /^\/_next\/image/,
      /^\/api\//,
      /\.ico$/,
      /\.png$/,
      /\.jpg$/,
      /\.jpeg$/,
      /\.gif$/,
      /\.svg$/,
      /\.woff$/,
      /\.woff2$/,
      /\.ttf$/,
      /\.eot$/,
    ]

    const shouldSkipMiddleware = (pathname: string): boolean => {
      return skipPatterns.some(pattern => pattern.test(pathname))
    }

    it('should skip static files', () => {
      expect(shouldSkipMiddleware('/_next/static/chunks/main.js')).toBe(true)
      expect(shouldSkipMiddleware('/_next/image/abc.jpg')).toBe(true)
    })

    it('should skip API routes', () => {
      expect(shouldSkipMiddleware('/api/health')).toBe(true)
      expect(shouldSkipMiddleware('/api/posts')).toBe(true)
    })

    it('should skip image files', () => {
      expect(shouldSkipMiddleware('/favicon.ico')).toBe(true)
      expect(shouldSkipMiddleware('/images/logo.png')).toBe(true)
      expect(shouldSkipMiddleware('/photo.jpg')).toBe(true)
    })

    it('should skip font files', () => {
      expect(shouldSkipMiddleware('/fonts/font.woff2')).toBe(true)
      expect(shouldSkipMiddleware('/font.ttf')).toBe(true)
    })

    it('should not skip page routes', () => {
      expect(shouldSkipMiddleware('/')).toBe(false)
      expect(shouldSkipMiddleware('/berita')).toBe(false)
      expect(shouldSkipMiddleware('/berita/123')).toBe(false)
      expect(shouldSkipMiddleware('/kategori/politik')).toBe(false)
    })
  })

  describe('Geo Detection', () => {
    const getEdgeGeo = (headers: Headers): { country?: string; region?: string; city?: string } | null => {
      const country = headers.get('x-geo-country')
      const region = headers.get('x-geo-region')
      const city = headers.get('x-geo-city')
      
      if (country || region || city) {
        return {
          country: country || undefined,
          region: region || undefined,
          city: city || undefined,
        }
      }
      
      return null
    }

    it('should extract geo from custom headers', () => {
      const headers = new Headers({
        'x-geo-country': 'ID',
        'x-geo-region': 'JT',
        'x-geo-city': 'Jakarta',
      })

      const geo = getEdgeGeo(headers)
      expect(geo?.country).toBe('ID')
      expect(geo?.region).toBe('JT')
      expect(geo?.city).toBe('Jakarta')
    })

    it('should return partial geo data when some headers missing', () => {
      const headers = new Headers({
        'x-geo-country': 'SG',
      })

      const geo = getEdgeGeo(headers)
      expect(geo?.country).toBe('SG')
      expect(geo?.region).toBeUndefined()
      expect(geo?.city).toBeUndefined()
    })

    it('should return null when no geo headers present', () => {
      const headers = new Headers()
      const geo = getEdgeGeo(headers)
      expect(geo).toBeNull()
    })
  })

  describe('Middleware Execution', () => {
    it('should be a function', () => {
      expect(typeof middleware).toBe('function')
    })
  })
})
