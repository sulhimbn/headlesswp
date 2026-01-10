import { enhancedPostService } from '@/lib/services/enhancedPostService'
import Header from '@/components/layout/Header'
import PostCard from '@/components/post/PostCard'
import SectionHeading from '@/components/ui/SectionHeading'
import Footer from '@/components/layout/Footer'
import { UI_TEXT } from '@/lib/constants/uiText'

export const revalidate = 300

export default async function HomePage() {
  const [latestPosts, categoryPosts] = await Promise.all([
    enhancedPostService.getLatestPosts(),
    enhancedPostService.getCategoryPosts()
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-12">
          <SectionHeading className="mb-6">
            {UI_TEXT.homePage.featuredHeading}
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {categoryPosts.map((post, index) => (
              <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 3} />
            ))}
          </div>
        </section>

        <section>
          <SectionHeading className="mb-6">
            {UI_TEXT.homePage.latestHeading}
          </SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestPosts.map((post, index) => (
              <PostCard key={post.id} post={post} mediaUrl={post.mediaUrl} priority={index < 3} />
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}