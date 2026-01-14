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

# -------------------------
# Copy backend manifests
# -------------------------
COPY backend/package.json ./backend/
COPY backend/tsconfig.json ./backend/
COPY backend/prisma.config.ts ./backend/

# -------------------------
# Copy Prisma schema
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

# Dummy DB URL only for Prisma generate at build time
ENV DATABASE_URL="mysql://dummy:dummy@localhost:3306/dummy"

RUN pnpm prisma generate
RUN pnpm build


# =========================
# Production stage
# =========================
FROM node:22-alpine AS production

# Install pnpm, Prisma CLI, and create non-root user
RUN npm install -g pnpm@9 && \
    pnpm add -g prisma && \
    addgroup -S nodejs && \
    adduser -S nodejs -G nodejs

WORKDIR /app

# -------------------------
# Copy monorepo root files
# -------------------------
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# -------------------------
# Copy backend manifests
# -------------------------
COPY backend/package.json ./backend/
COPY backend/prisma.config.ts ./backend/

# -------------------------
# Install production dependencies only
# -------------------------
RUN pnpm install --frozen-lockfile --prod

# -------------------------
# Copy built artifacts & Prisma client
# -------------------------
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/generated ./backend/generated
COPY --from=builder /app/backend/prisma ./backend/prisma

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
