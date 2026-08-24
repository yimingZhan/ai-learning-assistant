import type {
  ComplaintRiskConfig,
  ComplaintRiskTypeConfig,
  ComplaintRiskVersion,
} from "../contracts";

const initialRiskTypes: ComplaintRiskTypeConfig[] = [
  {
    id: "follow-up-timeliness",
    name: "跟进及时性",
    keywords: ["找不到人", "联系不上", "未反馈", "没回复", "没人回"],
    positiveExamples: [
      "我昨天问的问题到现在都没有人回复。",
      "这几天一直联系不上老师。",
      "说好了给我反馈，到现在还没有消息。",
      "我已经问了好几次了，一直没人处理。",
      "每次有事情都找不到人。",
    ],
    highRiskDefinition:
      "多次、持续出现联系不上、无人反馈、长期未回复等情况，并明显表达强烈不满或认为问题长期无人处理。",
    mediumRiskDefinition:
      "明确反馈某次或某段时间联系不上、未回复、未按约定反馈，已经对服务体验造成影响。",
    lowRiskDefinition:
      "对回复速度存在轻微抱怨、催促或提醒，但暂未出现持续性问题或明显不满。",
  },
  {
    id: "refund-intent",
    name: "退费",
    keywords: [
      "退费",
      "退了",
      "还剩多少钱",
      "还有多少课时",
      "什么时候到账",
    ],
    positiveExamples: [
      "这个课我不想继续上了，剩下的钱能退吗？",
      "我想把后面的课退掉。",
      "剩下还有多少课时？退费的话能退多少钱？",
      "我已经申请退费了，大概什么时候能到账？",
      "这个问题如果解决不了，我就退费。",
      "我还是决定退掉，不继续上了。",
    ],
    highRiskDefinition:
      "已明确提出、决定或正在实施退费，例如“我要退”“决定退掉”“已经申请退费”，或者反复表达明确退费诉求。",
    mediumRiskDefinition:
      "明显产生退费倾向，例如“想退”“考虑退”“如果解决不了就退”，但尚未形成明确最终决定。",
    lowRiskDefinition:
      "主动咨询退费金额、剩余课时、退款规则等信息，存在潜在退费关注，但尚未明确表达退费意愿。",
  },
  {
    id: "service-dissatisfaction",
    name: "客诉",
    keywords: ["不满意", "不喜欢", "不合适", "换老师", "风格不合适", "全拒"],
    positiveExamples: [
      "我对现在这个老师真的不满意。",
      "孩子很不喜欢这个老师的上课方式。",
      "这个老师的教学风格不适合孩子，能不能换一个？",
      "已经沟通过几次了，还是希望换老师。",
      "申请结果全部被拒了，我对你们这个服务很不满意。",
      "这个服务跟之前承诺的完全不一样。",
    ],
    highRiskDefinition:
      "明确表达强烈不满，并提出换老师、更换服务人员等明确解决诉求，或反复沟通后仍明确表示无法接受当前服务。",
    mediumRiskDefinition:
      "明确表达对老师、服务、教学方式等不满意或不适应，但尚未提出强烈的更换、投诉等诉求。",
    lowRiskDefinition:
      "存在轻微负面评价、体验欠佳或适应性问题，但整体态度较温和，尚未形成明确不满。",
  },
];

const initialSummaryPrompt =
  "你是 AI 客诉预警助手。请仅基于已提供的学生沟通记录、已识别的风险事件和处理状态生成风险总结。总结应客观、简洁，优先说明当前仍待处理的核心风险及其依据，不得补充数据中不存在的事实；对已排除或已处理的风险需明确区分，信息不足时直接说明需要人工核实。";

export function createInitialComplaintRiskConfig(): ComplaintRiskConfig {
  return {
    sceneId: "complaintRisk",
    sceneName: "AI 客诉预警",
    summaryPrompt: initialSummaryPrompt,
    publishedVersion: "v1.0",
    draftVersion: "v1.1-draft",
    draftStatus: "published",
    updatedAt: "2026-08-11 18:30",
    updatedBy: "周欣",
    riskTypes: structuredClone(initialRiskTypes),
  };
}

export function createInitialComplaintRiskVersions(
  currentConfig: ComplaintRiskConfig,
  legacyConfig: ComplaintRiskConfig,
): ComplaintRiskVersion[] {
  return [
    {
      version: "v1.0",
      status: "current",
      changeNote: "配置五类风险类型、召回关键词、语义参考案例及高/中/低风险定义。",
      publishedAt: "2026-08-11 18:30",
      publishedBy: "周欣",
      riskTypes: structuredClone(currentConfig.riskTypes),
    },
    {
      version: "v0.9",
      status: "history",
      changeNote: "试运行版本：仅配置跟进及时性与退费的关键词和案例。",
      publishedAt: "2026-08-08 16:20",
      publishedBy: "质检团队",
      riskTypes: structuredClone(legacyConfig.riskTypes),
    },
  ];
}
