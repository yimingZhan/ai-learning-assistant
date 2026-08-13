import type {
  ComplaintRiskDataSource,
  ComplaintRiskLevel,
} from "../../../api/contracts";

export const dataSourceMeta: Record<ComplaintRiskDataSource, string> = {
  wechat: "微信（云客）",
  phone: "电话外呼",
  learning: "学习数据",
  service: "服务记录",
  complaintHistory: "历史客诉",
};

export const dataSourceOptions = Object.entries(dataSourceMeta).map(
  ([value, label]) => ({
    value,
    label: value === "wechat" ? label : label + "（后续版本）",
    disabled: value !== "wechat",
  }),
);

export const riskLevelMeta: Record<
  ComplaintRiskLevel,
  { label: string; color: string }
> = {
  high: { label: "高风险", color: "error" },
  medium: { label: "中风险", color: "warning" },
  low: { label: "低风险", color: "success" },
};

export const riskLevelOptions = Object.entries(riskLevelMeta).map(
  ([value, meta]) => ({ value, label: meta.label }),
);

export const themeOptions = [
  "投诉升级",
  "退费倾向",
  "学习效果质疑",
  "服务响应不满",
  "排课服务不满",
  "反馈时效不满",
].map((value) => ({ value, label: value }));

export const notificationTargetOptions = [
  { value: "owner", label: "当前负责人" },
  { value: "quality", label: "质检团队" },
  { value: "manager", label: "直属主管（后续版本）", disabled: true },
];

export const runFrequencyOptions = [
  { value: "30m", label: "每 30 分钟" },
];
