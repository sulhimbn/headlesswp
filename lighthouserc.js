module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      numberOfRuns: 3,
      settings: {
        staticDistDir: './.next',
        budget: null,
        chromeFlags: '--no-sandbox --disable-gpu --disable-dev-shm-usage',
      },
    },
    upload: {
      target: 'temporary-public-storage',
      serverBaseUrl: process.env.LHCI_SERVER_BASE_URL || null,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['warn', { minScore: 0.7 }],
        'categories:best-practices': ['warn', { minScore: 0.7 }],
        'categories:seo': ['warn', { minScore: 0.7 }],
        'first-contentful-paint': ['warn', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 5000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.25 }],
        'total-blocking-time': ['warn', { maxNumericValue: 1000 }],
        'speed-index': ['warn', { maxNumericValue: 4500 }],
      },
    },
  },
};
