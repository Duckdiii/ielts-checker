# Multi-stage build for optimal image size
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json bun.lock* ./

# Install all dependencies (including devDependencies needed for build)
RUN npm ci

# Copy source code
COPY . .

# Build frontend and backend production bundle
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

# Copy built frontend assets, compiled backend and html
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/index.html ./index.html

EXPOSE 3000

CMD ["node", "dist/server.js"]
