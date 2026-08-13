# Risk Student List Fields Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the complaint-warning page fields with the specified risk-student filters, table columns, mock records, and matching detail view.

**Architecture:** Retain the existing standard `PageContainer` + `ProTable` query-table structure. Replace the page-local data model and pure filter with student-centric types while continuing to use schema-driven ProTable fields, Ant Design tags, and Ant Design descriptions without custom layout components.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components 3, Vitest, Playwright

---

### Task 1: Specify the new student filter behavior

**Files:**
- Modify: `src/pages/Quality/Conversation/index.test.tsx`

- [ ] **Step 1: Replace complaint-field tests with risk-student tests**

Use the new exports and verify student fuzzy search plus the exact five filters:

```tsx
import { describe, expect, it } from "vitest";
import { filterRiskStudents, riskStudents } from ".";

describe("filterRiskStudents", () => {
  it("按学生名称或编号模糊搜索", () => {
    expect(filterRiskStudents(riskStudents, { student: "林家" })).toHaveLength(1);
    expect(filterRiskStudents(riskStudents, { student: "S2026002" })).toHaveLength(1);
  });

  it("组合筛选等级、来源、时间和负责人", () => {
    expect(
      filterRiskStudents(riskStudents, {
        riskLevel: "high",
        riskSources: ["wechat"],
        eventTime: ["2026-08-01", "2026-08-09"],
        owner: "周欣",
      }),
    ).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx`

Expected: FAIL because `riskStudents` and `filterRiskStudents` do not exist.

### Task 2: Replace the page model and exact fields

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`

- [ ] **Step 1: Define the risk-student record and filter types**

Define `RiskStudent` with `studentName`, `studentNumber`, `riskLevel`, `coreRisk`, `riskEventCount`, `riskSources`, `latestRiskTime`, and `owner`. Define `RiskStudentFilters` with only `student`, `riskLevel`, `riskSources`, `eventTime`, and `owner`.

- [ ] **Step 2: Restrict risk sources and provide matching records**

Use only `wechat` and `phone` sources. Populate records that demonstrate “企微”, “电话”, and “企微+电话” display values, with core-risk text written as AI summaries and numeric event counts.

- [ ] **Step 3: Implement the five exact filter fields**

Configure ProTable search fields for “学生名称/编号”, “风险等级”, “风险来源”, “风险事件时间”, and “负责人”. Use a single select for risk level and owner, a multi-select for sources, and `dateRange` for event time.

- [ ] **Step 4: Implement the eight exact table columns**

Configure only “学生名称/编号”, “综合风险等级”, “核心风险”, “风险事件数”, “风险来源”, “最近风险时间”, “负责人”, and “操作”. Keep `headerTitle="风险学生列表"`, `cardBordered`, and the default ProTable toolbar.

- [ ] **Step 5: Align the detail drawer**

Show the same seven non-action fields in Ant Design `Descriptions`; remove processing status and all old customer-warning labels.

### Task 3: Update browser coverage and verify

**Files:**
- Modify: `e2e/assistant.spec.ts`

- [ ] **Step 1: Assert the new filters and table headers**

Replace old labels with the five filter labels and eight table headers from Task 2. Query `S2026002` through the student-name/number input and confirm only “陈子轩” remains.

- [ ] **Step 2: Run verification**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm test`

Expected: all Vitest tests pass.

Run: `pnpm test:e2e`

Expected: all Playwright tests pass.

Run: `pnpm build`

Expected: the production build succeeds.

