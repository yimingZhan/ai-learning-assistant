# Complaint Risk Safe Rollback Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the complaint-risk experience to the repository baseline that existed before the current feature change without discarding later Demo-only architecture work or any unrelated uncommitted files.

**Architecture:** Freeze the running processes, create a durable Git stash containing the entire mixed working tree, then restore only the complaint-risk files changed in this feature. Preserve the later Demo backend-removal changes, and reverse only the complaint-risk API hunk in the one overlapping client file.

**Tech Stack:** Git, Umi Max, React, TypeScript, Vitest

---

### Task 1: Capture a recoverable snapshot

**Files:**
- Preserve: every tracked and untracked working-tree file

- [x] **Step 1: Stop the local frontend and backend processes**

Stop the two existing development sessions so generated files and database state cannot change during the snapshot.

- [x] **Step 2: Create and retain a full safety stash**

Run:

```bash
git stash push --include-untracked -m "safety-before-complaint-risk-rollback-2026-08-14"
git stash apply stash@{0}
```

Expected: the mixed working tree is restored, while `stash@{0}` remains available as a full recovery point.

### Task 2: Revert only the complaint-risk feature

**Files:**
- Restore: `ai-assistant-web/e2e/assistant.spec.ts`
- Restore: `ai-assistant-web/src/api/mock/complaintRiskConfig.test.ts`
- Restore: `ai-assistant-web/src/api/mock/complaintRiskConfig.ts`
- Restore: `ai-assistant-web/src/api/mock/data.ts`
- Restore: `ai-assistant-web/src/api/mock/handlers.ts`
- Restore: `ai-assistant-web/src/pages/AIConfig/ComplaintRisk/index.tsx`
- Restore: `ai-assistant-web/src/pages/AIConfig/ComplaintRisk/meta.ts`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentSelector.styles.ts`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/StudentSelector.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/index.test.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/index.tsx`
- Restore: `ai-assistant-web/src/pages/Quality/Conversation/riskData.ts`
- Patch selectively: `ai-assistant-web/src/api/client.ts`

- [x] **Step 1: Restore non-overlapping complaint-risk files from `HEAD`**

Use `git restore --source=HEAD -- <explicit file list>` with only the files listed above. Do not restore the repository root, deployment files, Service Worker files, or the removed backend.

- [x] **Step 2: Reverse only the complaint-risk API client hunk**

Remove the added event read/resolve APIs and restore the former no-argument student list request while retaining the later page-derived Demo API base.

### Task 3: Verify scope and application health

**Files:**
- Test: `ai-assistant-web/src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `ai-assistant-web/src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Test: `ai-assistant-web/src/pages/Quality/Conversation/index.test.tsx`

- [x] **Step 1: Confirm unrelated work remains**

Run `git status --short` and verify the Demo backend deletion, deployment changes, Service Worker changes, documentation, data, and both rollback/removal plans remain present.

- [x] **Step 2: Run the frontend suite and build checks**

Run:

```bash
corepack pnpm test
corepack pnpm typecheck
corepack pnpm build
```

Expected: all unit tests pass, TypeScript reports no errors, and the static production build succeeds.

- [x] **Step 3: Confirm recovery point**

Run `git stash list` and verify `safety-before-complaint-risk-rollback-2026-08-14` remains available.
