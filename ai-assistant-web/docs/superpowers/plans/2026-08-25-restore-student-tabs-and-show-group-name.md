# Restore Student Tabs and Show Group Name Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the previous all/pending/handled student tabs and show the group-chat name in risk evidence metadata.

**Architecture:** Keep the student-level event status data introduced for API consistency, but make the selector use the previous presentation rule: students with pending risks are pending, and students with zero pending risks are handled. Extend the existing Ant Design `Descriptions` metadata only for `wechat_group` evidence, using the already-required `groupName` field without changing direct-chat evidence.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Umi Max, Vitest, Testing Library, Playwright.

---

### Task 1: Restore the previous student selector tabs

**Files:**

- Modify: `src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: Restore the previous tab assertions**

Assert that `全部（6）`, `待处理（5）`, and `已处理（1）` are the only tabs, that pending remains selected initially, and that 沈雨桐 appears in the handled tab with `已全部闭环`.

```ts
expect(screen.getByRole("tab", { name: "全部（6）" })).toBeTruthy();
expect(screen.getByRole("tab", { name: "待处理（5）" })).toBeTruthy();
expect(screen.getByRole("tab", { name: "已处理（1）" })).toBeTruthy();
expect(screen.queryByRole("tab", { name: /已排除/ })).toBeNull();
```

- [x] **Step 2: Verify the restored assertions fail**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: the old all/handled labels are missing and the excluded tab is still present.

- [x] **Step 3: Restore pending-count grouping**

Use the previous selector filter contract and derive groups from `pendingRiskCount`.

```ts
export type StudentProgressFilter = "all" | "pending" | "closed";

const progressCounts = {
  all: filteredStudents.length,
  pending: filteredStudents.filter((student) => student.pendingRiskCount > 0)
    .length,
  closed: filteredStudents.filter((student) => student.pendingRiskCount === 0)
    .length,
};
```

Render the tabs in all/pending/handled order and use `已全部闭环` for zero-pending student cards.

- [x] **Step 4: Run selector tests**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: all selector tests pass, including the six-student pagination path under `全部`.

### Task 2: Show group-chat name in evidence metadata

**Files:**

- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: Add a failing group-name assertion**

Assert that the evidence region contains one `群聊名称` label and the configured `林家宁服务沟通群` value, while the direct-chat item still has no group field.

```ts
expect(within(evidence).getByText("群聊名称", { exact: true })).toBeTruthy();
expect(
  within(evidence).getByText("林家宁服务沟通群", { exact: true }),
).toBeTruthy();
```

- [x] **Step 2: Verify the evidence test fails**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: `群聊名称` is not found in the evidence metadata.

- [x] **Step 3: Add the conditional Ant Design description item**

Use two columns for group evidence and preserve three columns for direct evidence.

```tsx
column={{ xs: 1, sm: evidence.sourceType === "wechat_group" ? 2 : 3 }}
items={[
  sourceItem,
  ...(evidence.sourceType === "wechat_group"
    ? [{ key: "groupName", label: "群聊名称", children: evidence.groupName }]
    : []),
  employeeItem,
  timeItem,
]}
```

- [x] **Step 4: Run focused and full verification**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: focused tests, all unit tests, TypeScript, and production build pass.

- [x] **Step 5: Verify the browser flows and deploy**

Run the two affected Playwright scenarios, inspect the live page after pushing `main`, and confirm the restored tabs plus group name are visible in the deployed build.
