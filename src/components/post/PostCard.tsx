import { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import { memo } from 'react'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'
import { UI_TEXT } from '@/lib/constants/uiText'
import { formatDate } from '@/lib/utils/dateFormat'

interface PostCardProps {
  post: WordPressPost
  mediaUrl?: string | null
  priority?: boolean
}

const PostCard = memo(function PostCard({ post, mediaUrl, priority = false }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-red-600 focus-within:ring-offset-2">
      {post.featured_media > 0 && (
        <Link href={`/berita/${post.slug}`} className="relative block h-48 sm:h-56 md:h-48 focus:outline-none" aria-label={UI_TEXT.postCard.readArticle(post.title.rendered)}>
          <Image
            src={mediaUrl || '/placeholder-image.jpg'}
            alt={UI_TEXT.postCard.altText(post.title.rendered)}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            priority={priority}
            placeholder="blur"
            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwC9A//2Q=="
          />
        </Link>
      )}
      <div className="p-4 sm:p-5 md:p-4">
        <h3 className="text-lg sm:text-xl md:text-lg font-semibold mb-2">
          <Link 
            href={`/berita/${post.slug}`} 
            className="text-gray-900 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded"
          >
            {post.title.rendered}
          </Link>
        </h3>
        <div
          className="text-sm sm:text-base text-gray-600 mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.excerpt.rendered, 'excerpt') }}
          aria-hidden="true"
        />
         <div className="text-xs sm:text-sm text-gray-500">
          <time dateTime={post.date}>
            {formatDate(post.date, 'full')}
          </time>
        </div>
      </div>
    </article>
  )
})

export default PostCard
