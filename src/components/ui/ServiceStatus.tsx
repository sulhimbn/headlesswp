'use client'

import { useState, useEffect, memo } from 'react'

type ServiceHealth = 'healthy' | 'degraded' | 'down'

interface HealthResponse {
  status: string
  timestamp?: string
  latency?: number
}

const POLL_INTERVAL = 30000

const statusStyles = {
  healthy: 'bg-green-500',
  degraded: 'bg-yellow-500',
  down: 'bg-red-500'
}

const statusLabelText = {
  healthy: 'Layanan beroperasi normal',
  degraded: 'Layanan mengalami gangguan',
  down: 'Layanan tidak tersedia'
}

function ServiceStatusComponent() {
  const [status, setStatus] = useState<ServiceHealth>('healthy')
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)

        const response = await fetch('/api/health', {
          signal: controller.signal,
          cache: 'no-store'
        })

        clearTimeout(timeoutId)

        if (response.ok) {
          const data: HealthResponse = await response.json()
          if (data.status === 'healthy') {
            setStatus('healthy')
          } else {
            setStatus('degraded')
          }
        } else {
          setStatus('degraded')
        }
      } catch {
        setStatus('down')
      }
    }

    checkHealth()
    const interval = setInterval(checkHealth, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [])

  return (
    <button
      type="button"
      className="relative focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[hsl(var(--color-primary))] rounded-full"
      onClick={() => setShowTooltip(!showTooltip)}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      aria-label={statusLabelText[status]}
    >
      <span
        className={`w-3 h-3 rounded-full ${statusStyles[status]} transition-colors duration-200`}
        aria-hidden="true"
      />
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-md shadow-lg whitespace-nowrap z-50">
          {statusLabelText[status]}
          <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
        </div>
      )}
    </button>
  )
}

export default memo(ServiceStatusComponent)
