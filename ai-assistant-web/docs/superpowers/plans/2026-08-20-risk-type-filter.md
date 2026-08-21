# 客诉风险类型筛选 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在学生列表页的筛选区域增加“风险类型”多选，并用现有 Mock 风险事件筛选学生。

**Architecture:** 风险类型继续由 `riskData.ts` 统一定义，筛选函数从每个学生的风险详情中判断是否存在所选类型。页面使用 Ant Design Pro 的 `ProFormSelect` 多选控件；风险类型之间按“任一匹配”，并与其他筛选条件按“同时满足”组合。

**Tech Stack:** React、TypeScript、Ant Design Pro、Vitest、Testing Library。

---

### Task 1: 锁定风险类型筛选规则

**Files:**
- Modify: `src/pages/Quality/Conversation/index.test.tsx`
- Modify: `src/pages/Quality/Conversation/riskData.ts`

**Step 1: Write the failing test**

在 `filterRiskStudents` 测试组中增加单选和多选断言：

```tsx
it("风险类型多选按任一类型匹配学生", () => {
  expect(
    filterRiskStudents(riskStudents, { riskTypes: ["退费"] }).map(
      (student) => student.id,
    ),
  ).toEqual(["risk-student-001", "risk-student-002", "risk-student-005"]);

  expect(
    filterRiskStudents(riskStudents, { riskTypes: ["退费", "客诉"] }).map(
      (student) => student.id,
    ),
  ).toEqual([
    "risk-student-001",
    "risk-student-002",
    "risk-student-005",
    "risk-student-006",
  ]);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx`

Expected: FAIL，因为 `RiskStudentFilters` 尚不支持 `riskTypes`。

**Step 3: Write minimal implementation**

新增共享类型和选项：

```ts
export type RiskType = "跟进及时性" | "退费" | "客诉";

export type RiskStudentFilters = {
  riskTypes?: RiskType[];
  // 现有字段保持不变
};

export const riskTypeOptions = [
  { label: "跟进及时性", value: "跟进及时性" },
  { label: "退费", value: "退费" },
  { label: "客诉", value: "客诉" },
] satisfies Array<{ label: RiskType; value: RiskType }>;
```

在 `filterRiskStudents` 中通过 `riskStudentDetails[record.id]` 检查学生是否至少有一条风险事件命中所选类型，并把结果加入现有组合筛选。

**Step 4: Run test to verify it passes**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx`

Expected: PASS。

### Task 2: 在筛选区域接入多选控件

**Files:**
- Modify: `src/pages/Quality/Conversation/StudentSelector.test.tsx`
- Modify: `src/pages/Quality/Conversation/StudentSelector.tsx`
- Modify: `src/pages/Quality/Conversation/index.tsx`

**Step 1: Write the failing test**

将筛选字段测试改为“六项筛选”，并在字段名单中加入 `风险类型`。

**Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/StudentSelector.test.tsx`

Expected: FAIL，因为页面尚未渲染“风险类型”。

**Step 3: Write minimal implementation**

在风险等级后增加 Ant Design Pro 多选：

```tsx
<ProFormSelect
  name="riskTypes"
  label="风险类型"
  options={riskTypeOptions}
  fieldProps={{
    allowClear: true,
    maxTagCount: "responsive",
    mode: "multiple",
    placeholder: "请选择",
  }}
/>
```

同步表单回填 `riskTypes`，导出 `RiskType`，不增加接口或后端逻辑。

**Step 4: Run focused and full verification**

Run: `pnpm exec vitest run src/pages/Quality/Conversation/index.test.tsx src/pages/Quality/Conversation/StudentSelector.test.tsx`

Run: `pnpm exec vitest run src/pages/Quality/Conversation`

Run: `pnpm exec tsc --noEmit --pretty false`

Expected: 全部测试及类型检查通过。
