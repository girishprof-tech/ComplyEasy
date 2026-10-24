# Venture

Compliance tracking for Indian MSMEs and the accountants who look after them: licences, registrations and
certificates with expiry dates, a cross-client dashboard, AI-assisted certificate reading, "areas to review",
scheme matching, sustainability ideas and an in-app assistant.

This is the same product as before, restructured into a conventional **React + TypeScript** frontend and a
**Java (Spring Boot)** backend. No feature, URL, request/response shape or database table was changed — the
new backend uses the same SQLite schema, so an existing `venture.db` (and its passwords) keeps working.

```
venture/
├── frontend/   Vite + React 19 + TypeScript   (src/features/…)
├── backend/    Spring Boot 3 · Java 21 · SQLite (src/main/java/com/venture/…)
├── docs/       DATA_MODEL.md  (unchanged)
├── assets/     logo
└── .env.example
```

## Running it

You need **Node 20+**, **JDK 21** and **Maven 3.9+**.

```bash
cp .env.example .env            # optional — works without a Gemini key (Demo AI Mode)

# Terminal 1 — API on :8787
cd backend && mvn spring-boot:run

# Terminal 2 — web app on :5173 (proxies /api to the backend)
cd frontend && npm install && npm run dev
```

Open http://localhost:5173.

**Single-process production run** — the backend serves the built frontend, with SPA fallback:

```bash
cd frontend && npm install && npm run build
cd ../backend && mvn package && java -jar target/venture-backend-1.0.0.jar
# → http://localhost:8787
```

Tests: `cd backend && mvn test` · `cd frontend && npm test` (and `npm run typecheck`).

### Configuration

Read from `.env` in the repo root and/or real environment variables (environment wins).

| Variable | Default | Purpose |
|---|---|---|
| `GEMINI_API_KEY` | empty | Enables real AI. Empty = Demo AI Mode (clearly labelled mock output). |
| `GEMINI_MODEL` | `gemini-3.7-flash` | Model name, read at call time. |
| `PORT` | `8787` | HTTP port. |
| `SESSION_SECRET` | random per start | Signs session cookies. Set it to keep people logged in across restarts. |
| `VENTURE_DATA_DIR` | `./data` | Folder holding `venture.db` and `uploads/` (relative to `backend/`). |
| `VENTURE_WEB_DIST` | `../frontend/dist` | Built frontend to serve, if the folder exists. |

`backend/data/venture.db` is your database from the original zip. Delete it to start fresh.

