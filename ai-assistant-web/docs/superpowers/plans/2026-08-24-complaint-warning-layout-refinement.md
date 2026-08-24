# 客诉预警标注布局调整 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按标注压缩客诉预警页的信息密度，使筛选区默认只占一行、学生摘要每行三项、风险统计同排无底色，并将风险表格分页恢复为标准尺寸。

**Architecture:** 保留现有 `StudentQueryBar`、`StudentRiskDetail` 与 Ant Design 组件边界，只调整 Pro QueryFilter 的官方折叠配置、Descriptions 响应式列数、统计区布局样式及 Table 分页参数。交互由现有表单和表格状态继续管理，不新增业务状态或自定义分页组件。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Ant Design Pro Components、antd-style、Vitest、Playwright

---

### Task 1: 固化标注要求的回归测试

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: 将筛选测试改为“默认折叠、可展开”**

```tsx
expect(formItemFor("风险事件时间")).toHaveClass("ant-form-item-hidden");
fireEvent.click(screen.getByRole("button", { name: /展\s*开/ }));
expect(formItemFor("风险事件时间")).not.toHaveClass("ant-form-item-hidden");
```

- [x] **Step 2: 让表格测试识别显式分页尺寸**

```tsx
const paginationSize = pagination?.size ?? (size === "small" ? "small" : "default");
<div className={`ant-pagination${paginationSize === "small" ? " ant-pagination-mini" : ""}`} />
```

- [x] **Step 3: 增加真实页面布局断言**

```ts
expect(summaryLayout.gradeTop).toBeCloseTo(summaryLayout.ownerTop, 0);
expect(summaryLayout.ownerTop).toBeCloseTo(summaryLayout.plannerTop, 0);
expect(statsLayout.levelTop).toBeCloseTo(statsLayout.typeTop, 0);
await expect(detail.locator(".ant-pagination")).not.toHaveClass(/ant-pagination-mini/);
```

- [x] **Step 4: 运行测试确认旧实现不能满足新断言**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，默认筛选仍全部展开且风险表格分页仍继承 `small` 尺寸。

### Task 2: 实现筛选区默认一行与自主展开

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.styles.ts`

- [x] **Step 1: 启用 QueryFilter 官方折叠行为**

```tsx
<QueryFilter<AdvancedFilters>
  defaultCollapsed
  showHiddenNum
  labelWidth="auto"
  span={{ xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 }}
>
```

- [x] **Step 2: 保持动作区与首行对齐**

```css
.ant-pro-query-filter-actions {
  white-space: nowrap;
}
```

- [x] **Step 3: 运行筛选组件测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: PASS，首行之外的筛选项初始隐藏，点击“展开”后六项均可操作。

### Task 3: 调整学生摘要、风险统计与表格分页

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`

- [x] **Step 1: 将学生摘要调整为大屏每行三项**

```tsx
<Descriptions column={{ xs: 1, sm: 2, lg: 3 }} />
```

- [x] **Step 2: 将两组风险统计放到同一行并移除底色块**

```css
.riskStats {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  align-items: flex-start;
}
```

- [x] **Step 3: 显式使用标准尺寸分页**

```tsx
pagination={{
  current: currentPage,
  pageSize: RISK_TABLE_PAGE_SIZE,
  size: "large",
  position: ["bottomRight"],
  showSizeChanger: false,
}}
```

- [x] **Step 4: 运行风险详情组件测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: PASS，表格分页不再使用 `ant-pagination-mini`。

### Task 4: 完整验证

**Files:**
- Test: `src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `e2e/assistant.spec.ts`

- [x] **Step 1: 运行客诉预警相关单元测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

- [x] **Step 2: 运行类型检查**

Run: `pnpm typecheck`

Expected: PASS，无 TypeScript 错误。

- [x] **Step 3: 运行客诉预警端到端测试**

Run: `pnpm playwright test e2e/assistant.spec.ts`

Expected: PASS，桌面端与窄屏均无页面级横向溢出。
