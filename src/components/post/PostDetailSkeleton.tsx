export default function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50" aria-hidden="true">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px py-8">
        <article className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="h-96 bg-gray-200 animate-pulse" />
          <div className="p-8">
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-4 w-1/4" />
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
          </div>
        </article>
      </div>
    </div>
  )
}
