# Nexa Deployment Guide

## Architecture Overview

```
                                ┌──────────────┐
                                │   Users      │
                                │ (Mobile/Web) │
                                └──────┬───────┘
                                       │
                                  ┌────▼──────┐
                                  │   CDN     │
                                  │ Cloudflare │
                                  └────┬──────┘
                                       │
                                  ┌────▼──────┐
                                  │   Nginx   │
                                  │  Reverse  │
                                  │   Proxy   │
                                  └────┬──────┘
                         ┌──────────────┼──────────────┐
                         │              │              │
                    ┌────▼───┐    ┌────▼───┐    ┌─────▼─────┐
                    │  API   │    │ Admin  │    │ Monitoring│
                    │ NestJS │    │ NextJS │    │Prometheus │
                    │ :4000  │    │ :3000  │    │ Grafana   │
                    └───┬────┘    └────────┘    └───────────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
     ┌────▼───┐   ┌────▼───┐   ┌────▼────┐
     │Postgres│   │ Redis  │   │  MinIO  │
     │PostGIS │   │ Cache  │   │  S3      │
     │  :5432 │   │ :6379  │   │  :9000  │
     └────────┘   └────────┘   └─────────┘
```

---

## Scaling Tiers

### Tier 1: 1,000 Users (Startup)

**Infrastructure**: Single server ($40-80/month)

| Component | Spec | Notes |
|-----------|------|-------|
| **Server** | 2 vCPU, 4 GB RAM, 80 GB SSD | Single VM (Hetzner/DigitalOcean) |
| **PostgreSQL** | Same server | PostGIS-enabled, 2 GB RAM allocated |
| **Redis** | Same server | 512 MB maxmemory |
| **API** | 1 replica | Node.js cluster mode (2 workers) |
| **Admin** | 1 replica | Next.js standalone |
| **Object Storage** | MinIO same server | Or use Cloudflare R2 ($0) |
| **Backup** | Daily pg_dump to S3 | 7-day retention |
| **Monitoring** | Prometheus + Grafana | Lite config, same server |

**Docker Compose** (single host):
```bash
# Deploy
docker compose up -d

# Scale API workers inside container
NODE_CLUSTER_WORKERS=2 docker compose up -d
```

**Estimated costs**: ~$50/month + $5 S3 storage

**Key constraints**:
- Single point of failure (no HA)
- Manual failover for Postgres
- Redis may need tuning for socket.io sessions
- API can handle ~100 req/s per worker

---

### Tier 2: 100,000 Users (Growth)

**Infrastructure**: Multi-server cluster ($400-800/month)

```
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Load    │  │  Load    │  │  Load    │
│ Balancer │  │ Balancer │  │ Balancer │
│ (HAProxy)│  │ (HAProxy)│  │ (HAProxy)│
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │             │
     ├──────┬──────┘             │
     │      │                    │
┌────▼───┐ │          ┌─────────▼────────┐
│ API x3 │ │          │  Admin x2        │
│ :4000  │ │          │  :3000           │
└────┬───┘ │          └─────────┬────────┘
     │     │                    │
     │  ┌──▼──────────┐        │
     │  │ NFS / S3    │        │
     │  │ (uploads)   │        │
     │  └─────────────┘        │
     │                         │
┌────▼─────────────────────────▼──────┐
│         PostgreSQL Primary         │
│         (8 vCPU, 32 GB RAM)        │
└────────────────┬───────────────────┘
                 │
          ┌──────▼───────┐
          │ PostgreSQL   │
          │ Replica x1   │
          │ (Read-only)  │
          └──────────────┘
```

| Component | Spec | Count |
|-----------|------|-------|
| **Load Balancer** | 2 vCPU, 4 GB RAM | 2 (HA pair) |
| **API Servers** | 4 vCPU, 8 GB RAM | 3 |
| **Admin Servers** | 2 vCPU, 4 GB RAM | 2 |
| **PostgreSQL Primary** | 8 vCPU, 32 GB RAM, 200 GB SSD | 1 |
| **PostgreSQL Replica** | 4 vCPU, 16 GB RAM, 200 GB SSD | 1 |
| **Redis Cluster** | 4 vCPU, 8 GB RAM | 3 nodes |
| **MinIO / S3** | S3-compatible storage | Cloudflare R2 |
| **Monitoring** | 4 vCPU, 8 GB RAM | 1 |

