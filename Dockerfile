# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/server/package.json ./apps/server/
COPY packages/providers/package.json ./packages/providers/
COPY packages/sdk/package.json ./packages/sdk/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source files
COPY . .

# Build packages and server
RUN pnpm --filter @signinwithethos/providers build
RUN pnpm --filter @signinwithethos/server build

# Production stage
FROM node:20-alpine AS runner

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files from builder
COPY --from=builder /app/apps/server/.next/standalone ./
COPY --from=builder /app/apps/server/.next/static ./apps/server/.next/static
COPY --from=builder /app/apps/server/public ./apps/server/public

# Set permissions
USER nextjs

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "apps/server/server.js"]
