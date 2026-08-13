# Employee Complaint Risk List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an “员工客诉列表” page under AI 质检 that lets frontline managers compare employee-level complaint-risk counts and percentages, then open the matching students in AI 客诉预警.

**Architecture:** Register a new Umi route and render it with the repository’s official Ant Design Pro list-page composition: `PageContainer`, `ProCard`/`StatisticCard`, and `ProTable`. Keep typed mock profiles and pure aggregation/filtering helpers beside the page, deriving risk counts from the existing complaint-risk student records so list totals and drill-down results stay aligned.

**Tech Stack:** React 19, TypeScript, Umi Max 4, Ant Design 6, Ant Design Pro Components 3, Vitest, Playwright

---

### Task 1: Register the menu and route

**Files:**
- Modify: `config/routes.ts`
- Modify: `config/routes.test.ts`
- Modify: `src/locales/zh-CN/menu.ts`

- [x] Add `/quality/employee-complaints` as the second AI 质检 child route, pointing to `./Quality/EmployeeComplaints`.
- [x] Add `menu.quality.employeeComplaints: "员工客诉列表"` and assert the new route in the route test.
- [x] Run `pnpm exec vitest run config/routes.test.ts`; expect the route suite to pass.

### Task 2: Add typed employee-risk aggregation

**Files:**
- Create: `src/pages/Quality/EmployeeComplaints/employeeRiskData.ts`
- Create: `src/pages/Quality/EmployeeComplaints/index.test.tsx`

- [x] Define employee profiles with employee, group, and active-student counts, plus `7 | 30` day filters and high/medium/low risk aggregates.
- [x] Derive each employee’s period counts from `riskStudents`, de-duplicate by student id, calculate total and per-level rates against active students, and sort by high-risk count then total risk rate.
- [x] Test 7/30-day aggregation, group/employee/risk-level filtering, zero-risk rows, summary totals, percentage formatting, and complaint-warning drill-down URLs.
- [x] Run `pnpm exec vitest run src/pages/Quality/EmployeeComplaints/index.test.tsx`; expect all focused tests to pass.

### Task 3: Build the official list-template page

**Files:**
- Create: `src/pages/Quality/EmployeeComplaints/index.tsx`

- [x] Use `PageContainer` without custom page layout or stylesheet.
- [x] Render the six agreed overview metrics inside official `ProCard` and `StatisticCard` components: active students, all risk students, total rate, and high/medium/low counts.
- [x] Render a `ProTable` titled `员工客诉列表` with official expanded search form fields for 7/30 days, group, employee, and high/medium/low level.
- [x] Show employee, group, active students, total risk count/rate, and each level’s count/rate. Default to the last 7 days and sort by high-risk count, then total risk rate.
- [x] Make total/level metrics and the row action navigate to AI 客诉预警 with employee, period, and optional level query parameters.

### Task 4: Apply drill-down filters in AI 客诉预警

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.test.tsx`

- [x] Parse valid `owner`, `riskLevel`, and `period` query parameters on page entry.
- [x] Initialize the existing student selector with the linked employee as related person, the linked level, and an inclusive 7- or 30-day date range.
- [x] Test linked filter initialization and preserve the existing default 30-day behavior for direct visits.

### Task 5: Verify the complete flow

**Files:**
- Modify: `e2e/assistant.spec.ts`

- [x] Add a browser test that opens the new AI 质检 menu, verifies the standard ProTable search/table cards and agreed columns, switches the time period, and drills from an employee risk value into the matching AI 客诉预警 student list.
- [x] Run `pnpm typecheck`; expect no TypeScript errors.
- [x] Run `pnpm test`; expect all Vitest suites to pass.
- [x] Run the focused Playwright test; expect menu navigation and drill-down filtering to pass.
- [x] Run `pnpm build`; expect the production bundle to complete successfully.
