export default function PostCardSkeleton() {
  return (
    <article className="bg-white rounded-lg shadow-md overflow-hidden" aria-hidden="true">
      <div className="h-48 bg-gray-200 animate-pulse" />
      <div className="p-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-1" />
        <div className="h-4 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
      </div>
    </article>
  )
}
