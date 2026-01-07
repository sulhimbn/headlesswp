import { getApiUrl } from '@/lib/api/client'

describe('API Client - getApiUrl', () => {
  it('should construct correct API URL from path', () => {
    const path = '/wp/v2/posts'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts')
  })

  it('should handle empty path', () => {
    const url = getApiUrl('')
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=')
  })

  it('should handle complex paths', () => {
    const path = '/wp/v2/posts/1'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts/1')
  })

  it('should handle paths with query parameters', () => {
    const path = '/wp/v2/posts?per_page=10'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts?per_page=10')
  })

  it('should handle category endpoint', () => {
    const path = '/wp/v2/categories'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/categories')
  })

  it('should handle tags endpoint', () => {
    const path = '/wp/v2/tags'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/tags')
  })

  it('should handle media endpoint', () => {
    const path = '/wp/v2/media'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/media')
  })

  it('should handle users endpoint', () => {
    const path = '/wp/v2/users'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/users')
  })

  it('should handle search endpoint', () => {
    const path = '/wp/v2/search'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/search')
  })

  it('should handle post detail endpoint with slug', () => {
    const path = '/wp/v2/posts?slug=test-post'
    const url = getApiUrl(path)
    
    expect(url).toBe('http://localhost:8080/index.php?rest_route=/wp/v2/posts?slug=test-post')
  })
})
