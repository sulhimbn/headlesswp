# Contributing to HeadlessWP

Thanks for taking the time to contribute. This guide covers the three things you need to get going:

1. [Set up the project locally](#1-set-up-the-project-locally)
2. [Run it and verify it works](#2-run-it-and-verify-it-works)
3. [Submit your changes](#3-submit-your-changes)

For architecture details, coding standards, and deeper workflows, see the guides listed in [Further reading](#further-reading).

## Table of contents

- [Code of conduct](#code-of-conduct)
- [1. Set up the project locally](#1-set-up-the-project-locally)
- [2. Run it and verify it works](#2-run-it-and-verify-it-works)
- [3. Submit your changes](#3-submit-your-changes)
- [Coding standards](#coding-standards)
- [Tests](#tests)
- [Troubleshooting](#troubleshooting)
- [Further reading](#further-reading)

## Code of conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). Please read it and follow it in all project spaces.

## 1. Set up the project locally

### Prerequisites

| Tool | Version | Notes |
| --- | --- | --- |
| Node.js | 20 (see `.nvmrc`) | `.npmrc` sets `engine-strict=true`, so npm will fail fast on a wrong version |
| npm | ships with Node 20 | this repo is npm-only; there is no yarn/pnpm lockfile |
| Git | any recent version | |
| Docker + Docker Compose | v2 | only needed to run the WordPress backend locally |

If you use [nvm](https://github.com/nvm-sh/nvm):

```bash
nvm install && nvm use   # reads .nvmrc
```

### Clone and install

```bash
git clone https://github.com/sulhimbn/headlesswp.git
cd headlesswp
npm ci                   # clean install from package-lock.json (same as CI)
```

Use `npm ci` for a reproducible install, exactly as CI does. Use `npm install` only when you intend to change dependencies.

### Configure environment variables

The app validates its environment at startup (`src/lib/config/envValidation.ts`, called from `src/app/layout.tsx`) and **throws** if either of these is missing:

- `NEXT_PUBLIC_WORDPRESS_URL`
- `NEXT_PUBLIC_WORDPRESS_API_URL`

Start from the template and point them at your local WordPress instance:

```bash
cp .env.example .env
```

Use the name `.env` (not `.env.local`): Next.js reads both, but Docker Compose only reads `.env`, and the Docker services below need the `MYSQL_*` values from it.

```env
NEXT_PUBLIC_WORDPRESS_URL=http://localhost:8080
NEXT_PUBLIC_WORDPRESS_API_URL=http://localhost:8080/wp-json
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL_WWW=http://localhost:3000
WORDPRESS_URL=http://localhost:8080
WORDPRESS_API_URL=http://localhost:8080/wp-json
```

The rest of `.env.example` (database credentials, Sentry, content-summarization provider) is optional for frontend work, but the `MYSQL_*` values are required by Docker Compose. `.env` is git-ignored — never commit real credentials, and never edit `.env.example` with real values.

You can confirm the environment is valid at any time:

```bash
curl http://localhost:3000/api/health/environment   # 200 = valid, 500 = missing required vars
```

### Start the WordPress backend (Docker)

Run only the backend services so port 3000 stays free for `npm run dev`:

```bash
docker compose up -d wordpress db phpmyadmin
```

| Service | URL | Credentials |
| --- | --- | --- |
| WordPress | http://localhost:8080 | complete the install at `/wp-admin/install.php` |
| WordPress admin | http://localhost:8080/wp-admin | the admin account created during the install below |
| REST API | http://localhost:8080/wp-json/wp/v2/ | public |
| phpMyAdmin | http://localhost:8081 | `root` / `MYSQL_ROOT_PASSWORD` from `.env` |

If the WordPress container comes up empty, finish the 5-minute install:

- manually at http://localhost:8080/wp-admin/install.php (you choose the admin user and password), or
- via `./install-wordpress.sh` (reads `WP_ADMIN_USER` / `WP_ADMIN_PASSWORD` / `WP_ADMIN_EMAIL` from the environment, so set them in `.env`; it generates a random password when `WP_ADMIN_PASSWORD` is unset)

Then create a post in the WordPress admin so the frontend has content to render.

## 2. Run it and verify it works

```bash
npm run dev        # http://localhost:3000
```

### Alternative: run the whole stack in Docker

If you prefer not to run Node locally, the dev override mounts your source and runs the Next.js dev server with hot reload:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.dev.yml logs -f frontend
```

See [docs/guides/development.md](docs/guides/development.md#docker-development-with-hot-reload) for the details, including how to rebuild after adding dependencies.

### Scripts

```bash
npm run dev          # Start Next.js dev server
npm run build        # Production build
npm run start        # Serve the production build
npm run lint         # ESLint over src/
npm run typecheck    # tsc --noEmit
npm run test         # Jest test suite
npm run test:watch   # Jest in watch mode
npm run check        # lint + typecheck + test (run this before every push)
npm run analyze      # Build with bundle analyzer
npm run size-check   # Fail if a chunk exceeds 250 KB or the total exceeds 850 KB
npm run audit:security   # npm audit at moderate severity
npm run audit:full       # npm audit at low severity
npm run deps:check       # List outdated dependencies
npm run deps:update      # Update within semver ranges
```

### Verify the stack

```bash
curl http://localhost:8080/wp-json/wp/v2/posts   # WordPress API responds
curl http://localhost:3000                       # Frontend responds
npm run check                                    # Lint, types, and tests pass
npm run build                                    # Production build succeeds
```

`./test-api-integration.sh` runs these checks against a local stack end to end.

### Conventions worth knowing up front

- ESLint only covers `src/` — `__tests__/`, `scripts/`, and root config files are not linted.
- `no-console` is a warning in `src/**`; use `logger` from `@/lib/utils/logger` instead of `console.log`.
- Tests do **not** need WordPress running: `jest.setup.js` injects `http://localhost:8080` defaults and mocks `next/server` and `next/navigation`.

## 3. Submit your changes

### 1. Branch from `main`

```bash
git checkout main
git pull origin main
git checkout -b feature/short-description   # or fix/..., docs/..., chore/...
```

Branch prefixes in use: `feature/*`, `fix/*`, `docs/*`, `chore/*`. Always branch from `main`, not from another feature branch.

### 2. Commit with Conventional Commits

```
<type>(optional scope): short imperative summary

feat: add srcset support to post images
fix: resolve API timeout on slow connections
docs: update API documentation
refactor: extract cache logic into its own module
test: cover the date formatting utility
chore: bump axios
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`. Keep commits small and focused, and add tests with the behavior they cover.

### 3. Run the checks locally first

```bash
npm run check
npm run build
```

`npm run check` runs the exact same lint, typecheck, and test commands as CI, so a green local run means a green pipeline.

### 4. Push and open a pull request

```bash
git push -u origin feature/short-description
```

Open the PR against `main`. The [PR template](.github/pull_request_template.md) asks you to fill in the change type, a description, related issues (`Fixes #123`), what you changed, how you tested it, and any security or performance impact. Add screenshots for UI changes.

### 5. What happens next

- CI ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs `lint`, `typecheck`, and `test`, then a production `build` on every PR to `main`. All jobs must pass.
- [CODEOWNERS](CODEOWNERS) automatically requests review from the maintainer for all files.
- Reviewers follow [CODE_REVIEW_GUIDELINES.md](.github/CODE_REVIEW_GUIDELINES.md): code quality, tests, documentation, and a clear description. Failing tests, merge conflicts, missing docs, and security issues block merge.
- Address feedback with follow-up commits (or pushes to the same branch), and keep the branch up to date with `main`.

### Reporting issues

Use the templates in [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/) — `bug_report.md` and `feature_request.md`. For anything substantial, open an issue and discuss the approach before writing code so you do not build the wrong thing.

### Reporting security issues

Do not open a public issue for a vulnerability. Report it privately to the maintainers; see [docs/guides/SECURITY.md](docs/guides/SECURITY.md). Dependabot monitors `Dockerfile` and `docker-compose.yml` and opens image-update PRs on its own.

## Coding standards

The short version — the long version is in [docs/guides/development.md](docs/guides/development.md):

- **TypeScript everywhere.** Strict mode is on. No `any`; use `unknown` plus a type guard.
- **Pick the right API layer.** `enhancedPostService` for page data fetching (validation, caching, fallbacks), `standardizedAPI` for API routes/proxies (consistent error shape), `wordpressAPI` for raw WordPress access.
- **Sanitize any HTML** coming from WordPress with `sanitizeHTML()` before rendering it.
- **Use design tokens** (`bg-[hsl(var(--color-primary))]`) instead of hardcoded Tailwind colors, and keep components mobile-first and accessible (semantic HTML, WCAG AA).
- **Prefer parallel fetches** and `Promise.all`, and set `revalidate` for ISR pages.
- **Keep components small and focused**, with a typed props interface.

## Tests

```bash
npm run test                    # Single run
npm run test:watch              # Watch mode
npm run test -- --coverage      # Coverage report
```

Jest is configured in `jest.config.cjs`:

- Tests live in `__tests__/` and must match `**/__tests__/**/*test.(ts|tsx|js)` — name the file `something.test.ts`, not `something.spec.ts`.
- `@/` maps to `src/`.
- The environment is `jsdom`, with `@testing-library/react` and `jest-axe` available for accessibility assertions.

Follow Arrange–Act–Assert, name tests as `when X, it should Y`, test behavior rather than internals, mock the API and services, and cover error paths as well as happy paths.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| App throws about missing environment variables on startup | Set `NEXT_PUBLIC_WORDPRESS_URL` and `NEXT_PUBLIC_WORDPRESS_API_URL` in `.env` |
| Frontend renders nothing / API calls fail | Check `docker compose ps` and `curl http://localhost:8080/wp-json/wp/v2/posts` |
| Port 3000 already in use | Something else owns it, or the `frontend` service from `docker compose up` is still running — stop it with `docker compose stop frontend` |
| Type or build errors after pulling | `rm -rf .next node_modules && npm ci` |
| `npm run size-check` fails | A chunk exceeded the 250 KB limit; split the component or use a dynamic import |

More in [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md).

## Further reading

- [README](README.md) — project overview, features, structure
- [Development Guide](docs/guides/development.md) — workflow, code organization, performance
- [Contributing Guide](docs/guides/CONTRIBUTING.md) — extended contribution and dependency policy
- [Architecture Blueprint](docs/blueprint.md) — system design and patterns
- [Security Guide](docs/guides/SECURITY.md) — security policies
- [API Documentation](docs/api.md) — API layer reference
- [Troubleshooting Guide](docs/TROUBLESHOOTING.md) — common problems

## License

Contributions are licensed under the [MIT License](LICENSE).
