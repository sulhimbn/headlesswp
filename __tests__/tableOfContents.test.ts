import { extractHeadings, shouldShowToc, addIdsToHeadings } from '@/lib/utils/tableOfContents'

describe('tableOfContents', () => {
  describe('extractHeadings', () => {
    it('should extract h2 headings', () => {
      const html = '<h2>Introduction</h2><p>Content</p>'
      const headings = extractHeadings(html)
      
      expect(headings).toHaveLength(1)
      expect(headings[0]).toEqual({
        id: 'introduction',
        text: 'Introduction',
        level: 2
      })
    })

    it('should extract multiple headings with different levels', () => {
      const html = `
        <h2>Section 1</h2>
        <p>Content</p>
        <h3>Subsection One One</h3>
        <p>More content</p>
        <h4>Deep heading</h4>
      `
      const headings = extractHeadings(html)
      
      expect(headings).toHaveLength(3)
      expect(headings[0]).toEqual({ id: 'section-1', text: 'Section 1', level: 2 })
      expect(headings[1]).toEqual({ id: 'subsection-one-one', text: 'Subsection One One', level: 3 })
      expect(headings[2]).toEqual({ id: 'deep-heading', text: 'Deep heading', level: 4 })
    })

    it('should return empty array for no headings', () => {
      const html = '<p>Just some content without headings</p>'
      const headings = extractHeadings(html)
      
      expect(headings).toHaveLength(0)
    })

    it('should handle empty content', () => {
      expect(extractHeadings('')).toHaveLength(0)
      expect(extractHeadings(null as unknown as string)).toHaveLength(0)
      expect(extractHeadings(undefined as unknown as string)).toHaveLength(0)
    })

    it('should generate unique IDs for duplicate headings', () => {
      const html = '<h2>Same Title</h2><h2>Same Title</h2><h2>Same Title</h2>'
      const headings = extractHeadings(html)
      
      expect(headings).toHaveLength(3)
      expect(headings[0].id).toBe('same-title')
      expect(headings[1].id).toBe('same-title-1')
      expect(headings[2].id).toBe('same-title-2')
    })

    it('should strip HTML tags from heading text', () => {
      const html = '<h2><strong>Bold</strong> Title</h2>'
      const headings = extractHeadings(html)
      
      expect(headings[0].text).toBe('Bold Title')
    })

    it('should handle headings with existing IDs', () => {
      const html = '<h2 id="custom-id">Custom</h2>'
      const headings = extractHeadings(html)
      
      expect(headings[0].id).toBe('custom')
    })
  })

  describe('shouldShowToc', () => {
    it('should return true when headings >= minHeadings', () => {
      const headings = [
        { id: '1', text: 'Heading 1', level: 2 },
        { id: '2', text: 'Heading 2', level: 2 },
        { id: '3', text: 'Heading 3', level: 2 }
      ]
      
      expect(shouldShowToc(headings)).toBe(true)
      expect(shouldShowToc(headings, 3)).toBe(true)
    })

    it('should return false when headings < minHeadings', () => {
      const headings = [
        { id: '1', text: 'Heading 1', level: 2 },
        { id: '2', text: 'Heading 2', level: 2 }
      ]
      
      expect(shouldShowToc(headings)).toBe(false)
      expect(shouldShowToc(headings, 3)).toBe(false)
    })

    it('should return false for empty headings', () => {
      expect(shouldShowToc([])).toBe(false)
    })
  })

  describe('addIdsToHeadings', () => {
    it('should add IDs to headings without existing IDs', () => {
      const html = '<h2>First Section</h2><p>Content</p><h3>Sub Section</h3>'
      const result = addIdsToHeadings(html)
      
      expect(result).toContain('id="first-section"')
      expect(result).toContain('id="sub-section"')
    })

    it('should not modify headings with existing IDs', () => {
      const html = '<h2 id="existing-id">Custom</h2>'
      const result = addIdsToHeadings(html)
      
      expect(result).toContain('id="existing-id"')
    })

    it('should handle empty content', () => {
      expect(addIdsToHeadings('')).toBe('')
      expect(addIdsToHeadings(null as unknown as string)).toBe(null)
    })
  })
})
