'use client';

import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleLoad = () => {
        navigator.serviceWorker.register('/sw.js')
          .then(registration => {
            logger.warn('SW registered:', undefined, { scope: registration.scope, module: 'ServiceWorkerRegistration' });
          })
          .catch(error => {
            logger.error('SW registration failed', error, { module: 'ServiceWorkerRegistration' });
          });
      };

      window.addEventListener('load', handleLoad);

      return () => {
        window.removeEventListener('load', handleLoad);
      };
    }
  }, []);

  return null;
}
