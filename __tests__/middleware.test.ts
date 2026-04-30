import { config } from '@/middleware'

describe('Middleware Config', () => {
  it('should export config with matcher', () => {
    expect(config).toBeDefined()
    expect(config.matcher).toBeDefined()
    expect(Array.isArray(config.matcher)).toBe(true)
  })

  it('should have matcher pattern that excludes api routes', () => {
    expect(config.matcher[0]).toContain('api')
  })

  it('should have matcher pattern that excludes static files', () => {
    expect(config.matcher[0]).toContain('_next/static')
  })

  it('should have matcher pattern that excludes image optimization', () => {
    expect(config.matcher[0]).toContain('_next/image')
  })
})