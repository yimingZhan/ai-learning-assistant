# API Contract

## AI 客诉预警配置

现有接口路径保持不变：

| 用途 | Method | URL |
| --- | --- | --- |
| 获取当前配置 | GET | `/api/v1/ai-config/complaint-risk` |
| 更新并即时生效 | PATCH | `/api/v1/ai-config/complaint-risk` |

`ComplaintRiskConfig` 在原字段基础上增加必填的风险总结系统提示词：

```ts
type ComplaintRiskConfig = {
  summaryPrompt: string;
  // 其余场景、版本、更新信息和 riskTypes 字段保持不变。
};
```

`summaryPrompt` 保存时去除首尾空格，纯空白内容无效。该字段只控制客诉预警详情中的“风险总结”，不参与风险识别或等级判定。

## 续费规则配置 / 升学目标标的

现有接口路径保持不变：

| 用途 | Method | URL |
| --- | --- | --- |
| 获取当前草稿 | GET | `/api/v1/ai-config/renewal` |
| 保存草稿 | PATCH | `/api/v1/ai-config/renewal` |
| 学生试算 | POST | `/api/v1/ai-config/renewal/trial` |
| 发布版本 | POST | `/api/v1/ai-config/renewal/publish` |
| 版本列表 | GET | `/api/v1/ai-config/renewal/versions` |
| 回滚版本 | POST | `/api/v1/ai-config/renewal/versions/:version/rollback` |

### 目标规则

`RenewalConditionRule` 在原字段基础上增加：

```ts
type RenewalRuleLevel = "grade" | "destination" | "school" | "major";
type RenewalGoalDimension = "subject" | "language" | "admissions";

type RenewalCriterion = {
  id: string;
  label: string;
  metric: "score" | "grade" | "count" | "completion" | "text";
  operator?: "gte" | "lte" | "eq" | "contains";
  value?: string | number;
  unit?: string;
};

type RenewalConditionRule = {
  level: RenewalRuleLevel;
  dimension: RenewalGoalDimension;
  schools: string[];
  criteriaLogic: "all";
  criteria: RenewalCriterion[];
  // 其余 requirementCode、grade、curricula、countries、schoolTiers、
  // majors、applicationYears、category、type、target 等字段保持不变。
};
```

`requirementCode` 是同一目标事项的稳定标识。不同标识的目标同时生效；同一标识按 `grade → destination → school → major` 选择最具体的规则。同层级、同具体度且适用范围重叠的启用规则返回 HTTP 400，禁止保存、试算和发布。

### 学生目标画像

`RenewalTargetProfile` 增加 `schools: string[]`。`countries` 在页面中展示为“留学方向”，`schoolTiers` 继续作为院校梯队条件。

### 诊断结果

`RenewalConditionDiagnosis` 增加：

```ts
type RenewalRuleSource = {
  ruleId: string;
  level: RenewalRuleLevel;
  label: string;
  effective: boolean;
};

type RenewalConditionDiagnosis = {
  sourceLevel: RenewalRuleLevel;
  sourceChain: RenewalRuleSource[];
  dimension: RenewalGoalDimension;
  criteria: RenewalCriterion[];
};
```

产品仍关联具体规则 ID。诊断选中深层规则时，产品匹配会同时读取 `sourceChain` 上全部规则的关联产品，再应用原有可售、年级、课程体系、画像、时间和已购过滤。
