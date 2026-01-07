import { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeHTML } from '@/lib/utils/sanitizeHTML'

interface PostCardProps {
  post: WordPressPost
  mediaUrl?: string | null
}

const PostCard = function PostCard({ post, mediaUrl }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 focus-within:ring-2 focus-within:ring-red-600 focus-within:ring-offset-2">
      {post.featured_media > 0 && (
        <Link href={`/berita/${post.slug}`} className="relative block h-48 focus:outline-none" aria-label={`Baca artikel: ${post.title.rendered}`}>
          <Image
            src={mediaUrl || '/placeholder-image.jpg'}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </Link>
      )}
      <div className="p-4">
        <Link href={`/berita/${post.slug}`} className="block focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600 transition-colors">
            {post.title.rendered}
          </h3>
        </Link>
        <div
          className="text-gray-600 mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.excerpt.rendered, 'excerpt') }}
          aria-hidden="true"
        />
        <div className="text-sm text-gray-500">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </time>
        </div>
      </div>
    </article>
  )
}

export default PostCard
