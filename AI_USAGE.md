# AI Engineering Usage Notes

## 1. Tools & Models Used
- **CLI Coding Agent:** `opencode` running `opencode/deepseek-v4.1-flash-free` for codebase scaffolding, implementation, and test generation.
- **Architectural Planning & Prompt Refinement:** **Gemini** (including **Gemini  Neon**) and **ChatGPT** used to break down ambiguous requirements, refine phase-by-phase prompts for better agent precision, verify generated code against architectural boundaries, and evaluate trade-offs for `DECISIONS.md`.
- **Workflow:** Spec-first phased execution (`AGENTS.md` -> Scaffold -> Backend Domain & Tests -> Frontend -> Docs), reviewing every git diff between phases and cross-checking logic before proceeding.

## 2. Agent Instruction Files Committed

- `AGENTS.md` (at repository root): Enforces strict frontend-to-backend proxy boundaries, canonical domain types, Repository/Provider interfaces, Zod validation, and test isolation.

## 3. Plan / Spec Used

- Executed a 5-phase plan starting from domain contracts and backend interfaces before generating any UI components, ensuring the frontend remained decoupled from the upstream Fake Store schema.
- Kept transport, business logic, and provider boundaries separate: React -> `/api/*` -> Express -> `ProductService` -> `ProductRepository` -> Fake Store, with email delivery behind `EmailProvider`.

## 4. Key Prompts & Moments That Shaped the Solution

1. **Establishing Boundaries Upfront (`AGENTS.md`):** Instructing `opencode` never to expose raw Fake Store shapes outside the adapter forced it to write a clean mapper (`toDomainProduct`) from the start.
2. **Backend-First Contract & Mocking:** Prompting `opencode` to build `ProductService` with constructor-injected interfaces made writing zero-network Vitest/Supertest suites straightforward.
3. **Explicit Search Trigger & Form State:** Directing the frontend prompt to tie search to explicit button/form submission (matching the GIVEN/WHEN/THEN criteria) and replace the enquiry form with a confirmation state on a `201` response.
4. **Targeted Frontend Review Pass:** After the UI worked, I reviewed the data-fetching, navigation, and enquiry flows instead of accepting the generated code as-is. That review produced the fixes documented below.

## 5. Where the AI Got Something Wrong & How I Caught It

I reviewed every git diff across each phase, manually verified the UI and end-to-end product catalogue flows in the browser (checking network requests, category grouping, search, and enquiry submission), and reran typechecking, automated tests, and the production build after every change. These were the concrete issues found and fixed:

- **Header search input drifted out of sync with navigation:** Typing a search worked, but navigating to a different search URL or leaving search could leave stale text in the header input. I fixed `Layout.tsx` to derive the active query from `useLocation()` + `URLSearchParams`, sync the input in an effect, and clear it on non-search routes. Added a regression test for navigation sync and reset.
- **Whitespace-only searches still reached the query layer:** `useSearchProducts` used the raw query for both the React Query key and API request. I normalized with `trim()` once, used the normalized value for both, and kept the query disabled when it was empty. Added tests confirming a padded query requests `backpack` and a whitespace-only query makes no request.
- **Cancelling the enquiry form did not clear state:** Cancel only hid the form, so old field values and a previous mutation error could reappear on reopen. I added `handleCancel()` to reset the form to `emptyForm`, call `enquiry.reset()`, and close the form. Added a regression test that submits an error, cancels, reopens, and asserts empty fields with no stale error.
- **Typechecking caught a weak test mock:** The new search hook test initially typed `vi.fn()` as zero-argument, so accessing `mock.calls[0][0]` failed with `Tuple type '[]'`. I typed the mock with `RequestInfo | URL` and `RequestInit` and reran the full verification suite.
- **API base URL handling was verified, not assumed:** I reviewed `client.ts` and confirmed that `VITE_API_BASE_URL` is trimmed, empty or whitespace-only values fall back to `http://localhost:4000/api`, and `/\/+$/` removes one or more trailing slashes without duplicating the `/api` path. No code change was needed.

**Verification performed:** `npm run typecheck`, `npm test` (32 backend tests and 10 frontend tests), and `npm run build` all pass. Live smoke checks against the built Express server confirmed categories, featured ranking, search, product lookup, the category split, enquiry submission returning `201 { status: 'sent' }`, CORS, and console email output.

## 6. Time Spent Breakdown

- **Planning & Architecture (`AGENTS.md` + contracts):** ~25 mins
- **Building (Backend, Tests & React Frontend via `opencode`):** ~2 hr 15 mins
- **Manual Review, Bug Fixes & Edge-Case Testing:** ~30 mins
- **Documentation (`DECISION.md`, `AI_USAGE.md`) & Final Validation:** ~25 mins
- **Total:** ~3 hrs 35 mins (approx the 2–3 hour time-box)

**Known validation gaps:**SMTP delivery was not exercised; the console provider path was verified.
