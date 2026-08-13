# ProTable Card Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Align the AI complaint-warning page with the official Ant Design Pro query-table card pattern and record the strict component-usage rule in project guidance.

**Architecture:** Keep `PageContainer` and `ProTable` as the only page-layout primitives. Restore the ProTable-provided table header, toolbar, and outlined search/table cards through official component props rather than custom wrappers or CSS.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components 3, Playwright, Markdown

---

### Task 1: Add a failing browser check for the standard card structure

**Files:**
- Modify: `e2e/assistant.spec.ts`

- [ ] **Step 1: Add assertions for the official ProTable card treatment**

Add these checks after navigating to the warning list:

```ts
await expect(page.getByText("AI 客诉预警列表", { exact: true })).toBeVisible();
await expect(page.locator(".ant-pro-table .ant-pro-card-border")).toHaveCount(2);
```

The first assertion requires a standard `headerTitle`; the second requires outlined ProTable cards for both search and table areas.

- [ ] **Step 2: Run the focused browser test and verify it fails**

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: FAIL because the current page disables the table toolbar/title and does not enable `cardBordered`.

### Task 2: Restore the official ProTable query-table presentation

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`

- [ ] **Step 1: Enable the official table card props**

Replace the toolbar-disabling props with the official ProTable card configuration:

```tsx
<ProTable<ComplaintWarning, WarningFilters>
  headerTitle="AI 客诉预警列表"
  cardBordered
  columns={columns}
  rowKey="id"
  dateFormatter="string"
  // retain the existing search, pagination, request, and scroll props
/>
```

Remove `options={false}` and `toolBarRender={false}` so ProTable supplies its standard toolbar controls. Do not introduce a custom Card, toolbar, grid, or stylesheet.

- [ ] **Step 2: Run type and browser verification**

Run: `pnpm typecheck`

Expected: PASS with no TypeScript errors.

Run: `pnpm exec playwright test e2e/assistant.spec.ts --grep "两组二级菜单"`

Expected: PASS with a search card and a titled table card.

### Task 3: Record the project-wide UI rule

**Files:**
- Create: `AGENTS.md`
- Modify: `README.md`

- [ ] **Step 1: Create project-level agent guidance**

Create `AGENTS.md` with this rule:

```md
# 项目开发指导

## UI 实现规范

- 一定要严格按照 Ant Design、Ant Design Pro 模板以及 Ant Design 的设计规范去使用组件，不要自己造组件，也不要按照自己的理解去写布局。
```

- [ ] **Step 2: Update the human-facing README**

Add the same UI implementation rule under a new “开发规范” heading and rename the documented menu from “AI 会话质检” to “AI 客诉预警”.

- [ ] **Step 3: Run complete regression verification**

Run: `pnpm test && pnpm test:e2e && pnpm build`

Expected: all unit tests, all browser tests, and the production build pass.

