'use client'

import BookmarkButton from '@/components/ui/BookmarkButton'

interface ArticleActionsProps {
  postId: number
  slug: string
  title: string
  thumbnail: string | null
  category: string | null
}

export default function ArticleActions({
  postId,
  slug,
  title,
  thumbnail,
  category
}: ArticleActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <BookmarkButton
        postId={postId}
        slug={slug}
        title={title}
        thumbnail={thumbnail}
        category={category}
      />
    </div>
  )
}