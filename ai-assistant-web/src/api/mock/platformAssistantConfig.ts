import type {
  AssistantCapabilityId,
  PlatformAssistantConfig,
  PlatformAssistantRuntime,
  PlatformAssistantVersion,
  QueryContext,
  UserRole,
} from "../contracts";

const createCapabilities = (): PlatformAssistantConfig["capabilities"] => [
  {
    id: "studentLearning",
    name: "学习情况查询",
    description: "汇总学生近期成绩、作业与出勤表现。",
    enabled: true,
    order: 1,
    requiredContext: "student",
    dataSources: ["模考记录", "作业记录", "出勤记录"],
    outputType: "scoreCard",
    requireSources: true,
    requireDataTimestamp: true,
    recommendedPrompts: [
      { key: "study", description: "查询李明近 30 天的学习情况" },
    ],
  },
  {
    id: "orderQuery",
    name: "订单查询",
    description: "查询有效订单、课消与剩余课时。",
    enabled: true,
    order: 2,
    requiredContext: "student",
    dataSources: ["订单中心", "课消记录"],
    outputType: "orderCard",
    requireSources: true,
    requireDataTimestamp: true,
    recommendedPrompts: [
      { key: "orders", description: "查看李明的订单与续费建议" },
    ],
  },
  {
    id: "teacherFeedback",
    name: "老师反馈总结",
    description: "归纳近期授课反馈与需要关注的学习动作。",
    enabled: true,
    order: 3,
    requiredContext: "student",
    dataSources: ["授课反馈"],
    outputType: "feedbackSummary",
    requireSources: true,
    requireDataTimestamp: true,
    recommendedPrompts: [
      { key: "feedback", description: "汇总李明近 30 天的老师反馈" },
    ],
  },
  {
    id: "parentReply",
    name: "家长回复建议",
    description: "结合学情和沟通内容生成待人工确认的话术草稿。",
    enabled: true,
    order: 4,
    requiredContext: "student",
    dataSources: ["家长沟通记录", "近期学情"],
    outputType: "replyDraft",
    requireSources: true,
    requireDataTimestamp: false,
    disclaimer: "内容为回复草稿，发送前需由老师确认。",
    recommendedPrompts: [
      { key: "reply", description: "根据家长反馈生成回复建议" },
    ],
  },
  {
    id: "complaintRisk",
    name: "客诉风险解读",
    description: "解释已发布客诉预警结果与主要证据。",
    enabled: true,
    order: 5,
    requiredContext: "student",
    dataSources: ["客诉预警结果", "风险事件"],
    outputType: "riskSummary",
    requireSources: true,
    requireDataTimestamp: true,
    disclaimer: "不得展示当前用户无权查看的原始沟通内容。",
    recommendedPrompts: [
      { key: "risk-summary", description: "总结该生当前客诉风险" },
      { key: "risk-actions", description: "给出优先跟进动作" },
      { key: "risk-reply", description: "生成家长沟通话术" },
    ],
  },
  {
    id: "renewalDiagnosis",
    name: "续费条件诊断",
    description: "解释已发布续费条件诊断和产品匹配依据。",
    enabled: true,
    order: 6,
    requiredContext: "student",
    dataSources: ["续费条件诊断", "产品映射"],
    outputType: "renewalDiagnosis",
    requireSources: true,
    requireDataTimestamp: true,
    disclaimer: "诊断仅供内部参考，不代表续费概率。",
    recommendedPrompts: [
      { key: "renewal-summary", description: "总结该生当前续费条件诊断" },
      { key: "renewal-product", description: "说明产品推荐与原始依据" },
      { key: "renewal-pending", description: "列出待补充或待确认信息" },
    ],
  },
];

