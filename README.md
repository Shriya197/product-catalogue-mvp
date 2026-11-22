# Product Catalogue MVP

A small, extensible product catalogue with a React storefront and an Express proxy API. The frontend talks only to `/api/*`; the Fake Store API is isolated behind a repository adapter, and email delivery behind a provider interface.

## Overview & Tech Stack Rationale

- **React 19 + TypeScript + Vite:** Fast local development and a typed UI that mirrors the backend's canonical `Product` contract. TypeScript on both sides catches integration mistakes early.
- **Tailwind CSS + TanStack Query + React Router:** Small, composable styling and routing, with server-state caching/refetching handled by TanStack Query instead of custom fetch state.
- **Node.js 22 + Express 5 + TypeScript:** A minimal API layer that is quick for reviewers to run and easy to keep separate from business logic.
- **Zod:** Validates upstream payloads and incoming API parameters/bodies at the boundaries.
- **npm workspaces + Docker Compose:** One repository, one install, and a 1–2 command local setup.
- **Replaceable boundaries:** `ProductRepository` isolates the product data source; `EmailProvider` isolates email delivery. The UI never consumes raw Fake Store shapes.

## Architecture Summary

```text
Browser (React + TanStack Query)
  └─ /api/* via client/src/api/client.ts
      └─ Express app + routes
          ├─ ProductService
          │    └─ ProductRepository
          │         └─ FakeStoreProductRepository -> Fake Store API
          └─ EmailProvider
               └─ ConsoleEmailProvider -> stdout (+ optional SMTP)
```

`ProductService` owns ranking, category splitting, search, and lookup. Routes validate input with Zod and delegate to the service or email provider. Because external dependencies sit behind interfaces, the Fake Store adapter or email provider can be replaced without changing the UI or service logic.

## Quick Start

**Prerequisites:** Node.js 22+ and npm, or Docker with Compose v2. No paid accounts are required.

### Option A — Docker Compose (recommended)

From the repository root:

```bash
docker compose up --build
```

- Client: http://localhost:5173
- API: http://localhost:4000
- Health check: http://localhost:4000/api/health

Stop with `docker compose down`. The Compose setup runs the development servers with source mounts.

### Option B — Local Node

From the repository root:

```bash
cp .env.example .env
npm install
npm run dev
```

`npm run dev` starts the Express server and Vite client together. Use the same URLs as above.

## Environment Variables

Copy `.env.example` to `.env` for local development. All values have working defaults, so the app starts without editing the file.

| Variable | Required | Default | Purpose |
| --- | --- | --- | --- |
| `PORT` | No | `4000` | Express server port. |
| `FAKESTORE_BASE_URL` | No | `https://fakestoreapi.com` | Upstream product API base URL used by the repository adapter. |
| `SALES_INBOX_EMAIL` | No | `sales@example.com` | Recipient address recorded/sent for product enquiries. |
| `SMTP_HOST` | No | unset | When set, enables SMTP delivery. Unset uses console output only. |
| `SMTP_PORT` | No | `587` | SMTP port. Port `465` uses a secure connection. |
| `SMTP_USER` | No | unset | SMTP username for authenticated delivery. |
| `SMTP_PASS` | No | unset | SMTP password. Do not commit real credentials. |
| `SMTP_FROM` | No | `SMTP_USER`, then `no-reply@example.com` | Sender address for SMTP email. |

Client/runtime notes: `VITE_API_BASE_URL` controls the browser-facing API URL (default `http://localhost:4000/api`). The Vite dev proxy uses `VITE_API_PROXY_TARGET` (default `http://localhost:4000`; Compose sets `http://server:4000`). The server's CORS origin is `CLIENT_ORIGIN` (default `http://localhost:5173`).

## Running Tests & API Endpoints

From the repository root:

```bash
npm test          # Server then client tests
npm run typecheck # Both workspaces
npm run build     # Server build, then client production build
```

The suite uses Vitest + Supertest for the backend and Vitest + React Testing Library for the frontend.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check: `{ "status": "ok" }`. |
| `GET` | `/api/products/featured` | Top 5 products by rating. |
| `GET` | `/api/categories` | Derived category names. |
| `GET` | `/api/categories/:category` | `{ category, topRated, additionalProducts }`; top 3 plus the remainder, with no duplicates. |
| `GET` | `/api/products?search=...` | Case-insensitive title/description search. Missing or empty search returns all products. |
| `GET` | `/api/products/:id` | One product, or `404`. |
| `POST` | `/api/enquiries` | Accepts `{ productId, customerName, customerEmail, message }`; returns `201 { "status": "sent" }`. |

Errors use the consistent envelope `{ "error": { "code": "…", "message": "…" } }`.

For deeper rationale, see `DECISION.md` and `AI_USAGE.md`.
