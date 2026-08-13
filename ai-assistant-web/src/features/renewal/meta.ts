import type {
  RenewalConditionCategory,
  RenewalConditionStatus,
  RenewalConditionType,
  RenewalEvidence,
  RenewalOpportunityPriority,
  RenewalProductRecommendation,
  RenewalRuleScope,
  RenewalTriggerType,
} from "../../api/contracts";

export const renewalCategoryMeta: Record<
  RenewalConditionCategory,
  { label: string; direction: string }
> = {
  language: { label: "语言", direction: "语言能力补强" },
  subject: { label: "学科", direction: "学科课程衔接" },
  competition: { label: "竞赛", direction: "竞赛能力提升" },
  background: { label: "背景提升", direction: "背景提升规划" },
  assessment: { label: "笔面试", direction: "笔面试备考" },
  planning: { label: "升学规划", direction: "升学规划服务" },
};

export const renewalStatusMeta: Record<
  RenewalConditionStatus,
  { label: string; color: string }
> = {
  completed: { label: "已完成", color: "success" },
  in_progress_on_track: { label: "进行中·正常", color: "processing" },
  in_progress_at_risk: { label: "进行中·覆盖不足", color: "warning" },
  missing: { label: "缺失", color: "error" },
  applicability_pending: { label: "适用性待确认", color: "default" },
  data_pending: { label: "数据待补充", color: "default" },
};

export const renewalConditionTypeMeta: Record<
  RenewalConditionType,
  { label: string; color?: string }
> = {
  common: { label: "年级共性必备", color: "blue" },
  conditional: { label: "条件性必备", color: "gold" },
  optional: { label: "可选提升", color: undefined },
};

export const renewalPriorityMeta: Record<
  RenewalOpportunityPriority,
  { label: string; color: string }
> = {
  P0: { label: "P0 优先处理", color: "error" },
  P1: { label: "P1 建议关注", color: "warning" },
};

export const renewalRuleScopeMeta: Record<
  RenewalRuleScope,
  { label: string; color: string }
> = {
  baseline: { label: "基础要求", color: "blue" },
  goal: { label: "目标要求", color: "purple" },
};

export const renewalTriggerMeta: Record<RenewalTriggerType, string> = {
  monthly: "月度盘点",
  manual: "手动诊断",
  event: "事件触发",
};

export const renewalRecommendationTypeMeta: Record<
  RenewalProductRecommendation["recommendationType"],
  string
> = {
  renewal: "原产品续学",
  reinforcement: "薄弱项加强",
  new: "新增学习",
  advanced: "进阶学习",
};

export const renewalEvidenceSourceMeta: Record<
  RenewalEvidence["source"],
  string
> = {
  score: "成绩",
  registration: "考试/报名",
  planning: "规划",
  order: "订单",
  course: "课程/课时",
  profile: "学生档案",
};

export const renewalCategoryOptions = Object.entries(renewalCategoryMeta).map(
  ([value, meta]) => ({ value, label: meta.label }),
);

export const gradeOptions = ["9年级", "10年级", "11年级", "12年级"].map(
  (grade) => ({ value: grade, label: grade }),
);
