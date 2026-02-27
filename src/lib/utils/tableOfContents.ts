export interface TocHeading {
  id: string
  text: string
  level: number
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function generateId(text: string, existingIds: Set<string>): string {
  let id = slugify(text)
  if (!id) {
    id = 'section'
  }
  
  let counter = 0
  let uniqueId = id
  while (existingIds.has(uniqueId)) {
    counter++
    uniqueId = `${id}-${counter}`
  }
  
  existingIds.add(uniqueId)
  return uniqueId
}

export function extractHeadings(htmlContent: string): TocHeading[] {
  if (!htmlContent) return []
  
  const headingRegex = /<h([2-6])[^>]*>(.*?)<\/h\1>/gi
  const headings: TocHeading[] = []
  const existingIds = new Set<string>()
  
  let match
  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1], 10)
    const textContent = match[2]
    
    const text = textContent.replace(/<[^>]*>/g, '').trim()
    
    if (text && text.length > 0) {
      const id = generateId(text, existingIds)
      headings.push({ id, text, level })
    }
  }
  
  return headings
}

export function shouldShowToc(headings: TocHeading[], minHeadings: number = 3): boolean {
  return headings.length >= minHeadings
}

export function addIdsToHeadings(htmlContent: string): string {
  if (!htmlContent) return htmlContent
  
  const existingIds = new Set<string>()
  
  const headingRegex = /<h([2-6])([^>]*)>(.*?)<\/h\1>/gi
  
  return htmlContent.replace(headingRegex, (match, level, attrs, content) => {
    const text = content.replace(/<[^>]*>/g, '').trim()
    const id = generateId(text, existingIds)
    
    const hasId = /id=["']([^"']+)["']/.test(attrs)
    if (hasId) {
      return match
    }
    
    return `<h${level}${attrs} id="${id}">${content}</h${level}>`
  })
}
