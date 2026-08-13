# AI 续费三栏工作台 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将续费机会与学生条件诊断合并为一个可筛选、可深链、响应式的三栏工作台，并让 AI 助手基于当前学生及当前关注项提供有依据的行动建议。

**Architecture:** `/renewal/opportunities` 负责机会列表、学生选择、诊断加载与嵌入式 AI 上下文；学生列表和诊断内容拆成聚焦组件，证据继续通过标准 Drawer 展示。`/renewal/diagnosis` 保留为兼容入口并将查询参数转发到新工作台。现有规则引擎和产品匹配接口保持不变，只扩展 AI 查询上下文的可选关注项。

**Tech Stack:** React 19、TypeScript、Umi Max、Ant Design 6、Ant Design Pro、Ant Design X、Vitest、Playwright

---

### Task 1: Lock workbench behaviors with tests

**Files:**
- Modify: `src/pages/Renewal/Opportunities/index.test.ts`
- Modify: `src/api/mock/data.test.ts`
- Modify: `e2e/renewal.spec.ts`

- [ ] **Step 1: Add unit coverage for list filtering and focused renewal AI responses**

Add assertions that opportunity and pending tabs stay separate, and that renewal assistant output uses the four-part structure `结论 / 依据 / 建议动作 / 需人工确认`, including sources and no renewal probability.

- [ ] **Step 2: Add browser coverage for the merged route**

Assert that selecting `王若曦` updates the middle diagnosis, opens evidence, and scopes the embedded assistant; assert that `/renewal/diagnosis?studentId=renewal-student-003` lands on `/renewal/opportunities?studentId=renewal-student-003`.

- [ ] **Step 3: Run the tests and confirm they fail before implementation**

Run:

```bash
pnpm vitest run src/pages/Renewal/Opportunities/index.test.ts src/api/mock/data.test.ts
pnpm playwright test e2e/renewal.spec.ts
```

Expected: new workbench and structured assistant assertions fail against the existing table-plus-detail implementation.

### Task 2: Build the workbench presentation components

**Files:**
- Create: `src/pages/Renewal/Opportunities/index.styles.ts`
- Create: `src/pages/Renewal/Opportunities/RenewalStudentList.tsx`
- Create: `src/pages/Renewal/Opportunities/RenewalDiagnosisPanel.tsx`
- Create: `src/pages/Renewal/Opportunities/RenewalAssistantIntro.tsx`
- Create: `src/features/renewal/RenewalEvidenceDrawer.tsx`

- [ ] **Step 1: Implement the selectable student list**

Render Ant Design Tabs and semantic buttons for `可跟进` and `待补信息`; each row shows student, grade, owner, priority, primary trigger, and first relevant condition. Keep current selection visible without relying on color alone.

- [ ] **Step 2: Implement the vertical diagnosis panel**

Render student facts, missing-data warning, actionable conditions, up to three product recommendations, collapsed covered conditions, and evidence actions. Each condition and product receives a stable DOM anchor so AI focus actions can locate it.

- [ ] **Step 3: Extract the existing evidence drawer**

Move condition evidence, current coverage, recommendation, filtered-product reason, dates, and amounts into one reusable Ant Design Drawer used by the merged workbench.

- [ ] **Step 4: Implement the assistant action brief**

Show a source-labelled `本次建议` with a priority action, communication focus, and missing prerequisite. Each available item calls the workbench focus handler and scrolls to the corresponding middle-panel anchor.

### Task 3: Orchestrate data, selection, filters, and responsive layout

**Files:**
- Modify: `src/pages/Renewal/Opportunities/index.tsx`
- Modify: `src/features/renewal/page.styles.ts`

- [ ] **Step 1: Load opportunity and selected-student diagnosis data**

Use the existing `listOpportunities`, `getStudentDiagnosis`, and `runDiagnosis` methods. Select the query-string student when valid, otherwise select the first visible item. Keep selection synchronized with `studentId` in the URL.

- [ ] **Step 2: Add the compact filter toolbar**

Support keyword, grade, owner, priority, condition category, and trigger type using existing filter metadata. Reset returns every field to its empty value without changing the active tab.

- [ ] **Step 3: Register an embedded assistant surface**

At the desktop XL breakpoint show Ant Design Splitter panels sized `280 / flexible / 360`; at LG show list and detail with AI in a Drawer; below LG show detail with list and AI Drawers. Preserve selected-student context at all breakpoints.

- [ ] **Step 4: Preserve recalculation behavior**

Page-level recalculation refreshes opportunities and the selected diagnosis; student-level recalculation refreshes only the current diagnosis and reports success using the existing messages.

### Task 4: Extend focused AI context and route compatibility

**Files:**
- Modify: `src/api/contracts.ts`
- Modify: `src/features/globalToolbar/GlobalToolbarProvider.tsx`
- Modify: `src/features/globalToolbar/GlobalAssistantPanel.tsx`
- Modify: `src/features/assistant/CompactAssistantPanel.tsx`
- Modify: `src/pages/Renewal/Diagnosis/index.tsx`
- Modify: `config/routes.ts`
- Modify: `src/api/mock/data.ts`

- [ ] **Step 1: Extend renewal context with optional focus**

Use this compatible shape without changing existing callers:

```ts
type RenewalAssistantFocus =
  | { type: "condition"; id: string; label: string }
  | { type: "product"; id: string; label: string };

type RenewalQueryContext = {
  kind: "renewal";
  studentId: string;
  focus?: RenewalAssistantFocus;
};
```

- [ ] **Step 2: Add assistant empty-state composition**

Allow `CompactAssistantPanel` to receive an optional empty-state intro and custom placeholder, while retaining prompts, history, streaming, copying, feedback, and sources.

- [ ] **Step 3: Structure mock renewal assistant answers**

Return markdown with `结论`, `依据`, `建议动作`, and `需人工确认`; branch for explanation, product comparison, missing information, communication draft, and step-by-step follow-up. Always include rule and evidence sources and state that the result does not represent renewal probability.

- [ ] **Step 4: Redirect the legacy detail route**

Replace the old detail component with a compatibility redirect that preserves `studentId`; hide the diagnosis route from the menu while keeping it addressable.

### Task 5: Verify quality and visual behavior

**Files:**
- Verify: all files above

- [ ] **Step 1: Run static and unit checks**

```bash
pnpm typecheck
pnpm test
```

Expected: both commands exit with code 0.

- [ ] **Step 2: Run renewal browser tests**

```bash
pnpm playwright test e2e/renewal.spec.ts
```

Expected: merged workbench, AI, legacy links, and three viewport tests pass.

- [ ] **Step 3: Capture and inspect desktop, medium, and narrow screenshots**

Use widths `1680`, `1024`, and `768`; verify no page-level horizontal overflow, the selected student is understandable without color, drawers replace unavailable columns, and evidence/source timestamps remain visible.

- [ ] **Step 4: Review the completed diff**

Confirm no unrelated files changed, no destructive operations were used, and no implementation introduces renewal probability, purchasing-power inference, or automatic business-state mutation.
