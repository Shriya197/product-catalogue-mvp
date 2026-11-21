# AGENTS.md — Project Rules & Architecture Spec

## Context & Goal
We are building an extensible MVP Product Catalogue (React + TypeScript frontend, Node.js + TypeScript backend).
The client has been burned by throwaway PoCs. Every layer must have clean boundaries so the product data source (currently Fake Store API), UI layer, and email provider can be swapped later without rewriting core business logic.

## Tech Stack
- **Monorepo structure:** `/client` (React 19, Vite, TypeScript, Tailwind CSS, TanStack Query) and `/server` (Node.js, Express, TypeScript, Zod).
- **Containerization:** Root `docker-compose.yml` + `.env.example` so the app runs locally in 1–2 commands without paid accounts.
- **Testing:** Vitest + Supertest on backend; Vitest + React Testing Library on frontend.

## Hard Architectural Rules
1. **Strict Backend Proxy:** The frontend MUST NEVER call `fakestoreapi.com` directly. All data flows through our `/api/*` endpoints.
2. **Domain Normalization:** Never leak raw Fake Store API shapes to the frontend. Map external responses into our own canonical `Product` domain model inside the adapter layer.
3. **Repository/Adapter Pattern (Data Source):**
   - Define a `ProductRepository` interface (`getAll()`, `getById(id)`, `getCategories()`).
   - Business logic (ranking "top rated", filtering by category, searching) lives in `ProductService`, completely decoupled from where products come from.
4. **Provider Pattern (Email):**
   - Define an `EmailProvider` interface (`sendEnquiry(payload)`).
   - Implement `ConsoleEmailProvider` so reviewers need zero external accounts to test locally.
5. **Validation & Error Handling:** Validate all incoming API params and POST bodies (enquiry form) using Zod. Return consistent JSON error envelopes `{ error: { code, message, details? } }`.
6. **Code Discipline:** Keep functions small, strongly typed (no `any`), and write unit/integration tests for every critical path. Do not over-engineer features outside the 5 acceptance criteria.