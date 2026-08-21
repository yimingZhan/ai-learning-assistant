# 学生处理状态 Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI 客诉预警的学生列表顶部增加“全部 / 待处理 / 已闭环”切换，并让学生卡片显示一致的处理进度标签。

**Architecture:** 处理进度由 `RiskStudent.pendingRiskCount` 派生，不增加可手工维护的学生状态字段。`useRiskStudentSelection` 先应用现有查询条件，再计算三个 Tabs 的互斥数量并过滤列表；切换 Tab 时重置分页和当前学生选择。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Vitest、Testing Library

---

### Task 1: 用测试固化学生分组交互

**Files:**
- Test: `src/pages/Quality/Conversation/StudentSelector.test.tsx`

- [ ] **Step 1: 增加默认待处理和分组数量测试**

```tsx
expect(screen.getByRole("tab", { name: "全部（6）" })).toBeTruthy();
expect(screen.getByRole("tab", { name: "待处理（5）" })).toHaveAttribute(
  "aria-selected",
  "true",
);
expect(screen.getByRole("tab", { name: "已闭环（1）" })).toBeTruthy();
expect(screen.queryByRole("option", { name: /沈雨桐/ })).toBeNull();
```

- [ ] **Step 2: 增加切换已闭环与卡片标签测试**

```tsx
fireEvent.click(screen.getByRole("tab", { name: "已闭环（1）" }));
const closedCard = await screen.findByRole("option", { name: /沈雨桐/ });
expect(within(closedCard).getByText("已全部闭环", { exact: true })).toBeTruthy();
expect(screen.queryByRole("option", { name: /林家宁/ })).toBeNull();
```

- [ ] **Step 3: 运行定向测试并确认失败**

Run: `pnpm test -- src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: FAIL，因为学生列表尚未渲染状态 Tabs 和新标签。

### Task 2: 实现派生分组与卡片状态

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.styles.ts`
- Test: `src/pages/Quality/Conversation/StudentSelector.test.tsx`

- [ ] **Step 1: 在选择 Hook 中增加处理进度状态**

```tsx
export type StudentProgressFilter = "all" | "pending" | "closed";

const [progress, setProgressState] = useState<StudentProgressFilter>("pending");
const filteredStudents = useMemo(
  () => filterRiskStudents(records, filters),
  [filters, records],
);
const progressCounts = useMemo(
  () => ({
    all: filteredStudents.length,
    pending: filteredStudents.filter((student) => student.pendingRiskCount > 0).length,
    closed: filteredStudents.filter((student) => student.pendingRiskCount === 0).length,
  }),
  [filteredStudents],
);
```

- [ ] **Step 2: 用 Ant Design Tabs 渲染分组入口**

```tsx
<Tabs
  className={styles.progressTabs}
  size="small"
  activeKey={selection.progress}
  onChange={(key) => selection.applyProgress(key as StudentProgressFilter)}
  items={[
    { key: "all", label: `全部（${selection.progressCounts.all}）` },
    { key: "pending", label: `待处理（${selection.progressCounts.pending}）` },
    { key: "closed", label: `已闭环（${selection.progressCounts.closed}）` },
  ]}
/>
```

- [ ] **Step 3: 让卡片标签与分组口径一致**

```tsx
{student.pendingRiskCount > 0 ? (
  <Tag color="processing">有待处理风险 · {student.pendingRiskCount}</Tag>
) : (
  <Tag color="success">已全部闭环</Tag>
)}
```

- [ ] **Step 4: 重跑定向测试**

Run: `pnpm test -- src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: PASS。

- [ ] **Step 5: 运行页面测试和类型检查**

Run: `pnpm test -- src/pages/Quality/Conversation`

Expected: PASS。

Run: `pnpm typecheck`

Expected: PASS。
