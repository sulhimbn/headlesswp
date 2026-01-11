import type { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'
import { memo } from 'react'

interface PostCardProps {
  post: WordPressPost
  mediaUrl?: string | null
  priority?: boolean
}

function PostCardComponent({ post, mediaUrl, priority = false }: PostCardProps) {
  const postTitleId = `post-title-${post.id}`

  return (
    <article aria-labelledby={postTitleId} className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)] focus-within:ring-2 focus-within:ring-[hsl(var(--color-primary))] focus-within:ring-offset-2">
      {post.featured_media > 0 && (
        <Link href={`/berita/${post.slug}`} className="relative block h-48 sm:h-56 md:h-48 focus:outline-none" aria-label={`${UI_TEXT.postCard.readArticle(post.title.rendered)}`}>
          <Image
            src={mediaUrl || '/placeholder-image.jpg'}
            alt={UI_TEXT.postCard.altText(post.title.rendered)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=="
          />
        </Link>
      )}
      <div className="p-4 sm:p-5 md:p-4">
        <h3 id={postTitleId} className="text-lg sm:text-xl md:text-lg font-semibold mb-2">
          <Link
            href={`/berita/${post.slug}`}
            className="text-[hsl(var(--color-text-primary))] hover:text-[hsl(var(--color-primary))] transition-colors duration-[var(--transition-fast)] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 rounded-[var(--radius-sm)]"
          >
            {post.title.rendered}
          </Link>
        </h3>
        <div
          className="text-sm sm:text-base text-[hsl(var(--color-text-secondary))] mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.excerpt.rendered, 'excerpt') }}
          aria-hidden="true"
        />
         <div className="text-xs sm:text-sm text-[hsl(var(--color-text-muted))]">
          <time dateTime={post.date}>
            {formatDate(post.date, 'full')}
          </time>
        </div>
      </div>
    </article>
  )
}

function arePropsEqual(prevProps: PostCardProps, nextProps: PostCardProps): boolean {
  return (
    prevProps.post.id === nextProps.post.id &&
    prevProps.post.title.rendered === nextProps.post.title.rendered &&
    prevProps.post.excerpt.rendered === nextProps.post.excerpt.rendered &&
    prevProps.post.slug === nextProps.post.slug &&
    prevProps.post.featured_media === nextProps.post.featured_media &&
    prevProps.mediaUrl === nextProps.mediaUrl &&
    prevProps.priority === nextProps.priority &&
    prevProps.post.date === nextProps.post.date
  )
}

export default memo(PostCardComponent, arePropsEqual)
