'use client';

import { useEffect, useState } from 'react';

export function MSWProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function startMSW() {
      if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
        const { worker } = await import('@/mocks/browser');
        await worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js'
          }
        });
        console.log('[MSW] Mocking enabled');
      }
      setReady(true);
    }
    startMSW();
  }, []);

  if (!ready && process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Loading mock API...
      </div>
    );
  }

  return <>{children}</>;
}