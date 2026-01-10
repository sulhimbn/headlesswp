export default function PostCardSkeleton() {
  return (
    <article className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-md)] overflow-hidden" aria-busy="true" aria-label="Memuat kartu artikel">
      <div className="h-48 sm:h-56 md:h-48 bg-[hsl(var(--color-secondary-dark))] animate-pulse" />
      <div className="p-4 sm:p-5 md:p-4">
        <div className="h-6 sm:h-7 md:h-6 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2 w-3/4" />
        <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-1" />
        <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-1" />
        <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-3" />
        <div className="h-3 sm:h-4 md:h-3 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] w-1/2 animate-pulse" />
      </div>
    </article>
  )
}
