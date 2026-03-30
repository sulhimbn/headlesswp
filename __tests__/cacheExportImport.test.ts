import { cacheManager, type CacheExportData } from '@/lib/cache'

describe('CacheManager export/import', () => {
  beforeEach(() => {
    cacheManager.clearAll()
    cacheManager.resetStats()
  })

  describe('exportCache', () => {
    it('should export empty cache', () => {
      const exportData = cacheManager.exportCache()

      expect(exportData.version).toBe('1.0.0')
      expect(exportData.exportedAt).toBeDefined()
      expect(exportData.entries).toEqual([])
      expect(exportData.stats).toBeDefined()
    })

    it('should export cache entries', () => {
      cacheManager.set('test:1', { data: 'test' }, 60000, ['dep:1'])

      const exportData = cacheManager.exportCache()

      expect(exportData.entries.length).toBe(1)
      expect(exportData.entries[0].key).toBe('test:1')
      expect(exportData.entries[0].data).toEqual({ data: 'test' })
      expect(exportData.entries[0].ttl).toBe(60000)
      expect(exportData.entries[0].dependencies).toContain('dep:1')
    })

    it('should export cache statistics', () => {
      cacheManager.set('test:1', { data: 'test' }, 60000)
      cacheManager.get('test:1')

      const exportData = cacheManager.exportCache()

      expect(exportData.stats.sets).toBe(1)
      expect(exportData.stats.hits).toBe(1)
    })

    it('should export dependents information', () => {
      cacheManager.set('parent:1', { data: 'parent' }, 60000)
      cacheManager.set('child:1', { data: 'child' }, 60000, ['parent:1'])

      const exportData = cacheManager.exportCache()

      const parentEntry = exportData.entries.find(e => e.key === 'parent:1')
      expect(parentEntry?.dependents).toContain('child:1')
    })
  })

  describe('importCache', () => {
    it('should import cache entries', () => {
      const importData: CacheExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        entries: [
          { key: 'post:1', data: { title: 'Test' }, timestamp: Date.now(), ttl: 60000, dependencies: [], dependents: [] },
          { key: 'post:2', data: { title: 'Test2' }, timestamp: Date.now(), ttl: 60000, dependencies: [], dependents: [] }
        ],
        stats: { hits: 0, misses: 0, sets: 0, deletes: 0, cascadeInvalidations: 0, dependencyRegistrations: 0 }
      }

      const count = cacheManager.importCache(importData)

      expect(count).toBe(2)
      expect(cacheManager.get('post:1')).toEqual({ title: 'Test' })
      expect(cacheManager.get('post:2')).toEqual({ title: 'Test2' })
    })

    it('should clear existing cache before import', () => {
      cacheManager.set('existing:1', { data: 'old' }, 60000)

      const importData: CacheExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        entries: [
          { key: 'new:1', data: { data: 'new' }, timestamp: Date.now(), ttl: 60000, dependencies: [], dependents: [] }
        ],
        stats: { hits: 0, misses: 0, sets: 0, deletes: 0, cascadeInvalidations: 0, dependencyRegistrations: 0 }
      }

      cacheManager.importCache(importData)

      expect(cacheManager.get('existing:1')).toBeNull()
      expect(cacheManager.get('new:1')).toEqual({ data: 'new' })
    })

    it('should import dependencies', () => {
      const importData: CacheExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        entries: [
          { key: 'post:1', data: { title: 'Test' }, timestamp: Date.now(), ttl: 60000, dependencies: ['category:1'], dependents: [] }
        ],
        stats: { hits: 0, misses: 0, sets: 0, deletes: 0, cascadeInvalidations: 0, dependencyRegistrations: 0 }
      }

      cacheManager.importCache(importData)

      const deps = cacheManager.getDependencies('post:1')
      expect(deps.dependencies).toContain('category:1')
    })

    it('should import statistics', () => {
      const importData: CacheExportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        entries: [],
        stats: { hits: 10, misses: 5, sets: 15, deletes: 2, cascadeInvalidations: 1, dependencyRegistrations: 3 }
      }

      cacheManager.importCache(importData)

      const stats = cacheManager.getStats()
      expect(stats.hits).toBe(10)
      expect(stats.misses).toBe(5)
    })

    it('should throw error for invalid data', () => {
      expect(() => {
        cacheManager.importCache({} as CacheExportData)
      }).toThrow('Invalid cache export data')
    })

    it('should throw error for missing entries array', () => {
      const importData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString()
      } as CacheExportData

      expect(() => {
        cacheManager.importCache(importData)
      }).toThrow('Invalid cache export data')
    })
  })
})
