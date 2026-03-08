import CoreWebVitalsDashboard from '@/components/observability/CoreWebVitalsDashboard'

export const metadata = {
  title: 'Observability Dashboard - Core Web Vitals',
  description: 'Real-time Core Web Vitals monitoring dashboard'
}

export default function ObservabilityPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--color-background))]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[hsl(var(--color-text))]">Performance Monitoring</h1>
          <p className="mt-2 text-[hsl(var(--color-text-secondary))]">
            Monitor your application&apos;s Core Web Vitals in real-time
          </p>
        </div>
        
        <CoreWebVitalsDashboard />
      </div>
    </main>
  )
}
