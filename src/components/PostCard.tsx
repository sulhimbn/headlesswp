import Link from 'next/link'
import Image from 'next/image'
import { WordPressPost } from '@/types/wordpress'

interface PostCardProps {
  post: WordPressPost
  showExcerpt?: boolean
  className?: string
}

export default function PostCard({ post, showExcerpt = true, className = '' }: PostCardProps) {
  return (
    <article className={`bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200 ${className}`}>
      {/* Featured Image */}
      {post.featured_media > 0 && (
        <div className="relative h-48 group">
          <Image
            src="/placeholder-image.jpg" // Will be replaced with actual media URL
            alt={post.title.rendered}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-200"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
        </div>
      )}
      
      {/* Content */}
      <div className="p-4">
        <Link href={`/berita/${post.slug}`}>
          <h3 className="text-xl font-semibold text-gray-900 mb-2 hover:text-red-600 line-clamp-2 transition-colors">
            {post.title.rendered}
          </h3>
        </Link>
        
        {showExcerpt && (
          <p 
            className="text-gray-600 mb-3 line-clamp-3 text-sm leading-relaxed"
            dangerouslySetInnerHTML={{ __html: post.excerpt.rendered }}
          />
        )}
        
        {/* Meta */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </time>
          
          {/* Reading time estimate */}
          <span className="text-xs">
            {Math.ceil(post.content.rendered.replace(/<[^>]*>/g, '').length / 200)} min read
          </span>
        </div>
      </div>
    </article>
  )
}