**Changes from Tier 1**:
- Multi-instance API behind load balancer
- PostgreSQL primary-replica with read replicas for geo queries
- Redis cluster mode for socket.io adapter + caching
- Separate monitoring server
- Database connection pooling (PgBouncer)
- Read replicas handle map/nearby queries
- CI/CD with canary deployments
- Automated backups with 30-day retention

**Key configuration**:
```bash
# PgBouncer for connection pooling
docker compose -f docker-compose.yml -f docker-compose.pgbouncer.yml up -d

# API scaled to 3 instances
docker compose up -d --scale api=3

# Redis cluster
docker compose -f docker-compose.redis-cluster.yml up -d
```

---

### Tier 3: 1,000,000 Users (Scale)

**Infrastructure**: Kubernetes cluster ($2,000-5,000/month)

```
                        ┌──────────────┐
                        │  Cloudflare  │
                        │   CDN + WAF  │
                        └──────┬───────┘
                               │
                     ┌─────────▼─────────┐
                     │  AWS ALB / GCLB   │
                     │  (SSL termination)│
                     └─────────┬─────────┘
                               │
                     ┌─────────▼─────────┐
                     │   Kubernetes      │
                     │   (EKS / GKE)     │
                     └─────────┬─────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
   ┌────▼────┐          ┌─────▼─────┐          ┌─────▼─────┐
   │ API     │          │  Admin    │          │ Monitoring│
   │ HPA     │          │  HPA      │          │           │
   │ 5-20    │          │  2-5      │          │ Prometheus│
   │ Pods    │          │  Pods     │          │ Grafana   │
   └────┬────┘          └───────────┘          │ Loki      │
        │                                      └───────────┘
   ┌────┴────────────────────────────┐
   │         Service Mesh (Istio)    │
   │  - Traffic splitting            │
   │  - mTLS                         │
   │  - Rate limiting                │
   │  - Circuit breaking             │
   └─────────────────────────────────┘
        │
   ┌────┴───────────────────────────────────────┐
   │               Data Layer                   │
   │                                            │
   │  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
   │  │PostgreSQL│  │  Redis   │  │  S3      │ │
   │  │Primary   │  │ Cluster  │  │(R2/S3)   │ │
   │  │RDS/Aurora│  │ElastiCache│  │Uploads   │ │
   │  └────┬─────┘  └──────────┘  └──────────┘ │
   │       │                                     │
   │  ┌────▼─────┐                               │
   │  │Read      │                               │
   │  │Replicas  │                               │
   │  │x3        │                               │
   │  └──────────┘                               │
   └─────────────────────────────────────────────┘
```

| Component | Spec | Count | Managed Service |
|-----------|------|-------|-----------------|
| **Kubernetes** | EKS/GKE | 3-5 nodes (8 vCPU, 32 GB) | AWS EKS / GKE |
| **PostgreSQL** | Aurora Serverless v2 | 1 writer + 3 readers | RDS Aurora |
| **Redis** | cluster mode | 3 shards x 3 replicas | ElastiCache |
| **Object Storage** | S3/R2 | - | Cloudflare R2 |
| **CDN** | - | - | Cloudflare |
| **Monitoring** | - | - | Grafana Cloud |
| **Logging** | - | - | Grafana Loki |
| **Search** | Elasticsearch | 3 nodes | OpenSearch Service |

