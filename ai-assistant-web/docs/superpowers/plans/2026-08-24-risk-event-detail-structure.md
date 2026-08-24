# 风险事件详情分区 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将风险事件详情收敛为“风险基本信息、AI 风险总结、来源证据”三个统一分区，仅展示用户指定的字段。

**Architecture:** 保留现有风险表格、状态操作和 Ant Design Drawer 边界，仅重构 `RiskEventDetails` 及 `EvidenceList`。基本信息和证据元信息使用 Ant Design `Descriptions`，总结与建议使用统一的纵向字段；移除证据数、群名和完整聊天二级抽屉。

**Tech Stack:** React 19、TypeScript、Ant Design 6、antd-style、Vitest、Testing Library

---

### Task 1: 固化三分区和动态审计字段

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

- [x] **Step 1: 增加三个可访问分区及字段归属断言**

```tsx
const basic = within(drawer).getByRole("region", { name: "风险基本信息" });
const summary = within(drawer).getByRole("region", { name: "AI风险总结" });
const evidence = within(drawer).getByRole("region", { name: "来源证据" });
expect(within(basic).getByText("命中关键词", { exact: true })).toBeTruthy();
expect(within(summary).getByText("风险总结", { exact: true })).toBeTruthy();
expect(within(evidence).getAllByText("关键风险原文", { exact: true })).toHaveLength(2);
expect(within(drawer).queryByText("证据数", { exact: true })).toBeNull();
```

- [x] **Step 2: 覆盖已处理与已排除的统一审计标签**

```tsx
expect(within(basic).getByText("处理人", { exact: true })).toBeTruthy();
expect(within(basic).getByText("处理时间", { exact: true })).toBeTruthy();
expect(within(basic).queryByText("排除人", { exact: true })).toBeNull();
```

- [x] **Step 3: 运行单元测试确认旧结构不满足断言**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，旧详情未提供三个分区，且仍展示证据数和排除人专用标签。

### Task 2: 重构详情内容和来源证据

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`

- [x] **Step 1: 将基本信息收敛到同一个 Descriptions**

```tsx
<section aria-label="风险基本信息">
  <Text strong>风险基本信息</Text>
  <Descriptions
    column={{ xs: 1, sm: 2 }}
    items={[
      { key: "date", label: "风险日期", children: date },
      { key: "type", label: "风险类型", children: event.riskType },
      { key: "level", label: "风险等级", children: levelTag },
      { key: "status", label: "处理状态", children: statusTag },
      { key: "keywords", label: "命中关键词", span: 2, children: keywordTags },
      ...auditItems,
    ]}
  />
</section>
```

- [x] **Step 2: 将 AI 结果收敛为总结和处理建议两个字段**

```tsx
<section aria-label="AI风险总结">
  <Text strong>AI风险总结</Text>
  <div><Text type="secondary">风险总结</Text><Paragraph>{event.riskSummary}</Paragraph></div>
  <div><Text type="secondary">处理建议</Text><Paragraph>{event.handlingSuggestion}</Paragraph></div>
</section>
```

- [x] **Step 3: 证据项仅保留关键原文与三项原文信息**

```tsx
<Descriptions
  column={{ xs: 1, sm: 3 }}
  items={[
    { key: "source", label: "原文渠道", children: evidenceSourceMeta[evidence.sourceType].label },
    { key: "employees", label: "沟通员工", children: formatEmployees(evidence.employees) },
    { key: "time", label: "沟通时间", children: getEvidenceCommunicationAt(evidence) },
  ]}
/>
```

- [x] **Step 4: 删除不再可达的完整聊天状态、组件、图标和样式**

```tsx
<EvidenceList event={event} />
```

- [x] **Step 5: 运行组件测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: PASS，三个分区及待处理/已处理/已排除字段均符合要求。

### Task 3: 完整验证

**Files:**
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `src/pages/Quality/Conversation/index.test.tsx`

- [x] **Step 1: 运行客诉风险相关测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

- [x] **Step 2: 运行类型检查**

Run: `pnpm typecheck`

Expected: PASS，无 TypeScript 错误。

- [x] **Step 3: 运行生产构建**

Run: `pnpm build`

Expected: PASS，详情抽屉可正常打包。