> The root `.env` already contains the Gemini key from your original project (gitignored, so it won't be committed).

### AI troubleshooting

On startup the backend logs one line about Gemini, e.g. `[gemini] key accepted, model "…" is available` or
`[gemini] AI will NOT work: The Gemini API key was rejected.` While it is running, `GET /api/ai/status`
(signed-in users) reports the same thing as JSON, without ever exposing the key. When Ask Venture can't reach
the model, its reply now says why (bad key, model not found, quota, network) instead of a generic error.

Changes made to get the assistant working:

* **Tool declarations** — all six assistant tools declared an empty `parameters.properties`, which the Gemini
  API rejects with HTTP 400. That made every chat that needed data fail. The empty schemas are removed.
* **Thought signatures** — newer Gemini models attach a `thoughtSignature` to function calls and reject the
  follow-up request without it. The model's parts are now echoed back untouched.
* **Model name** — if `GEMINI_MODEL` doesn't exist (404), the backend asks the API which models your key can
  use, switches to the newest stable Flash model and logs which one. Transient 500/503s are retried once.

## Free plan ads

Free accounts see a few clearly-labelled, fictional demo ads (`shared/components/AdBanner.tsx`): two on the
owner dashboard, one on the accountant dashboard and one on a client page. None on login, forms or dialogs.
Pro hides them all; the plan page lists "No ads" as a Pro benefit. The ads link nowhere except "Remove ads
with Pro".

## Frontend structure

```
src/
├── app/          App, route table, route guards, top bar / shell
├── api/          fetch wrapper + one small module per backend area
│                 (scope.ts: the owner-vs-accountant "which business" abstraction)
├── types/        API types, split by domain
├── shared/       reusable UI (Modal, Field, StatusBadge, StatRow…) and helpers
├── features/
│   ├── auth/         login, register, invite activation, AuthProvider
│   ├── business/     owner dashboard, business setup, change password
│   ├── clients/      accountant client list and client detail
│   ├── compliance/   item table, add/edit dialog, certificate upload, hooks
│   ├── insights/     health card, areas to review, schemes, sustainability, activity
│   ├── assistant/    "Ask Venture" chat
│   ├── dashboard/    accountant portfolio dashboard
│   ├── account/      plan page, CSV export button
│   ├── notifications/, landing/
└── styles/       the original stylesheet, split by section (byte-for-byte the same rules, same order)
```

The biggest structural change: the owner portal and the accountant's client page used to carry two copies
of the same item table, item dialog and insight panels. They are now one set of components driven by a
`BusinessScope` (`{kind:'business'}` or `{kind:'client', clientId}`), which maps onto the two URL families
the backend already exposed.

## Backend structure

Package-by-feature under `com.venture`, each with controller → service → repository (plain `JdbcTemplate`
SQL, no ORM — it is the same SQL as before).

```
common/          ApiException, JSON error handler, ItemStatus (status/day maths)
config/          typed properties, SQLite DataSource, web config + SPA hosting, body-size limits
security/        session cookies, password hashing, invite tokens, AccessRules, auth interceptor
db/              schema creation + in-place migrations (same as the old db.js)
auth/ user/ account/ business/ compliance/ activity/ notifications/ dashboard/ export/ health/
suggestions/ schemes/ sustainability/ ai/ assistant/ portal/
```

* **Access control lives in one table**, `security/AccessRules.java` (`/api/clients/**` → accountant,
  `/api/business/**` → owner, …). Controllers contain no role checks.
* **Business scoping lives in one class**, `BusinessResolver` — the single place deciding which business a
  request may touch (accountants must own the id in the URL; owners are resolved from their own login and
  never name a business). Every business-scoped controller uses it, and the same handler serves both
  `/api/clients/{id}/…` and `/api/business/…`.
* Rule engines (`SuggestionEngine`, `HealthSummaryCalculator`, `ComplianceInsightGenerator`) are pure
  functions with unit tests; the product-boundary wording is untouched.
* Existing passwords still work: hashes are scrypt in the same `salt:hash` format (BouncyCastle), covered by
  a test vector generated by the old Node code.
* The assistant's system prompt and tool declarations are loaded from `src/main/resources/assistant/`,
  extracted verbatim from the old source.

## What was verified, and what wasn't

**Frontend — exercised end to end.** I ran the new React app in a real browser against the *original* Node
server (same API contract the Java backend implements) and drove: owner sign-up → business setup → adding
items (including from an "Area to Review" prefill) → edit/delete → activity log → sustainability notes →
scheme discovery fallback → Ask Venture fast path → plan upgrade and CSV gating → notifications; and the
accountant path: sign-up → add client → add item → dashboard → Free-plan client limit → invite link →
activation in a second browser → owner portal → role guards → change password. No console errors.
`tsc --noEmit`, the production build and the unit tests pass.

**Backend — written carefully, but not compiled or run here, and the Gemini calls were never tested against the live API (the sandbox can't reach Google).** The sandbox I built this in cannot reach
Maven Central, so Spring Boot and the other dependencies couldn't be downloaded. What I could do was compile
all sources and tests with the JDK's `javac` without the libraries and confirm there are no errors in how my
own classes use each other (I checked the check works by injecting a deliberate mistake). That does *not*
cover Spring/Jackson API usage, so **please run `mvn test` and click through the app once** — if anything
fails to compile it will be a small, local fix. The riskiest spots are: Jackson handling of
`ComplianceItemRequest` (absent vs `null` certificate), and SQLite generated-key handling in `SqlSupport`.

## Small deliberate differences from the old code

Everything user-visible is the same, apart from these fixes of clear bugs and edge cases:

1. **Deleting a client now also removes its sustainability notes and its stored certificate files.** Before,
   a client with saved sustainability notes could not be deleted (foreign-key error) and files were orphaned.
2. **Certificate field:** after clicking *Remove* on an existing certificate it used to show both "No
   certificate uploaded" and "will be removed on save"; it now shows only the second.
3. **Oversized or malformed request bodies** return a JSON `413` / `400` on every route (some routes used to
   return a generic `500`).
4. The Gemini key is sent in an `x-goog-api-key` header rather than in the URL query string, so it can't end
   up in request logs.
5. Invite activation's response now includes `email`, like login and sign-up do.
6. Optional `SESSION_SECRET` (new) so sessions can survive restarts.
7. A request to an unknown `/api/clients/…`-style path while logged out now gets `401` rather than `404`.
