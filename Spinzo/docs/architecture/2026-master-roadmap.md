# Spinzo Modular Platform 2026: Detailed Migration & Architecture Roadmap

---

## 1. Current Platform Summary (2026)

Spinzo (formerly Spinit) is a premium laundry/dry-cleaning platform targeting iOS, Android, and Web, originally architected as a single Expo (React Native 0.81)/Firebase monolithic app with:
- **Single monorepo**: UI (Expo), backend logic (Firebase Auth, Firestore CRUD), admin and delivery flows mixed in one project
- **State**: Zustand stores (authStore, orderStore, cartStore, addressStore, subscriptionStore, adminStore)
- **Core DB**: Firestore
    - `users` collection: all user profiles
    - `orders` collection: order lifecycle, realtime
    - `vendors`, `addresses`, etc.
- **Auth**: Phone/OTP via Firebase Auth
- **Storage**: Firebase Storage for images
- **Navigation**: Hybrid RootNavigator, MainStack, AdminNavigator

**Why migrate?**
- Slow deploys/dev loops as features scale
- Tightly coupled user/admin/delivery logic
- Difficult to secure/gate per domain
- Firestore pricing, scale, and quota risks
- Testing, observability bottlenecks

---

## 2. Architectural Vision & Guiding Principles

### Core Principles
1. **Single codebase, clean modular boundaries.**
   - Tech owner and leads understand, operate, and can prove/test every layer/domain—no accidental monolith creep.
2. **Frontend splits:**
    - `frontend/` — Universal shared Next.js (for web/PWA), React Native (for iOS/Android) managed by Nx or Turborepo
    - Single repo, discrete apps for each customer/admin/delivery flow, but shared SDKs, contracts, storybook
3. **Backend splits:**
    - `backend/` — Node/NestJS/Go microservices, one per bounded context (auth, order, user, vendor, notification, admin, analytics)
    - Each service with its own data model, logic, versioned OpenAPI contract, CI/CD pipeline.
    - Data isolation: only APIs/gateways expose data; no shared DBs.
4. **Admin, delivery as first-class**
    - `admin/`, `delivery/` apps with identical tech, testing and production scrutiny as consumer app.
5. **Testing at every gate:** TDD enforced, contract/code/test scaffolds embedded from the start.

---

## 3. Data & Infra Migration/Choices (with Rationale)

- **DB Schema:**
    - Move core transactional/business data (orders, users, vendors, subscriptions) to managed, serverless relational DB (Aurora/Postgres, or AlloyDB).
    - Use Firestore or DynamoDB for **volatile, real-time, cache, or session storage only** (e.g., active orders/ephemeral cart).
    - Images/media: move or multi-home with S3/GCS, add CDN/multi-region if scale hits.
- **Auth:**
    - Keep Firebase Auth short-term (minimal risk, fast iteration, easy phone/OTP)—plan migration to Auth0/Cognito if you need SSO, SCIM, or large B2B partners.
- **Notifications:**
    - FCM, Twilio, and event streaming (Cloud Pub/Sub, Kafka for future scale).
- **What stays?**
    - Firestore for real-time, volatile, notification/subscription queues; Storage for already-uploaded images (unless size/cost triggers S3 migration).
    - Expo and React Native for cross-platform mobile foundation.
- **What changes?**
    - All business-critical, compliance data moves to relational for auditability & integrity; all new features as backend microservices, never as direct Firebase client CRUD.
    - All code/APIs contract-driven, with automated pact and TypeScript/SDK generation.

---

## 4. Migration & Build Phases (Explicit Checklist)

### 1. **Backend/API Foundation (backend/)**
- Contract-first: define all domain OpenAPI specs in `/contracts/`.
- Scaffold services: `nest new order`, `nest new user`, etc. (or Go micro for high-throughput domains)
- Each service: TDD, CI, unit/integration/E2E tests per endpoint, GitHub Actions + ephemeral envs
- IaC for DB, message bus, secrets, storage
- Multi-environment deployment (staging/prod/sandbox), CI gates: test, security, perf, rollback

### 2. **Automated Integrations & Data Migration**
- Firestore->SQL migration scripts, dry-run/tested on shadow traffic
- Dual-write: old and new systems for at least 1-2 release cycles; rollback command always ready
- Full contract/integration storm before cutover (k6/Locust for load, Pact for SDK compatibility)

### 3. **Frontend, Admin, Delivery Apps (universal shared codebase)**
- Scaffold separate Next.js SPA, RN app for each domain; sync on monorepo (Nx/Turborepo)
- All frontend apps only talk to backend APIs via generated SDKs
- Storybook for UI, Detox/E2E from day one with real device parity
- Shared design system tokens, constants, feature flagging via LaunchDarkly/Unleash

### 4. **CI, Observability, Security**
- Every push: static, SAST, DAST, unit, integration, E2E, perf, contract, canary, staff/incident alerting
- OpenTelemetry, Datadog, Sentry, Grafana dashboards
- mTLS, secrets rotated quarterly or on incident, incident playbooks

### 5. **Growth/Partner/Ecosystem**
- Partner API documented per `/contracts/`, with onboarding, abuse/fraud playbooks
- Every migration playbook, compliance task, audit in `/docs/`

---

## 5. Living Governance Protocol
- Major architectural/step changes are PR’d and reviewed in this doc and `README.md`
- Postmortems, incidents, and epics always reference/append relevant section
- All new hires, engineers, and ops start here—runbook, playbook, and ADR links baked in

---

## 6. Appendix: Explicit Artifact/Templates

- **OpenAPI example:** `/contracts/order.yaml` (see actual codebase or request sample)
- **Terraform infra pattern:** `/infra/main.tf`
- **Detox/End-to-End test template:** `/frontend/e2e/order.spec.js`
- **Storybook UI snapshot test:** `/frontend/storybook/config.js`
- **Partner API onboarding:** `/docs/ecosystem-partners.md`

---

## 7. References
- CLAUDE.md (original state, FAQ, setup scripts)
- [Netflix, DoorDash, Zepto, Uber, Next.js engineering blogs 2025–26]
- Anthropic Claude Code advanced skills, writing-plans, TDD, brainstorming, verification superpowers docs ([anthropic Claude Code Docs](https://claude.ai/code))

---

Always treat this as the living contract for everything Spinzo—the launchpad for every build, test, migration, onboarding, and major strategic review.
