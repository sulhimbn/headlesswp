import { WordPressPost } from '@/types/wordpress'
import Link from 'next/link'
import Image from 'next/image'
import React from 'react'

interface PostCardProps {
  post: WordPressPost
}

const PostCard = React.memo(function PostCard({ post }: PostCardProps) {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {post.featured_media > 0 && (
        <div className="relative h-48">
          <Image
            src="/placeholder-image.jpg"
            alt={post.title.rendered}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        </div>
      )}
      <div className="p-4">
        <Link href={`/berita/${post.slug}`} className="focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 rounded">
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600 transition-colors">
            {post.title.rendered}
          </h3>
        </Link>
        <p 
          className="text-gray-600 mb-3 line-clamp-3"
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
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
})

export default PostCard
