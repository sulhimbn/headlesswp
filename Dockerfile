# Production-ready Dockerfile for Next.js 16
# Multi-stage build for optimized image size
#
# Security features enabled:
# - Read-only root filesystem support (requires /tmp and /var/run volumes)
# - Runs as non-root user (nextjs)
# - Or use docker-compose.yml which includes these security settings

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for configuration
ARG NEXT_PUBLIC_WORDPRESS_URL
ARG NEXT_PUBLIC_WORDPRESS_API_URL
ARG NEXT_PUBLIC_SITE_URL
ARG NEXT_PUBLIC_SITE_URL_WWW
ARG NODE_ENV=production

# Set build-time environment variables
ENV NEXT_PUBLIC_WORDPRESS_URL=${NEXT_PUBLIC_WORDPRESS_URL}
ENV NEXT_PUBLIC_WORDPRESS_API_URL=${NEXT_PUBLIC_WORDPRESS_API_URL}
ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}
ENV NEXT_PUBLIC_SITE_URL_WWW=${NEXT_PUBLIC_SITE_URL_WWW}
ENV NODE_ENV=${NODE_ENV}

RUN npx next build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

RUN mkdir -p /tmp /var/run && chown nextjs:nodejs /tmp /var/run

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD wget --spider -q http://localhost:3000 || exit 1
