# HeadlessWP

WordPress headless untuk https://mitrabantennews.com

## Deskripsi

Proyek ini merupakan implementasi WordPress dalam arsitektur headless, di mana WordPress berfungsi sebagai backend CMS dan menyediakan REST API untuk frontend modern berbasis Next.js.

## Prasyarat

- Docker & Docker Compose
- Node.js (untuk frontend)

## Setup Development Environment

1. Clone repository ini
2. Jalankan docker-compose:
   ```bash
   docker-compose up -d
   ```
3. Akses WordPress di http://localhost:8080
4. Akses phpMyAdmin di http://localhost:8081

## Struktur Proyek

```
headlesswp/
├── src/                   # Next.js frontend application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/             # API clients and utilities
│   └── types/           # TypeScript type definitions
├── docker-compose.yml    # Konfigurasi Docker
├── wp-config.php        # Konfigurasi WordPress
├── wp-content/          # Theme dan plugin WordPress
└── README.md           # Dokumentasi
```

## API Architecture

**REST API Only Strategy**

Aplikasi ini menggunakan WordPress REST API sebagai satu-satunya metode pengambilan data. Keputusan ini dibuat untuk:

- **Performance**: Overhead lebih rendah dibandingkan GraphQL
- **Compatibility**: REST API native di WordPress, tidak perlu plugin tambahan
- **Maintenance**: Kode lebih sederhana dan mudah dipelihara
- **Bundle Size**: Ukuran bundle lebih kecil tanpa dependencies GraphQL

## WordPress API Endpoints

- REST API: http://localhost:8080/wp-json/wp/v2/
- Available endpoints:
  - `/wp/v2/posts` - Artikel berita
  - `/wp/v2/categories` - Kategori
  - `/wp/v2/tags` - Tag
  - `/wp/v2/media` - Media/gambar
  - `/wp/v2/users` - Author/penulis

## Development Workflow

1. Buat branch baru untuk setiap fitur
2. Lakukan perubahan di branch tersebut
3. Buat pull request ke branch Dev
4. Setelah review, merge ke Dev

## Contributing

Silakan ikuti pedoman kontribusi di TODO.md
