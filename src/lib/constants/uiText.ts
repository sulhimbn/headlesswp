export const UI_TEXT = {
  breadcrumb: {
    home: 'Beranda'
  },
  postCard: {
    altText: (title: string) => `Gambar utama untuk artikel: ${title}`,
    readArticle: (title: string) => `Baca artikel: ${title}`
  },
  metaInfo: {
    by: 'By',
    datePrefix: ''
  },
  postDetail: {
    tags: 'Tags',
    backToHome: 'Kembali ke Beranda'
  },
  newsPage: {
    heading: 'Semua Berita',
    subtitle: 'Kumpulan berita terkini dari Mitra Banten News',
    emptyTitle: 'Tidak ada berita',
    emptyDescription: 'Belum ada berita untuk ditampilkan saat ini.'
  },
  homePage: {
    featuredHeading: 'Berita Utama',
    latestHeading: 'Berita Terkini'
  },
  notFound: {
    heading: 'Halaman Tidak Ditemukan',
    description: 'Maaf, halaman yang Anda cari tidak dapat ditemukan. Halaman mungkin telah dipindahkan, dihapus, atau URL yang Anda masukkan salah.',
    backToHome: 'Kembali ke Beranda',
    viewNews: 'Lihat Berita Terkini',
    contactHelp: 'Jika Anda merasa ini adalah kesalahan, silakan',
    contactUs: 'hubungi kami'
  },
  error: {
    heading: 'Terjadi Kesalahan',
    description: 'Maaf, terjadi kesalahan saat memuat halaman ini. Ini bukan kesalahan dari pihak Anda.',
    tryAgain: 'Coba Lagi',
    backToHome: 'Kembali ke Beranda',
    contactHelp: 'Jika masalah berlanjut, silakan',
    contactUs: 'hubungi kami',
    contactForHelp: 'untuk bantuan'
  },
  emptyState: {
    title: 'Tidak ada berita',
    description: 'Belum ada berita untuk ditampilkan saat ini.'
  },
  pagination: {
    previous: 'Sebelumnya',
    next: 'Selanjutnya',
    page: 'Halaman',
    of: 'dari'
  },
  footer: {
    about: 'Tentang Kami',
    aboutTitle: 'Mitra Banten News',
    aboutDescription: 'Menyajikan berita terkini dan terpercaya dari Banten dan sekitarnya.',
    navigation: 'Navigasi',
    links: {
      home: 'Beranda',
      news: 'Berita',
      politics: 'Politik',
      economy: 'Ekonomi',
      sports: 'Olahraga'
    },
    contact: 'Kontak',
    contactTitle: 'Hubungi Kami',
    email: 'Email: info@mitrabantennews.com',
    phone: 'Telepon: (0254) 123-4567',
    address: 'Alamat: Banten, Indonesia',
    copyright: (year: number) => `&copy; ${year} Mitra Banten News. All rights reserved.`
  }
} as const