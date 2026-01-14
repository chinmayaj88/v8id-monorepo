# =========================
# Build stage
# =========================
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@9

WORKDIR /app

# -------------------------
# Copy monorepo root files
# -------------------------
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY tsconfig.base.json ./
COPY prisma.config.ts ./prisma.config.ts

# -------------------------
# Copy backend manifests
# -------------------------
COPY backend/package.json ./backend/
COPY backend/tsconfig.json ./backend/

# -------------------------
# Copy Prisma files
# -------------------------
COPY backend/prisma ./backend/prisma/

# -------------------------
# Install dependencies
# -------------------------
RUN pnpm install --frozen-lockfile

# -------------------------
# Copy backend source
# -------------------------
COPY backend/src ./backend/src/

# -------------------------
# Build backend
# -------------------------
WORKDIR /app/backend

RUN pnpm prisma generate
RUN pnpm build


# =========================
# Production stage
# =========================
FROM node:22-alpine AS production

# Install pnpm and create non-root user
RUN npm install -g pnpm@9 && \
  addgroup -S nodejs && \
  adduser -S nodejs -G nodejs

WORKDIR /app

# -------------------------
# Copy monorepo root files
# -------------------------
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma.config.ts ./prisma.config.ts

# -------------------------
# Copy backend manifests
# -------------------------
COPY backend/package.json ./backend/

# -------------------------
# Copy Prisma schema + migrations
# -------------------------
COPY --from=builder /app/backend/prisma ./backend/prisma

# -------------------------
# Install dependencies
# Prisma CLI is required at runtime
# -------------------------
RUN pnpm install --frozen-lockfile --prod=false

# -------------------------
# Generate Prisma client
# -------------------------
WORKDIR /app/backend
RUN pnpm prisma generate

# -------------------------
# Copy built artifacts
# -------------------------
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/generated ./backend/generated

# -------------------------
# Permissions
# -------------------------
RUN chown -R nodejs:nodejs /app
USER nodejs

WORKDIR /app/backend

# -------------------------
# Expose app port
# -------------------------
EXPOSE 4000

# -------------------------
# Healthcheck
# -------------------------
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# -------------------------
# Start app
# -------------------------
CMD ["node", "dist/index.js"]
