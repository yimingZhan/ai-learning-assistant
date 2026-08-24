# 风险事件批量处理 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让风险事件表格支持勾选多条待处理风险，并批量标记为已处理或批量排除。

**Architecture:** 使用 Ant Design Table `rowSelection` 提供标准多选列，已处理和已排除行禁止勾选；在表格上方增加紧凑的批量操作栏。单条与批量操作共用确认弹窗，页面层按顺序调用现有单条更新接口，逐次同步最新学生详情，最终只显示一条批量结果提示。

**Tech Stack:** React 19、TypeScript、Ant Design 6、antd-style、Vitest、Testing Library、Playwright

---

### Task 1: 固化批量选择与双操作流程

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

- [x] **Step 1: 扩展 Table mock 支持 `rowSelection`**

```tsx
rowSelection?: {
  selectedRowKeys?: React.Key[];
  onChange?: (keys: React.Key[], rows: Array<Record<string, unknown>>) => void;
  getCheckboxProps?: (row: Record<string, unknown>) => {
    disabled?: boolean;
    "aria-label"?: string;
  };
};
```

mock 中在每行前渲染受控 checkbox，点击时将新的 key 和已选行传给 `rowSelection.onChange`。

- [x] **Step 2: 增加待处理行可选、已处理行禁用的断言**

```tsx
expect(screen.getByRole("checkbox", {
  name: "选择风险 2026-08-09 跟进及时性",
})).not.toBeDisabled();
expect(screen.getByRole("checkbox", {
  name: "选择风险 2026-08-07 客诉",
})).toBeDisabled();
```

- [x] **Step 3: 分别覆盖批量已处理和批量排除**

```tsx
fireEvent.click(followCheckbox);
fireEvent.click(refundCheckbox);
fireEvent.click(screen.getByRole("button", { name: "批量标记已处理" }));
fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", {
  name: "确认已处理",
}));
await waitFor(() => expect(onUpdate).toHaveBeenCalledWith(
  ["lin-event-follow-0809", "lin-event-refund-0809"],
  "resolved",
));
```

批量排除使用同样的两行选择，断言提交 `excluded`。

- [x] **Step 4: 运行测试确认旧表格无批量功能**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，批量操作按钮与行 checkbox 不存在。

### Task 2: 实现表格选择、批量操作栏和共用确认弹窗

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`

- [x] **Step 1: 将待确认操作从单事件改为事件数组**

```tsx
type PendingStatusAction = {
  events: RiskEvent[];
  status: Exclude<RiskEventStatus, "pending">;
};
```

- [x] **Step 2: 为 Table 配置受控行选择**

```tsx
rowSelection={{
  selectedRowKeys: selectedEventIds,
  onChange: (keys) => onSelectedEventIdsChange(keys.map(String)),
  getCheckboxProps: (row) => ({
    disabled: row.event.status !== "pending" || updatingEventIds.length > 0,
    "aria-label": `选择风险 ${row.date} ${row.event.riskType}`,
  }),
  columnWidth: 48,
}}
```

- [x] **Step 3: 添加紧凑的批量操作栏**

```tsx
<div role="toolbar" aria-label="批量处理风险">
  <Text type="secondary">已选择 <Text strong>{selectedEvents.length}</Text> 项</Text>
  <Space>
    <Button disabled={!selectedEvents.length}>批量标记已处理</Button>
    <Button danger disabled={!selectedEvents.length}>批量排除风险</Button>
  </Space>
</div>
```

- [x] **Step 4: 让单条和批量操作共用 Modal**

```tsx
await onUpdateEventStatus(
  pendingAction.events.map((event) => event.id),
  pendingAction.status,
);
setSelectedEventIds((current) =>
  current.filter((id) => !pendingIds.has(id)),
);
```

单条操作保留现有标题；批量操作标题明确展示选中数量。

- [x] **Step 5: 为批量操作栏增加响应式样式**

```css
display: flex;
align-items: center;
justify-content: space-between;
gap: token.marginSM;
padding: token.paddingSM token.padding;
border: 1px solid token.colorBorderSecondary;
border-radius: token.borderRadius;
background: token.colorFillQuaternary;
```

窄屏下允许自然换行，按钮保持 Ant Design `small` 尺寸。

### Task 3: 在页面层顺序执行批量更新

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`

- [x] **Step 1: 将更新中状态扩展为 ID 数组**

```tsx
const [updatingEventIds, setUpdatingEventIds] = useState<string[]>([]);
```

- [x] **Step 2: 逐条更新并在每次响应后同步页面数据**

```tsx
for (const eventId of eventIds) {
  const response = await complaintRiskApi.updateEventStatus(
    selectedStudentId,
    eventId,
    status,
  );
  setDetail(response.detail);
  setRecords((current) => current.map((student) =>
    student.id === response.student.id ? response.student : student,
  ));
}
```

- [x] **Step 3: 根据单条/批量显示一条成功或失败提示**

```tsx
message.success(
  eventIds.length > 1
    ? `已批量${status === "excluded" ? "排除" : "标记已处理"} ${eventIds.length} 条风险`
    : status === "excluded" ? "风险已排除" : "风险已标记为已处理",
);
```

### Task 4: 回归验证

**Files:**
- Modify: `e2e/assistant.spec.ts`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`
- Test: `src/pages/Quality/Conversation/index.test.tsx`

- [x] **Step 1: 端到端测试勾选两条待处理风险并批量标记已处理**

```ts
await firstPendingCheckbox.check();
await secondPendingCheckbox.check();
await detail.getByRole("button", { name: "批量标记已处理" }).click();
await page.getByRole("dialog").getByRole("button", { name: "确认已处理" }).click();
await expect(detail.getByText("待处理", { exact: true })).toHaveCount(2);
```

- [x] **Step 2: 运行相关单元测试**

Run: `pnpm vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

- [x] **Step 3: 运行类型检查和生产构建**

Run: `pnpm typecheck && pnpm build`

Expected: PASS。

- [x] **Step 4: 运行客诉风险端到端测试**

Run: `pnpm playwright test e2e/assistant.spec.ts --grep "风险详情展示纯企微证据"`

Expected: PASS，批量处理后待处理数量和可操作行同步减少。
