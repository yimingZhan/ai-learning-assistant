# 风险已处理审计信息 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户确认“已处理风险”后，使用当前登录账号记录处理人和实际处理时间，并在已处理风险卡片中展示。

**Architecture:** `RiskEvent` 保存与该事件直接相关的处理人和处理时间，Mock 状态更新层负责以可信的当前用户和确认时刻写入数据，同时向现有 `operationLogs` 追加审计记录。详情页从全局工具栏上下文读取当前用户用于确认提示，但不由页面提交或手动选择操作人。

**Tech Stack:** React、TypeScript、Ant Design、MSW Mock、Vitest、Testing Library。

---

### Task 1: 记录风险处理人、处理时间和操作日志

**Files:**
- Modify: `src/pages/Quality/Conversation/riskData.ts`
- Modify: `src/api/mock/handlers.ts`
- Test: `src/api/complaintRisk.test.ts`
- Test: `src/pages/Quality/Conversation/index.test.tsx`

- [x] **Step 1: Write the failing Mock workflow test**

在已处理状态测试中断言事件和操作日志均包含操作者与时间：

```ts
const resolvedEvent = response.detail.eventGroups
  .flatMap((group) => group.events)
  .find((event) => event.id === "lin-event-follow-0809");
expect(resolvedEvent).toMatchObject({
  status: "resolved",
  resolvedBy: "周欣",
});
expect(resolvedEvent?.resolvedAt).toMatch(
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
);
expect(response.detail.operationLogs[0]).toMatchObject({
  category: "处理记录",
  eventId: "lin-event-follow-0809",
  operationType: "标记风险为已处理",
  operator: "周欣",
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts`

Expected: FAIL，因为风险事件和操作日志尚未写入处理审计字段。

- [x] **Step 3: Add audit fields to the event and operation log models**

```ts
export type RiskEvent = {
  id: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  status: RiskEventStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  riskSummary: string;
  handlingSuggestion: string;
  evidence: RiskEvidence[];
  keywords: string[];
};

export type RiskOperationLog = {
  id: string;
  eventId?: string;
  category: "处理记录" | "系统识别" | "访问记录";
  operationType: string;
  operator: string;
  result: "success" | "error";
  operatedAt: string;
  remark: string;
};
```

为现有已处理 Mock 事件补齐固定的 `resolvedBy` 和 `resolvedAt`，并在 `createDetail` 中生成对应的初始处理记录。

- [x] **Step 4: Update the Mock state transition**

在 `status === "resolved"` 时使用 Mock 当前用户和确认时刻写入：

```ts
const operatedAt = currentTimestamp();
event.status = body.status;
if (body.status === "resolved") {
  event.resolvedBy = currentUser.name;
  event.resolvedAt = operatedAt;
  detail.operationLogs.unshift({
    id: createId("complaint-risk-operation"),
    eventId: event.id,
    category: "处理记录",
    operationType: "标记风险为已处理",
    operator: currentUser.name,
    result: "success",
    operatedAt,
    remark: `${event.riskType}风险已处理`,
  });
}
```

- [x] **Step 5: Run focused tests**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

### Task 2: 在确认弹窗提示当前账号并展示处理信息

**Files:**
- Modify: `src/pages/Quality/Conversation/index.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

- [x] **Step 1: Write the failing component tests**

确认弹窗测试传入 `operatorName="周欣"` 并断言：

```tsx
expect(
  within(modal).getByText("系统将以当前账号“周欣”记录本次操作。"),
).toBeTruthy();
```

已处理事件测试断言卡片中展示：

```tsx
expect(within(events).getByText("处理人")).toBeTruthy();
expect(within(events).getByText("处理时间")).toBeTruthy();
expect(within(events).getByText("2026-08-07 19:05")).toBeTruthy();
```

- [x] **Step 2: Run the component test to verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，因为弹窗提示和处理信息尚未渲染。

- [x] **Step 3: Pass the current operator from the global toolbar**

在页面中读取全局当前用户，并传给风险详情：

```tsx
const { currentUser } = useGlobalToolbar();

<StudentRiskDetail
  detail={detail}
  operatorName={currentUser?.name ?? "当前用户"}
  updatingEventId={updatingEventId}
  onUpdateEventStatus={updateEventStatus}
/>
```

- [x] **Step 4: Render the confirmation hint and resolved metadata**

在确认弹窗正文中增加：

```tsx
{!actionIsExcluded ? (
  <Paragraph>
    系统将以当前账号“{operatorName}”记录本次操作。
  </Paragraph>
) : null}
```

在风险卡片状态区域增加：

```tsx
{event.status === "resolved" && event.resolvedBy && event.resolvedAt ? (
  <>
    <div className={styles.riskMetaItem}>
      <Text type="secondary">处理人</Text>
      <Text>{event.resolvedBy}</Text>
    </div>
    <div className={styles.riskMetaItem}>
      <Text type="secondary">处理时间</Text>
      <Text>{event.resolvedAt.slice(0, 16)}</Text>
    </div>
  </>
) : null}
```

- [x] **Step 5: Run full verification**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts src/pages/Quality/Conversation`

Run: `pnpm exec tsc --noEmit --pretty false`

Run: `git diff --check -- src/api/mock/handlers.ts src/api/complaintRisk.test.ts src/pages/Quality/Conversation`

Expected: 全部测试、类型检查和差异检查通过。
