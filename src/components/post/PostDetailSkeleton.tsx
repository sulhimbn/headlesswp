import { memo } from 'react'

function PostDetailSkeleton() {
  return (
    <div className="min-h-screen bg-[hsl(var(--color-background))]" aria-busy="true" aria-label="Memuat detail artikel">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2 w-20" />
        </div>
        
        <article className="bg-[hsl(var(--color-surface))] rounded-[var(--radius-lg)] shadow-[var(--shadow-lg)] overflow-hidden mt-4">
          <div className="h-64 sm:h-80 md:h-96 lg:h-[450px] bg-[hsl(var(--color-secondary-dark))] animate-pulse" />
          <div className="p-8">
            <div className="mb-6">
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-4 w-32" />
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="h-6 bg-[hsl(var(--color-secondary-dark))] rounded-full animate-pulse w-20" />
                <div className="h-6 bg-[hsl(var(--color-secondary-dark))] rounded-full animate-pulse w-24" />
              </div>
            </div>

            <div className="h-10 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-6 w-3/4" />

            <div className="space-y-3">
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2 w-5/6" />
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-2 w-4/6" />
            </div>

            <div className="mt-8 pt-6 border-t border-[hsl(var(--color-border))]">
              <div className="h-4 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse mb-3 w-12" />
              <div className="flex flex-wrap gap-2">
                <div className="h-6 bg-[hsl(var(--color-secondary-dark))] rounded-full animate-pulse w-16" />
                <div className="h-6 bg-[hsl(var(--color-secondary-dark))] rounded-full animate-pulse w-20" />
                <div className="h-6 bg-[hsl(var(--color-secondary-dark))] rounded-full animate-pulse w-18" />
              </div>
            </div>
          </div>
        </article>

        <div className="mt-8">
          <div className="h-10 bg-[hsl(var(--color-secondary-dark))] rounded-[var(--radius-sm)] animate-pulse w-32" />
        </div>
      </main>
    </div>
  )
}

export default memo(PostDetailSkeleton)