**Key architecture decisions**:
- **Kubernetes** for auto-scaling, rolling updates, self-healing
- **Horizontal Pod Autoscaler** based on CPU/memory/custom metrics
- **Read replicas** handle geo-spatial queries (NEARBY, map tiles)
- **Redis cluster** for real-time presence, socket.io, caching
- **Separate search service** (Elasticsearch) for full-text search, user discovery
- **Circuit breakers** to prevent cascading failures
- **Message queue** (BullMQ with Redis) for async tasks
- **Database sharding** consideration: shard by region for geo queries

**Kubernetes scaling config**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nexa-api
spec:
  minReplicas: 5
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
```

**Database scaling at 1M users**:
```sql
-- Geo-spatial query optimization
CREATE INDEX CONCURRENTLY idx_checkins_location
  ON checkins USING GIST (location);

-- Partition large tables by date
CREATE TABLE messages PARTITION BY RANGE (created_at);

-- Read replica for map queries
-- Route NEARBY queries to replica
ALTER SYSTEM SET max_standby_streaming_delay = '30s';
```

**Expected throughput at 1M users**:
| Metric | Value |
|--------|-------|
| Daily active users | ~100,000 |
| Peak concurrent | ~20,000 |
| API requests/sec | ~5,000 |
| WebSocket connections | ~15,000 |
| DB writes/sec | ~500 |
| DB reads/sec | ~4,000 |
| Storage (images) | ~500 GB/month |

---

## Database Migration Process

### Normal Migration

```bash
# Development
cd apps/api
DATABASE_URL=postgresql://nexa:nexa@localhost:5432/nexa_dev npm run prisma:migrate

# Staging / Production
./scripts/db/migrate.sh production
```

### Blue-Green Migration Strategy

1. Create a migration as a Prisma migration file
2. Deploy the migration to staging first
3. Run `prisma migrate deploy` against production during maintenance window
4. Deploy the new application code
5. Rollback plan: `prisma migrate resolve --rolled-back <migration_name>`

**Zero-downtime migrations**:
- Add columns: Safe, no table locking (PostgreSQL 11+)
- Add indexes: Use `CONCURRENTLY`
- Remove columns: Deploy in two phases (first remove code references, then drop column)
- Large table changes: Use `pg_repack` or `pt-online-schema-change`

## Backup Strategy

### Schedule

| Frequency | Type | Retention | Destination |
|-----------|------|-----------|-------------|
| Every 6h | PostgreSQL WAL archive | 7 days | S3 |
| Daily | Full database dump | 30 days | S3 (encrypted) |
| Weekly | Full database dump | 90 days | S3 (encrypted, cold) |
| Monthly | Full database dump | 1 year | S3 Glacier |

### Commands

```bash
# Manual backup
./scripts/backup/backup.sh

# Manual restore
./scripts/backup/restore.sh ./backups/nexa_db_20250101_000000.dump.gz

