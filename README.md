# HeadlessWP

WordPress headless untuk https://mitrabantennews.com

## Deskripsi

Proyek ini merupakan implementasi WordPress dalam arsitektur headless, di mana WordPress berfungsi sebagai backend CMS dan menyediakan API untuk frontend modern.

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
├── docker-compose.yml      # Konfigurasi Docker
├── wp-config.php          # Konfigurasi WordPress
├── wp-content/            # Theme dan plugin WordPress
└── README.md             # Dokumentasi
```

## WordPress API Endpoints

- REST API: http://localhost:8080/wp-json/wp/v2/
- GraphQL: http://localhost:8080/graphql (setelah install plugin WPGraphQL)

## Development Workflow

1. Buat branch baru untuk setiap fitur
2. Lakukan perubahan di branch tersebut
3. Buat pull request ke branch Dev
4. Setelah review, merge ke Dev

## Contributing

Silakan ikuti pedoman kontribusi di TODO.md
