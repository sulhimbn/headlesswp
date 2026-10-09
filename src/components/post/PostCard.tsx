import type { WordPressPost, WordPressCategory, WordPressTag } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'
import { memo } from 'react'
import { createArePropsEqual } from '@/lib/utils/memoization'
import Badge from '@/components/ui/Badge'

interface PostCardProps {
  post: WordPressPost
  mediaUrl?: string | null
  mediaDimensions?: { width: number; height: number } | null
  priority?: boolean
  categoriesDetails?: WordPressCategory[]
  tagsDetails?: WordPressTag[]
}

const POSTCARD_PROPS: (keyof PostCardProps)[] = [
  'post',
  'mediaUrl',
  'mediaDimensions',
  'priority',
  'categoriesDetails',
  'tagsDetails',
];

const arePropsEqual = createArePropsEqual<PostCardProps>(POSTCARD_PROPS);

function PostCardComponent({ post, mediaUrl, mediaDimensions, priority = false, categoriesDetails = [], tagsDetails = [] }: PostCardProps) {
  const postTitleId = `post-title-${post.id}`

  // Generate responsive sizes based on available dimensions
  const sizes = mediaDimensions?.width
    ? `(max-width: 768px) 100vw, (max-width: 1200px) 50vw, ${Math.min(mediaDimensions.width, 400)}px`
    : "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw";

  const visibleCategories = categoriesDetails.slice(0, 2)
  const visibleTags = tagsDetails.slice(0, 3)
  const hasBadges = visibleCategories.length > 0 || visibleTags.length > 0

  return (
    <article aria-labelledby={postTitleId} className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden hover:shadow-[var(--shadow-lg)] transition-all duration-[var(--transition-normal)] focus-within:ring-2 focus-within:ring-[hsl(var(--color-primary))] focus-within:ring-offset-2">
      {post.featured_media > 0 && (
        <Link href={`/berita/${post.slug}`} className="relative block h-48 sm:h-56 md:h-48 focus:outline-none" aria-label={`${UI_TEXT.postCard.readArticle(post.title.rendered)}`}>
          <Image
            src={mediaUrl || '/placeholder-image.jpg'}
            alt={UI_TEXT.postCard.altText(post.title.rendered)}
            fill
            className="object-cover"
            sizes={sizes}
            priority={priority}
            placeholder={priority ? "blur" : "empty"}
            {...(priority ? {
              blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=="
            } : {})}
          />
        </Link>
      )}
      <div className="p-4 sm:p-5 md:p-4">
        {hasBadges && (
          <div className="flex flex-wrap gap-2 mb-3" aria-label="Kategori dan tag artikel">
            {visibleCategories.map((category) => (
              <Badge key={`cat-${category.id}`} variant="category" href={`/kategori/${category.slug}`}>
                {category.name}
              </Badge>
            ))}
            {visibleTags.map((tag) => (
              <Badge key={`tag-${tag.id}`} variant="tag" href={`/tag/${tag.slug}`}>
                #{tag.name}
              </Badge>
            ))}
          </div>
        )}
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

export default memo(PostCardComponent, arePropsEqual)
