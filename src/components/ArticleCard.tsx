import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { WordPressPost } from '@/types/wordpress'

interface ArticleCardProps {
  post: WordPressPost
  size?: 'small' | 'medium' | 'large'
}

export default function ArticleCard({ post, size = 'medium' }: ArticleCardProps) {
  const imageHeight = size === 'large' ? 'h-64 sm:h-72' : size === 'medium' ? 'h-48 sm:h-56' : 'h-40 sm:h-48'
  const titleSize = size === 'large' ? 'text-xl sm:text-2xl' : size === 'medium' ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'
  const excerptSize = size === 'large' ? 'text-base' : 'text-sm'

  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {post.featured_media > 0 && (
        <div className={`relative ${imageHeight}`}>
          <Image
            src="/placeholder-image.jpg" // Will be replaced with actual media URL
            alt={post.title.rendered}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        </div>
      )}
      
      <div className="p-4 sm:p-6">
        <Link href={`/berita/${post.slug}`}>
          <h3 className={`${titleSize} font-semibold text-gray-900 mb-2 sm:mb-3 hover:text-red-600 transition-colors line-clamp-2`}>
            {post.title.rendered}
          </h3>
        </Link>
        
        <p 
          className={`${excerptSize} text-gray-600 mb-3 sm:mb-4 line-clamp-3`}
          dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
        />
        
        <div className="text-xs sm:text-sm text-gray-500">
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