import { WordPressPost, WordPressCategory, WordPressTag, WordPressMedia, WordPressAuthor } from '@/types/wordpress'

export const mockPosts: WordPressPost[] = [
  {
    id: 1,
    title: { rendered: 'Berita Pertama: Teknologi Terbaru' },
    content: { rendered: '<p>Ini adalah konten berita pertama tentang teknologi terbaru yang sedang trending.</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.</p>' },
    excerpt: { rendered: '<p>Ini adalah konten berita pertama tentang teknologi terbaru yang sedang trending.</p>' },
    slug: 'berita-pertama-teknologi-terbaru',
    date: '2024-01-15T10:00:00',
    modified: '2024-01-15T10:00:00',
    author: 1,
    featured_media: 1,
    categories: [1, 2],
    tags: [1, 3],
    status: 'publish',
    type: 'post',
    link: 'https://mitrabantennews.com/berita/berita-pertama-teknologi-terbaru'
  },
  {
    id: 2,
    title: { rendered: 'Berita Kedua: Ekonomi Nasional' },
    content: { rendered: '<p>Analisis mendalam tentang kondisi ekonomi nasional saat ini.</p><p>Sed ut perspiciatis unde omnis iste natus error.</p>' },
    excerpt: { rendered: '<p>Analisis mendalam tentang kondisi ekonomi nasional saat ini.</p>' },
    slug: 'berita-kedua-ekonomi-nasional',
    date: '2024-01-14T14:30:00',
    modified: '2024-01-14T14:30:00',
    author: 2,
    featured_media: 2,
    categories: [2],
    tags: [2, 4],
    status: 'publish',
    type: 'post',
    link: 'https://mitrabantennews.com/berita/berita-kedua-ekonomi-nasional'
  },
  {
    id: 3,
    title: { rendered: 'Berita Ketiga: Olahraga' },
    content: { rendered: '<p>Update terbaru dari dunia olahraga nasional dan internasional.</p>' },
    excerpt: { rendered: '<p>Update terbaru dari dunia olahraga nasional dan internasional.</p>' },
    slug: 'berita-ketiga-olahraga',
    date: '2024-01-13T09:15:00',
    modified: '2024-01-13T09:15:00',
    author: 1,
    featured_media: 0,
    categories: [3],
    tags: [5],
    status: 'publish',
    type: 'post',
    link: 'https://mitrabantennews.com/berita/berita-ketiga-olahraga'
  }
]

export const mockCategories: WordPressCategory[] = [
  {
    id: 1,
    name: 'Teknologi',
    slug: 'teknologi',
    description: 'Berita seputar teknologi dan inovasi terkini',
    parent: 0,
    count: 15
  },
  {
    id: 2,
    name: 'Ekonomi',
    slug: 'ekonomi',
    description: 'Analisis dan berita ekonomi nasional',
    parent: 0,
    count: 23
  },
  {
    id: 3,
    name: 'Olahraga',
    slug: 'olahraga',
    description: 'Berita olahraga dari dalam dan luar negeri',
    parent: 0,
    count: 18
  },
  {
    id: 4,
    name: 'Politik',
    slug: 'politik',
    description: 'Berita dan analisis politik',
    parent: 0,
    count: 31
  },
  {
    id: 5,
    name: 'Budaya',
    slug: 'budaya',
    description: 'Seni, budaya, dan pariwisata',
    parent: 0,
    count: 12
  }
]

export const mockTags: WordPressTag[] = [
  {
    id: 1,
    name: 'JavaScript',
    slug: 'javascript',
    description: 'Berita tentang pemrograman JavaScript',
    count: 8
  },
  {
    id: 2,
    name: 'React',
    slug: 'react',
    description: 'Framework React dan ekosistemnya',
    count: 5
  },
  {
    id: 3,
    name: 'AI',
    slug: 'ai',
    description: 'Kecerdasan buatan dan machine learning',
    count: 12
  },
  {
    id: 4,
    name: 'Startup',
    slug: 'startup',
    description: 'Berita startup dan ekosistem entrepreneur',
    count: 7
  },
  {
    id: 5,
    name: 'Sepak Bola',
    slug: 'sepak-bola',
    description: 'Berita sepak bola nasional dan internasional',
    count: 9
  }
]

export const mockMedia: WordPressMedia[] = [
  {
    id: 1,
    source_url: 'https://mitrabantennews.com/wp-content/uploads/2024/01/tech-image-1.jpg',
    alt_text: 'Gambar teknologi terbaru',
    media_type: 'image',
    mime_type: 'image/jpeg'
  },
  {
    id: 2,
    source_url: 'https://mitrabantennews.com/wp-content/uploads/2024/01/economy-chart.jpg',
    alt_text: 'Grafik pertumbuhan ekonomi',
    media_type: 'image',
    mime_type: 'image/jpeg'
  },
  {
    id: 3,
    source_url: 'https://mitrabantennews.com/wp-content/uploads/2024/01/sports-event.jpg',
    alt_text: 'Foto acara olahraga',
    media_type: 'image',
    mime_type: 'image/jpeg'
  }
]

export const mockAuthors: WordPressAuthor[] = [
  {
    id: 1,
    name: 'Ahmad Wijaya',
    slug: 'ahmad-wijaya',
    description: 'Journalist teknologi dengan pengalaman 5 tahun',
    avatar_urls: {
      '24': 'https://mitrabantennews.com/wp-content/uploads/avatars/1/24x24.jpg',
      '48': 'https://mitrabantennews.com/wp-content/uploads/avatars/1/48x48.jpg',
      '96': 'https://mitrabantennews.com/wp-content/uploads/avatars/1/96x96.jpg'
    }
  },
  {
    id: 2,
    name: 'Siti Nurhaliza',
    slug: 'siti-nurhaliza',
    description: 'Editor ekonomi dan analis keuangan',
    avatar_urls: {
      '24': 'https://mitrabantennews.com/wp-content/uploads/avatars/2/24x24.jpg',
      '48': 'https://mitrabantennews.com/wp-content/uploads/avatars/2/48x48.jpg',
      '96': 'https://mitrabantennews.com/wp-content/uploads/avatars/2/96x96.jpg'
    }
  },
  {
    id: 3,
    name: 'Budi Santoso',
    slug: 'budi-santoso',
    description: 'Reporter olahraga dan mantan atlet',
    avatar_urls: {
      '24': 'https://mitrabantennews.com/wp-content/uploads/avatars/3/24x24.jpg',
      '48': 'https://mitrabantennews.com/wp-content/uploads/avatars/3/48x48.jpg',
      '96': 'https://mitrabantennews.com/wp-content/uploads/avatars/3/96x96.jpg'
    }
  }
]

export const mockCSPReport = {
  'csp-report': {
    'document-uri': 'https://mitrabantennews.com/berita/test-article',
    'referrer': 'https://google.com/',
    'violated-directive': 'script-src',
    'effective-directive': 'script-src',
    'original-policy': "script-src 'self' 'unsafe-inline'; report-uri /api/csp-report",
    'disposition': 'report',
    'blocked-uri': 'https://evil.com/malicious.js',
    'line-number': 42,
    'column-number': 15,
    'source-file': 'https://mitrabantennews.com/_next/static/chunks/main.js',
    'status-code': 200,
    'script-sample': 'var malicious = true;'
  }
}

export const mockErrorResponse = {
  message: 'Internal Server Error',
  code: 'internal_server_error',
  data: {
    status: 500
  }
}

export const mockNotFoundResponse = {
  message: 'Not Found',
  code: 'rest_not_found',
  data: {
    status: 404
  }
}