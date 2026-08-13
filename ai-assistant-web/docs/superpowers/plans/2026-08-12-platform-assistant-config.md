# Platform Assistant Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a versioned platform-assistant configuration center with capability management, role grants, structured response policies, permission-aware runtime prompts, trial runs, publishing, rollback, and audit visibility.

**Architecture:** Extend the existing typed API and MSW mock store with a draft/published configuration pair and immutable version snapshots. Add an Ant Design Pro configuration page that follows the established complaint-risk publishing workflow, then make assistant runtime initialization and message authorization consume the published configuration while business-data access remains enforced independently.

**Tech Stack:** React 19, TypeScript, Umi Max, Ant Design 6, Ant Design Pro Components, Ant Design X, MSW, Vitest, Playwright.

---

### Task 1: Contracts and mock configuration lifecycle

**Files:**
- Modify: `src/api/contracts.ts`
- Modify: `src/api/client.ts`
- Create: `src/api/mock/platformAssistantConfig.ts`
- Modify: `src/api/mock/data.ts`
- Modify: `src/api/mock/handlers.ts`

- [x] Add typed basic settings, capability definitions, role grants, response policy, runtime manifest, trial result, version, and audit-log contracts.
- [x] Add mock draft save, trial, publish, version-list, rollback, audit-list, and runtime endpoints.
- [x] Resolve the current user role on the server side and reject disabled or unauthorized capabilities without accepting a client-provided role.
- [x] Add focused contract/lifecycle tests and run `pnpm test -- src/api/mock/platformAssistantConfig.test.ts`.

### Task 2: Platform assistant configuration page

**Files:**
- Create: `src/pages/AIConfig/PlatformAssistant/index.tsx`
- Create: `src/pages/AIConfig/PlatformAssistant/index.styles.ts`
- Create: `src/pages/AIConfig/PlatformAssistant/index.test.tsx`
- Modify: `config/routes.ts`
- Modify: `src/locales/zh-CN/menu.ts`

- [x] Add the platform-assistant route as the first AI configuration child.
- [x] Build tabs for basic settings, capability management, role grants, response/safety policy, and audit logs using standard Ant Design Pro components.
- [x] Implement dirty state, validation, trial-run drawer, draft save, publish confirmation, version history, and rollback.
- [x] Verify permissions disable edit/publish/rollback controls independently.
- [x] Run `pnpm test -- src/pages/AIConfig/PlatformAssistant/index.test.tsx config/routes.test.ts`.

### Task 3: Runtime configuration integration

**Files:**
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/features/assistant/useAssistantChat.ts`
- Modify: `src/features/globalToolbar/GlobalAssistantPanel.tsx`
- Modify: `src/api/mock/handlers.ts`

- [x] Load the published runtime manifest and replace hard-coded assistant name, welcome copy, and recommended prompts.
- [x] Remove the client-supplied role from assistant message requests.
- [x] Route inferred requests to capability IDs, enforce role grants before data lookup, and return the configured forbidden/no-data/service messages.
- [x] Keep embedded complaint and renewal scopes compatible with their existing flows.
- [x] Run focused assistant and global-toolbar tests.

### Task 4: Verification

**Files:**
- Modify: `e2e/assistant.spec.ts`

- [x] Cover route visibility, configured prompt rendering, unauthorized capability handling, draft isolation, successful trial requirement, publish activation, and rollback.
- [x] Run `pnpm typecheck`, `pnpm test`, and `pnpm build`.
- [x] Run focused Playwright coverage for assistant configuration when the local browser environment is available.
