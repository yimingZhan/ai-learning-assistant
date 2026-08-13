# AI 客诉预警风险数量与处理建议 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 AI 客诉预警的学生卡片上显示风险事件数量，并在详情的 AI 风险分析中增加处理建议。

**Architecture:** 继续使用现有 `RiskStudent` 中的 `riskEventCount` 渲染 Ant Design `Tag`；在 `RiskStudentDetail` 模型中新增学生级处理建议，由风险详情数据提供并由 `AnalysisSection` 统一展示。不改变风险计算、筛选、排序和事件级 AI 建议。

**Tech Stack:** React 19、TypeScript、Ant Design 6、Vitest、Testing Library

---

### Task 1: 学生卡片风险事件数量标签

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Test: `src/pages/Quality/Conversation/StudentSelector.test.tsx`

- [ ] **Step 1: 写一个失败的卡片展示测试**

在林家宁卡片的断言中加入：

```tsx
expect(within(linCard).getByText("风险事件 5", { exact: true })).toBeTruthy();
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `pnpm test -- src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: FAIL，提示找不到“风险事件 5”。

- [ ] **Step 3: 使用 Ant Design Tag 渲染数量**

将卡片右侧标签改为紧凑的水平标签组：

```tsx
<Space size={4} wrap>
  <Tag>风险事件 {student.riskEventCount}</Tag>
  <Tag color={riskMeta.color}>{riskMeta.label}</Tag>
</Space>
```

- [ ] **Step 4: 重跑定向测试**

Run: `pnpm test -- src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: PASS。

### Task 2: AI 风险分析处理建议

**Files:**
- Modify: `src/pages/Quality/Conversation/riskData.ts`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `src/pages/Quality/Conversation/index.test.tsx`

- [ ] **Step 1: 写失败的概览展示与数据完整性测试**

在详情组件测试中断言“处理建议”和对应文本位于 `risk-overview` 内，并在详情数据循环中断言：

```ts
expect(detail.handlingSuggestion.trim().length).toBeGreaterThan(0);
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `pnpm test -- src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx src/pages/Quality/Conversation/index.test.tsx`

Expected: FAIL，因 `handlingSuggestion` 尚未定义且页面未渲染处理建议。

- [ ] **Step 3: 增加详情字段和每名学生的建议数据**

在 `RiskStudentDetail` 中加入：

```ts
handlingSuggestion: string;
```

并在五条 `riskStudentDetailList` 数据中增加与风险主题一致、可执行的处理建议。

- [ ] **Step 4: 在 AI 风险分析中渲染建议**

在主要风险主题之后增加跨两列字段：

```tsx
{
  key: "handlingSuggestion",
  label: "处理建议",
  span: 2,
  children: detail.handlingSuggestion,
}
```

- [ ] **Step 5: 运行该页全部测试、类型检查和构建**

Run: `pnpm test -- src/pages/Quality/Conversation`

Expected: PASS。

Run: `pnpm typecheck`

Expected: PASS。

Run: `pnpm build`

Expected: PASS。
