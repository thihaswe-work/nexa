# ---- Dependencies Stage ----
FROM node:20-alpine AS deps
LABEL stage=deps

WORKDIR /app

COPY package*.json ./
RUN npm ci

# ---- Build Stage ----
FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY next.config.js tsconfig.json ./
COPY public/ ./public/
COPY src/ ./src/
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache tini curl

COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
