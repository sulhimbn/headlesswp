'use client';

import { useEffect, useState, useCallback } from 'react';
import { logger } from '@/lib/utils/logger';

interface PwaUpdateState {
  isUpdateAvailable: boolean;
  waitingWorker: ServiceWorker | null;
}

export default function ServiceWorkerRegistration() {
  const [updateState, setUpdateState] = useState<PwaUpdateState>({
    isUpdateAvailable: false,
    waitingWorker: null,
  });

  const handleUpdate = useCallback(() => {
    if (updateState.waitingWorker) {
      updateState.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [updateState.waitingWorker]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            logger.warn('SW registered:', undefined, { scope: registration.scope, module: 'ServiceWorkerRegistration' });

            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setUpdateState({
                      isUpdateAvailable: true,
                      waitingWorker: newWorker,
                    });
                  }
                });
              }
            });
          })
          .catch(error => {
            logger.error('SW registration failed', error, { module: 'ServiceWorkerRegistration' });
          });
      });

      const handleControllerChange = () => {
        window.location.reload();
      };

      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, []);

  if (!updateState.isUpdateAvailable) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed bottom-4 right-4 z-50 max-w-sm bg-[hsl(var(--color-surface-dark))] border border-[hsl(var(--color-border))] rounded-lg shadow-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <svg className="h-6 w-6 text-[hsl(var(--color-primary))]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-white">
            Pembaruan Tersedia
          </p>
          <p className="text-sm text-[hsl(var(--color-text-muted-dark))] mt-1">
            Versi baru telah siap. Klik untuk memuat ulang.
          </p>
          <button
            onClick={handleUpdate}
            className="mt-3 w-full px-4 py-2 bg-[hsl(var(--color-primary))] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[hsl(var(--color-primary-dark))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--color-primary))] focus:ring-offset-2 focus:ring-offset-[hsl(var(--color-surface-dark))] transition-colors duration-[var(--transition-fast)]"
          >
            Muat Ulang Sekarang
          </button>
        </div>
      </div>
    </div>
  );
}
