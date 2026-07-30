FROM node:20-alpine AS builder
LABEL stage=builder

WORKDIR /app

RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/ packages/tsconfig/
COPY apps/admin/package*.json apps/admin/

RUN npm ci

COPY apps/admin/next.config.js apps/admin/tsconfig.json apps/admin/postcss.config.js apps/admin/tailwind.config.ts apps/admin/
COPY apps/admin/src apps/admin/src

WORKDIR /app/apps/admin
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN apk add --no-cache tini curl

COPY package*.json ./
COPY packages/eslint-config/package.json packages/eslint-config/
COPY packages/shared/package.json packages/shared/
COPY packages/tsconfig/ packages/tsconfig/
COPY apps/admin/package*.json apps/admin/

RUN npm install --omit=dev --workspace=@nexa/admin && \
    npm cache clean --force

COPY --from=builder /app/apps/admin/.next/standalone ./
COPY --from=builder /app/apps/admin/.next/static ./.next/static

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
