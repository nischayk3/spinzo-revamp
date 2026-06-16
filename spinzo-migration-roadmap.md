# Spinzo: Monolith → Microservices — The Definitive Migration Roadmap

> **Owner:** CTO / Tech Lead  
> **Last Updated:** 2026-05-25  
> **Status:** SINGLE SOURCE OF TRUTH  
> **Scope:** Complete architectural migration from Firebase monolith to scalable microservices platform  

---

## Table of Contents

1. [Current State Audit](#1-current-state-audit)
2. [Why Migrate — The Hard Truth](#2-why-migrate)
3. [What Stays, What Goes, What Changes](#3-what-stays-what-goes)
4. [Target Architecture — The Endgame](#4-target-architecture)
5. [Tech Stack Decisions (2026 Best-in-Class)](#5-tech-stack-decisions)
6. [Domain Decomposition — Bounded Contexts](#6-domain-decomposition)
7. [Data Architecture & Migration Strategy](#7-data-architecture)
8. [Phase 0: Foundation (Weeks 1–3)](#8-phase-0)
9. [Phase 1: API Layer & First Microservice (Weeks 4–8)](#9-phase-1)
10. [Phase 2: Core Services Extraction (Weeks 9–16)](#10-phase-2)
11. [Phase 3: Multi-Dark-Store & Scaling (Weeks 17–24)](#11-phase-3)
12. [Phase 4: Admin Panel & Delivery App Separation (Weeks 25–30)](#12-phase-4)
13. [Phase 5: Observability, CI/CD & Production Hardening (Weeks 31–36)](#13-phase-5)
14. [Frontend Evolution Strategy](#14-frontend-evolution)
15. [Security Architecture](#15-security)
16. [Cost Analysis & Infrastructure](#16-cost-analysis)
17. [Team Structure & Hiring Plan](#17-team-structure)
18. [Risk Register & Mitigation](#18-risk-register)
19. [Success Metrics & KPIs](#19-success-metrics)
20. [Appendix: ADR Log](#20-appendix)

---

## 1. Current State Audit

### 1.1 What Spinzo Is Today

Spinzo (formerly Spinit) is a **premium laundry & dry-cleaning platform** live on **iOS, Android, and Web** with **1,000+ active users** operating in Bangalore (Jayanagar, HSR, Koramangala, and surrounding areas) from a **single dark store**.

### 1.2 Current Architecture (The Monolith)

```
┌─────────────────────────────────────────────────────────┐
│                    SINGLE EXPO APP                       │
│              (React Native 0.81 + Expo SDK 54)           │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌────────────────────────┐ │
│  │ Customer  │  │  Admin   │  │  Delivery Partner      │ │
│  │  Screens  │  │  Panel   │  │  (inside Admin)        │ │
│  └────┬─────┘  └────┬─────┘  └──────────┬─────────────┘ │
│       │              │                    │               │
│  ┌────▼──────────────▼────────────────────▼─────────────┐│
│  │           Zustand Stores (Client State)               ││
│  │  authStore · orderStore · cartStore · addressStore    ││
│  │  subscriptionStore · adminStore · adminAuthStore      ││
│  │  serviceAvailabilityStore · uiStore                   ││
│  └────────────────────┬─────────────────────────────────┘│
│                       │                                   │
│  ┌────────────────────▼─────────────────────────────────┐│
│  │          Services Layer (Direct Firebase SDK)         ││
│  │  firestore.ts (848 lines) · adminFirestore.ts (1075) ││
│  │  auth.ts · paymentService.ts · analytics.ts           ││
│  └────────────────────┬─────────────────────────────────┘│
└───────────────────────┼──────────────────────────────────┘
                        │ Direct Client SDK Calls
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    FIREBASE (Google)                       │
│                                                            │
│  Auth (Phone/OTP)  ·  Firestore (All Data)                │
│  Storage (Images)  ·  Cloud Functions (2 files)            │
│  Analytics  ·  FCM                                         │
│                                                            │
│  Collections:                                              │
│  ├── users/{uid}                                           │
│  │   ├── savedAddresses[] (embedded array)                │
│  │   ├── activeCart[] (embedded array)                     │
│  │   ├── credits, subscriptionStatus (embedded fields)    │
│  │   ├── orders/{orderId} (subcollection)                 │
│  │   └── subscriptions/{subId} (subcollection)            │
│  │       └── creditUsage/{usageId}                        │
│  ├── vendors/{vendorId}                                    │
│  │   ├── services/{serviceId}                              │
│  │   └── orders/{orderId} (mirror of user orders)         │
│  ├── config/adminPhones (RBAC via phone number map)       │
│  ├── config/serviceAvailability                            │
│  ├── daily_schedules/{date} (slot_counts map)             │
│  └── unserviceable_requests/{id}                           │
│                                                            │
│  Cloud Functions (functions/src/index.ts):                 │
│  ├── createRazorpayOrder (payment initiation)              │
│  ├── verifyRazorpayPayment (payment verification)          │
│  ├── onOrderCreatedWhatsApp (Firestore trigger)            │
│  └── onOrderUpdatedWhatsApp (Firestore trigger)            │
│                                                            │
│  External Integrations:                                    │
│  ├── Razorpay (payments - live keys in secrets)            │
│  ├── AiSensy (WhatsApp notifications)                      │
│  ├── Sentry (error tracking)                               │
│  └── Google Maps (geofencing, address)                     │
└───────────────────────────────────────────────────────────┘
```

### 1.3 Key Metrics of Current Codebase

| Metric | Value | Risk Level |
|--------|-------|------------|
| `firestore.ts` | 848 lines, 25+ functions | 🔴 God file |
| `adminFirestore.ts` | 1,075 lines, 20+ functions | 🔴 God file |
| `AdminOrdersScreen.tsx` | 81KB single file | 🔴 Unmaintainable |
| `CartScreen.tsx` | 59KB single file | 🔴 Unmaintainable |
| `ServiceDetailScreen.tsx` | 71KB single file | 🔴 Unmaintainable |
| Cloud Functions | 2 files, 226 lines total | 🟡 Minimal backend |
| Auth model | Phone numbers hardcoded in Firestore rules | 🔴 Security risk |
| Order data | Mirrored in 2 places (user + vendor subcollections) | 🔴 Consistency risk |
| Admin RBAC | Phone number map in `config/adminPhones` | 🟡 Fragile |
| Geofencing | Hardcoded lat/lng in `geofence.ts` | 🟡 Not scalable |
| Slot booking | `daily_schedules` with manual slot_counts | 🟡 Race conditions |
| Cart storage | Embedded in user document | 🟡 Document size risk |
| Addresses | Array embedded in user document | 🟡 No geospatial indexing |

### 1.4 What's Actually Working Well

- ✅ Expo cross-platform (Web + iOS + Android from one codebase)
- ✅ Zustand state management is clean and modular
- ✅ Firebase Auth phone/OTP flow is battle-tested
- ✅ Real-time order updates via Firestore snapshots
- ✅ Razorpay payment integration works
- ✅ WhatsApp notifications via AiSensy
- ✅ Role-based access (super_admin, store_admin, delivery_partner)
- ✅ NativeWind/Tailwind design system with good constants
- ✅ OTP verification for pickup/delivery (fraud prevention)
- ✅ Subscription/credits system functional

---

## 2. Why Migrate — The Hard Truth

### 2.1 You Will Hit a Wall at 5,000 Users

| Problem | Current Impact | At 5K Users | At 50K Users |
|---------|---------------|-------------|--------------|
| **Firestore reads** | ~₹2K/mo | ~₹15K/mo | ~₹1.5L/mo |
| **collectionGroup queries** (admin gets ALL orders) | Slow at 1K | Unusable at 5K | Impossible |
| **No server-side logic** — business rules in client | Works | Security holes | Catastrophic |
| **Order mirroring** (dual writes to user + vendor) | Occasional inconsistency | Regular data loss | Nightmare |
| **Single vendor hardcoded** (`vendor_1`) | Fine | Blocks multi-store | Blocks everything |
| **Admin phone hardcoded in security rules** | Dangerous | Dangerous | Dangerous |
| **No pagination** — admin loads ALL orders | 2-3s | 15-20s | Crashes |
| **Cart in user doc** — no size limit control | Fine | Bloated docs | Read failures |
| **No rate limiting** — client talks directly to Firestore | Fine | Abuse possible | DDoS vector |

### 2.2 What Zepto/Blinkit/Swiggy Got Right That We Don't Have

1. **API Gateway** — Single entry point, auth/rate-limiting/routing in one place
2. **Service Isolation** — Order service failure doesn't kill catalog browsing
3. **Database-per-Service** — Orders in PostgreSQL, catalog in cache, sessions in Redis
4. **Event-Driven** — Order placed → inventory, notification, analytics fire independently
5. **Multi-Store Routing** — Dynamic assignment of orders to nearest dark store
6. **Real-time Tracking** — WebSockets for live rider GPS, not Firestore polling
7. **Server-Side Business Logic** — Pricing, discounts, fraud checks happen server-side
8. **Pagination & Search** — Elasticsearch/PostgreSQL full-text, not client-side filtering

### 2.3 The Non-Negotiable Rule

> **Every new feature from today must be built behind an API. Zero new direct Firestore calls from the client. This is the strangler fig pattern — we wrap the monolith, not rewrite it.**

---

## 3. What Stays, What Goes, What Changes

### ✅ KEEP (Don't Touch What Works)

| Component | Why Keep It |
|-----------|------------|
| **Expo + React Native** | Cross-platform is your superpower. Expo SDK 54 is mature. |
| **Firebase Auth (Phone/OTP)** | Battle-tested, zero-friction for Indian users. Migrate later IF you need SSO/SCIM. |
| **Firebase Storage** | Images are already there. Add CDN layer (Cloudflare) in front. |
| **Zustand** | Clean, minimal, works great. Keep stores, just point them at APIs instead of Firestore. |
| **NativeWind + Design System** | Your `constants.ts` is well-structured. Keep the design tokens. |
| **Razorpay** | Works, Indian market standard. Just move verification server-side. |
| **AiSensy WhatsApp** | Works. Move trigger logic to backend event handlers. |
| **Sentry** | Keep for frontend. Add backend Sentry instances per service. |

### 🔴 REMOVE (Technical Debt)

| Component | Why Remove |
|-----------|-----------|
| **Direct Firestore SDK calls from client** | Security nightmare. All reads/writes go through API. |
| **Order mirroring** (writing to both `users/x/orders` and `vendors/x/orders`) | Source of inconsistency. Single orders table in PostgreSQL. |
| **Hardcoded phone numbers in firestore.rules** | Replace with proper JWT role claims. |
| **Hardcoded `vendor_1`** | Replace with dynamic store routing. |
| **collectionGroup queries for admin** | Replace with server-side paginated queries. |
| **Client-side revenue calculation** | Move to server-side analytics/aggregation. |
| **Embedded arrays** (addresses, cart in user doc) | Proper relational tables. |

### 🟡 TRANSFORM (Evolve, Don't Rewrite)

| Component | From | To |
|-----------|------|-----|
| **Business data** | Firestore | PostgreSQL (Neon/Supabase) |
| **Real-time data** | Firestore snapshots | Redis pub/sub + WebSockets |
| **Session/cache** | Firestore reads | Redis |
| **Cloud Functions** | Firebase Functions (2 files) | NestJS microservices |
| **Admin panel** | Screens inside Expo app | Separate Next.js web app |
| **Delivery app** | Part of admin flow | Separate lightweight Expo app |
| **Geofencing** | Hardcoded coordinates | PostGIS / dynamic config |
| **Slot management** | Firestore doc with counts | PostgreSQL with row-level locking |
| **RBAC** | Phone number map in Firestore | JWT claims + database roles |
| **Notifications** | Firestore triggers | BullMQ event queue |

---

## 4. Target Architecture — The Endgame

```
                         ┌─────────────────────────┐
                         │      CLIENTS             │
                         │  ┌───┐ ┌───┐ ┌────────┐ │
                         │  │iOS│ │And│ │Web/PWA │ │
                         │  └─┬─┘ └─┬─┘ └───┬────┘ │
                         │    │     │       │      │
                         │  ┌─▼─────▼───────▼────┐ │
                         │  │  Expo (Customer)    │ │
                         │  └────────┬───────────┘ │
                         │           │              │
                         │  ┌────────▼───────────┐ │
                         │  │ Admin (Next.js)     │ │
                         │  └────────┬───────────┘ │
                         │           │              │
                         │  ┌────────▼───────────┐ │
                         │  │ Delivery (Expo Lite)│ │
                         │  └────────┬───────────┘ │
                         └───────────┼─────────────┘
                                     │ HTTPS
                         ┌───────────▼─────────────┐
                         │      API GATEWAY         │
                         │  (Kong / Traefik)         │
                         │  • Auth verification      │
                         │  • Rate limiting           │
                         │  • Request routing         │
                         │  • API versioning          │
                         └──┬──┬──┬──┬──┬──┬───────┘
                            │  │  │  │  │  │
              ┌─────────────┘  │  │  │  │  └─────────────┐
              ▼                ▼  │  ▼  ▼                ▼
     ┌────────────┐  ┌──────────┐│┌──────────┐  ┌────────────┐
     │   AUTH      │  │  ORDER   │││  USER    │  │ NOTIFICATION│
     │  SERVICE    │  │ SERVICE  │││ SERVICE  │  │  SERVICE    │
     │             │  │          │││          │  │             │
     │ Firebase    │  │ Lifecycle│││ Profile  │  │ WhatsApp    │
     │ Auth +      │  │ Slot mgmt│││ Address  │  │ Push/FCM    │
     │ JWT issue   │  │ OTP verify││ RBAC     │  │ SMS/Email   │
     │             │  │ Status   │││          │  │ In-app      │
     └──────┬─────┘  └────┬─────┘│└────┬─────┘  └──────┬─────┘
            │              │      │     │               │
            │         ┌────┘      │     │               │
            │         │    ┌──────┘     │               │
            ▼         ▼    ▼            ▼               ▼
     ┌────────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
     │  PAYMENT   │  │ CATALOG  │  │  STORE   │  │ ANALYTICS │
     │  SERVICE   │  │ SERVICE  │  │ SERVICE  │  │  SERVICE  │
     │            │  │          │  │          │  │           │
     │ Razorpay   │  │ Services │  │ Dark     │  │ Revenue   │
     │ Create/    │  │ Pricing  │  │ stores   │  │ Reports   │
     │ Verify     │  │ Inventory│  │ Zones    │  │ User stats│
     │ Refund     │  │ Subscr.  │  │ Routing  │  │ Dashboards│
     └──────┬─────┘  └────┬─────┘  └────┬─────┘  └─────┬────┘
            │              │             │              │
            └──────┬───────┴──────┬──────┘              │
                   │              │                     │
                   ▼              ▼                     ▼
     ┌──────────────────────────────────────────────────────┐
     │              MESSAGE QUEUE (BullMQ + Redis)          │
     │  order.placed · order.status_changed · payment.done  │
     │  notification.send · analytics.track · slot.reserved │
     └──────────────────────┬───────────────────────────────┘
                            │
     ┌──────────────────────▼───────────────────────────────┐
     │                   DATA LAYER                          │
     │                                                       │
     │  ┌─────────────┐  ┌──────────┐  ┌─────────────────┐ │
     │  │ PostgreSQL   │  │  Redis   │  │ Firebase         │ │
     │  │ (Neon)       │  │ (Upstash)│  │ (Auth+Storage)   │ │
     │  │              │  │          │  │                   │ │
     │  │ • users      │  │ • cache  │  │ • Phone/OTP auth │ │
     │  │ • orders     │  │ • session│  │ • Image storage  │ │
     │  │ • addresses  │  │ • queue  │  │ • Push tokens    │ │
     │  │ • vendors    │  │ • pubsub │  │                   │ │
     │  │ • payments   │  │ • slots  │  │                   │ │
     │  │ • subs       │  │ • geo    │  │                   │ │
     │  │ • stores     │  │          │  │                   │ │
     │  │ • analytics  │  │          │  │                   │ │
     │  └─────────────┘  └──────────┘  └─────────────────┘ │
     └──────────────────────────────────────────────────────┘
```

---

## 5. Tech Stack Decisions (2026 Best-in-Class)

### 5.1 Backend Framework: **NestJS with Fastify adapter**

| Why NestJS | Why NOT Hono/Elysia |
|-----------|---------------------|
| Opinionated structure = team consistency | Hono is great but too minimal for 8+ services |
| Built-in DI, modules, guards, interceptors | Elysia locks you into Bun runtime |
| Mature microservices transport layer | Neither has NestJS's ecosystem (Swagger, validation, etc.) |
| Fastify adapter gives 2-3x Express performance | NestJS is the industry standard for enterprise Node.js |
| Massive hiring pool — every Node.js dev knows it | |

**Decision: NestJS + Fastify + TypeScript (strict mode)**

### 5.2 Database: **Neon PostgreSQL (Serverless)**

| Why Neon | Why NOT Supabase/RDS |
|----------|---------------------|
| Serverless PostgreSQL — scales to zero, scales up infinitely | Supabase is a full BaaS — we want unbundled control |
| Branching — create DB branches like git branches for dev/staging | RDS requires always-on instances, expensive at low scale |
| Connection pooling built-in (PgBouncer) | Neon gives you raw PostgreSQL power without vendor lock |
| ~$0 at low scale, predictable pricing at high scale | Free tier is generous (0.5 GB storage, 100 hours compute) |
| PostGIS extension for geospatial queries | |

**Decision: Neon PostgreSQL + Drizzle ORM**

### 5.3 ORM: **Drizzle ORM**

| Why Drizzle | Why NOT Prisma |
|------------|----------------|
| SQL-native — you write what you mean | Prisma generates opaque queries |
| 33KB bundle — critical for serverless cold starts | Prisma engine adds significant overhead |
| Schema defined in TypeScript — no separate schema file | Prisma requires codegen step |
| Drizzle Kit for migrations — simple and reliable | Drizzle gives you full SQL control when needed |
| Perfect for PostgreSQL + TypeScript stack | |

**Decision: Drizzle ORM with Drizzle Kit migrations**

### 5.4 Cache + Queue: **Redis (Upstash) + BullMQ**

| Component | Tool | Why |
|-----------|------|-----|
| Cache | Upstash Redis | Serverless Redis, per-request pricing, global replication |
| Job Queue | BullMQ | Industry standard for Node.js. Retry, delay, rate-limit, priority queues |
| Real-time | Redis Pub/Sub + Socket.io | For live order tracking, admin dashboard updates |
| Session | Redis | Fast, ephemeral, no DB load |

**Decision: Upstash Redis + BullMQ**

### 5.5 Monorepo: **Turborepo + pnpm**

| Why Turborepo | Why NOT Nx |
|--------------|-----------|
| Simple, fast, zero config | Nx is powerful but complex for a small team |
| Remote caching (Vercel) — CI builds skip unchanged packages | Turborepo is lighter weight |
| pnpm workspaces integration is native | Perfect for 5-15 packages |
| Your team already uses pnpm | |

**Decision: Turborepo + pnpm workspaces**

### 5.6 Deployment: **Railway (Now) → AWS ECS (Later)**

| Stage | Platform | Why |
|-------|----------|-----|
| Phase 0-2 (0-10K users) | **Railway** | Deploy in minutes, visual dashboard, auto-scaling, $5/service |
| Phase 3-5 (10K-100K users) | **AWS ECS Fargate** | When you need VPC, compliance, multi-region, reserved pricing |
| Edge/CDN | **Cloudflare** | Free tier handles massive traffic, R2 for storage if needed |
| Admin Panel | **Vercel** | Native Next.js hosting, preview deploys, edge functions |

**Decision: Railway → AWS ECS Fargate migration path**

### 5.7 CI/CD: **GitHub Actions**

- Already using GitHub. No reason to add another tool.
- Matrix builds for each service in the monorepo.
- Turborepo remote cache integration.
- Preview environments via Railway/Vercel for every PR.

### 5.8 Observability Stack

| Layer | Tool | Why |
|-------|------|-----|
| Error Tracking | **Sentry** | Already using it. Add backend DSNs per service. |
| APM/Tracing | **OpenTelemetry → Grafana Cloud** | Open standard, free tier generous, distributed tracing |
| Logs | **Pino (structured JSON) → Grafana Loki** | Pino is fastest Node.js logger. Loki is free-tier friendly |
| Uptime | **BetterStack (formerly BetterUptime)** | Simple, Slack alerts, status pages |
| Dashboards | **Grafana Cloud** | Unified metrics, logs, traces in one place |

### 5.9 Complete Tech Stack Summary

```
┌─────────────────────────────────────────────────────┐
│                   SPINZO TECH STACK 2026             │
├─────────────────────────────────────────────────────┤
│ FRONTEND                                             │
│  • Expo SDK 54 + React Native 0.81 (Customer app)   │
│  • Next.js 15 (Admin Panel)                          │
│  • Expo (Delivery Partner app — lightweight)         │
│  • Zustand (state) + TanStack Query (server state)  │
│  • NativeWind (styling) + Outfit font               │
│  • Socket.io-client (real-time)                      │
├─────────────────────────────────────────────────────┤
│ BACKEND                                              │
│  • NestJS + Fastify (TypeScript, strict)             │
│  • Drizzle ORM + Drizzle Kit migrations              │
│  • BullMQ (job queues) + Redis pub/sub               │
│  • Socket.io (WebSocket server)                      │
│  • Zod (validation) + Swagger (API docs)             │
├─────────────────────────────────────────────────────┤
│ DATA                                                 │
│  • Neon PostgreSQL (primary database)                │
│  • Upstash Redis (cache, queue, pub/sub, sessions)   │
│  • Firebase Auth (phone/OTP — kept)                  │
│  • Firebase Storage + Cloudflare CDN (images)        │
├─────────────────────────────────────────────────────┤
│ INFRASTRUCTURE                                       │
│  • Railway (Phase 0-2) → AWS ECS Fargate (Phase 3+) │
│  • Cloudflare (CDN, DNS, DDoS protection)            │
│  • Vercel (Admin Panel hosting)                      │
│  • GitHub Actions (CI/CD)                            │
│  • Turborepo + pnpm (monorepo)                       │
├─────────────────────────────────────────────────────┤
│ OBSERVABILITY                                        │
│  • Sentry (errors) + OpenTelemetry (traces)          │
│  • Grafana Cloud (metrics, logs, dashboards)         │
│  • BetterStack (uptime, status page)                 │
├─────────────────────────────────────────────────────┤
│ INTEGRATIONS                                         │
│  • Razorpay (payments)                               │
│  • AiSensy (WhatsApp)                                │
│  • Google Maps Platform (geocoding, routing)         │
│  • FCM (push notifications)                          │
│  • Sentry (crash reporting)                          │
└─────────────────────────────────────────────────────┘
```

---

## 6. Domain Decomposition — Bounded Contexts

Using Domain-Driven Design (DDD), here is how we split the monolith into bounded contexts:

### 6.1 Service Map

| Service | Owns | Database Tables | Current Code It Replaces |
|---------|------|-----------------|--------------------------|
| **auth-service** | Authentication, JWT, session | `sessions` | `auth.ts`, `adminAuthStore.ts`, Firebase Auth bridge |
| **user-service** | Profiles, addresses, preferences, RBAC | `users`, `addresses`, `roles` | `firestore.ts` (user/address functions), `authStore.ts` |
| **order-service** | Order lifecycle, slot booking, OTP verification | `orders`, `order_items`, `daily_slots` | `firestore.ts` (order functions), `orderStore.ts` |
| **catalog-service** | Services, pricing, subscriptions, credits | `services`, `subscriptions`, `credit_usage`, `pricing_rules` | `vendorSeed.ts`, `subscriptionStore.ts` |
| **payment-service** | Razorpay integration, refunds, ledger | `payments`, `refunds` | `paymentService.ts`, Cloud Functions |
| **store-service** | Dark stores, zones, geofencing, routing | `stores`, `service_zones`, `zone_pincodes` | `geofence.ts`, hardcoded `vendor_1` |
| **notification-service** | WhatsApp, push, SMS, email, in-app | `notification_log` | `whatsapp.ts`, Cloud Functions triggers |
| **analytics-service** | Revenue, user stats, dashboards | Materialized views, `analytics_events` | `adminFirestore.ts` (stats/revenue functions) |
| **gateway** | Routing, rate-limiting, auth middleware | — | New |

### 6.2 Service Communication Rules

```
RULE 1: Services NEVER share a database.
RULE 2: Synchronous calls (HTTP/gRPC) only for request-response.
RULE 3: Asynchronous events (BullMQ/Redis) for everything else.
RULE 4: Every service publishes events for state changes.
RULE 5: Gateway is the ONLY public-facing endpoint.
```

### 6.3 Event Flow Example: Customer Places Order

```
Customer App → POST /api/v1/orders (Gateway)
  │
  ├─→ Gateway: Verify JWT, rate-limit, route to order-service
  │
  ├─→ order-service:
  │     1. Validate order data (Zod schema)
  │     2. Check slot availability (Redis cache + PG fallback)
  │     3. Reserve slot (PG row-level lock)
  │     4. If subscription order → call catalog-service to deduct credit
  │     5. Create order in PG (status: 'confirmed')
  │     6. Generate pickup OTP
  │     7. Publish events:
  │        ├── order.placed → notification-service (WhatsApp + push)
  │        ├── order.placed → analytics-service (revenue tracking)
  │        └── order.placed → store-service (assign dark store)
  │     8. Return { orderId, pickupOTP, estimatedPickup }
  │
  └─→ notification-service (async, via BullMQ):
        1. Pick up 'order.placed' job
        2. Fetch customer phone from user-service
        3. Send WhatsApp via AiSensy
        4. Send push notification via FCM
        5. Log in notification_log table
```

---

## 7. Data Architecture & Migration Strategy

### 7.1 PostgreSQL Schema (Core Tables)

```sql
-- Users & Auth
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  name VARCHAR(255),
  email VARCHAR(255),
  gender VARCHAR(20),
  referral_code VARCHAR(50),
  role VARCHAR(20) DEFAULT 'customer', -- customer, admin, store_admin, delivery_partner
  credits INTEGER DEFAULT 0,
  subscription_status VARCHAR(20) DEFAULT 'inactive',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- 'Home', 'Work', etc.
  address_line TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  pincode VARCHAR(10),
  city VARCHAR(100),
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);
CREATE INDEX idx_addresses_geo ON addresses USING GIST (
  ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
); -- PostGIS geospatial index

-- Stores & Zones
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL, -- 'jayanagar_01', 'hsr_01'
  address TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 3000,
  is_active BOOLEAN DEFAULT true,
  operating_hours JSONB, -- { "mon": { "open": "08:00", "close": "20:00" }, ... }
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE service_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  center_lat DOUBLE PRECISION NOT NULL,
  center_lng DOUBLE PRECISION NOT NULL,
  radius_meters INTEGER NOT NULL,
  pincodes TEXT[], -- array of serviceable pincodes
  is_active BOOLEAN DEFAULT true
);

-- Catalog & Services
CREATE TABLE service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(100) NOT NULL, -- 'Wash & Fold', 'Wash & Iron', etc.
  slug VARCHAR(100) NOT NULL, -- 'wash_fold', 'wash_iron'
  description TEXT,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE service_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES service_categories(id),
  name VARCHAR(255) NOT NULL, -- 'T-Shirt', 'Jeans', etc.
  price DECIMAL(10,2) NOT NULL,
  unit VARCHAR(20) DEFAULT 'piece', -- 'piece', 'kg', 'pair'
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0
);

-- Orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  store_id UUID REFERENCES stores(id),
  status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    -- confirmed → pickup_completed → processing → ready → out_for_delivery → delivered
    -- confirmed → cancelled
  pickup_type VARCHAR(20) NOT NULL, -- 'instant', 'scheduled'
  pickup_date DATE,
  pickup_time VARCHAR(30), -- '10:00 - 11:00'
  delivery_date DATE,
  delivery_time VARCHAR(30),
  pickup_otp VARCHAR(6),
  pickup_verified BOOLEAN DEFAULT false,
  picked_up_at TIMESTAMPTZ,
  delivery_otp VARCHAR(6),
  delivery_verified BOOLEAN DEFAULT false,
  delivered_at TIMESTAMPTZ,
  token_number VARCHAR(20),
  address JSONB NOT NULL, -- snapshot of delivery address at order time
  bill_details JSONB, -- { subtotal, delivery, discount, total }
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  subscription_id UUID, -- if paid via subscription credit
  payment_method VARCHAR(30), -- 'razorpay', 'subscription_credit', 'cod'
  notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_pickup_date ON orders(pickup_date);

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  service_item_id UUID REFERENCES service_items(id),
  name VARCHAR(255) NOT NULL, -- denormalized for historical accuracy
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  subtotal DECIMAL(10,2) NOT NULL,
  photos TEXT[] -- array of Firebase Storage URLs
);

-- Slots
CREATE TABLE daily_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id),
  slot_date DATE NOT NULL,
  slot_time VARCHAR(30) NOT NULL,
  booked_count INTEGER DEFAULT 0,
  max_capacity INTEGER DEFAULT 5,
  UNIQUE(store_id, slot_date, slot_time)
);
CREATE INDEX idx_slots_date ON daily_slots(store_id, slot_date);

-- Payments
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  order_id UUID REFERENCES orders(id),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature VARCHAR(255),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  status VARCHAR(20) NOT NULL, -- 'created', 'authorized', 'captured', 'failed', 'refunded'
  method VARCHAR(30), -- 'upi', 'card', 'netbanking', 'wallet'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions & Credits
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  plan_type VARCHAR(20) NOT NULL, -- 'single', 'couple'
  total_credits INTEGER NOT NULL,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER NOT NULL,
  current_credit_index INTEGER DEFAULT 0,
  price_per_credit DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  kg_per_credit DECIMAL(5,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'expired', 'cancelled'
  payment_id UUID REFERENCES payments(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES subscriptions(id),
  user_id UUID REFERENCES users(id),
  credit_index INTEGER NOT NULL,
  order_id UUID REFERENCES orders(id),
  used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Log
CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  channel VARCHAR(20) NOT NULL, -- 'whatsapp', 'push', 'sms', 'email'
  template VARCHAR(100), -- 'order_placed', 'order_ready', etc.
  status VARCHAR(20) NOT NULL, -- 'sent', 'failed', 'delivered'
  metadata JSONB, -- any extra data
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- Unserviceable Requests (demand tracking)
CREATE TABLE unserviceable_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  pincode VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 7.2 Migration Strategy: The Strangler Fig

```
Phase 1: READ from Firebase, WRITE to Both
  ┌──────┐     ┌─────────┐     ┌────────────┐
  │Client│────▶│   API   │────▶│ PostgreSQL │ (new writes)
  │      │     │ Gateway │────▶│ Firestore  │ (legacy writes)
  └──────┘     └─────────┘     └────────────┘
                                      │
                              Read from Firebase
                              (until PG has all data)

Phase 2: WRITE to PostgreSQL, SYNC to Firebase
  ┌──────┐     ┌─────────┐     ┌────────────┐
  │Client│────▶│   API   │────▶│ PostgreSQL │ (primary)
  │      │     │ Gateway │     │            │
  └──────┘     └─────────┘     │ ──sync──▶  │
                               │ Firestore  │ (shadow/backup)
                               └────────────┘

Phase 3: PostgreSQL ONLY
  ┌──────┐     ┌─────────┐     ┌────────────┐
  │Client│────▶│   API   │────▶│ PostgreSQL │ (sole source)
  │      │     │ Gateway │     └────────────┘
  └──────┘     └─────────┘
                               Firestore: Auth + Storage only
```

### 7.3 Data Migration Script Architecture

```typescript
// Migration runs as a one-time NestJS CLI command
// migration/firestore-to-pg.ts

async function migrateUsers() {
  // 1. Fetch all users from Firestore
  // 2. Transform: flatten savedAddresses[] → addresses table rows
  // 3. Transform: map Firebase UID → users.firebase_uid
  // 4. Upsert into PostgreSQL (idempotent — can re-run safely)
  // 5. Verify count matches
}

async function migrateOrders() {
  // 1. Fetch from users/{uid}/orders (primary, not vendor mirror)
  // 2. Flatten: nested order data → orders + order_items rows
  // 3. Resolve user_id from firebase_uid mapping
  // 4. Assign store_id (all current = store_1/jayanagar)
  // 5. Upsert into PostgreSQL
}

async function migrateSubscriptions() {
  // 1. Fetch from users/{uid}/subscriptions
  // 2. Map to subscriptions table
  // 3. Fetch creditUsage subcollections → credit_usage table
}

// CRITICAL: Run migration with --dry-run first
// CRITICAL: Verify row counts match before cutover
// CRITICAL: Keep Firestore read-only as backup for 30 days post-migration
```

---

## 8. Phase 0: Foundation (Weeks 1–3)

> **Goal:** Set up the monorepo, database, and deploy a health-check API. Zero disruption to production.

### 8.0 Checklist

- [ ] Create Turborepo monorepo structure
- [ ] Set up Neon PostgreSQL database (dev + staging)
- [ ] Set up Upstash Redis instance
- [ ] Create gateway service (NestJS + Fastify)
- [ ] Create shared packages (types, config, validation)
- [ ] Set up GitHub Actions CI pipeline
- [ ] Deploy gateway to Railway with health-check endpoint
- [ ] Set up Sentry + Grafana Cloud for backend
- [ ] Create `.env` management with `dotenv-vault` or Railway secrets

### 8.1 Monorepo Structure

```
spinzo/
├── apps/
│   ├── gateway/                 # API Gateway (NestJS)
│   ├── auth-service/            # Auth microservice
│   ├── user-service/            # User microservice
│   ├── order-service/           # Order microservice
│   ├── catalog-service/         # Catalog/pricing microservice
│   ├── payment-service/         # Payment microservice
│   ├── store-service/           # Store/zone microservice
│   ├── notification-service/    # Notification microservice
│   ├── analytics-service/       # Analytics microservice
│   ├── mobile/                  # Existing Expo app (moved here)
│   ├── admin/                   # New Next.js admin panel
│   └── delivery/                # New Expo delivery partner app
├── packages/
│   ├── shared-types/            # TypeScript types, DTOs, Zod schemas
│   ├── db/                      # Drizzle schema, migrations, client
│   ├── config/                  # Shared ESLint, Prettier, TSConfig
│   ├── events/                  # Event type definitions
│   └── ui/                      # Shared UI components (if needed)
├── tools/
│   └── migration/               # Firestore → PostgreSQL migration scripts
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
└── .github/
    └── workflows/
        ├── ci.yml
        ├── deploy-gateway.yml
        └── deploy-services.yml
```

### 8.2 Shared Types Package (The Contract)

```typescript
// packages/shared-types/src/order.ts
import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'confirmed', 'pickup_completed', 'processing',
  'ready', 'out_for_delivery', 'delivered', 'cancelled'
]);

export const CreateOrderSchema = z.object({
  storeId: z.string().uuid(),
  items: z.array(z.object({
    serviceItemId: z.string().uuid(),
    quantity: z.number().int().positive(),
  })).min(1),
  pickupType: z.enum(['instant', 'scheduled']),
  pickupDate: z.string().optional(), // YYYY-MM-DD
  pickupTime: z.string().optional(), // '10:00 - 11:00'
  addressId: z.string().uuid(),
  paymentMethod: z.enum(['razorpay', 'subscription_credit', 'cod']),
  subscriptionId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

// packages/shared-types/src/events.ts
export const ORDER_EVENTS = {
  PLACED: 'order.placed',
  STATUS_CHANGED: 'order.status_changed',
  CANCELLED: 'order.cancelled',
  PICKUP_VERIFIED: 'order.pickup_verified',
  DELIVERY_VERIFIED: 'order.delivery_verified',
} as const;

export interface OrderPlacedEvent {
  orderId: string;
  userId: string;
  storeId: string;
  totalAmount: number;
  pickupType: 'instant' | 'scheduled';
}
```

---

## 9. Phase 1: API Layer & First Microservice (Weeks 4–8)

> **Goal:** Get the gateway live, build auth-service and user-service. Mobile app starts calling APIs for user profile and addresses instead of Firestore directly.

### 9.1 Checklist

- [ ] Build auth-service: Firebase token verification → JWT issuance
- [ ] Build user-service: CRUD for profiles and addresses
- [ ] Gateway: Route `/api/v1/auth/*` and `/api/v1/users/*`
- [ ] Run Firestore → PostgreSQL migration for `users` and `addresses`
- [ ] Update mobile app: Replace `getUser()`, `createUser()`, `addAddress()` with API calls
- [ ] Dual-write: API writes to PG, syncs to Firestore for 2-week safety window
- [ ] Load test with k6: 100 concurrent users, <200ms p95 latency

### 9.2 Auth Flow (Firebase Auth → Custom JWT)

```
Mobile App                    Gateway              auth-service          Firebase
    │                           │                      │                    │
    │──── Login (Phone/OTP) ──────────────────────────────────────────────▶│
    │◀─── Firebase ID Token ──────────────────────────────────────────────│
    │                           │                      │                    │
    │── POST /auth/token ──────▶│─── Forward ────────▶│                    │
    │   { firebaseToken }       │                      │── Verify token ──▶│
    │                           │                      │◀── Valid + UID ───│
    │                           │                      │                    │
    │                           │                      │ Lookup user in PG
    │                           │                      │ If new → create user
    │                           │                      │ Generate JWT with:
    │                           │                      │  { uid, role, storeId }
    │                           │                      │                    │
    │◀── { accessToken,  ──────│◀── Return ───────────│                    │
    │      refreshToken,        │                      │                    │
    │      user }               │                      │                    │
    │                           │                      │                    │
    │── GET /users/me ─────────▶│── Verify JWT ───────▶│                    │
    │   Authorization: Bearer   │   (middleware)        │── Query PG ──────│
    │                           │                      │◀── User data ─────│
    │◀── { user profile } ─────│◀────────────────────│                    │
```

### 9.3 Key API Endpoints (Phase 1)

```
POST   /api/v1/auth/token              # Firebase token → JWT exchange
POST   /api/v1/auth/refresh            # Refresh access token
POST   /api/v1/auth/logout             # Invalidate session

GET    /api/v1/users/me                # Get current user profile
PUT    /api/v1/users/me                # Update profile
GET    /api/v1/users/me/addresses      # List addresses
POST   /api/v1/users/me/addresses      # Add address
PUT    /api/v1/users/me/addresses/:id  # Update address
DELETE /api/v1/users/me/addresses/:id  # Delete address

GET    /api/v1/stores/check-serviceability?lat=X&lng=Y  # Check if location is serviceable
```

---

## 10. Phase 2: Core Services Extraction (Weeks 9–16)

> **Goal:** Extract order, catalog, payment, and notification services. Mobile app fully API-driven. Firestore is no longer written to by the client.

### 10.1 Checklist

- [ ] Build order-service: Create, read, update status, slot booking, OTP verification
- [ ] Build catalog-service: Services listing, pricing, subscriptions, credits
- [ ] Build payment-service: Razorpay create/verify (moved from Cloud Functions)
- [ ] Build notification-service: WhatsApp + push via BullMQ events
- [ ] Build store-service: Geofencing, zone management, store CRUD
- [ ] Migrate orders, subscriptions, payments data from Firestore → PostgreSQL
- [ ] Set up BullMQ workers for async events
- [ ] Update mobile app: All Firestore calls replaced with API calls
- [ ] Delete `firestore.ts` and `adminFirestore.ts` from mobile app
- [ ] Remove Cloud Functions (logic moved to services)
- [ ] Set up WebSocket for real-time order status updates
- [ ] End-to-end testing: Place order → payment → status updates → delivery

### 10.2 Key API Endpoints (Phase 2)

```
# Orders
POST   /api/v1/orders                        # Create order
GET    /api/v1/orders                         # List my orders (paginated)
GET    /api/v1/orders/:id                     # Get order detail
POST   /api/v1/orders/:id/verify-pickup       # Verify pickup OTP
POST   /api/v1/orders/:id/schedule-delivery   # Schedule delivery slot
POST   /api/v1/orders/:id/verify-delivery     # Verify delivery OTP
PUT    /api/v1/orders/:id/cancel              # Cancel order
GET    /api/v1/slots?storeId=X&date=Y         # Available slots

# Catalog
GET    /api/v1/stores/:storeId/services       # List service categories
GET    /api/v1/services/:id/items             # List items in a service
GET    /api/v1/subscriptions/plans            # Available plans & pricing

# Subscriptions
POST   /api/v1/subscriptions                  # Create subscription
GET    /api/v1/subscriptions/active           # Get active subscription
POST   /api/v1/subscriptions/:id/use-credit   # Use a credit

# Payments
POST   /api/v1/payments/create-order          # Create Razorpay order
POST   /api/v1/payments/verify                # Verify Razorpay payment
GET    /api/v1/payments/history               # Payment history

# Notifications (internal, not exposed to client)
# Triggered via BullMQ events from other services

# WebSocket
WS     /ws                                    # Real-time order updates
```

### 10.3 Mobile App Refactor Strategy

```
BEFORE (Current):
  CartScreen.tsx → calls firestore.createOrder() directly
  
AFTER:
  CartScreen.tsx → calls orderStore.createOrder()
                    → which calls apiClient.post('/orders', data)
                      → which hits Gateway → order-service → PostgreSQL

The Zustand stores stay. Only the service layer changes.
Replace src/services/firestore.ts with src/services/api.ts
```

```typescript
// src/services/api.ts (NEW — replaces firestore.ts)
import axios from 'axios';
import { auth } from './firebase'; // Still need Firebase Auth for token

const API_BASE = __DEV__
  ? 'http://localhost:3000/api/v1'
  : 'https://api.spinzo.in/api/v1';

const api = axios.create({ baseURL: API_BASE });

// Interceptor: Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken(); // or use stored JWT
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Order Service
export const orderApi = {
  create: (data: CreateOrderInput) => api.post('/orders', data),
  list: (page = 1) => api.get(`/orders?page=${page}`),
  get: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string, reason: string) => api.put(`/orders/${id}/cancel`, { reason }),
  verifyPickup: (id: string, otp: string) => api.post(`/orders/${id}/verify-pickup`, { otp }),
  scheduleDelivery: (id: string, date: string, time: string) =>
    api.post(`/orders/${id}/schedule-delivery`, { date, time }),
  verifyDelivery: (id: string, otp: string) => api.post(`/orders/${id}/verify-delivery`, { otp }),
};

// User Service
export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: Partial<UserProfile>) => api.put('/users/me', data),
  getAddresses: () => api.get('/users/me/addresses'),
  addAddress: (data: AddressInput) => api.post('/users/me/addresses', data),
  updateAddress: (id: string, data: Partial<AddressInput>) => api.put(`/users/me/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/me/addresses/${id}`),
};

export default api;
```

---

## 11. Phase 3: Multi-Dark-Store & Scaling (Weeks 17–24)

> **Goal:** Support multiple dark stores with dynamic routing, inventory per store, and zone-based operations. This is the Zepto/Blinkit unlock.

### 11.1 Checklist

- [ ] Store management: CRUD for dark stores with geo-boundaries
- [ ] Dynamic order routing: Assign orders to nearest serviceable store
- [ ] Per-store inventory and service catalog
- [ ] Per-store slot management
- [ ] Per-store admin views (store_admin sees only their store)
- [ ] Zone management: Admin can draw zones on map, assign pincodes
- [ ] Store performance dashboard
- [ ] Delivery partner assignment per store
- [ ] Update geofencing from hardcoded → PostGIS database queries

### 11.2 Multi-Store Order Routing Algorithm

```
Customer places order:
  1. Get customer's delivery address (lat, lng)
  2. Query service_zones: Find all zones containing this point
     → SELECT s.* FROM stores s
        JOIN service_zones z ON z.store_id = s.id
        WHERE z.is_active = true
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(z.center_lng, z.center_lat), 4326)::geography,
          ST_SetSRID(ST_MakePoint(:customerLng, :customerLat), 4326)::geography,
          z.radius_meters
        )
  3. From matching stores, pick the one that:
     a. Has the requested services available
     b. Has slot capacity for requested time
     c. Is closest (by distance)
  4. Assign order to that store
  5. If no store available → show "Not serviceable" + log to unserviceable_requests
```

### 11.3 Key API Endpoints (Phase 3)

```
# Admin — Store Management
POST   /api/v1/admin/stores                   # Create store
PUT    /api/v1/admin/stores/:id               # Update store
GET    /api/v1/admin/stores                    # List all stores
POST   /api/v1/admin/stores/:id/zones         # Add service zone
PUT    /api/v1/admin/stores/:id/zones/:zoneId # Update zone

# Admin — Per-Store Operations
GET    /api/v1/admin/stores/:id/orders        # Orders for this store
GET    /api/v1/admin/stores/:id/slots         # Slot availability
GET    /api/v1/admin/stores/:id/stats         # Store performance
```

---

## 12. Phase 4: Admin Panel & Delivery App Separation (Weeks 25–30)

> **Goal:** Extract admin panel into a standalone Next.js app. Build a dedicated delivery partner app.

### 12.1 Admin Panel (Next.js)

**Why separate from Expo:**
- Admin is **web-only** — no need for React Native overhead
- Next.js gives you SSR, middleware, file-based routing, built-in auth
- Faster iteration — admin changes don't require mobile app store updates
- Better for complex tables, charts, data-heavy UIs

**Key Features:**
- [ ] Dashboard: Today's orders, revenue, active stores
- [ ] Order management: Kanban board by status, bulk actions
- [ ] Customer management: Search, view history, manage credits
- [ ] Store management: CRUD, zone mapping, service toggle
- [ ] Delivery partner management: Assign, track, performance
- [ ] Subscription management: Active subs, usage, expiry
- [ ] Revenue analytics: Date range, per-store, per-service breakdowns
- [ ] Settings: Admin users CRUD, service availability toggles
- [ ] Demand heatmap: Unserviceable request visualization

**Tech:**
- Next.js 15 + App Router
- TanStack Table (for data grids)
- Recharts (for analytics)
- Shadcn/ui (component library)
- TanStack Query (server state)
- Socket.io-client (real-time order updates)
- Deployed on Vercel

### 12.2 Delivery Partner App (Expo Lite)

**Why separate:**
- Delivery partners need a **minimal, fast, battery-efficient** app
- Different auth flow (admin assigns phone → partner gets access)
- Only needs: Active pickups, navigation, OTP verification, status updates
- Can be a PWA initially, native app later

**Key Features:**
- [ ] Login: Phone/OTP (restricted to delivery_partner role)
- [ ] Active orders: List of assigned pickups/deliveries
- [ ] Order detail: Customer address, items, OTP display
- [ ] Status update: Mark picked up, out for delivery, delivered
- [ ] OTP entry: Verify pickup/delivery OTP
- [ ] Navigation: One-tap Google Maps navigation to address
- [ ] Earnings: Daily/weekly summary (future)

---

## 13. Phase 5: Observability, CI/CD & Production Hardening (Weeks 31–36)

> **Goal:** Production-grade CI/CD, monitoring, alerting, and security hardening.

### 13.1 CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint typecheck test --filter=...[${{ github.event.before }}]
      # ↑ Only runs tasks for packages affected by this commit

  deploy-staging:
    needs: check
    if: github.ref == 'refs/heads/develop'
    # Deploy all affected services to Railway staging

  deploy-production:
    needs: check
    if: github.ref == 'refs/heads/main'
    # Canary deploy → 10% traffic → monitor 15 min → full rollout
```

### 13.2 Observability Checklist

- [ ] Structured logging (Pino) in every service
- [ ] OpenTelemetry instrumentation: HTTP, DB, Redis, BullMQ spans
- [ ] Grafana dashboards: Request rate, error rate, latency (RED metrics)
- [ ] Sentry: Backend error tracking with service-specific DSNs
- [ ] BetterStack: Uptime monitoring for `/health` endpoints
- [ ] Alerting: Slack notifications for >1% error rate, p95 >500ms
- [ ] BullMQ dashboard: Bull Board for queue monitoring

### 13.3 Security Hardening

- [ ] Rate limiting: 100 req/min per user, 1000 req/min per IP
- [ ] JWT expiry: 15 min access token, 7 day refresh token
- [ ] CORS: Whitelist only `*.spinzo.in` origins
- [ ] Helmet.js: Security headers on all responses
- [ ] Input validation: Zod schemas on every endpoint
- [ ] SQL injection: Drizzle ORM parameterizes all queries
- [ ] Secrets: Railway/AWS Secrets Manager, rotated quarterly
- [ ] Admin endpoints: Require `role: 'admin'` or `role: 'super_admin'` in JWT
- [ ] Audit log: Track all admin actions (who changed what, when)

---

## 14. Frontend Evolution Strategy

### 14.1 Mobile App Migration (Strangler Pattern)

The mobile app stays in Expo. We don't rewrite screens. We **swap the service layer**.

```
Week 4-5:   Replace user/address calls with API
Week 6-8:   Replace catalog/pricing calls with API
Week 9-12:  Replace order/cart calls with API
Week 13-14: Replace payment calls with API
Week 15-16: Replace admin calls with API
Week 16:    Delete firestore.ts and adminFirestore.ts
Week 16:    Delete Cloud Functions (logic in services)
```

### 14.2 Add TanStack Query for Server State

```typescript
// Replace manual Zustand fetch patterns with TanStack Query
// Keep Zustand for UI state only (modals, filters, etc.)

// BEFORE:
const { orders, loading, fetchOrders } = useOrderStore();
useEffect(() => { fetchOrders(userId); }, []);

// AFTER:
const { data: orders, isLoading } = useQuery({
  queryKey: ['orders', userId],
  queryFn: () => orderApi.list(),
  staleTime: 30_000, // 30 seconds cache
});
// Zustand orderStore can still exist for complex UI state
// but data fetching responsibility moves to TanStack Query
```

### 14.3 Real-Time Updates via WebSocket

```typescript
// src/services/socket.ts
import { io } from 'socket.io-client';

const socket = io('wss://api.spinzo.in', {
  auth: { token: 'JWT_HERE' },
  transports: ['websocket'],
});

// Listen for order status changes
socket.on('order:status_changed', (data) => {
  // Invalidate TanStack Query cache to refetch
  queryClient.invalidateQueries({ queryKey: ['orders'] });
  queryClient.invalidateQueries({ queryKey: ['order', data.orderId] });
});

// Admin: Listen for new orders
socket.on('order:new', (data) => {
  queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
});
```

---

## 15. Security Architecture

### 15.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    AUTH ARCHITECTURE                          │
│                                                              │
│  Firebase Auth (Phone/OTP)                                   │
│       │                                                      │
│       ▼                                                      │
│  Firebase ID Token                                           │
│       │                                                      │
│       ▼                                                      │
│  auth-service:                                               │
│    1. Verify Firebase token (firebase-admin SDK)             │
│    2. Lookup/create user in PostgreSQL                       │
│    3. Issue custom JWT:                                      │
│       {                                                      │
│         sub: "uuid",                                         │
│         role: "customer" | "admin" | "store_admin" |         │
│               "delivery_partner",                            │
│         storeId: "uuid" (if store_admin/delivery),           │
│         phone: "+91XXXXXXXXXX",                              │
│         iat: timestamp,                                      │
│         exp: timestamp (15 min)                              │
│       }                                                      │
│    4. Issue refresh token (7 day, stored in Redis)           │
│                                                              │
│  Every subsequent API call:                                  │
│    Authorization: Bearer <JWT>                               │
│    Gateway validates JWT signature + expiry                  │
│    Gateway injects user context into request                 │
│    Service-level guards check role                           │
└─────────────────────────────────────────────────────────────┘
```

### 15.2 RBAC Model

| Role | Can Access | Scope |
|------|-----------|-------|
| `customer` | Own profile, orders, subscriptions | Own data only |
| `delivery_partner` | Assigned orders, customer PII for delivery | Assigned store |
| `store_admin` | Store orders, toggle services, no revenue | Assigned store |
| `super_admin` | Everything | Global |

---

## 16. Cost Analysis & Infrastructure

### 16.1 Current Firebase Costs (Estimated)

| Service | Monthly Cost (1K users) | At 10K users | At 50K users |
|---------|------------------------|-------------|--------------|
| Firestore Reads | ~₹1,500 | ~₹15,000 | ~₹75,000 |
| Firestore Writes | ~₹500 | ~₹5,000 | ~₹25,000 |
| Cloud Functions | ~₹200 | ~₹2,000 | ~₹10,000 |
| Firebase Auth | Free | Free | Free |
| Firebase Storage | ~₹100 | ~₹500 | ~₹2,500 |
| **Total** | **~₹2,300** | **~₹22,500** | **~₹1,12,500** |

### 16.2 New Architecture Costs (Estimated)

| Service | Monthly Cost (1K users) | At 10K users | At 50K users |
|---------|------------------------|-------------|--------------|
| Neon PostgreSQL | Free (0.5GB) | ~₹2,000 (Pro) | ~₹8,000 (Scale) |
| Upstash Redis | Free (10K cmds/day) | ~₹800 | ~₹3,000 |
| Railway (services) | ~₹2,000 (4 services) | ~₹6,000 | Migrate to AWS |
| AWS ECS Fargate | — | — | ~₹25,000 |
| Vercel (admin) | Free | Free | ~₹1,500 |
| Firebase Auth | Free | Free | Free |
| Firebase Storage | ~₹100 | ~₹500 | ~₹2,500 |
| Cloudflare | Free | Free | Free |
| Grafana Cloud | Free | Free | ~₹2,000 |
| Sentry | Free (5K events) | ~₹1,500 | ~₹4,000 |
| **Total** | **~₹2,100** | **~₹10,800** | **~₹46,000** |

> **Key insight:** At 50K users, the new architecture is **60% cheaper** than Firebase while being 10x more capable.

---

## 17. Team Structure & Hiring Plan

### 17.1 Minimum Viable Team

| Role | Phase 0-2 | Phase 3-5 |
|------|-----------|-----------|
| **You (CTO/Tech Lead)** | Architecture, code review, critical path | Strategy, hiring, scaling |
| **Full-stack Dev 1** | Backend services (NestJS) | Senior backend, mentoring |
| **Full-stack Dev 2** | Mobile app API migration | Frontend + delivery app |
| **DevOps/Infra** (Part-time) | CI/CD, Railway setup | AWS migration, monitoring |

### 17.2 Hiring Priorities

1. **Immediately:** Senior backend developer (NestJS + PostgreSQL experience)
2. **Phase 2:** Mobile developer (Expo/React Native + API integration)
3. **Phase 3:** DevOps engineer (part-time contract OK)
4. **Phase 4:** Frontend developer (Next.js for admin panel)

---

## 18. Risk Register & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| **Data loss during migration** | Medium | Critical | Dual-write for 2 weeks. Firestore backup. Idempotent migration scripts. |
| **Mobile app crashes after API switch** | Medium | High | Feature flags (per-screen API toggle). Rollback to Firestore in 1 tap. |
| **Team bandwidth** | High | High | Phase strictly. Never build 2 services simultaneously. |
| **Downtime during cutover** | Low | High | Blue-green deploy. DNS switch. 5-min rollback window. |
| **Scope creep** | High | Medium | This document is the scope. If it's not here, it's not Phase 1-5. |
| **Firebase Auth migration** | Low | Low | We're NOT migrating auth. Firebase Auth stays. |
| **Razorpay integration breaks** | Low | Critical | Payment service is a 1:1 port of Cloud Functions. Test with sandbox keys first. |
| **Real-time features degrade** | Medium | Medium | WebSocket fallback to polling. Redis pub/sub is battle-tested. |

---

## 19. Success Metrics & KPIs

### 19.1 Technical KPIs

| Metric | Current | Phase 2 Target | Phase 5 Target |
|--------|---------|---------------|---------------|
| API response time (p95) | N/A (client-side) | <200ms | <100ms |
| Admin page load | 5-8 seconds | <2 seconds | <1 second |
| Order creation latency | ~3 seconds | <1 second | <500ms |
| Concurrent users supported | ~100 | ~1,000 | ~10,000 |
| Deployment frequency | Manual | Daily | Multiple/day |
| Test coverage | 0% | >60% | >80% |
| Error rate | Unknown | <1% | <0.1% |
| MTTR (Mean Time to Recovery) | Hours | <30 min | <5 min |

### 19.2 Business KPIs (Enabled by Tech)

| Metric | How Architecture Enables It |
|--------|---------------------------|
| **Add new dark store** | store-service: Create store, draw zone, go live in 1 day |
| **Launch new city** | Create stores + zones. Same backend. No code changes. |
| **Add new service category** | catalog-service: Admin panel CRUD. No deploy needed. |
| **Partner integration** | API-first. Expose versioned endpoints with API keys. |
| **Real-time tracking** | WebSocket infrastructure ready for rider GPS. |
| **Dynamic pricing** | catalog-service: Price rules engine. Surge/discount per zone. |

---

## 20. Appendix: ADR Log

### ADR-001: NestJS over Hono/Elysia
- **Decision:** Use NestJS with Fastify adapter
- **Rationale:** Team needs opinionated structure. Hiring pool is largest for NestJS. Enterprise-grade module system prevents spaghetti code across 8 services. Fastify adapter gives sufficient performance.

### ADR-002: Neon PostgreSQL over Supabase
- **Decision:** Use Neon as managed PostgreSQL, not Supabase
- **Rationale:** Supabase is a full BaaS — we want to own our API layer via NestJS, not use Supabase's auto-generated REST. Neon gives us raw PostgreSQL with serverless scaling and branching.

### ADR-003: Drizzle ORM over Prisma
- **Decision:** Use Drizzle ORM
- **Rationale:** TypeScript-native schema definition (no codegen step), SQL-like API gives explicit control, minimal bundle size for potential serverless functions, excellent PostgreSQL support.

### ADR-004: Keep Firebase Auth
- **Decision:** Do NOT migrate away from Firebase Auth
- **Rationale:** Phone/OTP auth works perfectly. Indian users are comfortable with it. Migration would require all users to re-verify. We bridge Firebase tokens to custom JWTs in auth-service — best of both worlds.

### ADR-005: Railway → AWS ECS migration path
- **Decision:** Start on Railway, plan AWS ECS for Phase 3+
- **Rationale:** Railway gives us 10-minute deploys with zero DevOps overhead. At 10K+ users, we migrate to ECS Fargate for VPC isolation, reserved pricing, and compliance. Railway exit is clean — everything is containerized.

### ADR-006: BullMQ over Kafka/RabbitMQ
- **Decision:** Use BullMQ (Redis-backed) for event queuing
- **Rationale:** At current scale (1K-50K users), Kafka is overkill operationally. BullMQ gives us retries, delays, priorities, rate limiting, and a monitoring dashboard (Bull Board) — all on top of Redis we already need for caching. Migration to Kafka is straightforward if needed at 100K+ scale.

### ADR-007: Separate Admin Panel (Next.js)
- **Decision:** Build admin as standalone Next.js app, not inside Expo
- **Rationale:** Admin is web-only. Expo adds unnecessary RN overhead for pure web. Next.js gives SSR, middleware, better SEO for potential public pages, and doesn't require app store deploys for admin changes.

---

## Timeline Summary

```
PHASE 0 (Weeks 1-3)    ░░░░░░░░ Foundation, Monorepo, DB setup
PHASE 1 (Weeks 4-8)    ░░░░░░░░░░░░░░░░ Auth + User Service + First API calls
PHASE 2 (Weeks 9-16)   ░░░░░░░░░░░░░░░░░░░░░░░░ Core Services + Full API Migration
PHASE 3 (Weeks 17-24)  ░░░░░░░░░░░░░░░░░░░░░░░░ Multi-Store + Scaling
PHASE 4 (Weeks 25-30)  ░░░░░░░░░░░░░░░░░░░░ Admin Panel + Delivery App
PHASE 5 (Weeks 31-36)  ░░░░░░░░░░░░░░░░░░░░ CI/CD + Observability + Hardening

Total: ~9 months with a 2-person dev team
       ~5 months with a 4-person dev team
```

---

## The Golden Rules

> 1. **No new Firestore client calls. Ever. Starting today.**
> 2. **Every feature goes through an API endpoint.**
> 3. **Every service owns its data. No shared databases.**
> 4. **If it's not in this roadmap, it's not in scope.**
> 5. **Ship Phase 1 before designing Phase 3.**
> 6. **Dual-write during migration. Never big-bang cutover.**
> 7. **Test with production data shadow traffic before cutover.**
> 8. **This document is alive. Update it or it dies.**

---

*Last reviewed: 2026-05-25 | Next review: After Phase 0 completion*
