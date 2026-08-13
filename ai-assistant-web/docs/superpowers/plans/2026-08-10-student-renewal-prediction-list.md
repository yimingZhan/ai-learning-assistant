# Student Renewal Prediction List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the student-renewal placeholder with an interactive Ant Design Pro list page that implements the supplied filters, columns, pagination, and detail action.

**Architecture:** Keep the existing `/renewal/prediction` route. Store typed mock records, filter metadata, and a pure filter function in `renewalData.ts`; render the page with the same official `PageContainer + ProTable` composition used by AI complaint warning; open an Ant Design `Drawer` from the row action without introducing fields outside the supplied information architecture.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components 3, Vitest, Testing Library, Playwright

---

### Task 1: Specify and implement renewal filtering

**Files:**
- Create: `src/pages/Renewal/Prediction/renewalData.ts`
- Create: `src/pages/Renewal/Prediction/index.test.tsx`

- [x] **Step 1: Write the filtering tests**

Cover fuzzy student-name/phone search and a combined query containing opportunity, recommended-product type, grade, current product, advisor, and an inclusive update-date range:

```tsx
expect(filterRenewalStudents(renewalStudents, { studentSearch: "林家" })).toHaveLength(1);
expect(filterRenewalStudents(renewalStudents, { studentSearch: "2036" })).toHaveLength(1);
expect(filterRenewalStudents(renewalStudents, {
  renewalOpportunity: "high",
  recommendedProductType: "subject",
  grade: "高二",
  currentProduct: "A-Level 数学进阶",
  advisor: "周欣",
  updatedAtRange: ["2026-08-01", "2026-08-10"],
})).toHaveLength(1);
```

- [x] **Step 2: Run the focused test and confirm the missing module fails**

Run: `pnpm exec vitest run src/pages/Renewal/Prediction/index.test.tsx`

Expected: FAIL because `renewalData.ts` does not exist.

- [x] **Step 3: Add the typed data model and pure filter**

Define `RenewalOpportunity`, `RecommendedProductType`, `RenewalStudent`, and `RenewalStudentFilters`; export option metadata and a representative multi-row `renewalStudents` fixture. Implement case-insensitive name/phone matching, exact enum/grade/advisor matching, current-product membership, and inclusive ISO-date bounds.

- [x] **Step 4: Run the focused test**

Run: `pnpm exec vitest run src/pages/Renewal/Prediction/index.test.tsx`

Expected: PASS.

### Task 2: Build the Ant Design Pro list page

**Files:**
- Modify: `src/pages/Renewal/Prediction/index.tsx`

- [x] **Step 1: Replace the placeholder with the official list-page composition**

Use `PageContainer` titled `学生续费预测` and `ProTable` titled `学生续费列表`. Configure the expanded four-column search form with `学生搜索`, `续费机会`, `推荐产品类型`, `学生年级`, `当前学习产品`, `负责顾问 / 老师`, and `续费信息更新时间`.

- [x] **Step 2: Add only the requested list columns**

Render `学生信息`, `当前学习产品`, `续费机会`, `AI 续费建议`, `推荐方向`, `推荐产品`, `续费信息更新时间`, and `操作`. Use only official Ant Design components (`Space`, `Typography`, `Tag`, `Button`) for cell treatments.

- [x] **Step 3: Implement pagination and the detail action**

Pass filtered records through the same request/pagination flow as AI complaint warning. Open an official `Drawer` with `Descriptions` for the selected row and close it through the standard close affordance.

### Task 3: Verify behavior and visual parity

**Files:**
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: Replace the renewal placeholder assertion**

Assert the seven search labels, eight table headers, a seeded student, student search narrowing, and the row-level `查看详情` drawer action.

- [x] **Step 2: Run automated verification**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm test`

Expected: PASS for all Vitest suites.

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: PASS with the list visible at `/renewal/prediction`.

Run: `pnpm build`

Expected: PASS and a production bundle is generated.

- [x] **Step 3: Capture and inspect the desktop page**

Open `/renewal/prediction` at 1440px width, capture a screenshot, and verify that the search card, table card, horizontal overflow, tags, row density, and drawer match the AI complaint warning page conventions.
