import type {
  ComplaintRiskConfig,
  ComplaintRiskLevel,
  ComplaintRiskRule,
  ComplaintRiskTrialRequest,
  ComplaintRiskTrialResult,
  ComplaintRiskVersion,
} from "../contracts";
import {
  riskStudentDetails,
  type RiskEvent,
} from "../../pages/Quality/Conversation/riskData";

const promptVariables = [
  { key: "student_profile", label: "学生画像" },
  { key: "assessment_period", label: "分析周期" },
  { key: "wechat_messages", label: "微信聊天（云客）" },
];

const initialRules: ComplaintRiskRule[] = [
  {
    id: "rule-external-escalation",
    name: "正式投诉或外部升级",
    theme: "投诉升级",
    description: "识别明确投诉、监管举报、律师介入或公开曝光表达。",
    dataSources: ["wechat"],
    keywords: ["正式投诉", "投诉你们", "消费者协会", "监管部门", "律师", "曝光"],
    windowDays: 30,
    minOccurrences: 1,
    score: 70,
    priority: 100,
    forceLevel: "high",
    enabled: true,
  },
  {
    id: "rule-refund-intent",
    name: "明确退费倾向",
    theme: "退费倾向",
    description: "识别家长或学生明确表达退费、退款或终止服务的意向。",
    dataSources: ["wechat"],
    keywords: ["退费", "退款", "不再继续", "停止服务"],
    windowDays: 30,
    minOccurrences: 1,
    score: 50,
    priority: 90,
    enabled: true,
  },
  {
    id: "rule-learning-effect",
    name: "连续质疑学习效果",
    theme: "学习效果质疑",
    description: "识别近期重复出现的课程效果、成绩或学习进度质疑。",
    dataSources: ["wechat"],
    keywords: ["没有效果", "没看到效果", "成绩下降", "没有改善", "进度落后"],
    windowDays: 14,
    minOccurrences: 2,
    score: 20,
    priority: 70,
    enabled: true,
  },
  {
    id: "rule-service-response",
    name: "服务响应不满",
    theme: "服务响应不满",
    description: "识别需要反复催促、长时间未回复或问题无人处理。",
    dataSources: ["wechat"],
    keywords: ["回复太慢", "一直不回复", "反复催", "没人处理", "没有回应"],
    windowDays: 7,
    minOccurrences: 2,
    score: 20,
    priority: 60,
    enabled: true,
  },
  {
    id: "rule-scheduling",
    name: "排课问题持续未解决",
    theme: "排课服务不满",
    description: "识别排课或调课问题在多次沟通后仍未闭环。",
    dataSources: ["wechat"],
    keywords: ["排课冲突", "调课", "时间不合适", "排课没有解决"],
    windowDays: 14,
    minOccurrences: 2,
    score: 40,
    priority: 50,
    enabled: true,
  },
  {
    id: "rule-feedback-delay",
    name: "反馈时效不满",
    theme: "反馈时效不满",
    description: "识别对课后反馈、学情同步或处理进度时效的明确不满。",
    dataSources: ["wechat"],
    keywords: ["反馈不及时", "反馈太慢", "没有反馈", "课后反馈"],
    windowDays: 7,
    minOccurrences: 1,
    score: 20,
    priority: 40,
    enabled: true,
  },
];

export function createInitialComplaintRiskConfig(): ComplaintRiskConfig {
  return {
    sceneId: "complaintRisk",
    sceneName: "AI 客诉预警",
    publishedVersion: "v1.0",
    draftVersion: "v1.1-draft",
    draftStatus: "published",
    updatedAt: "2026-08-11 18:30",
    updatedBy: "周欣",
    prompts: {
      systemPrompt:
        "你是唯寻 AI 客诉风险分析助手。你只能依据系统提供的云客微信文字证据进行判断，必须区分否定、假设、引用和客户当前真实诉求。禁止虚构事实，禁止代替质检作最终定性。",
      analysisPrompt:
        "请结合 {{student_profile}} 和 {{assessment_period}} 内的 {{wechat_messages}}，识别风险主题、关键证据、发生时间和证据来源。每个结论必须引用真实 evidenceId；没有证据时明确说明数据不足。",
      suggestionPrompt:
        "基于已确认的风险证据生成内部跟进建议，列出负责人、建议完成时间、具体动作和验证标准。不得生成未经确认的对外承诺，并标注“AI 结果仅供内部核验”。",
      variables: promptVariables,
    },
    rules: initialRules,
    strategy: {
      thresholds: { high: 70, medium: 40, low: 20 },
      analysisWindowDays: 30,
      dedupeHours: 24,
      minimumConfidence: 65,
      crossChannelBonus: 0,
      dataSources: ["wechat"],
      highRiskRequiresReview: false,
      notificationTargets: ["owner", "quality"],
      runFrequency: "30m",
    },
  };
}

