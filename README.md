# HeadlessWP

Headless WordPress implementation for [mitrabantennews.com](https://mitrabantennews.com)

## Quick Start

```bash
git clone https://github.com/sulhimbn/headlesswp.git
cd headlesswp
cp .env.example .env
docker-compose up -d
npm install
npm run dev
```

Access the application at [http://localhost:3000](http://localhost:3000)

## Overview

WordPress as a headless CMS with a Next.js 14 frontend. WordPress manages content, provides REST API endpoints, and Next.js consumes those APIs to deliver a modern, performant web application.

```
┌─────────────┐     REST API      ┌──────────────┐
│   Next.js   │ ◄──────────────► │  WordPress   │
│  Frontend   │   (wp-json)      │   Backend    │
└─────────────┘                  └──────────────┘
```

## Documentation

- 📖 [Development Guide](docs/guides/development.md) - Setup, development, and deployment
- 🏗️ [Architecture Blueprint](docs/blueprint.md) - System architecture and design patterns
- 🔌 [API Documentation](docs/api.md) - Complete API reference and usage examples
- 🛡️ [Security Guide](docs/guides/SECURITY.md) - Security policies and best practices
- 🤝 [Contributing Guide](docs/guides/CONTRIBUTING.md) - How to contribute
- 📋 [Task Backlog](docs/task.md) - Current development tasks

## Technology Stack

**Frontend**
- Next.js 14.2 (App Router)
- TypeScript 5.9
- Axios 1.7
- DOMPurify 3.3

**Backend**
- WordPress (headless CMS)
- REST API
- MySQL
- Docker + Docker Compose

**Resilience Patterns**
- Circuit Breaker
- Retry Strategy with Exponential Backoff
- Rate Limiting (Token Bucket)
- Request Cancellation
- Dependency-Aware Caching

## Available Scripts

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
```

## Project Structure

```
headlesswp/
├── src/                   # Next.js application
│   ├── app/              # App Router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities and API layer
│   │   ├── api/          # API client and resilience patterns
│   │   ├── services/     # Business logic
│   │   └── validation/   # Data validation
│   └── types/            # TypeScript definitions
├── docs/                  # Documentation
├── __tests__/            # Test files
└── docker-compose.yml    # Docker configuration
```

## Key Features

- 🚀 **Static Site Generation** - ISR with 5-minute revalidation
- 🛡️ **Security** - XSS protection (DOMPurify), CSP headers, input validation
- ⚡ **Performance** - Optimized bundle size, component memoization, parallel API calls
- 🔄 **Resilience** - Circuit breaker, retry strategy, rate limiting
- ♿ **Accessibility** - WCAG AA compliant components, semantic HTML
- 📱 **Responsive** - Mobile-first design, multi-breakpoint support

## Development

See [Development Guide](docs/guides/development.md) for complete setup instructions.

### Prerequisites

- Docker & Docker Compose
- Node.js 18+
- Git

### Environment Variables

Copy `.env.example` to `.env` and configure:

```env
WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_URL=https://mitrabantennews.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://mitrabantennews.com/wp-json
SKIP_RETRIES=false
```

## Testing

```bash
npm test              # Run all tests
npm test:watch        # Run tests in watch mode
```

Test coverage:
- Unit tests for business logic
- Integration tests for resilience patterns
- Component tests for React components

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run quality checks: `npm run lint && npm run typecheck && npm test`
4. Commit and push
5. Create Pull Request

See [Contributing Guide](docs/guides/CONTRIBUTING.md) for detailed guidelines.

## License

MIT

## Support

- 📖 [Documentation](docs/)
- 🐛 [Issue Tracker](https://github.com/sulhimbn/headlesswp/issues)
- 💬 [Discussions](https://github.com/sulhimbn/headlesswp/discussions)
