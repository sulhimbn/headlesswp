import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import PostDetailSkeleton from '@/components/post/PostDetailSkeleton'
import { UI_TEXT } from '@/lib/constants/uiText'

export default function Loading() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]">
      <Header />
      <div role="status" aria-live="polite" aria-label={UI_TEXT.loading.article}>
        <PostDetailSkeleton />
      </div>
      <Footer />
    </div>
  )
}