export function createInitialComplaintRiskVersions(): ComplaintRiskVersion[] {
  return [
    {
      version: "v1.0",
      status: "current",
      changeNote: "完成客诉预警初始 Prompt 与六类判断规则。",
      publishedAt: "2026-08-11 18:30",
      publishedBy: "周欣",
    },
    {
      version: "v0.9",
      status: "history",
      changeNote: "试运行版本：仅支持云客微信与退费关键词。",
      publishedAt: "2026-08-08 16:20",
      publishedBy: "质检团队",
    },
  ];
}

function countKeywordOccurrences(text: string, keywords: string[]) {
  return keywords.reduce((total, keyword) => {
    if (!keyword) return total;
    return total + text.split(keyword).length - 1;
  }, 0);
}

function getLevel(
  score: number,
  config: ComplaintRiskConfig,
  forcedLevels: ComplaintRiskLevel[],
) {
  if (forcedLevels.includes("high")) return "high";
  if (forcedLevels.includes("medium")) return "medium";
  if (forcedLevels.includes("low")) return "low";
  if (score >= config.strategy.thresholds.high) return "high";
  if (score >= config.strategy.thresholds.medium) return "medium";
  if (score >= config.strategy.thresholds.low) return "low";
  return undefined;
}

function eventEvidence(event: RiskEvent) {
  const evidence = event.evidence[0];
  if (!evidence) return event.riskSummary;
  return evidence.contentSummary.map((segment) => segment.text).join("");
}

export function createComplaintRiskTrialResult(
  request: ComplaintRiskTrialRequest,
): ComplaintRiskTrialResult {
  const { config, input } = request;
  const enabledRules = config.rules
    .filter((rule) => rule.enabled)
    .sort((left, right) => right.priority - left.priority);
  const matches: ComplaintRiskTrialResult["matchedRules"] = [];
  const matchedSources = new Set<string>();
  let summary = "未识别到足以生成客诉预警的有效证据。";
  let suggestion = "保持常规服务跟进，后续如出现新的明确风险表达再次评估。";

  if (input.mode === "text") {
    for (const rule of enabledRules) {
      const occurrences = countKeywordOccurrences(input.text, rule.keywords);
      if (occurrences < rule.minOccurrences) continue;
      const evidenceKeywords = rule.keywords.filter((keyword) =>
        input.text.includes(keyword),
      );
      matches.push({
        ruleId: rule.id,
        ruleName: rule.name,
        theme: rule.theme,
        score: rule.score,
        evidence: `命中：${evidenceKeywords.join("、")}`,
      });
      rule.dataSources
        .filter((source) => source === "wechat" || source === "phone")
        .slice(0, 1)
        .forEach((source) => matchedSources.add(source));
    }
    if (matches.length) {
      summary = `输入文本命中 ${matches.length} 条风险规则，主要涉及${[
        ...new Set(matches.map((match) => match.theme)),
      ].join("、")}。`;
      suggestion =
        "建议负责人先核对完整沟通上下文和未闭环事项，当天明确处理人、完成时间与下一次同步节点。";
    }
  } else {
    const detail = riskStudentDetails[input.studentId];
    if (detail) {
      for (const rule of enabledRules) {
        const theme = detail.themes.find((item) => item.label === rule.theme);
        if (!theme || theme.count < rule.minOccurrences) continue;
        const event = detail.eventGroups
          .flatMap((group) => group.events)
          .find((item) => item.riskType === rule.theme);
        if (!event) continue;
        event.riskSources.forEach((source) => matchedSources.add(source));
        matches.push({
          ruleId: rule.id,
          ruleName: rule.name,
          theme: rule.theme,
          score: rule.score,
          evidence: eventEvidence(event),
        });
      }
      summary = detail.aiSummary;
      suggestion =
        detail.eventGroups.flatMap((group) => group.events)[0]
          ?.handlingSuggestion ??
        suggestion;
    }
  }

  const crossChannelBonusApplied =
    config.strategy.crossChannelBonus > 0 &&
    config.strategy.dataSources.length > 1 &&
    matchedSources.size > 1;
  const rulesScore = matches.reduce((total, match) => total + match.score, 0);
  const riskScore = Math.min(
    100,
    rulesScore +
      (crossChannelBonusApplied ? config.strategy.crossChannelBonus : 0),
  );
  const forcedLevels = enabledRules
    .filter((rule) =>
      matches.some((match) => match.ruleId === rule.id && rule.forceLevel),
    )
    .map((rule) => rule.forceLevel)
    .filter((level): level is ComplaintRiskLevel => Boolean(level));
  const confidence = matches.length
    ? Math.min(
        98,
        62 + matches.length * 7 + (crossChannelBonusApplied ? 8 : 0),
      )
    : 48;

  return {
    riskScore,
    riskLevel: getLevel(riskScore, config, forcedLevels),
    confidence,
    crossChannelBonusApplied,
    matchedRules: matches,
    summary,
    suggestion,
  };
}