# CRON setup (daily at 02:00)
0 2 * * * /opt/nexa/scripts/backup/backup.sh >> /var/log/nexa/backup.log 2>&1
```

### Disaster Recovery

**Recovery Time Objective (RTO)**: 1 hour
**Recovery Point Objective (RPO)**: 5 minutes (WAL) / 6 hours (dump)

Steps:
1. Provision new database instance from latest backup
2. Replay WAL files to the point of failure
3. Verify data integrity
4. Point application to new database
5. Verify application health

---

## Monitoring Setup

### Metrics Collected

| Category | Metrics | Tool |
|----------|---------|------|
| **API** | Request rate, latency (p50/p95/p99), error rate, active users | Prometheus |
| **PostgreSQL** | Connections, query time, cache hit ratio, replication lag | Postgres exporter |
| **Redis** | Memory usage, hit rate, connected clients, command rate | Redis exporter |
| **System** | CPU, memory, disk, network, swap | Node exporter |
| **Business** | Sign-ups, DAU/MAU, messages sent, check-ins, reports | Custom metrics |

### Alerting Thresholds

| Alert | Threshold | Severity |
|-------|-----------|----------|
| API error rate | > 5% for 5 min | Critical |
| API p95 latency | > 2s for 5 min | Warning |
| Instance down | 0 for 1 min | Critical |
| Disk space | < 10% | Critical |
| CPU usage | > 80% for 10 min | Warning |
| DB connections | > 80 | Warning |
| Redis memory | > 80% | Warning |

### Dashboard Access

- **Grafana**: https://monitor.nexa.app (admin / password from env)
- Pre-built dashboards for API, Database, Redis, and Business metrics
- Alert notifications via Slack webhook, email, or PagerDuty

---

## Logging Strategy

### Structure

All logs are emitted as **structured JSON** with the following fields:

```json
{
  "timestamp": "2025-01-01T00:00:00.000Z",
  "level": "info",
  "service": "nexa-api",
  "trace_id": "abc123",
  "message": "User authenticated successfully",
  "metadata": {
    "user_id": "usr_123",
    "ip": "203.0.113.1",
    "duration_ms": 42
  }
}
```

### Log Levels

| Level | Usage | Examples |
|-------|-------|----------|
| `error` | Unhandled errors, system failures | DB connection lost, uncaught exception |
| `warn` | Recoverable issues | Rate limit exceeded, retry attempts |
| `info` | Normal operations | User signup, message sent, login |
| `debug` | Development only | SQL queries, request details |
| `trace` | Deep debugging | Function entry/exit, data dumps |

### Log Aggregation Pipeline

```
Application → stdout → Docker JSON file → Fluentd → Elasticsearch → Grafana Loki / Kibana
```

### Query Examples

```logql
# Last 5 minutes of errors
{service="nexa-api"} |= "error" |= "ERROR" |= "level"

# Rate limit hits by IP
sum by (ip) (rate({service="nexa-api"} |= "rate_limit" [5m]))

# p95 response time
quantile_over_time(0.95, {service="nexa-api"} | json | unwrap duration_ms [5m])
```

### Audit Logging

All sensitive operations (user data access, role changes, report actions) are logged to a separate `nexa-audit` index with 1-year retention.

---

## Environment Configuration

### Production Variables

Required variables (`DB_PASSWORD`, `JWT_SECRET`, etc.) must be set in:
1. GitHub Actions secrets (for CI/CD)
2. Server `.env` file (for runtime)
3. Docker secrets (for sensitive values)

```bash
# Generate secure secrets
openssl rand -hex 64  # JWT_SECRET
openssl rand -hex 64  # NEXTAUTH_SECRET
openssl rand -hex 32  # Database password

# Deploy .env to server
scp .env.production user@host:/opt/nexa/.env
```

### Docker Secrets (Production)

```yaml
# docker-compose.yml
secrets:
  db_password:
    file: ./secrets/db_password.txt
  jwt_secret:
    file: ./secrets/jwt_secret.txt

services:
  api:
    secrets:
      - db_password
      - jwt_secret
    environment:
      DATABASE_PASSWORD_FILE: /run/secrets/db_password
      JWT_SECRET_FILE: /run/secrets/jwt_secret
```

---

## Quick Start

### Prerequisites
- Docker & Docker Compose v2
- Node.js 20 (for local dev)
- 2 GB free RAM minimum

### One-command deploy

```bash
# Clone and deploy
git clone https://github.com/your-org/nexa.git
cd nexa
cp .env.example .env
# Edit .env with your secrets
docker compose up -d

# Run database migrations
docker compose exec api npx prisma migrate deploy

# Verify
curl http://localhost:4000/health/live
curl http://localhost:3000
```

### Production checklist

- [ ] Generate and set all secrets
- [ ] Configure DNS (api.nexa.app, admin.nexa.app)
- [ ] Set up SSL certificates (Let's Encrypt / certbot)
- [ ] Configure S3-compatible storage
- [ ] Set up SMTP for emails
- [ ] Configure monitoring alerts
- [ ] Set up database backups (CRON)
- [ ] Enable firewall (ufw / iptables)
- [ ] Configure fail2ban for SSH/API
- [ ] Set up log aggregation
- [ ] Load test with k6 or artillery.io
- [ ] Configure CI/CD secrets in GitHub
