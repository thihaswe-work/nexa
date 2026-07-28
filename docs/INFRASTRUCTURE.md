# Nexa Infrastructure Guide

> Complete production infrastructure reference for deploying and hosting the Nexa social networking platform.

---

## Table of Contents

1. [Production Architecture](#1-production-architecture)
2. [Hosting Options](#2-hosting-options)
3. [Recommended Production Setup](#3-recommended-production-setup)
4. [Docker Infrastructure](#4-docker-infrastructure)
5. [Deployment Process](#5-deployment-process)
6. [CI/CD Pipeline](#6-cicd-pipeline)
7. [Domain Setup](#7-domain-setup)
8. [Reverse Proxy](#8-reverse-proxy)
9. [Scaling Strategy](#9-scaling-strategy)
10. [Monitoring](#10-monitoring)
11. [Security](#11-security)
12. [Backup Strategy](#12-backup-strategy)
13. [Production Checklist](#13-production-checklist)

---

## 1. Production Architecture

### System Topology

```
                                  ┌─────────────────────────────────┐
                                  │          Cloudflare             │
                                  │  CDN · WAF · DDoS · SSL · DNS  │
                                  └──────────┬──────────────────────┘
                                             │
                                        ┌────▼────┐
                                        │  Nginx  │
                                        │ Reverse │
                                        │  Proxy  │
                                        └────┬────┘
                         ┌───────────────────┼───────────────────┐
                         │                   │                   │
                    ┌────▼────┐        ┌─────▼──────┐     ┌─────▼──────┐
                    │  API    │        │   Admin    │     │ Monitoring │
                    │ NestJS  │        │ Next.js 14 │     │ Prometheus │
                    │ :4000   │        │ standalone │     │ + Grafana  │
                    │ Socket.IO│       │   :3000    │     │   :3001    │
                    └────┬────┘        └────────────┘     └─────┬──────┘
                         │                                      │
            ┌────────────┼─────────────────┐                    │
            │            │                 │                    │
       ┌────▼───┐   ┌────▼────┐     ┌─────▼──────┐             │
       │Postgres│   │  Redis  │     │   MinIO    │             │
       │PostGIS │   │  BullMQ │     │  S3-compat │             │
       │ :5432  │   │ Session │     │   :9000    │             │
       └────────┘   │ :6379   │     └────────────┘             │
                    └─────────┘                                │
                                                               │
                    ┌──────────────────────────────────────────┘
                    │
               ┌────▼────┐
               │Fluentd  │
               │Logs     │
               └─────────┘
```

### Communication Flows

#### Mobile App → API

```
┌──────────┐   HTTPS    ┌──────────┐   HTTP/2    ┌───────────┐
│  Flutter  │ ──────────▶│  Nginx   │ ────────────▶│  NestJS   │
│  Client   │ ◀───────── │  :443   │ ◀──────────── │   API     │
└──────────┘             └──────────┘              └─────┬─────┘
                                                         │
                                              ┌──────────▼──────────┐
                                              │  JWT Auth Guard     │
                                              │  (global)           │
                                              │  @CurrentUser('sub')│
                                              └──────────┬──────────┘
                                                         │
                                      ┌──────────────────┼──────────────────┐
                                      │                  │                  │
                                 ┌────▼────┐       ┌─────▼─────┐     ┌─────▼─────┐
                                 │ Prisma  │       │   Redis   │     │   BullMQ  │
                                 │ ORM     │       │  Cache    │     │  Queue    │
                                 └────┬────┘       │  Session  │     │ (jobs)    │
                                      │             │  PubSub   │     └───────────┘
                                 ┌────▼────┐       └───────────┘
                                 │Postgres │
                                 │PostGIS  │
                                 └─────────┘
```

**Request flow:**
1. Flutter client sends HTTPS request with JWT `Authorization: Bearer <access_token>` header
2. Nginx terminates SSL, proxies to NestJS API (upstream `nexa-api:4000`)
3. Global `JwtAuthGuard` validates token, extracts `sub` (user ID), `email`, `role`
4. Controller checks RBAC via `@RequirePermission()` decorator
5. Service layer queries Postgres via Prisma, caches in Redis, enqueues jobs in BullMQ
6. Response returned through Nginx

#### WebSocket (Socket.IO) Flow

```
┌──────────┐   WSS       ┌──────────┐   WS         ┌────────────┐
│  Flutter  │ ──────────▶│  Nginx   │ ─────────────▶│  NestJS    │
│  Client   │ ◀───────── │ upgrade  │ ◀─────────────│ Socket.IO  │
└──────────┘             └──────────┘               └──────┬─────┘
                                                            │
                                          ┌─────────────────┼─────────────────┐
                                          │                 │                 │
                                     ┌────▼────┐      ┌─────▼─────┐    ┌─────▼─────┐
                                     │  Redis  │      │  BullMQ   │    │  Session  │
                                     │ Adapter │      │  Events   │    │  Blacklist│
                                     │ Pub/Sub  │      │           │    │           │
                                     └─────────┘      └───────────┘    └───────────┘
```

**WebSocket flow:**
1. Client connects to `wss://api.nexa.app` with `token` in handshake `auth` or `query`
2. Nginx upgrades connection to WS, proxies to Socket.IO gateway
3. Gateway validates JWT, extracts user ID, registers connection in Redis presence set
4. Messages published to Redis PubSub — all API instances receive the event
5. For horizontal scaling: Redis adapter synchronizes across multiple Socket.IO instances

#### Notification Flow

```
┌─────────┐  ┌──────────────┐  ┌──────────┐  ┌──────────┐
│  Event   │─▶│  BullMQ     │─▶│  Worker  │─▶│  FCM     │
│ (msg,    │  │  Producer   │  │ Consumer │  │ APNs     │
│  friend) │  └──────────────┘  └──────────┘  │ WebSocket│
└─────────┘                                    └──────────┘
                                                      │
                                            ┌─────────▼─────────┐
                                            │  Mobile Device    │
                                            └───────────────────┘
```

**Notification delivery:**
1. Service layer enqueues notification job in BullMQ
2. Worker processes the job, creates DB record, sends push via FCM/APNs
3. If user is connected via WebSocket, real-time event pushed directly
4. Fallback: push notification via Firebase Cloud Messaging

#### Storage Flow

```
┌──────────┐  HTTP multipart  ┌──────────┐  presigned PUT  ┌──────────┐
│  Client  │ ────────────────▶│  API    │ ────────────────▶│  S3/R2  │
│          │                  │ /upload  │                  │  Bucket │
│          │ ◀────────────────│         │ ◀────────────────│          │
│          │  presigned URL   └──────────┘  presigned URL  └──────────┘
└──────────┘
```

**File upload flow:**
1. Client requests signed URL via `POST /files/upload/:category`
2. API verifies user is conversation participant or avatar owner (auth check)
3. Returns presigned URL — client uploads directly to S3/R2
4. Multer fallback (100 MB limit) for server-side upload via `POST /files/upload-multer`

---

## 2. Hosting Options

### Backend Hosting

| Provider | Spec (2 vCPU, 4 GB) | Monthly Cost | Pros | Cons |
|----------|---------------------|-------------|------|------|
| **Hetzner** | CX22 | ~$12 | Best price/performance, EU/US DC | Manual setup, no managed DB |
| **DigitalOcean** | Basic Droplet | ~$24 | Simple UI, good docs, 1-click apps | More expensive than Hetzner |
| **AWS EC2** | t3.medium | ~$30 | Global infra, integrates with all AWS | Complex pricing, steep learning curve |
| **Railway** | Starter | ~$20 | Zero-ops deploy, auto HTTPS | Lock-in, CPU limits, expensive at scale |
| **Render** | Starter | ~$25 | Auto-deploy from Git, managed Postgres | Limited regions, cold starts |
| **Vultr** | Regular Cloud | ~$20 | Good global coverage, GPU options | Smaller community |

**Recommendation (MVP/Growth):** Hetzner CX series for VPS. Railway or Render for zero-ops teams.

### Database Hosting

| Provider | Plan | Monthly Cost | Pros | Cons |
|----------|------|-------------|------|------|
| **Supabase** | Pro | ~$25 | PostGIS included, real-time, auth, dashboard | Row-level lock-in, connection limits |
| **Railway Postgres** | Starter | ~$12 | Managed, auto-backup, easy setup | No PostGIS by default |
| **DigitalOcean Managed DB** | 2 GB RAM | ~$30 | Managed backups, monitoring, scaling | No PostGIS support |
| **AWS RDS** | db.t3.medium | ~$50 | Full control, read replicas, Multi-AZ | Complex setup, egress costs |
| **Self-hosted (Docker)** | Same server | ~$0 | Full control, no monthly cost | Ops burden, no auto-failover |
| **Aiven** | Startup-4 | ~$50 | Multi-cloud, PostGIS, replicas, support | Expensive at scale |

**Recommendation (MVP):** Supabase Pro for managed Postgres + PostGIS + built-in auth.  
**Recommendation (Growth):** AWS RDS with read replicas, or Aiven for multi-cloud.  
**Recommendation (Scale):** Aurora Serverless v2 with Global Database.

### Redis Hosting

| Provider | Plan | Monthly Cost | Pros | Cons |
|----------|------|-------------|------|------|
| **Upstash** | Pro (100 MB) | ~$9 | Serverless, durable, REST API | Connection limits at lower tiers |
| **Redis Cloud** | Fixed (250 MB) | ~$15 | Fully managed, clustering, high perf | More expensive at scale |
| **Railway Redis** | Starter | ~$5 | Simple setup, auto-backup | No clustering |
| **Self-hosted (Docker)** | Same server | ~$0 | Full control, no cost | Ops burden, no HA |
| **AWS ElastiCache** | cache.t3.micro | ~$15 | Managed, VPC, Multi-AZ, clustering | Complex setup |

**Recommendation (MVP):** Self-hosted Redis in Docker (single instance).  
**Recommendation (Growth):** Upstash or Redis Cloud for managed + persistence.  
**Recommendation (Scale):** AWS ElastiCache cluster mode or Redis Cloud Pro.

### Object Storage

| Provider | Storage | Monthly Cost (100 GB) | Pros | Cons |
|----------|---------|---------------------|------|------|
| **Cloudflare R2** | 100 GB | ~$0.15 + $0.36/1M writes | Zero egress fees, global CDN | No free tier for workers |
| **AWS S3** | 100 GB | ~$2.30 + $0.005/1K writes | Industry standard, all features | Egress fees ($0.09/GB) |
| **DigitalOcean Spaces** | 250 GB | ~$5 flat | Simple pricing, CDN included | Limited regions |
| **Wasabi** | 1 TB | ~$6 flat | Cheapest, no egress fees | Minimum 1 TB storage |
| **MinIO (self-hosted)** | Unlimited | ~$0 | Full S3 compatibility, on-prem | Ops burden, storage space |

**Recommendation (all tiers):** Cloudflare R2 — zero egress + global CDN + S3-compatible API.

---

## 3. Recommended Production Setup

### MVP: 1,000 Users (~$45/month)

| Component | Solution | Cost |
|-----------|----------|------|
| **Server** | Hetzner CX22 (2 vCPU, 4 GB, 80 GB SSD) | ~$12 |
| **PostgreSQL** | Supabase Pro (8 GB, PostGIS) | ~$25 |
| **Redis** | Self-hosted (Docker, same server) | ~$0 |
| **Storage** | Cloudflare R2 (pay-as-you-go) | ~$2 |
| **Domain/SSL** | Cloudflare Free | ~$0 |
| **Monitoring** | Self-hosted (Prometheus + Grafana) | ~$0 |
| **Email/SMTP** | SendGrid Free (100/day) or Resend | ~$0 |
| **CDN** | Cloudflare Free | ~$0 |
| **Backup** | R2 backup (pg_dump → R2) | ~$2 |
| **Total** | | **~$41–$45/mo** |

**Server setup:** Single machine — API, Admin, Redis, MinIO, Nginx, Monitoring all in Docker.
**Database:** External managed (Supabase) to reduce load on the single server.

### Growth: 100,000 Users (~$650/month)

| Component | Solution | Cost |
|-----------|----------|------|
| **API Servers** | 3× Hetzner CX32 (4 vCPU, 8 GB) | ~$90 |
| **Admin Servers** | 2× Hetzner CX22 (2 vCPU, 4 GB) | ~$24 |
| **Load Balancer** | Hetzner LB (or HAProxy on CX11) | ~$10 |
| **PostgreSQL** | Aiven for Postgres (Business-8, 8 vCPU, 32 GB) | ~$250 |
| **Read Replica** | Aiven read replica (same spec) | ~$150 |
| **Redis Cluster** | Upstash Pro (1 GB, clustered) | ~$40 |
| **Storage** | Cloudflare R2 (500 GB) | ~$5 |
| **CDN** | Cloudflare Pro | ~$20 |
| **Monitoring** | Grafana Cloud Free | ~$0 |
| **Email** | SendGrid Essentials (50K/mo) | ~$15 |
| **Backup** | R2 + PgBouncer | ~$10 |
| **Total** | | **~$614/mo** |

**Key additions from MVP:**
- Load balancer in front of 3 API instances
- PostgreSQL with read replica for geo-queries
- PgBouncer for connection pooling
- Redis cluster for Socket.IO + caching
- Canary deployments with health checks

### Large Scale: 1,000,000 Users (~$3,500/month)

| Component | Solution | Cost |
|-----------|----------|------|
| **Kubernetes** | AWS EKS (5× c6i.xlarge, 8 vCPU, 32 GB) | ~$800 |
| **PostgreSQL** | Aurora Serverless v2 (writer + 3 readers) | ~$1,200 |
| **Redis** | ElastiCache (cluster, 3 shards × 3 replicas) | ~$400 |
| **Storage** | Cloudflare R2 (2 TB) | ~$15 |
| **CDN** | Cloudflare Business | ~$200 |
| **Monitoring** | Grafana Cloud Pro | ~$100 |
| **Logging** | Grafana Loki (2 TB ingested) | ~$150 |
| **Search** | OpenSearch (3× r6g.large) | ~$300 |
| **Email** | SendGrid Pro (500K/mo) | ~$90 |
| **Backup/DR** | Cross-region backups + WAL | ~$100 |
| **Total** | | **~$3,355/mo** |

**Key additions from Growth:**
- Kubernetes for auto-scaling and self-healing
- Aurora Serverless for auto-scaling database
- Elasticache Redis cluster for high-throughput Socket.IO
- OpenSearch for user discovery and full-text search
- Separate monitoring and logging infrastructure
- Traffic splitting via service mesh (Istio)
- mTLS between all services
- Read replicas handle all geo-spatial queries

---

## 4. Docker Infrastructure

### Container Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   nexa-net (public)                          │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Nginx   │  │   API   │  │  Admin   │  │   Grafana    │  │
│  │  :80/443 │  │  :4000  │  │  :3000   │  │   :3001      │  │
│  └────┬─────┘  └────┬────┘  └──────────┘  └──────────────┘  │
│       │              │                                        │
└───────┼──────────────┼────────────────────────────────────────┘
        │              │
┌───────┼──────────────┼────────────────────────────────────────┐
│       │              │            nexa-internal (private)      │
│  ┌────▼────┐  ┌─────▼─────┐  ┌──────────┐  ┌──────────────┐ │
│  │Postgres │  │   Redis   │  │  MinIO   │  │  Prometheus  │ │
│  │  :5432  │  │   :6379   │  │  :9000   │  │   :9090      │ │
│  └─────────┘  └───────────┘  └──────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### docker-compose.yml (Production)

```yaml
version: "3.9"

x-logging: &default-logging
  driver: "json-file"
  options:
    max-size: "10m"
    max-file: "3"

networks:
  nexa-net:
    driver: bridge
  nexa-internal:
    driver: bridge
    internal: true

volumes:
  postgres-data:
  redis-data:
  minio-data:
  prometheus-data:
  grafana-data:

services:
  # =====================
  # Database Layer
  # =====================
  postgres:
    image: postgis/postgis:16-3.4
    container_name: nexa-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DATABASE_NAME:-nexa_prod}
      POSTGRES_USER: ${DATABASE_USER:-nexa}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:?required}
    ports:
      - "127.0.0.1:5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/db/init:/docker-entrypoint-initdb.d:ro
    networks:
      - nexa-internal
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER:-nexa}"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    logging: *default-logging

  redis:
    image: redis:7-alpine
    container_name: nexa-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD:-} --appendonly yes
    ports:
      - "127.0.0.1:6379:6379"
    volumes:
      - redis-data:/data
    networks:
      - nexa-internal
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    logging: *default-logging

  # =====================
  # Storage Layer
  # =====================
  minio:
    image: minio/minio:latest
    container_name: nexa-minio
    restart: unless-stopped
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY:-nexa}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY:?required}
    ports:
      - "127.0.0.1:9000:9000"
      - "127.0.0.1:9001:9001"
    volumes:
      - minio-data:/data
    networks:
      - nexa-internal
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
    logging: *default-logging

  # =====================
  # Application Layer
  # =====================
  api:
    build:
      context: ./apps/api
      dockerfile: Dockerfile
      target: production
    container_name: nexa-api
    restart: unless-stopped
    deploy:
      resources:
        limits: { cpus: "1", memory: "512M" }
        reservations: { cpus: "0.5", memory: "256M" }
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: redis://:${REDIS_PASSWORD:-}@redis:6379
      REDIS_PREFIX: nexa:
      JWT_SECRET: ${JWT_SECRET:?required}
      JWT_ACCESS_EXPIRES_IN: ${JWT_ACCESS_EXPIRES_IN:-15m}
      JWT_REFRESH_EXPIRES_IN: ${JWT_REFRESH_EXPIRES_IN:-7d}
      JWT_ISSUER: ${JWT_ISSUER:-nexa-api}
      SMTP_HOST: ${SMTP_HOST:-smtp}
      SMTP_PORT: ${SMTP_PORT:-587}
      SMTP_USER: ${SMTP_USER:-}
      SMTP_PASS: ${SMTP_PASS:-}
      EMAIL_FROM: ${EMAIL_FROM:-noreply@nexa.app}
      S3_ENDPOINT: ${S3_ENDPOINT:-http://minio:9000}
      S3_REGION: ${S3_REGION:-auto}
      S3_BUCKET: ${S3_BUCKET:-nexa-uploads}
      S3_ACCESS_KEY_ID: ${S3_ACCESS_KEY_ID:-nexa}
      S3_SECRET_ACCESS_KEY: ${S3_SECRET_ACCESS_KEY:?required}
      S3_PUBLIC_URL: ${S3_PUBLIC_URL:-}
      LOG_LEVEL: ${LOG_LEVEL:-info}
    env_file:
      - path: .env
        required: false
    ports:
      - "127.0.0.1:4000:4000"
    networks:
      - nexa-net
      - nexa-internal
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:4000/health/live"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    logging: *default-logging

  admin:
    build:
      context: ./apps/admin
      dockerfile: Dockerfile
      target: production
    container_name: nexa-admin
    restart: unless-stopped
    deploy:
      resources:
        limits: { cpus: "0.5", memory: "256M" }
        reservations: { cpus: "0.25", memory: "128M" }
    environment:
      NODE_ENV: production
      PORT: 3000
      NEXT_PUBLIC_API_URL: ${API_URL:-https://api.nexa.app}
      NEXTAUTH_URL: ${ADMIN_URL:-https://admin.nexa.app}
      NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:?required}
    env_file:
      - path: .env
        required: false
    ports:
      - "127.0.0.1:3000:3000"
    networks:
      - nexa-net
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/auth/session"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    logging: *default-logging

  # =====================
  # Monitoring Layer
  # =====================
  prometheus:
    image: prom/prometheus:v2.51.0
    container_name: nexa-prometheus
    restart: unless-stopped
    volumes:
      - ./infra/monitoring/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - ./infra/monitoring/prometheus/rules:/etc/prometheus/rules:ro
      - prometheus-data:/prometheus
    command:
      - "--config.file=/etc/prometheus/prometheus.yml"
      - "--storage.tsdb.path=/prometheus"
      - "--storage.tsdb.retention.time=${PROMETHEUS_RETENTION:-30d}"
    ports:
      - "127.0.0.1:9090:9090"
    networks:
      - nexa-internal

  grafana:
    image: grafana/grafana:10.4.0
    container_name: nexa-grafana
    restart: unless-stopped
    environment:
      GF_SECURITY_ADMIN_USER: ${GRAFANA_USER:-admin}
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:?required}
    volumes:
      - ./infra/monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
      - ./infra/monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - grafana-data:/var/lib/grafana
    ports:
      - "127.0.0.1:3001:3000"
    networks:
      - nexa-net
      - nexa-internal
    depends_on:
      - prometheus

  # =====================
  # Reverse Proxy
  # =====================
  nginx:
    image: nginx:alpine
    container_name: nexa-nginx
    restart: unless-stopped
    volumes:
      - ./infra/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./infra/nginx/sites:/etc/nginx/conf.d:ro
      - ./data/certbot/conf:/etc/letsencrypt:ro
      - ./data/certbot/www:/var/www/certbot:ro
    ports:
      - "80:80"
      - "443:443"
    networks:
      - nexa-net
    depends_on:
      - api
      - admin
    logging: *default-logging
```

### Environment Variables (.env)

```bash
# ─── Database ───────────────────────────────────────
DATABASE_NAME=nexa_prod
DATABASE_USER=nexa
DATABASE_PASSWORD=<generate: openssl rand -hex 32>
DATABASE_URL=postgresql://nexa:<password>@postgres:5432/nexa_prod?schema=public

# ─── Redis ──────────────────────────────────────────
REDIS_PASSWORD=<generate: openssl rand -hex 32>
REDIS_PREFIX=nexa:

# ─── JWT ────────────────────────────────────────────
JWT_SECRET=<generate: openssl rand -hex 64>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=nexa-api

# ─── S3 / Storage ───────────────────────────────────
S3_ENDPOINT=http://minio:9000          # MinIO for dev; https://<account>.r2.cloudflarestorage.com for R2
S3_REGION=auto                          # 'auto' for R2, 'us-east-1' for AWS S3
S3_BUCKET=nexa-uploads
S3_ACCESS_KEY_ID=<your-access-key>
S3_SECRET_ACCESS_KEY=<your-secret-key>
S3_PUBLIC_URL=https://uploads.nexa.app  # CDN URL for public assets

# ─── SMTP / Email ───────────────────────────────────
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<sendgrid-api-key>
EMAIL_FROM=noreply@nexa.app

# ─── API ────────────────────────────────────────────
API_URL=https://api.nexa.app
ADMIN_URL=https://admin.nexa.app
NEXTAUTH_SECRET=<generate: openssl rand -hex 64>
PORT=4000
NODE_ENV=production
LOG_LEVEL=info

# ─── Monitoring ─────────────────────────────────────
GRAFANA_USER=admin
GRAFANA_PASSWORD=<generate: openssl rand -hex 32>
PROMETHEUS_RETENTION=30d
```

### Docker Compose Variants

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Full production stack |
| `docker-compose.dev.yml` | Development with hot-reload |
| `docker-compose.pgbouncer.yml` | Adds PgBouncer for connection pooling |
| `docker-compose.redis-cluster.yml` | Redis cluster mode for horizontal scaling |

---

## 5. Deployment Process

### Prerequisites

```bash
# Local machine
docker --version            # Docker 24+
docker compose version      # Compose v2
node --version              # Node 20+
openssl version             # For secret generation

# Server
ssh root@<server-ip>
apt update && apt upgrade -y
apt install docker.io docker-compose-v2 -y
```

### Secret Generation

```bash
# Run once to generate all secrets
cat << 'SECRETS' > .env
DATABASE_PASSWORD=$(openssl rand -hex 32)
JWT_SECRET=$(openssl rand -hex 64)
REDIS_PASSWORD=$(openssl rand -hex 32)
S3_SECRET_ACCESS_KEY=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 64)
GRAFANA_PASSWORD=$(openssl rand -hex 32)
SECRETS

# Source the generated secrets
source .env
```

### Backend Deployment

```bash
# 1. Clone and enter directory
git clone https://github.com/your-org/nexa.git
cd nexa

# 2. Set up environment
cp .env.example .env
# Edit .env with your production values

# 3. Build and start all services
docker compose build
docker compose up -d

# 4. Run database migrations
docker compose exec api npx prisma migrate deploy

# 5. Run database seed (if needed)
docker compose exec api npx prisma db seed

# 6. Verify health
curl -f http://localhost:4000/health/live
curl -f http://localhost:4000/health/ready
```

### Zero-Downtime Deployment

```bash
# For production updates with zero downtime:

# 1. Pull latest code
git pull origin main

# 2. Build new images
docker compose build api admin

# 3. Re-create services one at a time
docker compose up -d --no-deps --scale api=2  # Start new instance
docker compose up -d --no-deps api             # Restart primary
# Health check passes → remove old container
docker compose exec nginx nginx -s reload      # Reload upstreams

# 4. Repeat for admin
docker compose up -d --no-deps admin
```

### Database Migration Process

```bash
# Normal migration (no downtime expected)
docker compose exec api npx prisma migrate deploy

# If migration needs index creation (use CONCURRENTLY):
# 1. Generate migration locally
cd apps/api
npx prisma migrate dev --name add_user_location_index

# 2. Manually edit migration SQL to add CONCURRENTLY
# CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location ...

# 3. Apply migration
docker compose exec api npx prisma migrate resolve --applied <migration_name>
docker compose exec api -c "psql $DATABASE_URL -c 'CREATE INDEX CONCURRENTLY IF NOT EXISTS ...'"

# Rollback migration
docker compose exec api npx prisma migrate resolve --rolled-back <migration_name>
```

### Admin Deployment

```bash
# Admin is deployed as a standalone Next.js app via Docker
# The Dockerfile uses `output: standalone` for optimized builds

# Build and deploy
docker compose build admin
docker compose up -d admin

# Verify
curl -f http://localhost:3000
```

### Manual Server Setup (No Docker Compose)

```bash
# For environments where Docker Compose isn't appropriate:

# API
cd apps/api
npm ci --production
npx prisma generate
npx prisma migrate deploy
node dist/main.js

# Admin
cd apps/admin
npm ci --production
npx next build
npx next start -p 3000
```

---

## 6. CI/CD Pipeline

### GitHub Actions Workflow

The CI/CD pipeline is defined in `.github/workflows/`. Three workflows are configured:

| File | Trigger | Purpose |
|------|---------|---------|
| `ci.yml` | Push to any branch | Lint, typecheck, test, build |
| `cd.yml` | Push to `main` | Build, push to GHCR, deploy |
| `staging.yml` | Push to `develop` | Deploy to staging environment |

### CI Pipeline (ci.yml)

```yaml
name: CI
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  api:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/api
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  admin:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/admin
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20" }

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: TypeScript check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

  mobile:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/mobile
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: { flutter-version: "3.19" }

      - name: Analyze
        run: flutter analyze

      - name: Run tests
        run: flutter test
```

### CD Pipeline (cd.yml)

```yaml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push API
        uses: docker/build-push-action@v5
        with:
          context: apps/api
          push: true
          tags: ghcr.io/${{ github.repository }}/api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Build and push Admin
        uses: docker/build-push-action@v5
        with:
          context: apps/admin
          push: true
          tags: ghcr.io/${{ github.repository }}/admin:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Deploy to Production Server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/nexa
            docker compose pull
            docker compose up -d --no-deps --scale api=2 api
            sleep 15
            curl -f http://localhost:4000/health/live || exit 1
            docker compose up -d --no-deps api
            docker compose up -d --no-deps admin
            docker image prune -f
```

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DEPLOY_HOST` | Production server IP |
| `DEPLOY_USER` | SSH username |
| `DEPLOY_SSH_KEY` | Private SSH key for deployment |
| `DATABASE_URL` | Production database URL |

### Deployment Flow

```
Developer pushes to main
         │
         ▼
GitHub Actions CI triggers
  ├── Lint API + Admin + Mobile
  ├── TypeScript check API + Admin
  ├── Run API unit tests
  ├── Run Admin unit tests (73 tests)
  └── Run Flutter analyzer + tests
         │
         ▼
All checks pass
         │
         ▼
GitHub Actions CD triggers
  ├── Build API Docker image → ghcr.io
  ├── Build Admin Docker image → ghcr.io
  ├── SSH into production server
  │   ├── docker compose pull
  │   ├── Start new API instance (scaled to 2)
  │   ├── Health check on new instance
  │   ├── Restart API (rolling)
  │   └── Restart Admin
  └── Clean up old images
         │
         ▼
Deployment complete
```

---

## 7. Domain Setup

### DNS Records

Configure the following DNS records at your domain registrar or Cloudflare:

```dns
; Zone: nexa.app

; ── Main Application ──
api.nexa.app.       A     203.0.113.10        ; Production server IP
admin.nexa.app.     A     203.0.113.10        ; Same server (Nginx routes)

; ── Static Assets / CDN ──
uploads.nexa.app.   CNAME  nexa-uploads.r2.cloudflarestorage.com.  ; R2 bucket

; ── WebSocket ──
; Uses same domain as API (api.nexa.app) with path-based routing

; ── Monitoring (optional) ──
monitor.nexa.app.   A     203.0.113.10        ; Grafana (internal only)

; ── Email (optional) ──
nexa.app.           MX 10 mx.sendgrid.net.    ; Email delivery
nexa.app.           TXT "v=spf1 include:sendgrid.net ~all"
```

### SSL Certificates

**Option A: Cloudflare (Recommended)**

1. Set up Cloudflare as DNS provider (or delegate `nexa.app` to Cloudflare)
2. Enable **Full (Strict)** SSL/TLS mode in Cloudflare dashboard
3. Cloudflare handles SSL termination at the edge — certificates auto-renew
4. Origin certificates can be generated if needed for server-to-Cloudflare encryption

**Option B: Let's Encrypt (Self-hosted)**

```bash
# Install certbot
apt install certbot python3-certbot-nginx -y

# Get certificates for both domains
certbot --nginx -d api.nexa.app -d admin.nexa.app

# Auto-renewal (certbot creates systemd timer by default)
systemctl status certbot.timer

# Manual renewal test
certbot renew --dry-run
```

**Option C: Docker + certbot**

```bash
# Initial certificate request
docker compose run --rm certbot certonly --webroot \
  -w /var/www/certbot \
  -d api.nexa.app -d admin.nexa.app

# Renewal (runs daily via cron)
docker compose run --rm certbot renew
```

### HTTPS Configuration

```nginx
# Nginx SSL configuration (in /etc/nginx/nginx.conf)
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 1d;
ssl_session_tickets off;
ssl_stapling on;
ssl_stapling_verify on;

# HSTS (uncomment after confirming HTTPS works)
# add_header Strict-Transport-Security "max-age=63072000" always;
```

---

## 8. Reverse Proxy

### Nginx Configuration

The Nginx reverse proxy handles:
- SSL termination
- Routing to API and Admin
- WebSocket upgrade
- Static file serving
- Rate limiting
- Security headers

**Main config** (`infra/nginx/nginx.conf`):

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # ── Logging ──
    log_format json escape=json '{'
        '"time":"$time_iso8601",'
        '"remote_addr":"$remote_addr",'
        '"request":"$request",'
        '"status":$status,'
        '"body_bytes":$body_bytes_sent,'
        '"request_time":$request_time,'
        '"upstream_addr":"$upstream_addr",'
        '"http_referer":"$http_referer",'
        '"http_user_agent":"$http_user_agent"'
    '}';
    access_log /var/log/nginx/access.log json;

    # ── Rate Limiting Zones ──
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;
    limit_conn_zone $binary_remote_addr zone=conn:10m;

    # ── SSL (from certbot) ──
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 1d;

    # ── Performance ──
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    keepalive_requests 1000;
    client_max_body_size 100M;
    client_body_timeout 30s;
    client_header_timeout 30s;

    # ── Gzip ──
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # ── Upstreams ──
    upstream api_upstream {
        least_conn;
        server api:4000 max_fails=3 fail_timeout=30s;
        keepalive 64;
    }

    upstream admin_upstream {
        server admin:3000 max_fails=3 fail_timeout=30s;
        keepalive 16;
    }

    # ── Servers ──
    include /etc/nginx/conf.d/*.conf;
}
```

**API site** (`infra/nginx/sites/api.conf`):

```nginx
server {
    listen 443 ssl http2;
    server_name api.nexa.app;

    ssl_certificate /etc/letsencrypt/live/api.nexa.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.nexa.app/privkey.pem;

    # ── Security Headers ──
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; frame-ancestors 'none';" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # ── CORS (permissive for mobile clients) ──
    set $cors_origin "";
    if ($http_origin ~* (nexa\.app$|localhost)) {
        set $cors_origin $http_origin;
    }
    add_header Access-Control-Allow-Origin $cors_origin always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, PATCH, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
    add_header Access-Control-Allow-Credentials "true" always;

    # ── Health checks (no rate limit) ──
    location /health/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ── Auth endpoints (strict rate limit) ──
    location ~ ^/(auth/login|auth/register|auth/refresh|auth/forgot-password|auth/reset-password) {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # ── API endpoints ──
    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Connection "";
    }

    # ── WebSocket (Socket.IO) ──
    location /socket.io/ {
        limit_req zone=api burst=30 nodelay;
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # ── File upload (larger body, strict rate limit) ──
    location /files/upload {
        limit_req zone=upload burst=2 nodelay;
        client_max_body_size 100M;
        proxy_pass http://api_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP → HTTPS redirect
server {
    listen 80;
    server_name api.nexa.app;
    return 301 https://$host$request_uri;
}
```

**Admin site** (`infra/nginx/sites/admin.conf`):

```nginx
server {
    listen 443 ssl http2;
    server_name admin.nexa.app;

    ssl_certificate /etc/letsencrypt/live/admin.nexa.app/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.nexa.app/privkey.pem;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self' https://api.nexa.app;" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    location / {
        proxy_pass http://admin_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /_next/static {
        proxy_pass http://admin_upstream;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }
}

server {
    listen 80;
    server_name admin.nexa.app;
    return 301 https://$host$request_uri;
}
```

---

## 9. Scaling Strategy

### Backend (API) Scaling

```
        ┌─────────┐
        │  Nginx  │  (load balancer)
        │  :443   │
        └────┬────┘
     ┌───────┼───────┐
     │       │       │
┌────▼───┐┌─▼────┐┌─▼────┐
│ API v1 ││API v2││API v3│
│ :4000  ││:4001 ││:4002 │
└────┬───┘└──┬───┘└──┬───┘
     │       │       │
     └───────┼───────┘
             │
      ┌──────▼──────┐
      │   Redis     │  (shared session + adapter)
      │  Cluster    │
      └─────────────┘
```

**Horizontal scaling approach:**

1. **Add API instances** — Nginx `least_conn` load balancing distributes requests
2. **Redis adapter** — Socket.IO instances share state via Redis PubSub
3. **Stateless design** — JWT tokens carry session data, no server-side session storage
4. **Database pool** — PgBouncer manages connection pool across all instances

```bash
# Scale API to N instances
docker compose up -d --scale api=3

# Nginx automatically picks up new upstreams
docker compose exec nginx nginx -s reload
```

### Socket.IO Scaling

Socket.IO uses Redis as a shared adapter for horizontal scaling:

```typescript
// apps/api/src/main.ts
const redisAdapter = new RedisIoAdapter(app);
app.useWebSocketAdapter(redisAdapter);
```

**Adapter configuration:**

```typescript
// Redis adapter broadcasts events across all instances:
// 1. Client connects to API instance 1
// 2. Client sends message to instance 1
// 3. Instance 1 publishes to Redis channel "socket.io#/#"
// 4. Redis adapter on instance 2 receives the message
// 5. Instance 2 delivers to its connected clients
```

**Sticky sessions (optional):**
- Not required with Redis adapter
- Nginx can be configured with `ip_hash` to pin clients to instances

### Database Scaling

```sql
-- 1. Connection Pooling (PgBouncer)
--    Reduces PostgreSQL connection overhead
--    Run PgBouncer in transaction mode

-- 2. Read Replicas
--    Route read-only queries (NEARBY, geo-spatial) to replicas
--    Use Prisma's read replica support:
--      DATABASE_URL=postgresql://nexa@primary:5432/nexa
--      DATABASE_REPLICA_URL=postgresql://nexa@replica:5432/nexa

-- 3. PostGIS Indexing (CRITICAL for nearby queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_location_gist
  ON profiles USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  )
  WHERE deleted_at IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_location_history_gist
  ON location_history USING GIST (
    ST_SetSRID(ST_MakePoint(lng, lat), 4326)
  );

-- 4. Partial indexes for soft-delete
CREATE INDEX CONCURRENTLY idx_users_active ON users (id)
  WHERE deleted_at IS NULL AND is_active = true;

-- 5. Composite indexes for common queries
CREATE INDEX CONCURRENTLY idx_messages_conversation_created
  ON messages (conversation_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- 6. Table partitioning (at 1M+ scale)
CREATE TABLE messages PARTITION BY RANGE (created_at);
CREATE TABLE messages_2024_01 PARTITION OF messages
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Redis Scaling

```bash
# Single instance (MVP)
redis-server --requirepass <password> --appendonly yes

# Cluster mode (Growth+)
# Minimum 3 master nodes, each with 1 replica
redis-cli --cluster create \
  10.0.1.1:6379 10.0.1.2:6379 10.0.1.3:6379 \
  10.0.2.1:6379 10.0.2.2:6379 10.0.2.3:6379 \
  --cluster-replicas 1

# Memory sizing:
# 100K users × ~10KB/user (session + presence) = ~1 GB
# Socket.IO adapter overhead: ~500 MB
# Cache (profiles, conversations): ~2 GB
# Total: ~4 GB recommended
```

---

## 10. Monitoring

### Stack

| Layer | Tool | Purpose |
|-------|------|---------|
| Metrics | Prometheus + Exporters | Collect CPU, memory, request rates, DB stats |
| Visualisation | Grafana | Dashboards, alerting, annotations |
| Logs | Fluentd → Loki / Elasticsearch | Centralised log aggregation |
| Errors | Sentry | Real-time error tracking |
| Uptime | Health checks + Uptime Robot | HTTP endpoint monitoring |
| Performance | Prometheus metrics + Sentry traces | p50/p95/p99 latency |

### Prometheus Metrics

**Custom metrics exposed by the API:**

```
# HTTP
http_requests_total{method,path,status}     # Request count
http_request_duration_seconds{method,path}   # Latency histogram

# Database
prisma_query_duration_seconds               # DB query latency
prisma_queries_total{status}                 # Query count

# WebSocket
nexa_ws_connections_total                    # Active connections
nexa_ws_messages_total{type}                 # Messages sent/received

# Business
nexa_users_total{status}                     # User registrations
nexa_messages_total                          # Messages sent
nexa_nearby_queries_total                    # Geo queries
nexa_push_notifications_total{platform}      # Push notifications

# System
process_cpu_seconds_total
process_resident_memory_bytes
nodejs_eventloop_lag_seconds
```

**Prometheus config** (`infra/monitoring/prometheus/prometheus.yml`):

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

rule_files:
  - /etc/prometheus/rules/*.yml

scrape_configs:
  - job_name: "nexa-api"
    static_configs:
      - targets: ["api:4000"]
    metrics_path: "/metrics"

  - job_name: "node"
    static_configs:
      - targets:
          - "node-exporter:9100"

  - job_name: "postgres"
    static_configs:
      - targets:
          - "postgres-exporter:9187"

  - job_name: "redis"
    static_configs:
      - targets:
          - "redis-exporter:9121"
```

### Alert Rules

```yaml
# infra/monitoring/prometheus/rules/alerts.yml
groups:
  - name: nexa-alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m]) > 0.05
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "API error rate > 5%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "p95 latency > 2s"

      - alert: InstanceDown
        expr: up == 0
        for: 1m
        labels: { severity: critical }
        annotations:
          summary: "Instance {{ $labels.instance }} down"

      - alert: DiskSpace
        expr: (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"}) < 0.1
        for: 5m
        labels: { severity: critical }
        annotations:
          summary: "Disk space < 10%"

      - alert: HighCPU
        expr: avg by(instance) (rate(node_cpu_seconds_total{mode!="idle"}[10m])) > 0.8
        for: 10m
        labels: { severity: warning }
        annotations:
          summary: "CPU usage > 80%"

      - alert: DBConnectionsHigh
        expr: pg_stat_activity_count > 80
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "Database connections > 80"

      - alert: RedisMemoryHigh
        expr: redis_memory_used_bytes / redis_memory_max_bytes > 0.8
        for: 5m
        labels: { severity: warning }
        annotations:
          summary: "Redis memory > 80%"
```

### Sentry Setup

```bash
# API (NestJS)
npm install @sentry/node @sentry/profiling-node

# Production .env
SENTRY_DSN=https://<key>@o<org>.ingest.sentry.io/<project>
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

### Uptime Monitoring

```bash
# Option 1: Uptime Robot (free, 5 monitors)
# Monitor:
#   https://api.nexa.app/health/live   - 5 min intervals
#   https://admin.nexa.app              - 5 min intervals

# Option 2: Better Uptime (paid, $20/mo)
#   + Status page: status.nexa.app
#   + Incident management
#   + Public API

# Option 3: Self-hosted with Grafana
#   Grafana OnCall or AlertManager for PagerDuty/Slack/Email
```

---

## 11. Security

### Firewall

```bash
# Production server (ufw)
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh                # Port 22 (restrict to your IP if possible)
ufw allow http               # Port 80
ufw allow https              # Port 443
ufw enable

# Or use iptables with a stricter ruleset
iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s <your-ip> -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -j ACCEPT
iptables -A INPUT -j DROP
```

### Secrets Management

```bash
# NEVER commit secrets to version control
# .gitignore already excludes .env files

# Method 1: Docker secrets (recommended for production)
echo "my-db-password" | docker secret create db_password -
# Reference in docker-compose.yml:
# secrets:
#   db_password:
#     external: true

# Method 2: Environment variables (.env)
# Used in development. For production, encrypt .env:
gpg --symmetric --cipher-algo AES256 .env.production

# Method 3: Secret manager (AWS/GCP/Azure)
# Use SSM Parameter Store or Secrets Manager
# Fetch at container startup via init container

# Method 4: 1Password CLI (for team access)
op inject -i .env.template -o .env --account myteam.1password.com
```

### Database Security

```sql
-- 1. Use strong passwords (32+ random characters)
ALTER USER nexa WITH PASSWORD '<openssl rand -hex 32>';

-- 2. Limit network access (Docker internal network)
-- Already configured: postgres only accessible on nexa-internal network

-- 3. Use SSL for external connections
-- In DATABASE_URL: ?sslmode=require

-- 4. Create separate roles for read-only operations (for replicas)
CREATE ROLE nexa_readonly WITH LOGIN PASSWORD '<password>';
GRANT CONNECT ON DATABASE nexa_prod TO nexa_readonly;
GRANT USAGE ON SCHEMA public TO nexa_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO nexa_readonly;

-- 5. Regular security updates
-- Use postgis/postgres:16 image which auto-updates minor versions

-- 6. Audit logins
ALTER SYSTEM SET log_connections = 'on';
ALTER SYSTEM SET log_disconnections = 'on';
```

### API Rate Limiting

```typescript
// Nginx level (hard limits)
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/s;
limit_req_zone $binary_remote_addr zone=auth:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=upload:10m rate=5r/s;

// Application level (soft limits, with Redis)
// apps/api/src/infrastructure/redis/rate-limit.service.ts
@Injectable()
export class RateLimitService {
  async checkRateLimit(key: string, maxRequests: number, windowMs: number): Promise<boolean> {
    const current = await this.redis.incr(`rate_limit:${key}`);
    if (current === 1) await this.redis.pexpire(`rate_limit:${key}`, windowMs);
    return current <= maxRequests;
  }
}
```

### DDoS Protection

```
                     ┌──────────────┐
                     │  Cloudflare  │
                     │  (first line)│
                     │              │
                     │  · WAF       │
                     │  · Rate limit│
                     │  · IP block  │
                     │  · Challenge │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │   Nginx      │
                     │  (second line)│
                     │              │
                     │  · limit_req │
                     │  · limit_conn│
                     │  · Timeouts  │
                     └──────┬───────┘
                            │
                     ┌──────▼───────┐
                     │   API        │
                     │  (third line) │
                     │              │
                     │  · App rate  │
                     │    limiting  │
                     │  · Auth guard│
                     └──────────────┘
```

### File Upload Security

```typescript
// 1. File type validation (Multer)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },  // 100 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'audio/mpeg', 'audio/ogg', 'audio/wav'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new BadRequestException('Invalid file type'), false);
    }
  },
});

// 2. Signed URLs (pre-signed uploads)
// Client never uploads directly to API
// API generates pre-signed S3 URL after auth check

// 3. Virus scanning (at scale)
// Use ClamAV or AWS GuardDuty for uploaded files

// 4. File size limits by category
// Avatar: 5 MB
// Message image: 25 MB
// Voice message: 10 MB
// Video: 100 MB
```

### Security Checklist

- [ ] All secrets generated with `openssl rand -hex 64`
- [ ] `.env` files excluded from version control
- [ ] Database only accessible on internal Docker network
- [ ] PostgreSQL password meets complexity requirements
- [ ] Nginx configured with security headers
- [ ] Rate limiting enabled (auth: 10 req/s, api: 100 req/s)
- [ ] CORS restricted to known origins
- [ ] File upload validated by MIME type and size
- [ ] JWT tokens expire (access: 15 min, refresh: 7 days)
- [ ] HTTPS enforced (HTTP → 301 redirect)
- [ ] HSTS header configured
- [ ] Failed login attempts rate-limited
- [ ] API input validated with class-validator + Zod
- [ ] SQL injection prevented via Prisma parameterized queries
- [ ] XSS prevented via CSP headers + output encoding
- [ ] CSRF protection via token-based auth (not cookie-based)

---

## 12. Backup Strategy

### Database Backups

```bash
# ─── Automated backup script (scripts/backup/backup.sh) ───

#!/bin/bash
set -euo pipefail

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/tmp/nexa-backups"
PG_DATABASE="${DATABASE_NAME:-nexa_prod}"
S3_BUCKET="${S3_BUCKET:-nexa-backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"

mkdir -p "$BACKUP_DIR"

# Perform pg_dump with compression
echo "[$(date)] Starting backup of $PG_DATABASE..."
PGPASSWORD=$DATABASE_PASSWORD pg_dump \
  -h postgres \
  -U $DATABASE_USER \
  -d $PG_DATABASE \
  -F c \
  -Z 9 \
  -f "$BACKUP_DIR/${PG_DATABASE}_${TIMESTAMP}.dump.gz"

# Encrypt backup (optional)
gpg --symmetric --cipher-algo AES256 \
  --passphrase "$BACKUP_ENCRYPTION_KEY" \
  -o "$BACKUP_DIR/${PG_DATABASE}_${TIMESTAMP}.dump.gz.gpg" \
  "$BACKUP_DIR/${PG_DATABASE}_${TIMESTAMP}.dump.gz"

# Upload to S3/R2
aws s3 cp "$BACKUP_DIR/${PG_DATABASE}_${TIMESTAMP}.dump.gz.gpg" \
  "s3://$S3_BUCKET/database/$TIMESTAMP/"

# Upload WAL archive (continuous archiving)
# WAL files are archived by PostgreSQL streaming to S3

# Cleanup old backups (local)
find "$BACKUP_DIR" -name "*.dump.gz*" -mtime +$RETENTION_DAYS -delete

# Cleanup old backups (S3) - 30 day retention
aws s3 ls "s3://$S3_BUCKET/database/" | while read -r line; do
  createDate=$(echo "$line" | awk '{print $1" "$2}')
  if [ $(date -d "$createDate" +%s) -lt $(date -d "-$RETENTION_DAYS days" +%s) ]; then
    fileName=$(echo "$line" | awk '{print $4}')
    aws s3 rm "s3://$S3_BUCKET/database/$fileName"
  fi
done

echo "[$(date)] Backup completed successfully."
```

### Backup Schedule

```yaml
# CRON jobs on production server

# Full database dump (daily at 02:00 UTC)
0 2 * * * /opt/nexa/scripts/backup/backup.sh >> /var/log/nexa/backup.log 2>&1

# WAL archiving (every 6 hours)
0 */6 * * * /opt/nexa/scripts/backup/archive_wal.sh >> /var/log/nexa/wal.log 2>&1

# File storage sync (hourly)
0 * * * * /opt/nexa/scripts/backup/sync_storage.sh >> /var/log/nexa/storage.log 2>&1

# Backup verification (weekly, Sunday 04:00)
0 4 * * 0 /opt/nexa/scripts/backup/verify.sh >> /var/log/nexa/verify.log 2>&1
```

### Backup Retention

| Type | Frequency | Retention | Storage | Cost |
|------|-----------|-----------|---------|------|
| WAL archive | Continuous | 7 days | S3/R2 | Low |
| Full dump | Daily | 30 days | S3/R2 | Medium |
| Weekly dump | Weekly | 90 days | S3/R2 Glacier | Low |
| Monthly dump | Monthly | 1 year | S3/R2 Glacier Deep Archive | Very low |

### Disaster Recovery Procedure

```bash
# RTO: 1 hour
# RPO: 5 minutes (WAL) / 6 hours (dump)

# 1. Provision new infrastructure (or use pre-warmed standby)

# 2. Restore latest database backup
./scripts/backup/restore.sh s3://nexa-backups/database/latest.dump.gz.gpg

# 3. Replay WAL files (if available)
# Configure recovery.conf:
# restore_command = 'aws s3 cp s3://nexa-backups/wal/%f %p'
# recovery_target_time = '2025-01-01 12:00:00 UTC'

# 4. Point application to restored database
docker compose up -d api admin

# 5. Verify data integrity
docker compose exec api npx prisma db validate

# 6. Update DNS if needed (failover to standby region)
# Cloudflare: set proxied A record to new server IP

# 7. Monitor recovery
curl -f https://api.nexa.app/health/ready
```

### Monitoring Backup Health

```sql
-- Check last backup time
SELECT
  scheduled_time,
  completed_time,
  status,
  size_bytes,
  error_message
FROM backup_history
ORDER BY scheduled_time DESC
LIMIT 10;

-- Alert if no successful backup in 24 hours
SELECT CASE
  WHEN MAX(completed_time) < NOW() - INTERVAL '24 hours'
  THEN 'CRITICAL: No recent backup'
  ELSE 'OK'
END as backup_status
FROM backup_history
WHERE status = 'success';
```

---

## 13. Production Checklist

### Pre-Launch

#### Security
- [ ] All secrets generated (JWT, DB, Redis, NextAuth, Grafana)
- [ ] Secrets stored in Docker secrets or secret manager
- [ ] `.env` files in `.gitignore`
- [ ] PostgreSQL password > 32 characters
- [ ] Redis password configured
- [ ] Nginx security headers configured
- [ ] Rate limiting configured (auth: 10/s, api: 100/s)
- [ ] CORS restricted to known origins
- [ ] Firewall enabled (ufw), only ports 22/80/443 open
- [ ] SSH key-only authentication (no passwords)
- [ ] fail2ban installed for SSH brute force protection
- [ ] HTTPS enforced (HTTP → 301 redirect)
- [ ] Content Security Policy headers configured for admin dashboard
- [ ] File upload validation enabled (MIME type + size limits)

#### Infrastructure
- [ ] Docker and Docker Compose v2 installed
- [ ] Nginx configured with upstreams and SSL
- [ ] SSL certificates obtained and auto-renewal working
- [ ] DNS records created (api, admin)
- [ ] CDN (Cloudflare) configured
- [ ] Server timezone set to UTC
- [ ] Swap configured (2 GB minimum)
- [ ] System limits increased (`ulimit -n 65535`)

#### Database
- [ ] PostGIS extension enabled
- [ ] Database migrations run successfully
- [ ] PostGIS GIST index created on `profiles(lat, lng)`
- [ ] Composite indexes created for common queries
- [ ] Partial indexes for soft-delete patterns
- [ ] Connection pooling configured (PgBouncer for Growth+)
- [ ] Read replica configured (Growth+)
- [ ] Auto-vacuum configured
- [ ] `statement_timeout` set (30s default)
- [ ] `log_min_duration_statement` set (1s for slow query logging)

#### Testing
- [ ] API health endpoint returns `{ status: "ok" }`
- [ ] All 73 admin tests passing
- [ ] API TypeScript compiles with zero errors
- [ ] Admin TypeScript compiles with zero errors
- [ ] WebSocket connection works end-to-end
- [ ] File upload works (avatar, message attachments)
- [ ] Push notifications delivered
- [ ] JWT auth flow works (login → refresh → logout)
- [ ] Rate limiting is working (test with curl)
- [ ] Database backup works (manual test)
- [ ] Database restore works (manual test)

#### Monitoring
- [ ] Prometheus scraping API metrics
- [ ] Grafana dashboards provisioned
- [ ] Sentry DSN configured and error reported
- [ ] Alert rules configured for critical metrics
- [ ] Uptime monitoring configured
- [ ] Log aggregation working (Fluentd → Loki)
- [ ] Slack/webhook notifications configured for alerts

#### Operations
- [ ] Database backup CRON job configured
- [ ] Backup retention policy configured
- [ ] Disaster recovery document printed and accessible
- [ ] Deployment process documented for the team
- [ ] Rollback plan documented
- [ ] On-call rotation established (Growth+)
- [ ] Runbook created for common incidents

### Post-Launch (First Week)

- [ ] Monitor error rates (target < 1%)
- [ ] Monitor p95 latency (target < 500ms)
- [ ] Monitor database connections and query performance
- [ ] Verify backups are completing successfully
- [ ] Test restore from backup (actual file)
- [ ] Review application logs for warnings
- [ ] Load test with k6 (simulate expected traffic)
- [ ] Optimize slow queries (check `pg_stat_statements`)
- [ ] Verify Redis memory usage and hit rate
- [ ] Review Sentry errors and set up issue triage

### Continuous

- [ ] Weekly: Review monitoring dashboards
- [ ] Weekly: Rotate database passwords
- [ ] Monthly: Review backup restore tests
- [ ] Monthly: Dependency security audit (`npm audit`)
- [ ] Monthly: Review Cloudflare analytics for attack patterns
- [ ] Quarterly: Infrastructure cost review and right-sizing
- [ ] Quarterly: Disaster recovery drill
- [ ] Per-release: Run full CI/CD pipeline
- [ ] Per-release: Review and update alert thresholds

---

## Appendix A: Quick Deploy Commands

```bash
# ─── Initial server setup ───
ssh root@<server-ip>
apt update && apt upgrade -y
apt install docker.io docker-compose-v2 nginx git ufw -y
ufw allow ssh && ufw allow http && ufw allow https && ufw enable

# ─── Clone and deploy ───
git clone https://github.com/your-org/nexa.git /opt/nexa
cd /opt/nexa
cp .env.example .env
# Edit .env with production secrets
docker compose build
docker compose up -d
docker compose exec api npx prisma migrate deploy

# ─── Update deployment ───
cd /opt/nexa
git pull origin main
docker compose build api admin
docker compose up -d --no-deps --scale api=2 api
sleep 15
curl -f http://localhost:4000/health/live || exit 1
docker compose up -d --no-deps api
docker compose up -d --no-deps admin
docker image prune -f

# ─── Database operations ───
docker compose exec api npx prisma migrate deploy    # Run migrations
docker compose exec api npx prisma generate           # Regenerate client
./scripts/backup/backup.sh                            # Manual backup
./scripts/backup/restore.sh <backup-file>             # Manual restore

# ─── Monitoring ───
docker compose logs api -f --tail 100     # View API logs
docker compose exec redis redis-cli ping  # Check Redis
docker compose exec postgres pg_isready   # Check Postgres
curl http://localhost:4000/health/live    # API health
```

## Appendix B: Troubleshooting

| Problem | Check | Solution |
|---------|-------|----------|
| API won't start | `docker compose logs api` | Check DB connection, run migrations |
| WebSocket won't connect | Nginx `proxy_read_timeout` | Ensure 86400s timeout, upgrade headers |
| High memory usage | `docker stats` | Adjust `deploy.resources.limits.memory` |
| Slow queries | `pg_stat_statements` | Add missing indexes, check `EXPLAIN ANALYZE` |
| Redis OOM | `redis-cli info memory` | Set `maxmemory` and `maxmemory-policy allkeys-lru` |
| File upload fails | Check S3 endpoint | Verify credentials, CORS on bucket |
| SSL cert expired | `certbot renew` | Check certbot timer, Cloudflare status |
| Rate limiting too strict | Nginx error logs | Adjust `burst` and `nodelay` parameters |
| Cron backups failing | `cat /var/log/nexa/backup.log` | Check S3 credentials, disk space |
| Docker disk full | `docker system df` | Run `docker system prune -a` (careful!) |

---

*Last updated: July 2026 · Nexa Infrastructure Guide v2.0*
