# Demo Backend Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused production-oriented backend and make the repository unambiguously run as a self-contained demonstration with local mock data.

**Architecture:** The Ant Design Pro application remains the only maintained runtime. Its existing API client continues to provide a clean UI/data boundary, while MSW handlers always serve the demo data in development, tests, and static deployments; no Java service, database, scheduler, third-party connector, or model gateway remains in the main repository.

**Tech Stack:** Umi Max, React, TypeScript, MSW, Vitest, Playwright

---

### Task 1: Remove the production backend

**Files:**
- Delete: `complaint-risk-service/`

- [x] **Step 1: Confirm the frontend owns the complete demo contract**

Run:

```bash
rg -n 'http\.(get|post|patch|put|delete)' ai-assistant-web/src/api/mock/handlers.ts
rg -n 'complaint-risk-service|YUNK_|Yunk|云客' --glob '!complaint-risk-service/**' .
```

Expected: the application endpoints are implemented by MSW; references outside the backend are presentation copy or obsolete integration documentation, not runtime imports.

- [x] **Step 2: Remove the backend as one recoverable unit**

Move `complaint-risk-service/` to a uniquely named folder in the current user's macOS Trash. This removes the Spring Boot application, Maven build, Docker Compose stack, H2 data, Flyway migrations, cloud chat connector, identity adapter, model gateway, scheduler, persistence repositories, security layer, audit/outbox code, and their tests without permanently destroying local uncommitted work.

- [x] **Step 3: Verify no tracked backend remains**

Run:

```bash
git status --short -- complaint-risk-service
test ! -e complaint-risk-service
```

Expected: Git reports deletions for the tracked service files and the directory no longer exists in the workspace.

### Task 2: Lock the web application to demo data

**Files:**
- Modify: `ai-assistant-web/src/app.tsx`
- Modify: `ai-assistant-web/src/api/client.ts`
- Modify: `ai-assistant-web/config/config.ts`
- Delete: `ai-assistant-web/.env.example`

- [x] **Step 1: Add tests for the demo request base**

Extend the URL helper tests with local-root, GitHub Pages subpath, and `index.html` cases. Expected request bases are respectively the origin, the project subpath, and the directory containing `index.html`.

- [x] **Step 2: Replace external API configuration with a page-derived base**

Add a small URL helper that derives the API base from `window.location.href`, and make `src/api/client.ts` use it. This keeps MSW requests inside the service worker's scope on both localhost and GitHub Pages without exposing a real-backend switch.

- [x] **Step 3: Always start the mock worker**

Remove the `DATA_MODE` branch from `src/app.tsx`. The render hook always starts the existing worker before rendering the application.

- [x] **Step 4: Remove dead build-time environment definitions**

Delete the `process.env.API_BASE_URL` and `process.env.DATA_MODE` definitions from `config/config.ts`, then delete `.env.example` because the demo no longer accepts backend credentials or endpoints.

- [x] **Step 5: Run focused tests**

Run:

```bash
corepack pnpm vitest run src/api/mock/serviceWorkerUrl.test.ts
corepack pnpm typecheck
```

Expected: all URL helper tests pass and TypeScript reports no errors.

### Task 3: Align deployment and documentation

**Files:**
- Modify: `.github/workflows/pages.yml`
- Modify: `ai-assistant-web/README.md`

- [x] **Step 1: Remove obsolete deployment variables**

Delete `DATA_MODE` and `API_BASE_URL` from the GitHub Pages build step. The application infers the project subpath at runtime.

- [x] **Step 2: Describe the actual Demo architecture**

Replace the backend-integration section with a concise statement that all data is local simulated data, refresh resets in-memory mutations, and no backend or external system is required.

- [x] **Step 3: Verify the complete application**

Run:

```bash
corepack pnpm test
corepack pnpm build
```

Expected: the Vitest suite passes and the production static bundle builds successfully.

- [x] **Step 4: Review scope**

Run:

```bash
git diff --stat
git status --short
rg -n 'DATA_MODE|API_BASE_URL|complaint-risk-service|YUNK_|Yunk' --glob '!docs/superpowers/plans/**' .
```

Expected: only the intended backend deletions and Demo-mode alignment are new; existing user changes remain present; no runtime backend switch or server-side cloud connector remains.
