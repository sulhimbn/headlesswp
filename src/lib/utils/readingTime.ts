const WORDS_PER_MINUTE = 200

function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function calculateReadingTime(content: string): number {
  if (!content) return 0
  const plainText = stripHtmlTags(content)
  const wordCount = plainText.split(/\s+/).filter(word => word.length > 0).length
  const minutes = Math.ceil(wordCount / WORDS_PER_MINUTE)
  return minutes
}

export function getReadingTimeText(minutes: number): string {
  return `${minutes} min read`
}
