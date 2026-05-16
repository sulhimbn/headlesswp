import { worker } from './browser';

export async function startMocking() {
  if (process.env.NEXT_PUBLIC_USE_MOCK === 'true') {
    await worker.start({
      onUnhandledRequest: 'bypass',
      serviceWorker: {
        url: '/mockServiceWorker.js'
      }
    });
    console.log('[MSW] Mocking enabled via NEXT_PUBLIC_USE_MOCK=true');
  }
}