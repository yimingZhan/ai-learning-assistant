import type {
  ComplaintRiskConfig,
  ComplaintRiskTypeConfig,
  ComplaintRiskVersion,
} from "../contracts";

const initialRiskTypes: ComplaintRiskTypeConfig[] = [
  {
    id: "follow-up-timeliness",
    name: "跟进及时性",
    keywords: ["联系不上", "没回复", "没有反馈"],
    positiveExamples: [
      "一直联系不上你",
      "老师很久没回复消息",
      "咨询的问题一直没有反馈",
    ],
    negativeExamples: ["老师已经及时回复了", "问题已经得到反馈", "一直都有联系"],
  },
  {
    id: "refund-intent",
    name: "退费倾向",
    keywords: ["退费", "退款", "退钱", "停课", "不上了", "到账"],
    positiveExamples: [
      "我要退费，剩下的钱什么时候退",
      "剩余课时能退款吗",
      "不上了，给我停课退钱",
      "钱什么时候到账",
    ],
    negativeExamples: ["我没有要退费，只是问一下规则", "其他家长之前退过费", "老师说不能随便退费"],
  },
  {
    id: "service-dissatisfaction",
    name: "服务不满",
    keywords: ["不满意", "换老师", "不合适", "不喜欢"],
    positiveExamples: [
      "对现在的老师不满意，想换一个",
      "老师的教学风格不合适",
      "这个服务我不喜欢",
    ],
    negativeExamples: ["我对现在的老师很满意", "这个服务挺好的，没有问题", "朋友对你们的服务不满意"],
  },
  {
    id: "learning-effect-doubt",
    name: "学习效果质疑",
    keywords: ["没有提升", "没什么效果", "没有解决", "成绩"],
    positiveExamples: [
      "上了这么久成绩没有提升",
      "感觉没什么效果",
      "课程没有解决我的问题",
    ],
    negativeExamples: ["孩子最近成绩提升很明显", "课程已经解决了我的问题", "我对学习效果很满意"],
  },
  {
    id: "communication-problem",
    name: "沟通问题",
    keywords: ["没说清楚", "沟通没解决", "不沟通了", "指导不到位"],
    positiveExamples: [
      "沟通了半天还是没说清楚",
      "指导不到位，反复沟通没解决",
      "算了，不沟通了",
    ],
    negativeExamples: ["老师已经解释得很清楚了", "沟通很顺畅，问题已解决", "这次沟通没有问题"],
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
      changeNote: "配置五类风险类型、召回关键词及语义参考案例。",
      publishedAt: "2026-08-11 18:30",
      publishedBy: "周欣",
      riskTypes: structuredClone(currentConfig.riskTypes),
    },
    {
      version: "v0.9",
      status: "history",
      changeNote: "试运行版本：仅配置跟进及时性与退费倾向的关键词和案例。",
      publishedAt: "2026-08-08 16:20",
      publishedBy: "质检团队",
      riskTypes: structuredClone(legacyConfig.riskTypes),
    },
  ];
}
