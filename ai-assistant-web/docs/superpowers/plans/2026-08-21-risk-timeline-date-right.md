# 风险时间线日期右置 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将风险详情时间线左侧日期移到每个风险日期分组的右上角，释放左侧宽度并保持日期清晰可见。

**Architecture:** 移除 Ant Design `Timeline` 的 `title`，使时间线恢复单侧布局并将轴线贴近内容左边。日期作为带日历图标的 Ant Design `Tag` 放进分组内容顶部，右对齐且保留明确的无障碍标签。

**Tech Stack:** React、TypeScript、Ant Design Timeline/Tag/Flex、antd-style、Vitest、Testing Library。

---

### Task 1: 调整风险日期分组布局

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.tsx`
- Modify: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.styles.ts`
- Test: `src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

- [x] **Step 1: Write the failing accessibility test**

在风险详情基础测试中断言日期作为右侧分组标签存在：

```tsx
expect(
  within(events).getByLabelText("风险日期 2026-08-09"),
).toBeTruthy();
```

- [x] **Step 2: Run the component test to verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Expected: FAIL，因为现有日期只作为时间线左侧标题显示，没有“风险日期”标签。

- [x] **Step 3: Move the date into the timeline content**

删除时间线条目的 `title`，在每个分组内容顶部增加右对齐日期标签：

```tsx
content: (
  <div className={styles.timelineGroup}>
    <Flex className={styles.timelineDateRow} justify="flex-end">
      <Tag
        aria-label={`风险日期 ${group.date}`}
        className={styles.timelineDateTag}
        icon={<CalendarOutlined />}
      >
        {group.date}
      </Tag>
    </Flex>
    <div className={styles.timelineEventList}>
      {group.events.map((event) => (
        <TimelineEvent
          key={event.id}
          event={event}
          updating={updatingEventId === event.id}
          onRequestStatusUpdate={onRequestStatusUpdate}
          onOpenSecondary={(evidence) =>
            onOpenSecondary({
              date: group.date,
              riskType: event.riskType,
              evidence,
            })
          }
        />
      ))}
    </div>
  </div>
)
```

- [x] **Step 4: Replace the fixed left date column styles**

删除 `104px/88px` 左侧标题栏和轴线偏移规则，并增加：

```ts
timelineGroup: css`
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: ${token.marginXS}px;
`,
timelineDateRow: css`
  min-width: 0;
`,
timelineDateTag: css`
  margin-inline-end: 0;
  color: ${token.colorText};
  font-variant-numeric: tabular-nums;
`,
```

- [x] **Step 5: Run focused and full verification**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/StudentRiskDetailDrawer.test.tsx`

Run: `pnpm exec vitest run src/pages/Quality/Conversation`

Run: `pnpm exec tsc --noEmit --pretty false`

Run: `git diff --check -- src/pages/Quality/Conversation docs/superpowers/plans/2026-08-21-risk-timeline-date-right.md`

Expected: 页面测试、类型检查和差异检查全部通过。
