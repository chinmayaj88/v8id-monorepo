# Build stage
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Copy prisma schema
COPY backend/prisma ./backend/prisma/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy backend source code
COPY backend/src ./backend/src/
COPY backend/tsconfig.json ./backend/

# Generate Prisma Client and build
WORKDIR /app/backend
RUN pnpm prisma:generate
RUN pnpm build

# Production stage
FROM node:22-alpine AS production

# Install pnpm and create non-root user for security
RUN npm install -g pnpm@9 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy monorepo root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Copy backend package.json
COPY backend/package.json ./backend/

# Copy Prisma schema (needed for client generation)
COPY --from=builder /app/backend/prisma ./backend/prisma

# Install production dependencies only (Prisma CLI is in devDependencies but needed)
# We keep dev dependencies to ensure Prisma CLI is available
# This is acceptable for containerized deployments
RUN pnpm install --frozen-lockfile --prod=false

# Generate Prisma client in production stage
WORKDIR /app/backend
RUN pnpm prisma:generate

# Copy built application from builder
COPY --from=builder /app/backend/dist ./backend/dist

# Copy generated Prisma client from builder (custom output path)
COPY --from=builder /app/backend/generated ./backend/generated

# Change ownership to non-root user
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

WORKDIR /app/backend

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]
