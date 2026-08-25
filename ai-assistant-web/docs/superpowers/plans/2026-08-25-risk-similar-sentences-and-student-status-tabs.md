# Risk Similar Sentences and Student Status Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the semantic reference sentences matched by every complaint-risk event, and split the student selector into pending, resolved, and excluded status tabs.

**Architecture:** Extend the existing mock risk event and student summary models instead of introducing a parallel view model. Risk events carry `similarSentences`; student summaries carry an overall `status` derived from their event states, so the selector can filter without fetching every detail record. Keep rendering inside the existing Ant Design `Table`, `Descriptions`, and `Tabs` components.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Umi Max, Vitest, Testing Library, Playwright.

---

### Task 1: Extend risk event and student status data

**Files:**

- Modify: `src/pages/Quality/Conversation/riskData.ts`
- Modify: `src/api/mock/handlers.ts`
- Test: `src/pages/Quality/Conversation/index.test.tsx`
- Test: `src/api/complaintRisk.test.ts`

- [x] **Step 1: Write failing model tests**

Assert that every mock event has at least one semantic match sentence and that the six student summaries are grouped into five pending students, zero resolved students, and one excluded student.

```ts
expect(events.every((event) => event.similarSentences.length > 0)).toBe(true);
expect(
  riskStudents.filter((student) => student.status === "pending"),
).toHaveLength(5);
expect(
  riskStudents.filter((student) => student.status === "resolved"),
).toHaveLength(0);
expect(
  riskStudents.filter((student) => student.status === "excluded"),
).toHaveLength(1);
```

- [x] **Step 2: Run the model tests and verify they fail**

Run: `pnpm vitest run src/pages/Quality/Conversation/index.test.tsx src/api/complaintRisk.test.ts`

Expected: failures report missing `similarSentences` and missing student `status`.

- [x] **Step 3: Add the model fields and derive terminal status**

Add these properties to the existing domain types.

```ts
status: RiskEventStatus;
similarSentences: string[];
```

Use the configured semantic examples as deterministic mock matches. When the last pending event is updated, derive the student status with this rule: any pending event means `pending`; all excluded events means `excluded`; otherwise the student is `resolved`.

```ts
function getStudentRiskStatus(events: RiskEvent[]): RiskEventStatus {
  if (events.some((event) => event.status === "pending")) return "pending";
  if (events.every((event) => event.status === "excluded")) return "excluded";
  return "resolved";
}
```

- [x] **Step 4: Run the model and API tests**

Run: `pnpm vitest run src/pages/Quality/Conversation/index.test.tsx src/api/complaintRisk.test.ts`

Expected: all selected tests pass, including status updates that move the student summary to the correct terminal status.

- [x] **Step 5: Commit the data model change**

```bash
git add src/pages/Quality/Conversation/riskData.ts src/pages/Quality/Conversation/index.test.tsx src/api/mock/handlers.ts src/api/complaintRisk.test.ts
git commit -m "feat: add complaint risk semantic matches"
```

### Task 2: Render matched similar sentences in the table and detail drawer

**Files:**

- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `e2e/assistant.spec.ts`

- [x] **Step 1: Write failing component assertions**

Add `命中相似句` to the expected table headers, assert that it follows `命中关键词`, and assert that the detail drawer contains the same field immediately after its keyword field.

```ts
expect(
  within(events).getByRole("columnheader", { name: "命中相似句" }),
).toBeTruthy();
expect(within(drawer).getByText("命中相似句", { exact: true })).toBeTruthy();
expect(
  within(drawer).getByText("这几天一直联系不上老师。", { exact: true }),
).toBeTruthy();
```

- [x] **Step 2: Run the detail component test and verify it fails**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: the new column header and drawer field are not found.

- [x] **Step 3: Add the Ant Design table column and description item**

Insert a fixed-width text column after the keyword column, use a two-line ellipsis and tooltip for long content, and add a two-column `Descriptions` item after keywords.

```tsx
{
  title: "命中相似句",
  key: "similarSentences",
  width: 240,
  render: (_, row) => (
    <Paragraph ellipsis={{ rows: 2, tooltip: row.event.similarSentences.join("；") }}>
      {row.event.similarSentences.join("；")}
    </Paragraph>
  ),
}
```

Increase the table horizontal scroll width from `1060` to `1300` so the existing columns retain their intended density.

- [x] **Step 4: Run the component and end-to-end assertions**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: the matched sentences appear in the list and detail drawer without removing existing keyword behavior.

- [x] **Step 5: Commit the risk detail UI change**

```bash
git add src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx e2e/assistant.spec.ts
git commit -m "feat: show matched similar sentences"
```

### Task 3: Replace student selector tabs with three processing states

**Files:**

- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Test: `src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Test: `e2e/assistant.spec.ts`

- [x] **Step 1: Write failing tab behavior tests**

Assert that the selector exposes only `待处理`, `已处理`, and `已排除`; pending remains the default; and the excluded tab selects 沈雨桐.

```ts
expect(screen.getByRole("tab", { name: "待处理（5）" })).toBeTruthy();
expect(screen.getByRole("tab", { name: "已处理（0）" })).toBeTruthy();
expect(screen.getByRole("tab", { name: "已排除（1）" })).toBeTruthy();
expect(screen.queryByRole("tab", { name: /全部/ })).toBeNull();
```

- [x] **Step 2: Run the selector test and verify it fails**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: the old all/closed tab labels are still present.

- [x] **Step 3: Filter directly by overall student risk status**

Replace `StudentProgressFilter` and its counts with the three event statuses, then render the three tabs in this order.

```tsx
items={[
  { key: "pending", label: `待处理（${selection.progressCounts.pending}）` },
  { key: "resolved", label: `已处理（${selection.progressCounts.resolved}）` },
  { key: "excluded", label: `已排除（${selection.progressCounts.excluded}）` },
]}
```

Render terminal student cards as `已处理` or `已排除` with Ant Design success/default tag colors.

- [x] **Step 4: Run selector and page tests**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx src/pages/Quality/Conversation/index.test.tsx`

Expected: all selector groups, empty states, page selection, and linked query filters pass.

- [x] **Step 5: Run the full verification suite**

Run: `pnpm test && pnpm typecheck && pnpm build`

Expected: all unit tests pass, TypeScript reports no errors, and the production bundle is generated under `dist`.

- [x] **Step 6: Commit the student selector change**

```bash
git add src/pages/Quality/Conversation/StudentSelector.tsx src/pages/Quality/Conversation/StudentSelector.test.tsx e2e/assistant.spec.ts docs/superpowers/plans/2026-08-25-risk-similar-sentences-and-student-status-tabs.md
git commit -m "feat: split complaint students by risk status"
```
