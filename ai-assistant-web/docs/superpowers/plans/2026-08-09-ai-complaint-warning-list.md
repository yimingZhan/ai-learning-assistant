# AI Complaint Warning List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rename the AI quality child menu to “AI 客诉预警” and replace its placeholder with a standard Ant Design warning-list page containing exactly the requested filters and columns.

**Architecture:** Keep the existing `/quality/conversation` route so existing links remain valid. Implement the page with `PageContainer` and `ProTable`, backed by a small typed in-memory data set and a pure filtering function so the mock list is interactive and testable without adding a new API surface.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components 3, Vitest, Testing Library, Playwright

---

### Task 1: Rename the quality child menu

**Files:**
- Modify: `src/locales/zh-CN/menu.ts`
- Modify: `e2e/assistant.spec.ts`

- [ ] **Step 1: Update the end-to-end expectation to the new menu label**

Replace the existing quality-menu assertion and click target with:

```ts
await page.getByText("AI 质检", { exact: true }).click();
await page.getByText("AI 客诉预警", { exact: true }).click();
await expect(page).toHaveURL(/\/quality\/conversation/);
await expect(page.getByRole("heading", { name: "AI 客诉预警" })).toBeVisible();
```

- [ ] **Step 2: Run the focused end-to-end test and verify it fails**

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: FAIL because the current menu is still named “AI 会话质检”.

- [ ] **Step 3: Rename the locale entry**

Change the child-menu translation to:

```ts
"menu.quality.conversation": "AI 客诉预警",
```

- [ ] **Step 4: Re-run the focused test after the page implementation**

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: PASS once Task 3 is complete.

### Task 2: Specify warning filtering behavior

**Files:**
- Create: `src/pages/Quality/Conversation/index.test.tsx`
- Modify: `src/pages/Quality/Conversation/index.tsx`

- [ ] **Step 1: Write failing unit tests for the exact filters**

Create tests that import `filterWarnings` and `complaintWarnings`, then assert customer name/number fuzzy matching, risk-level matching, multi-source matching, date-range inclusion, and multi-status matching:

```tsx
import { describe, expect, it } from "vitest";
import { complaintWarnings, filterWarnings } from ".";

describe("filterWarnings", () => {
  it("fuzzy-matches the customer name or number", () => {
    expect(filterWarnings(complaintWarnings, { customer: "林家" })).toHaveLength(1);
    expect(filterWarnings(complaintWarnings, { customer: "C1002" })).toHaveLength(1);
  });

  it("combines the requested select and date filters", () => {
    expect(
      filterWarnings(complaintWarnings, {
        riskLevel: "high",
        riskSources: ["wechat"],
        warningTime: ["2026-08-01", "2026-08-09"],
        statuses: ["pending", "processing"],
      }),
    ).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the unit test and verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx`

Expected: FAIL because the exports do not exist yet.

- [ ] **Step 3: Add typed records and the pure filter**

Define `RiskLevel`, `RiskSource`, `HandlingStatus`, `ComplaintWarning`, and `WarningFilters`, export a compact `complaintWarnings` fixture, and implement `filterWarnings` with case-insensitive customer matching, exact enum matching, inclusive date bounds, and OR semantics within each multi-select.

- [ ] **Step 4: Run the unit test and verify it passes**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS.

### Task 3: Build the standard Ant Design list page

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`
- Modify: `e2e/assistant.spec.ts`

- [ ] **Step 1: Replace the placeholder with PageContainer and ProTable**

Use `PageContainer` with title “AI 客诉预警” and one `ProTable`. Configure only these searchable fields: customer name/number text input, single risk-level select, multi risk-source select, warning date range, and multi handling-status select. Configure only these table columns: customer name/number, risk level, core risk, risk source, latest warning-risk time, owner, handling status, and action.

- [ ] **Step 2: Add restrained visual treatment**

Render enum values as Ant Design `Tag` components, use a link-style “详情” action, disable table settings/options, keep the search form expanded, and omit descriptions, statistics, toolbar buttons, alerts, and unrelated metadata.

- [ ] **Step 3: Make the detail action functional without inventing fields**

Open an Ant Design `Drawer` containing `Descriptions` for the same seven non-action list fields only. Do not add notes, history, scores, or any fields absent from the supplied structure.

- [ ] **Step 4: Add end-to-end assertions for page structure and filtering**

After navigation, assert the five filter labels, eight table headers, visible seed customer, and a customer query that narrows the visible rows.

- [ ] **Step 5: Run verification**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm test`

Expected: PASS for all Vitest suites.

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: PASS and the new list page is visible under the renamed menu.

Run: `pnpm build`

Expected: PASS and Umi produces the production bundle.

