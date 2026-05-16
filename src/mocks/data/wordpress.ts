export const mockPosts = [
  {
    id: 1,
    date: '2026-05-15T10:00:00Z',
    modified: '2026-05-15T12:00:00Z',
    slug: 'berita-pertama',
    title: { rendered: 'Berita Pertama: Pembukaan Festival Budaya' },
    content: { rendered: '<p>Festival budaya daerah resmi dibuka hari ini dengan berbagai pertunjukan tradisional.</p>' },
    excerpt: { rendered: '<p>Festival budaya daerah resmi dibuka hari ini...</p>' },
    author: 1,
    categories: [1, 2],
    tags: [1, 2],
    featured_media: 1,
    status: 'publish',
    type: 'post',
    link: 'http://localhost:8080/berita/berita-pertama/'
  },
  {
    id: 2,
    date: '2026-05-14T09:00:00Z',
    modified: '2026-05-14T11:00:00Z',
    slug: 'berita-kedua',
    title: { rendered: 'Berita Kedua: Pembangunan Infrastruktur Baru' },
    content: { rendered: '<p>Pembangunan jalan baru diharapkan selesai dalam waktu 6 bulan.</p>' },
    excerpt: { rendered: '<p>Pembangunan jalan baru diharapkan selesai...</p>' },
    author: 1,
    categories: [3],
    tags: [3],
    featured_media: 2,
    status: 'publish',
    type: 'post',
    link: 'http://localhost:8080/berita/berita-kedua/'
  },
  {
    id: 3,
    date: '2026-05-13T08:00:00Z',
    modified: '2026-05-13T10:00:00Z',
    slug: 'berita-ketiga',
    title: { rendered: 'Berita Ketiga: Program Pendidikan Gratis' },
    content: { rendered: '<p>Program pendidikan gratis untuk daerah terpencil telah diluncurkan.</p>' },
    excerpt: { rendered: '<p>Program pendidikan gratis untuk daerah terpencil...</p>' },
    author: 2,
    categories: [2, 4],
    tags: [4],
    featured_media: 3,
    status: 'publish',
    type: 'post',
    link: 'http://localhost:8080/berita/berita-ketiga/'
  }
];

export const mockCategories = [
  { id: 1, name: 'Politik', slug: 'politik', description: 'Berita politik terkini', count: 5, link: 'http://localhost:8080/category/politik/' },
  { id: 2, name: 'Budaya', slug: 'budaya', description: 'Berita budaya dan seni', count: 3, link: 'http://localhost:8080/category/budaya/' },
  { id: 3, name: 'Ekonomi', slug: 'ekonomi', description: 'Berita ekonomi dan bisnis', count: 4, link: 'http://localhost:8080/category/ekonomi/' },
  { id: 4, name: 'Pendidikan', slug: 'pendidikan', description: 'Berita pendidikan', count: 2, link: 'http://localhost:8080/category/pendidikan/' }
];

export const mockTags = [
  { id: 1, name: 'Festival', slug: 'festival', count: 2, link: 'http://localhost:8080/tag/festival/' },
  { id: 2, name: 'Budaya', slug: 'budaya', count: 3, link: 'http://localhost:8080/tag/budaya/' },
  { id: 3, name: 'Infrastruktur', slug: 'infrastruktur', count: 1, link: 'http://localhost:8080/tag/infrastruktur/' },
  { id: 4, name: 'Pendidikan', slug: 'pendidikan', count: 2, link: 'http://localhost:8080/tag/pendidikan/' }
];

export const mockMedia = [
  { id: 1, source_url: 'https://picsum.photos/800/600?random=1', alt_text: 'Gambar 1', media_details: { width: 800, height: 600 } },
  { id: 2, source_url: 'https://picsum.photos/800/600?random=2', alt_text: 'Gambar 2', media_details: { width: 800, height: 600 } },
  { id: 3, source_url: 'https://picsum.photos/800/600?random=3', alt_text: 'Gambar 3', media_details: { width: 800, height: 600 } }
];

export const mockAuthors = [
  { id: 1, name: 'Ahmad Fauzi', slug: 'ahmad-fauzi', description: 'Wartawan senior', avatar_urls: { '96': 'https://i.pravatar.cc/150?u=ahmad' } },
  { id: 2, name: 'Siti Rahayu', slug: 'siti-rahayu', description: 'Wartawan budaya', avatar_urls: { '96': 'https://i.pravatar.cc/150?u=siti' } }
];