# HeadlessWP

Headless WordPress implementation for https://mitrabantennews.com

## Overview

This project implements WordPress as a headless CMS with a modern Next.js 14 frontend. WordPress serves as the backend content management system, providing REST API endpoints that the Next.js application consumes.

## Architecture

```
┌─────────────┐     REST API      ┌──────────────┐
│   Next.js   │ ◄──────────────► │  WordPress   │
│  Frontend   │   (wp-json)      │   Backend    │
└─────────────┘                  └──────────────┘
```

## Technology Stack

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.9
- **HTTP Client**: Axios 1.7
- **Security**: DOMPurify 3.3

### Backend
- **CMS**: WordPress
- **API**: REST API (wp-json/wp/v2/)
- **Database**: MySQL
- **Containerization**: Docker + Docker Compose

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for frontend development)
- Git

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/sulhimbn/headlesswp.git
cd headlesswp
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your WordPress credentials
```

### 3. Start WordPress Backend

```bash
docker-compose up -d
```

Access WordPress at http://localhost:8080
Access phpMyAdmin at http://localhost:8081

### 4. Install Frontend Dependencies

```bash
npm install
```

### 5. Start Next.js Development Server

```bash
npm run dev
```

Access frontend at http://localhost:3000

## Development

### Available Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run typecheck    # Run TypeScript type checking
npm run test         # Run Jest tests
npm test:watch       # Run tests in watch mode
npm audit:security   # Check for security vulnerabilities
npm audit:full       # Full security audit
npm deps:check       # Check for outdated dependencies
npm deps:update      # Update dependencies
```

### Environment Variables

Key environment variables (see `.env.example`):

```env
WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://mitrabantennews.com/wp-json
SKIP_RETRIES=false  # Set to true during CI/build when WordPress backend is unavailable
```

## Project Structure

```
headlesswp/
├── src/                   # Next.js frontend application
│   ├── app/              # App Router pages
│   │   ├── layout.tsx    # Root layout
│   │   ├── page.tsx      # Homepage
│   │   └── berita/       # News post pages
│   ├── components/       # React components
│   │   ├── layout/       # Header, Footer
│   │   ├── post/         # PostCard component
│   │   └── ui/           # UI components
│   ├── lib/              # Utilities and API layer
│   │   ├── api/          # API client and resilience patterns
│   │   │   ├── config.ts        # API configuration
│   │   │   ├── client.ts        # Axios client
│   │   │   ├── errors.ts        # Error types
│   │   │   ├── circuitBreaker.ts # Circuit breaker
│   │   │   └── retryStrategy.ts  # Retry strategy
│   │   ├── services/     # Business logic
│   │   │   └── postService.ts   # Post data service
│   │   ├── wordpress.ts  # WordPress API wrapper
│   │   └── cache.ts      # Cache utilities
│   └── types/            # TypeScript definitions
├── docs/                  # Documentation
│   ├── blueprint.md      # Architecture blueprint
│   ├── task.md           # Task backlog
│   └── api/              # API documentation (to be added)
├── __tests__/            # Test files
├── docker-compose.yml    # Docker configuration
├── wp-config.php        # WordPress configuration
└── wp-content/          # WordPress themes and plugins
```

## WordPress API Endpoints

Base URL: `http://localhost:8080/wp-json/wp/v2/`

Available endpoints:
- `/posts` - News articles
- `/categories` - Categories
- `/tags` - Tags
- `/media` - Media/images
- `/users` - Authors

## Resilience Patterns

The application implements several resilience patterns for reliable API integration:

1. **Circuit Breaker**: Prevents cascading failures by stopping calls to failing services
2. **Retry Strategy**: Automatically retries failed requests with exponential backoff
3. **Request Cancellation**: Cancels stale requests using AbortController
4. **Fallback Data**: Provides fallback content when WordPress API is unavailable

See [docs/blueprint.md](docs/blueprint.md) for detailed architecture and configuration.

## Testing

```bash
npm test              # Run all tests
npm test:watch        # Run tests in watch mode
```

Test coverage includes:
- Unit tests for business logic (postService, API utilities)
- Integration tests for resilience patterns (circuit breaker, retry strategy)
- Component tests for React components

## Performance

- **ISR Caching**: Static pages revalidate every 5 minutes
- **Parallel API Calls**: Multiple endpoints fetched concurrently
- **Component Optimization**: React.memo for expensive components
- **Bundle Size**: Optimized for performance (< 200KB initial JS)

## Security

- **XSS Protection**: DOMPurify on all user-generated content
- **CSP**: Content Security Policy headers
- **Type Safety**: Strong TypeScript coverage
- **Input Validation**: Runtime validation for API responses

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run quality checks:
   ```bash
   npm run lint
   npm run typecheck
   npm test
   ```
4. Commit your changes
5. Push to the branch
6. Create a Pull Request to `dev` branch

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Deployment

### Production Build

```bash
npm run build
npm run start
```

### Docker Deployment

```bash
docker-compose up -d  # WordPress backend
docker-compose -f docker-compose.prod.yml up -d  # Production setup
```

## Troubleshooting

### WordPress not accessible
```bash
docker-compose ps
docker-compose logs wordpress
```

### Frontend build errors
```bash
rm -rf .next node_modules
npm install
npm run build
```

### API connection errors
- Check WordPress is running: http://localhost:8080
- Verify environment variables in `.env`
- Check WordPress REST API: http://localhost:8080/wp-json/wp/v2/

## Documentation

- [Architecture Blueprint](docs/blueprint.md) - Detailed system architecture
- [Task Backlog](docs/task.md) - Current development tasks
- [API Documentation](docs/api.md) - API usage examples (coming soon)

## License

MIT

## Contact

For issues and questions, please open an issue on GitHub.
