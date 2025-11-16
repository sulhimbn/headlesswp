# Development Guide

This guide provides information for developers working on the headless WordPress project.

## Getting Started

### Prerequisites
- Node.js 18+ 
- Docker and Docker Compose
- Git

### Installation
1. Clone the repository
2. Run `npm install`
3. Set up environment variables from `.env.example`
4. Start WordPress with `docker-compose up -d`
5. Run `npm run dev` to start the development server

## Project Structure

```
src/
├── app/              # Next.js app router pages
├── components/       # Reusable React components
├── lib/             # Utility libraries and API clients
└── types/           # TypeScript type definitions
```

## Development Workflow

1. Create a feature branch from `main`
2. Make your changes
3. Run tests with `npm run test`
4. Run type checking with `npm run typecheck`
5. Submit a pull request

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run typecheck` - Run TypeScript type checking
- `npm run lint` - Run ESLint

## Coding Standards

- Use TypeScript for all new code
- Follow ESLint configuration
- Write tests for new features
- Use conventional commit messages

## WordPress Integration

The project uses WordPress as a headless CMS with:
- REST API for content fetching
- GraphQL support via WPGraphQL plugin
- Custom post types and taxonomies

## Environment Variables

Key environment variables:
- `NEXT_PUBLIC_WORDPRESS_URL` - WordPress instance URL
- `WORDPRESS_DATABASE_URL` - Database connection string

See `.env.example` for complete list.