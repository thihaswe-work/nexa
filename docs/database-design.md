# Database Design — Nexa

## Overview

PostgreSQL 16 with **PostGIS 3.4** extension for spatial queries. Managed via **Prisma ORM**.

## Entity Relationship Diagram

```
                    ┌─────────────┐
                    │  Permission │
                    └──────┬──────┘
                           │ M:M
                    ┌──────┴──────┐
                    │    Role     │
                    └──────┬──────┘
                           │ 1:M
              ┌────────────┼────────────────┐
              │            │                │
         ┌────┴───┐  ┌────┴───┐      ┌────┴───┐
         │  User  │  │  ...   │      │  ...   │
         └───┬───┘  └────────┘      └────────┘
             │
    ┌────────┼──────────┬──────────────┬──────────────┬─────────────┐
    │        │          │              │              │             │
┌───┴───┐ ┌──┴───┐ ┌───┴────┐  ┌─────┴─────┐  ┌────┴────┐  ┌────┴────┐
│Profile│ │Device│ │Refresh │  │Notification│  │ Friend  │  │  Block  │
│ 1:1   │ │ M:1  │ │Token   │  │    M:1     │  │Request  │  │  M:1    │
└───────┘ └──────┘ │  M:1   │  └───────────┘  │  M:1    │  └─────────┘
                    └───────┘                  └────────┘
                                                    │
                                              ┌─────┴──────┐
                                              │ Friendship │
                                              │   M:M      │
                                              └────────────┘
                                                    │
                                              ┌─────┴──────────┐
                                              │ Conversation   │
                                              │   Participant  │
                                              └────────┬───────┘
                                                       │ M:M
                                                ┌──────┴──────┐
                                                │ Conversation │
                                                └──────┬──────┘
                                                       │ 1:M
                                                ┌──────┴──────┐
                                                │   Message   │
                                                └──────┬──────┘
                                                       │ 1:M
                                                ┌──────┴──────┐
                                                │  Message    │
                                                │ Attachment  │
                                                └─────────────┘

┌────────────────┐
│ LocationHistory│
│    M:1         │── User
└────────────────┘

┌────────┐
│ Report │── Reporter (User)
│        │── ReportedUser (User, opt)
│        │── ResolvedBy (User, opt)
└────────┘
```

## Model Details

### 1. Role & Permission (RBAC)

**Role** — Named role with optional permissions.
- `isDefault` — whether newly registered users get this role
- M:M with Permission via `RolePermission` junction

**Permission** — Fine-grained action+resource pair.
- `action` — e.g. `user:read`, `place:approve`
- `resource` — e.g. `user`, `place`, `report`, `system`

**RolePermission** — Junction table.
- Composite PK: `(roleId, permissionId)`

### 2. User & Profile

**User** — Authentication and core identity.
- Unique `username` (VARCHAR 30) and `email`
- `password` — bcrypt hash
- `roleId` FK → Role (every user has exactly one role)
- `isActive` — account status flag
- `isOnline` — real-time presence

**Profile** — Extended public profile (1:1 with User).
- `displayName`, `bio`, `avatarUrl`, `coverUrl`
- `lat`/`lng` — current location (DoublePrecision + PostGIS geometry via trigger)
- `city`/`country` — denormalized for quick filtering

> **PostGIS integration**: The `profiles` table has a hidden `location` column (`geometry(Point, 4326)`) managed via database trigger. When `lat`/`lng` is updated, the trigger auto-syncs the geometry column. All spatial queries use the indexed geometry column.

### 3. FriendRequest & Friendship

**FriendRequest** — Pending/unresolved requests.
- Status workflow: `PENDING → ACCEPTED | REJECTED | CANCELLED`
- Unique constraint: `(senderId, receiverId)` — prevents duplicates
- Soft-delete: cancelled/rejected requests are soft-deleted

**Friendship** — Confirmed bidirectional relationships.
- Unique constraint: `(userId, friendId)` — no duplicate friendships
- Both user IDs are indexed for fast friend list queries
- To query all friends: `WHERE userId = :id OR friendId = :id`

### 4. Conversation & Message

**Conversation** — Chat channel.
- `isGroup` — true for group chats, false for DMs
- `name` — null for DMs (derived from participant names)
- `lastMessageAt` / `lastMessagePreview` — denormalized for inbox sorting

**ConversationParticipant** — Junction with metadata.
- `lastReadAt` — per-user read marker for unread counts
- Composite PK: `(conversationId, userId)`

**Message** — Individual message within a conversation.
- `type`: TEXT, IMAGE, VIDEO, AUDIO, LOCATION, SYSTEM
- `replyToId` — self-referential for reply chains
- Index on `(conversationId, createdAt)` for paginated message loading

**MessageAttachment** — File/rich media attached to a message.
- Supports images, videos, documents, audio, and location data
- `metadata` — JSON field for extensible properties
- `width`/`height` for images, `duration` for audio/video

### 5. Notification

**Notification** — Push/in-app notifications.
- `type` — determines icon and handling logic
- `data` — JSON payload for navigation actions
- `isRead` / `readAt` — read tracking
- Index on `(userId, isRead, createdAt)` for unread notification queries

