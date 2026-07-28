# ---- Build Stage ----
FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY tsconfig*.json nest-cli.json ./
COPY prisma/ ./prisma/
RUN npx prisma generate

COPY src/ ./src/
RUN npm run build

# ---- Development Stage ----
FROM node:20-alpine AS development

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY . .

EXPOSE 4000

CMD ["npm", "run", "start:dev"]

# ---- Production Stage ----
FROM node:20-alpine AS production

WORKDIR /app

RUN apk add --no-cache openssl tini curl

# Production dependencies only
COPY package*.json ./
RUN npm ci --only=production --ignore-scripts && \
    npm cache clean --force

# Copy built artifacts and Prisma client
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Health check script
COPY --from=builder /app/dist/scripts/health.js ./scripts/health.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