export function createInitialPlatformAssistantConfig(): PlatformAssistantConfig {
  return {
    sceneId: "platformAssistant",
    sceneName: "平台 AI 助手",
    publishedVersion: "v1.0",
    draftVersion: "v1.1-draft",
    draftStatus: "published",
    basic: {
      name: "AI 学情助手",
      welcomeMessage: "👋 你好，我是 AI 学情助手",
      description: "查询学生学习情况、订单与老师反馈，或生成家长回复建议。",
      disclaimer: "AI 结果仅供内部参考，请结合原始业务数据判断。",
      historyEnabled: true,
      fallbackMessages: {
        noData: "当前数据不足，请补充后再查询。",
        forbidden: "暂无权限使用该 AI 能力或查看相关学生数据。",
        serviceError: "AI 服务暂时不可用，请稍后重试。",
      },
    },
    capabilities: createCapabilities(),
    roleGrants: [
      {
        role: "studentManager",
        capabilityIds: [
          "studentLearning",
          "orderQuery",
          "teacherFeedback",
          "parentReply",
          "complaintRisk",
          "renewalDiagnosis",
        ],
      },
      {
        role: "consultant",
        capabilityIds: [
          "studentLearning",
          "orderQuery",
          "parentReply",
          "renewalDiagnosis",
        ],
      },
      {
        role: "planner",
        capabilityIds: [
          "studentLearning",
          "teacherFeedback",
          "parentReply",
          "renewalDiagnosis",
        ],
      },
      {
        role: "qualityInspector",
        capabilityIds: [
          "studentLearning",
          "teacherFeedback",
          "complaintRisk",
        ],
      },
      {
        role: "teacher",
        capabilityIds: ["studentLearning", "teacherFeedback"],
      },
    ],
    responsePolicy: {
      tone: "professional",
      detailLevel: "standard",
      requireSources: true,
      requireDataTimestamp: true,
      refuseWhenDataMissing: true,
      externalDraftRequiresReview: true,
      systemPrompt:
        "你是内部 AI 学情助手。只能基于当前用户有权访问的业务数据回答；禁止虚构事实；数据不足时明确说明；对外话术始终标记为草稿。",
    },
    lastSuccessfulTrialAt: "2026-08-12 09:30:00",
    lastSuccessfulTrialBy: "周欣",
    updatedAt: "2026-08-12 09:30:00",
    updatedBy: "周欣",
  };
}

export function createInitialPlatformAssistantVersions(): PlatformAssistantVersion[] {
  return [
    {
      version: "v1.0",
      status: "current",
      changeNote: "初始发布平台助手六项能力与岗位授权。",
      publishedAt: "2026-08-12 09:30:00",
      publishedBy: "周欣",
    },
  ];
}

export function platformAssistantConfigSignature(
  config: PlatformAssistantConfig,
) {
  const {
    publishedVersion: _publishedVersion,
    draftVersion: _draftVersion,
    draftStatus: _draftStatus,
    lastSuccessfulTrialAt: _lastSuccessfulTrialAt,
    lastSuccessfulTrialBy: _lastSuccessfulTrialBy,
    updatedAt: _updatedAt,
    updatedBy: _updatedBy,
    ...effectiveConfig
  } = config;
  return JSON.stringify(effectiveConfig);
}

export function capabilityIdForContext(
  context?: QueryContext,
): AssistantCapabilityId | undefined {
  if (!context) return undefined;
  const mapping: Record<QueryContext["kind"], AssistantCapabilityId> = {
    score: "studentLearning",
    order: "orderQuery",
    teacherFeedback: "teacherFeedback",
    parentReply: "parentReply",
    complaintRisk: "complaintRisk",
    renewal: "renewalDiagnosis",
  };
  return mapping[context.kind];
}

export function roleCanUseCapability(
  config: PlatformAssistantConfig,
  role: UserRole,
  capabilityId: AssistantCapabilityId,
) {
  const capability = config.capabilities.find(
    (item) => item.id === capabilityId,
  );
  const grant = config.roleGrants.find((item) => item.role === role);
  return Boolean(
    capability?.enabled && grant?.capabilityIds.includes(capabilityId),
  );
}

export function createPlatformAssistantRuntime(
  config: PlatformAssistantConfig,
  role: UserRole,
): PlatformAssistantRuntime {
  const grantedIds = new Set(
    config.roleGrants.find((item) => item.role === role)?.capabilityIds ?? [],
  );
  return {
    configVersion: config.publishedVersion,
    role,
    basic: structuredClone(config.basic),
    capabilities: structuredClone(
      config.capabilities
        .filter((item) => item.enabled && grantedIds.has(item.id))
        .sort((left, right) => left.order - right.order),
    ),
  };
}