### 6. Device

**Device** — Push notification device registration.
- `deviceId` — unique device identifier
- `pushToken` — FCM/APNS token
- `isActive` — soft-disabled flag for expired tokens
- Unique: `(userId, deviceId)` — one registration per device per user

### 7. RefreshToken

**RefreshToken** — JWT refresh token rotation.
- `token` — hashed token value (unique)
- `expiresAt` — auto-expiry
- `revokedAt` — manual revocation
- `replacedByToken` — rotation chain for detecting token reuse

### 8. Report & Block

**Report** — User/moderator content reporting system.
- `targetType` + `targetId` — polymorphic reference to any reported entity
- `status` workflow: `PENDING → REVIEWED | RESOLVED | DISMISSED`
- `reportedUserId` — denormalized for user-specific report queries

**Block** — User-to-user blocking.
- Unique: `(blockerId, blockedId)`
- Checked on friend requests, messages, and visibility

### 9. LocationHistory

**LocationHistory** — Continuous location tracking for features.
- `lat`/`lng` — coordinate pair (also synced to PostGIS geometry)
- `accuracy`, `altitude`, `heading`, `speed` — GPS metadata
- `source` — GPS, NETWORK, or PASSIVE
- `activity` — inferred user activity (STILL, WALKING, etc.)
- `isBackground` — whether recorded in the background
- Indexed on `(userId, createdAt)` for time-range queries

## PostGIS Spatial Features

### Setup
```sql
CREATE EXTENSION postgis;
```

### Geometry Column
Managed via database triggers — not exposed in Prisma schema:

| Table | Column | Type | Trigger |
|-------|--------|------|---------|
| profiles | `location` | `geometry(Point, 4326)` | BEFORE INSERT/UPDATE ON lat/lng |
| location_history | `location` | `geometry(Point, 4326)` | BEFORE INSERT/UPDATE ON lat/lng |

### Spatial Indexes
- `profiles.location` — GiST index for distance queries
- `location_history.location` — GiST index for trajectory queries
- `profiles(lat, lng) WHERE deleted_at IS NULL` — partial B-tree for bounding box queries

### Helper Functions (in migration)
| Function | Purpose |
|----------|---------|
| `find_nearby_users(lat, lng, radius, exclude, limit)` | Returns users within radius |
| `count_users_in_radius(lat, lng, radius)` | Count users in area |
| `sync_profile_location()` | Trigger function: lat/lng ↔ geometry |

### Service Layer
`PostgisService` wraps all raw PostGIS queries with typed methods:
- `findNearbyUsers()` — users within radius, ordered by distance
- `countUsersInRadius()` — headcount for heatmaps
- `findPlacesInBounds()` — map viewport queries
- `findNearestPlace()` — nearest point-of-interest
- `calculateDistance()` — point-to-point distance
- `getLocationHistoryInBounds()` — trajectory in time range

## Soft Delete

Every model has a `deletedAt DateTime?` column.

A **Prisma middleware** (`softDeleteMiddleware`) automatically:
- Converts `delete()` → `update({ deletedAt: now() })`
- Adds `WHERE deleted_at IS NULL` to all read queries
- Allows explicit `where: { deletedAt: { not: null } }` to access deleted records
- Skips models without `deletedAt` field

## Indexes Summary

| Table | Index | Type | Purpose |
|-------|-------|------|---------|
| users | `email` | Unique B-tree | Login lookup |
| users | `username` | Unique B-tree | Profile lookup |
| users | `role_id` | B-tree | Role-based filtering |
| users | `is_active` | B-tree | Active user queries |
| profiles | `user_id` | Unique B-tree | Profile lookup |
| profiles | `display_name` | B-tree | Search |
| profiles | `(lat, lng)` | B-tree (partial) | Bounding box queries |
| profiles | `location` | GiST | Spatial queries |
| friend_requests | `(sender_id, receiver_id)` | Unique B-tree | Duplicate prevention |
| friend_requests | `status` | B-tree | Pending requests |
| friendships | `(user_id, friend_id)` | Unique B-tree | Duplicate prevention |
| messages | `(conversation_id, created_at)` | Composite B-tree | Message pagination |
| notifications | `(user_id, is_read, created_at)` | Composite B-tree | Unread notifications |
| location_history | `(user_id, created_at)` | Composite B-tree | Time-range queries |
| location_history | `location` | GiST | Spatial trajectory |
| refresh_tokens | `token` | Unique B-tree | Token lookup |
| refresh_tokens | `expires_at` | B-tree | Cleanup queries |
| blocks | `(blocker_id, blocked_id)` | Unique B-tree | Duplicate prevention |

## Conventions

- **Primary keys**: UUID v4 (generated via `uuid_generate_v4()`)
- **Timestamps**: `created_at` (default `now()`), `updated_at` (auto-update)
- **Soft delete**: `deleted_at` (nullable, set on "deletion")
- **Naming**: snake_case for columns, PascalCase for tables (mapped via `@@map`)
- **Foreign keys**: `{table}_id` convention, `CASCADE` on delete
- **Indexes**: B-tree for equality/range, GiST for spatial
