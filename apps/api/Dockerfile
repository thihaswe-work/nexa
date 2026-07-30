FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/ packages/tsconfig/
COPY apps/api/package*.json apps/api/
COPY apps/api/tsconfig*.json apps/api/
COPY apps/api/nest-cli.json apps/api/

RUN npm ci

COPY apps/api/prisma apps/api/prisma
RUN npx prisma generate --schema=apps/api/prisma/schema.prisma

COPY apps/api/src apps/api/src
WORKDIR /app/apps/api
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache openssl tini curl

COPY package*.json ./
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/ packages/tsconfig/
COPY apps/api/package*.json apps/api/

RUN npm install --omit=dev --workspace=@nexa/api && \
    npm cache clean --force

COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

RUN cp dist/scripts/health.js scripts/health.js 2>/dev/null || true

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:4000/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
