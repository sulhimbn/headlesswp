# HeadlessWP

Headless WordPress implementation for [mitrabantennews.com](https://mitrabantennews.com)

## What is HeadlessWP?

HeadlessWP is a **headless WordPress** implementation. This means:

- **WordPress** manages your content (articles, images, categories)
- **Next.js** displays that content to users with modern, fast technology
- **REST API** connects WordPress and Next.js

**Why Headless WordPress?**
- 🚀 **Faster performance** - Static site generation (SSG) delivers content quickly
- 🛡️ **Better security** - No WordPress vulnerabilities exposed to users
- 🎨 **Modern UX** - React-based interface with smooth interactions
- 📱 **Responsive** - Works perfectly on all devices
- 🔧 **Flexible** - Easy to extend with new features

If you're new to headless CMS, this project demonstrates how to decouple content management from frontend presentation.

---

## Quick Start

Get HeadlessWP running in 5 minutes. Follow these exact steps:

```bash
# 1. Clone and navigate
git clone https://github.com/sulhimbn/headlesswp.git
cd headlesswp

# 2. Set up environment (uses default values)
cp .env.example .env

# 3. Start WordPress backend (Docker)
docker-compose up -d

# 4. Install dependencies and start frontend
npm install && npm run dev
```

**That's it!** Access your site at http://localhost:3000

---

### Quick Start Details

**After running the commands above:**

- **Frontend**: http://localhost:3000 - Your headless WordPress site
- **WordPress Admin**: http://localhost:8080/wp-admin - Manage content (admin/admin)
- **WordPress API**: http://localhost:8080/wp-json/wp/v2/ - REST API endpoint
- **phpMyAdmin**: http://localhost:8081 - Database admin

**Default credentials for local development:**
- Database: WordPress (MySQL) - Running in Docker
- WordPress Admin: User `admin`, Password `admin`
- Environment: Uses default values from `.env.example`

### Verify Everything Works

```bash
# Verify WordPress API is responding
curl http://localhost:8080/wp-json/wp/v2/posts

# Run quality checks (optional)
npm run lint          # Check code quality
npm run typecheck     # Verify TypeScript types
npm test             # Run test suite
```

**Having Issues?** See [Troubleshooting Guide](docs/TROUBLESHOOTING.md)

## What You'll Learn

By exploring this codebase, you'll see:

- **Headless CMS architecture** - Decoupling content from presentation
- **Next.js App Router** - Server components, SSR, and ISR
- **TypeScript best practices** - Type safety across the stack
- **API resilience patterns** - Circuit breakers, retries, rate limiting
- **Caching strategies** - In-memory, ISR, cascade invalidation
- **Security implementations** - CSP, XSS protection, input validation
- **Design system approach** - Design tokens, component reusability

## Overview

WordPress as a headless CMS with a Next.js 16 frontend. WordPress manages content, provides REST API endpoints, and Next.js consumes those APIs to deliver a modern, performant web application.

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
- 🔧 [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Common issues and solutions
- 👥 [User Guide](docs/USER_GUIDE.md) - End-user documentation
- 📋 [Task Backlog](docs/task.md) - Current development tasks

## Technology Stack

**Frontend**
- Next.js 16.1 (App Router)
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
│   ├── app/              # App Router pages & API routes
│   ├── components/       # React components (layout, post, ui)
│   ├── lib/              # Utilities and API layer
│   │   ├── api/          # API client, resilience patterns, standardization
│   │   ├── services/     # Business logic (enhancedPostService)
│   │   ├── validation/   # Runtime data validation
│   │   ├── utils/        # Utilities (logger, sanitization)
│   │   └── constants/    # Constants and fallback data
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

**Local Development** - Use default values from `.env.example`:
```bash
cp .env.example .env
# Works immediately with default settings
```

**Production** - Update these variables in `.env`:
```env
NEXT_PUBLIC_WORDPRESS_URL=https://your-domain.com
NEXT_PUBLIC_WORDPRESS_API_URL=https://your-domain.com/wp-json
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NODE_ENV=production
```

See `.env.example` for all available configuration options.

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
