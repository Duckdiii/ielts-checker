# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json bun.lock* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Install tsx globally or as runtime dependency
RUN npm install -g tsx

# Copy built frontend assets and backend source
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/backend ./backend
COPY --from=builder /app/index.html ./index.html

EXPOSE 3000

CMD ["tsx", "backend/src/server.ts"]
