# Architectural Decisions & Assumptions

Date: 2026-11-21
Last updated: 2026-11-22

This log records the architecture and implementation decisions for the Product Catalogue MVP. Each decision favours simple, replaceable layers over premature optimisation.

## 1. Assumptions Made (Where Acceptance Criteria Were Open)

- **"Top Rated" selection logic:** Fake Store API has no `featured` flag. I assumed "top rated" means sorting by `rating.rate` descending, using `rating.count` descending as a tie-breaker so products with higher review volume rank higher when scores match.
- **Category page split:** The criteria require "top rated products" and "additional products" for a category. I defined "top rated" as the top 3 items in that category (when more than 3 exist) and excluded those IDs from "additional products" to avoid duplicate cards on the same screen.
- **Search behavior and scope:** Search triggers on form submit or Search button click, matching the GIVEN/WHEN/THEN criteria, rather than on every keystroke. It performs case-insensitive substring matching across both `title` and `description`, and the URL is the source of truth for the active query.
- **Categories:** Categories are derived from the normalized product list. The upstream `/categories` endpoint returned HTTP 404 during verification, while `/products` worked, so deriving categories keeps navigation functional and guarantees it matches the products being served.
- **Enquiry form fields and email delivery:** The minimum viable contact details are `customerName`, `customerEmail`, and `message`, linked to `productId`. I chose `ConsoleEmailProvider` behind an `EmailProvider` interface so reviewers can test end-to-end submission locally without SMTP credentials or paid third-party accounts. SMTP delivery is only enabled when `SMTP_HOST` is configured.
- **Caching:** TanStack Query owns client-side request caching, refetching, and server state in the UI. The backend TTL cache was intentionally removed because the catalogue is small (20 products), this is an MVP, and the extra cache code, configuration, and expiry tests added complexity without a product requirement. The adapter can add caching later without changing the repository interface, service, or routes.
- **Validation and errors:** Zod validates upstream payloads, route parameters, query strings, and enquiry bodies. Enquiries verify that the product exists before the email provider is called. Central Express error middleware returns the consistent envelope `{ error: { code, message } }` for validation, not-found, upstream, email-delivery, malformed-JSON, and internal errors. The frontend API client converts those envelopes into typed `ApiRequestError` values, and pages render retryable query errors and inline enquiry errors.

## 2. Requirements Simplified or Dropped (2–3 Hour Time-Box)

- **No persistent database:** Enquiries are validated and dispatched through the `EmailProvider` rather than persisted, because the acceptance criteria only require delivering the enquiry to the sales inbox and confirming to the customer.
- **No admin UI for choosing featured products:** Featured products remain algorithmic (top 5 by rating) instead of adding an admin dashboard and authentication, keeping focus on the customer critical path.
- **No client-side pagination:** Fake Store returns 20 products total, so pagination was omitted. List endpoints return arrays; `limit`/`offset` can be added later without changing the domain model or UI contract.
- **No backend TTL cache:** The 5-minute in-memory cache was removed from the Fake Store adapter. TanStack Query covers the UI caching need, and avoiding a backend cache keeps data fresh and the adapter simpler.
- **No browser E2E suite:** Critical flows are covered by Vitest, React Testing Library, and live smoke checks. Playwright coverage remains a follow-up rather than part of the time-box.

## 3. How the Design Evolves Beyond the PoC (Avoiding Throwaway Code)

- **Monorepo boundaries:** `client/` and `server/` are separate npm workspaces under one root. Root scripts orchestrate development, tests, builds, and Docker Compose, while keeping frontend and backend build boundaries clear.
- **Strict proxy and repository adapter:** The frontend only calls `/api/*`; it never calls Fake Store directly. `ProductService` depends on the `ProductRepository` interface, and `FakeStoreProductRepository` validates upstream JSON with Zod and maps it into the canonical `Product` model. Raw Fake Store shapes never reach the UI.
- **Swapping the product data source:** Replacing Fake Store with PostgreSQL, Shopify, or a headless CMS requires implementing a new `ProductRepository` class without touching business logic or React components. Ranking, category splitting, and search stay in `ProductService` with constructor injection.
- **Swapping the email provider:** `POST /api/enquiries` depends on the `EmailProvider` interface. Moving to AWS SES, SendGrid, or Resend requires swapping `ConsoleEmailProvider` for another implementation via dependency injection.
- **Swapping the UI:** Because ranking, filtering, and normalization live in the Node backend, the upcoming creative redesign can overhaul React components, or add a mobile client, against the same `/api/*` contract. TanStack Query hooks isolate server-state concerns from page components.
- **Stable API contract:** List endpoints return arrays for featured products, search results, and categories. Category pages return `{ category, topRated, additionalProducts }`; product lookup returns one `Product`; enquiry submission returns `201 { status: 'sent' }`. This keeps frontend integration predictable as the backend evolves.
- **Validation and error contract:** Zod schemas stay at the boundaries, while the error envelope and typed frontend errors preserve one predictable contract as adapters and providers change.
- **AWS readiness:** Both services are stateless containers orchestrated via `docker-compose.yml`, ready to deploy to AWS ECS Fargate behind an Application Load Balancer. If backend caching becomes necessary, it can be added inside the adapter or replaced by ElastiCache without affecting callers.
- **Verification guardrails:** The current codebase has 32 backend tests and 10 frontend tests, plus typecheck, production build, and live smoke checks for health, categories, featured ranking, search, product lookup, category paging, enquiry submission, CORS, and console email output.

## 4. What I Would Do Next With One More Day

1. **Persistence and audit trail:** Store submitted enquiries in PostgreSQL or DynamoDB before sending email so sales enquiries are never lost if an email provider has an outage.
2. **Admin curation override:** Add an optional `isFeatured` flag in the database so the entrepreneur can manually pin featured products while falling back to top-rated ranking.
3. **End-to-end and broader frontend tests:** Add Playwright tests for the five user journeys and expand React Testing Library coverage for every enquiry form validation branch.
4. **Rate limiting and observability:** Add `express-rate-limit` on `POST /api/enquiries` to prevent spam and structured JSON logging (for example Pino) for production monitoring.
