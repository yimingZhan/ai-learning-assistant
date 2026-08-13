# Student Renewal Fields Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the student-renewal filters and table to use the requested customer, organizational hierarchy, and current-advisor fields.

**Architecture:** Keep the existing Ant Design Pro table composition and route. Refine the typed fixture model and filter contract first, then update official-component renderers and the two existing end-to-end specifications so field names, ordering, and example values remain testable.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components 3, Vitest, Playwright

---

### Task 1: Refine the renewal data contract

**Files:**
- Modify: `src/pages/Renewal/Prediction/index.test.tsx`
- Modify: `src/pages/Renewal/Prediction/renewalData.ts`

- [x] **Step 1: Replace the old date/advisor assertions with the new contract**

```tsx
expect(filterRenewalStudents(renewalStudents, {
  renewalOpportunity: "high",
  recommendedProductType: "subject",
  grade: "12年级",
  currentProduct: "A-Level 数学进阶",
  currentAdvisor: "A1024",
})).toHaveLength(1);

expect(renewalStudents[0]).toMatchObject({
  customerNumber: "VA100213",
  grade: "12年级",
  businessUnit: "高端",
  courseSystem: "高端竞赛",
  courseItem: "高阶竞赛",
  currentAdvisor: { name: "周欣", employeeNumber: "A1024" },
});
```

- [x] **Step 2: Run the focused test and confirm the old model fails**

Run: `pnpm exec vitest run src/pages/Renewal/Prediction/index.test.tsx`

Expected: FAIL because customer number, organizational hierarchy, and current-advisor fields do not exist.

- [x] **Step 3: Update the model, options, fixture values, and filter**

Add `customerNumber`, `businessUnit`, `courseSystem`, `courseItem`, and `currentAdvisor: { name; employeeNumber }` to every record. Remove `studyDirection`, `targetCountry`, `advisor`, and `updatedAtRange`; expose a `currentAdvisor` filter keyed by employee number and grade options using `9年级` through `12年级` plus `大一`.

- [x] **Step 4: Run the focused test**

Run: `pnpm exec vitest run src/pages/Renewal/Prediction/index.test.tsx`

Expected: PASS.

### Task 2: Update the official-component page structure

**Files:**
- Modify: `src/pages/Renewal/Prediction/index.tsx`

- [x] **Step 1: Update the search form**

Rename `负责顾问 / 老师` to `当前跟进顾问`, bind it to `currentAdvisor`, and remove the `续费信息更新时间` date-range search column.

- [x] **Step 2: Update student and hierarchy columns**

Render the student cell as bold `林家宁（VA100213）` plus secondary `12年级`. Insert `事业部/课程体系/课程项` immediately after it and render `高端 / 高端竞赛 / 高阶竞赛`.

- [x] **Step 3: Add the current-advisor table cell and drawer fields**

Insert `当前跟进顾问` immediately after `续费信息更新时间` and render `周欣（A1024）`. Mirror student, hierarchy, and advisor fields in the existing Ant Design `Descriptions` drawer and increase horizontal scroll width for the additional columns.

### Task 3: Verify the new information architecture

**Files:**
- Modify: `e2e/renewal.spec.ts`
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: Update browser assertions**

Assert `当前跟进顾问` exists as a filter, the update-time filter is absent, both new table headers are visible, and the first row contains `林家宁（VA100213）`, `12年级`, `高端 / 高端竞赛 / 高阶竞赛`, and `周欣（A1024）` without the former study-direction text.

- [x] **Step 2: Run verification with the development server stopped**

Run: `pnpm typecheck && pnpm test && pnpm build`

Expected: all commands PASS.

- [x] **Step 3: Restart and inspect the live page**

Run the development service on port 8000, open `/renewal/prediction`, and confirm through a browser snapshot that all six filters and ten columns are rendered in the requested order.
