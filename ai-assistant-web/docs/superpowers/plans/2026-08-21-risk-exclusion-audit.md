# 风险排除审计信息 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 用户确认排除风险后，记录排除人和排除时间，并在已排除风险卡片上直接展示。

**Architecture:** 延续已处理风险的事件审计模型，在 `RiskEvent` 上增加排除审计字段，Mock 状态更新层以当前登录用户和确认时刻写入，并追加操作日志。卡片根据终态展示对应的“处理”或“排除”信息，两个确认弹窗都提示当前账号。

**Tech Stack:** React、TypeScript、Ant Design、MSW Mock、Vitest、Testing Library。

---

### Task 1: 记录排除人、排除时间和操作日志

**Files:**
- Modify: `src/pages/Quality/Conversation/riskData.ts`
- Modify: `src/api/mock/handlers.ts`
- Test: `src/api/complaintRisk.test.ts`
- Test: `src/pages/Quality/Conversation/index.test.tsx`

- [x] **Step 1: Write the failing Mock tests**

在排除状态测试中断言事件和操作日志包含：

```ts
expect(excludedEvent).toMatchObject({
  status: "excluded",
  excludedBy: "周欣",
});
expect(excludedEvent?.excludedAt).toMatch(
  /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
);
expect(detail.operationLogs[0]).toMatchObject({
  category: "处理记录",
  eventId: "lin-event-refund-0809",
  operationType: "排除风险",
  operator: "周欣",
});
```

- [x] **Step 2: Run the test to verify it fails**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts src/pages/Quality/Conversation/index.test.tsx`

Expected: FAIL，因为排除审计字段尚未定义和写入。

- [x] **Step 3: Extend the event model and seed data**

```ts
export type RiskEvent = {
  id: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  status: RiskEventStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  excludedBy?: string;
  excludedAt?: string;
  riskSummary: string;
  handlingSuggestion: string;
  evidence: RiskEvidence[];
  keywords: string[];
};
```

为 `shen-event-follow-excluded` 增加固定的排除人“赵敏”和排除时间“2026-08-04 14:30:00”，并让 `createDetail` 为已处理、已排除两类终态生成初始操作记录。

- [x] **Step 4: Update the Mock transition**

确认排除时写入：

```ts
event.excludedBy = currentUser.name;
event.excludedAt = operatedAt;
detail.operationLogs.unshift({
  id: createId("complaint-risk-operation"),
  eventId: event.id,
  category: "处理记录",
  operationType: "排除风险",
  operator: currentUser.name,
  result: "success",
  operatedAt,
  remark: `${event.riskType}风险已排除`,
});
```

- [x] **Step 5: Run focused data tests**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

### Task 2: 在排除确认弹窗和风险卡片中展示审计信息

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

- [x] **Step 1: Write the failing component tests**

排除确认弹窗断言：

```tsx
expect(
  within(modal).getByText("系统将以当前账号“周欣”记录本次操作。"),
).toBeTruthy();
```

已排除卡片断言：

```tsx
expect(screen.getByText("排除人", { exact: true })).toBeTruthy();
expect(screen.getByText("排除时间", { exact: true })).toBeTruthy();
expect(screen.getByText("2026-08-09 12:30", { exact: true })).toBeTruthy();
```

- [x] **Step 2: Run the component test to verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，因为弹窗提示仅覆盖已处理，卡片也只渲染处理审计信息。

- [x] **Step 3: Render terminal-state audit metadata**

在 `TimelineEvent` 中按状态生成展示信息：

```ts
const auditMeta =
  event.status === "resolved" && event.resolvedBy && event.resolvedAt
    ? { actorLabel: "处理人", actor: event.resolvedBy, timeLabel: "处理时间", time: event.resolvedAt }
    : event.status === "excluded" && event.excludedBy && event.excludedAt
      ? { actorLabel: "排除人", actor: event.excludedBy, timeLabel: "排除时间", time: event.excludedAt }
      : undefined;
```

使用现有 `riskMetaItem` 信息行渲染 `auditMeta`，并将确认弹窗中的当前账号提示改为两种操作都显示。

- [x] **Step 4: Run complete verification**

Run: `pnpm exec vitest run src/api/complaintRisk.test.ts src/pages/Quality/Conversation`

Run: `pnpm exec tsc --noEmit --pretty false`

Run: `git diff --check -- src/api/mock/handlers.ts src/api/complaintRisk.test.ts src/pages/Quality/Conversation docs/superpowers/plans/2026-08-21-risk-exclusion-audit.md`

Expected: 所有相关测试、类型检查和差异检查通过。
