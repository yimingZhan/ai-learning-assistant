import type {
  AssistantCard,
  ChatMessage,
  ComplaintRiskConfig,
  ComplaintRiskVersion,
  ConversationSummary,
  CurrentUser,
  PlatformAssistantAuditLog,
  PlatformAssistantConfig,
  PlatformAssistantVersion,
  QueryContext,
  RenewalConfig,
  RenewalConfigVersion,
  Source,
  StudentOption,
  WorkReminder,
} from "../contracts";
import { riskStudentDetails } from "../../pages/Quality/Conversation/riskData";
import {
  createInitialComplaintRiskConfig,
  createInitialComplaintRiskVersions,
} from "./complaintRiskConfig";
import {
  createInitialRenewalConfig,
  createInitialRenewalVersions,
  getRenewalStudentDiagnosis,
} from "./renewal";
import {
  createInitialPlatformAssistantConfig,
  createInitialPlatformAssistantVersions,
  platformAssistantConfigSignature,
} from "./platformAssistantConfig";

export const students: StudentOption[] = [
  { id: "student-li-ming", name: "李明" },
  { id: "student-wang-xin", name: "王欣" },
  { id: "student-chen-yuan", name: "陈予安" },
];

const seedConversation: ConversationSummary = {
  id: "conversation-seed",
  title: "李明近 30 天学习情况",
  updatedAt: "2026-08-09T08:30:00.000Z",
};

const seedMessages: ChatMessage[] = [
  {
    id: "message-seed-user",
    role: "user",
    content: "查询李明近 30 天的学习情况",
    createdAt: "2026-08-09T08:29:58.000Z",
    status: "done",
  },
  {
    id: "message-seed-assistant",
    role: "assistant",
    content: "已整理李明近 30 天的学习情况。",
    createdAt: "2026-08-09T08:30:00.000Z",
    status: "done",
    card: {
      kind: "score",
      conclusion: "整体有进步，但作业提交需要关注。",
      metrics: [
        { label: "数学模考", value: "78 → 86", note: "提升 8 分" },
        { label: "作业提交", value: "8 / 10", note: "2 次未提交" },
        { label: "出勤", value: "6 / 6" },
      ],
    },
    sources: [
      { id: "source-score", label: "工作台 · 模考记录" },
      { id: "source-homework", label: "工作台 · 作业记录" },
      { id: "source-attendance", label: "工作台 · 出勤记录" },
    ],
  },
];

export type MockStore = {
  conversations: ConversationSummary[];
  messages: Record<string, ChatMessage[]>;
  reminders: WorkReminder[];
  complaintRiskConfig: ComplaintRiskConfig;
  complaintRiskVersions: ComplaintRiskVersion[];
  complaintRiskVersionSnapshots: Record<string, ComplaintRiskConfig>;
  renewalConfig: RenewalConfig;
  renewalPublishedConfig: RenewalConfig;
  renewalVersions: RenewalConfigVersion[];
  renewalVersionSnapshots: Record<string, RenewalConfig>;
  platformAssistantConfig: PlatformAssistantConfig;
  platformAssistantPublishedConfig: PlatformAssistantConfig;
  platformAssistantVersions: PlatformAssistantVersion[];
  platformAssistantVersionSnapshots: Record<string, PlatformAssistantConfig>;
  platformAssistantAuditLogs: PlatformAssistantAuditLog[];
  platformAssistantLastTrialSignature?: string;
};

export const currentUser: CurrentUser = {
  id: "employee-a1024",
  name: "周欣",
  organization: "上海中心 · 学管组",
  role: { id: "studentManager", label: "学管" },
  permissions: [
    "assistant.use",
    "complaintRisk.view",
    "renewal.view",
    "renewalConfig.manage",
    "workReminder.view",
    "platformAssistantConfig.view",
    "platformAssistantConfig.edit",
    "platformAssistantConfig.publish",
    "platformAssistantConfig.rollback",
  ],
};

const seedReminders: WorkReminder[] = [
  {
    id: "reminder-risk-001",
    type: "complaintRisk",
    priority: "high",
    title: "林家宁客诉风险升至高风险",
    description: "学习效果质疑连续出现，建议今天优先回访。",
    createdAt: "2026-08-11T08:40:00+08:00",
    targetPath: "/quality/conversation?studentId=risk-student-001",
    read: false,
    student: { id: "risk-student-001", name: "林家宁" },
  },
  {
    id: "reminder-renewal-001",
    type: "renewal",
    priority: "medium",
    title: "王若曦有2项续费条件需关注",
    description: "语言条件缺失，竞赛备考进行中但覆盖不足。",
    createdAt: "2026-08-11T07:55:00+08:00",
    targetPath: "/renewal/diagnosis?studentId=renewal-student-003",
    read: false,
    student: { id: "renewal-student-003", name: "王若曦" },
  },
  {
    id: "reminder-assignment-001",
    type: "assignment",
    priority: "normal",
    title: "陈子轩跟进任务已分配给你",
    description: "请在明天 18:00 前补充家长沟通结论。",
    createdAt: "2026-08-10T16:20:00+08:00",
    targetPath: "/quality/conversation?studentId=risk-student-002",
    read: false,
    student: { id: "risk-student-002", name: "陈子轩" },
  },
];

export const createInitialStore = (): MockStore => {
  const complaintRiskConfig = createInitialComplaintRiskConfig();
  const renewalConfig = createInitialRenewalConfig();
  const platformAssistantConfig = createInitialPlatformAssistantConfig();
  const legacyConfig = structuredClone(complaintRiskConfig);
  legacyConfig.publishedVersion = "v0.9";
  legacyConfig.draftVersion = "v1.0-draft";
  legacyConfig.rules = legacyConfig.rules.filter((rule) =>
    ["rule-refund-intent", "rule-feedback-delay"].includes(rule.id),
  );

  return {
    conversations: [structuredClone(seedConversation)],
    messages: { [seedConversation.id]: structuredClone(seedMessages) },
    reminders: structuredClone(seedReminders),
    complaintRiskConfig,
    complaintRiskVersions: createInitialComplaintRiskVersions(),
    complaintRiskVersionSnapshots: {
      "v1.0": structuredClone(complaintRiskConfig),
      "v0.9": legacyConfig,
    },
    renewalConfig: structuredClone(renewalConfig),
    renewalPublishedConfig: structuredClone(renewalConfig),
    renewalVersions: createInitialRenewalVersions(),
    renewalVersionSnapshots: {
      "v1.0": structuredClone(renewalConfig),
    },
    platformAssistantConfig: structuredClone(platformAssistantConfig),
    platformAssistantPublishedConfig: structuredClone(platformAssistantConfig),
    platformAssistantVersions: createInitialPlatformAssistantVersions(),
    platformAssistantVersionSnapshots: {
      "v1.0": structuredClone(platformAssistantConfig),
    },
    platformAssistantAuditLogs: [],
    platformAssistantLastTrialSignature: platformAssistantConfigSignature(
      platformAssistantConfig,
    ),
  };
};

export function inferQueryContext(text: string): QueryContext | undefined {
  const student = students.find((item) => text.includes(item.name));
  if (!student) return undefined;

  if (/订单|课时|课消/.test(text)) {
    return { kind: "order", studentId: student.id };
  }
  if (/老师|反馈/.test(text)) {
    return { kind: "teacherFeedback", studentId: student.id, days: 30 };
  }
  if (/家长|回复/.test(text)) {
    return {
      kind: "parentReply",
      studentId: student.id,
      parentMessage: text,
    };
  }
  if (/成绩|学习|模考|作业|出勤/.test(text)) {
    return { kind: "score", studentId: student.id, days: 30 };
  }
  return undefined;
}

export function createAssistantPayload(
  context?: QueryContext,
  text = "",
  renewalConfig = createInitialRenewalConfig(),
): {
  content: string;
  card?: AssistantCard;
  sources?: Source[];
} {
  if (!context) {
    return {
      content: "请告诉我学生姓名，以及需要查询的学习情况、订单或老师反馈。",
    };
  }

  if (context.kind === "complaintRisk") {
    const detail = riskStudentDetails[context.studentId];
    if (!detail) {
      return {
        content: "暂未找到该学生的客诉风险信息。",
      };
    }

    const studentName = detail.student.studentName;
    const sources = [
      { id: "risk-analysis", label: "客诉预警 · AI 风险分析" },
      { id: "risk-evidence", label: "客诉预警 · 风险事件与原始证据" },
    ];

    if (/话术|家长|沟通|回复/.test(text)) {
      return {
        content: `建议回复：您好，我们已经关注到您对当前学习效果和服务响应的担忧。针对${studentName}近期反馈的问题，我们会先完成相关记录复核，并由跟进负责人同步具体处理动作和时间节点；处理过程中会持续向您反馈进展。`,
        sources,
      };
    }

    if (/动作|跟进|处理|建议/.test(text)) {
      const suggestions = detail.eventGroups
        .flatMap((group) => group.events)
        .slice(0, 3)
        .map((event, index) => `${index + 1}. ${event.aiSuggestion}`)
        .join("\n");
      return {
        content: `建议按以下顺序跟进${studentName}：\n\n${suggestions}`,
        sources,
      };
    }

    return {
      content: `${studentName}当前为${detail.student.riskLevel === "high" ? "高" : detail.student.riskLevel === "medium" ? "中" : "低"}风险。${detail.aiSummary}\n\n主要风险主题：${detail.themes.map((theme) => `${theme.label} × ${theme.count}`).join("、")}。`,
      sources,
    };
  }

  if (context.kind === "renewal") {
    const diagnosis = getRenewalStudentDiagnosis(
      context.studentId,
      renewalConfig,
    );
    if (!diagnosis) {
      return { content: "暂未找到该学生的续费信息。" };
    }

    const actionable = diagnosis.conditions.filter((condition) =>
      ["missing", "in_progress_at_risk"].includes(condition.status),
    );
    const pending = diagnosis.conditions.filter((condition) =>
      ["data_pending", "applicability_pending"].includes(condition.status),
    );
    const focusedCondition =
      context.focus?.type === "condition"
        ? diagnosis.conditions.find(
            (condition) => condition.conditionId === context.focus?.id,
          )
        : undefined;
    const focusedProduct =
      context.focus?.type === "product"
        ? diagnosis.topRecommendations.find(
            (product) => product.productId === context.focus?.id,
          )
        : undefined;
    const relevantConditions = focusedCondition ? [focusedCondition] : actionable;
    const products = focusedProduct
      ? [focusedProduct]
      : diagnosis.topRecommendations.slice(0, 3);
    const sourceUpdatedAt = diagnosis.student.diagnosedAt;
    const sources = [
      { id: "renewal-analysis", label: "续费条件诊断 · 规则判断" },
      {
        id: "renewal-evidence",
        label: `续费条件诊断 · 学生原始证据（${sourceUpdatedAt}）`,
      },
      { id: "renewal-products", label: "续费条件诊断 · 产品匹配" },
    ];
    const manualCheck =
      "以上内容用于内部判断，不代表续费概率。对外沟通前请核对原始证据、产品可售状态、价格与时间。";

    if (/比较|产品/.test(text)) {
      const productLines = products.length
        ? products
            .map(
              (product, index) =>
                `${index + 1}. **${product.productName}**：${product.suggestedPackage}，${product.referenceAmount === undefined ? "价格待补" : `参考金额 ¥${product.referenceAmount.toLocaleString("zh-CN")}`}。匹配点：${product.matchReasons.join("、") || product.reason}；报名截止 ${product.enrollmentDeadline}。`,
            )
            .join("\n")
        : "当前没有可比较的合规候选，请先补齐资料或等待产品可售条件满足。";
      return {
        content: `**结论**\n\n产品比较仅覆盖当前规则筛选后的合规候选。\n\n**依据**\n\n${productLines}\n\n**建议动作**\n\n先确认学生目标、学习缺口与上课时间，再选择最匹配的产品，不以价格或数量作为单一判断依据。\n\n**需人工确认**\n\n${manualCheck}`,
        sources,
      };
    }

    if (/待补|补充|资料|信息/.test(text)) {
      const missingItems = Array.from(
        new Set([
          ...diagnosis.missingFields,
          ...pending.map((condition) => condition.conditionName),
        ]),
      );
      return {
        content: `**结论**\n\n当前有 ${missingItems.length} 项信息需要补充或确认，资料未齐时不生成强行推荐。\n\n**依据**\n\n${missingItems.length ? missingItems.map((item) => `- ${item}`).join("\n") : "- 当前没有明确待补项"}\n\n**建议动作**\n\n逐项补齐目标、考试节点、在读课程与订单信息，完成后重新诊断。\n\n**需人工确认**\n\n${manualCheck}`,
        sources,
      };
    }

    if (/话术|家长|沟通|回复/.test(text)) {
      const priority = relevantConditions[0];
      const product = products[0];
      const draft = priority
        ? `您好，我们结合${diagnosis.student.name}当前的学习安排和后续目标，发现“${priority.conditionName}”需要优先确认。现有记录显示：${priority.statusReason}。${product ? `我们可以进一步评估${product.productName}是否适合衔接，` : "我们会先把缺失信息补齐，"}确认课程时间、产品状态和您的需求后，再给出正式方案。`
        : `您好，我们已核对${diagnosis.student.name}当前的学习安排，暂未发现需要立即补充的明确学习条件。后续会结合考试节点和目标变化持续跟进。`;
      return {
        content: `**结论**\n\n本次沟通应先解释学习缺口和判断依据，再讨论产品，不直接承诺续费结果。\n\n**依据**\n\n${priority?.statusReason ?? "当前未发现明确缺口"}\n\n**建议动作**\n\n**沟通草稿**\n\n${draft}\n\n**需人工确认**\n\n${manualCheck}`,
        sources,
      };
    }

    if (/清单|步骤|跟进|计划/.test(text)) {
      const firstCondition = relevantConditions[0];
      return {
        content: `**结论**\n\n建议按“核对证据、确认需求、评估产品、复核方案”的顺序推进。\n\n**依据**\n\n${firstCondition ? `${firstCondition.conditionName}：${firstCondition.statusReason}` : "当前未发现明确缺口"}\n\n**建议动作**\n\n**跟进清单**\n\n1. 核对诊断时间和原始证据是否仍有效。\n2. 与学生或家长确认目标、考试节点和当前主要顾虑。\n3. ${diagnosis.missingFields.length ? `补齐${diagnosis.missingFields.join("、")}。` : "确认现有课程覆盖与剩余课时。"}\n4. 复核候选产品的可售状态、课包、价格和报名截止时间。\n5. 人工确认后再输出正式沟通方案。\n\n**需人工确认**\n\n${manualCheck}`,
        sources,
      };
    }

    const summary = relevantConditions.length
      ? relevantConditions
          .map(
            (condition) =>
              `${condition.conditionName}（${condition.status === "missing" ? "缺失" : condition.status === "in_progress_at_risk" ? "进行中覆盖不足" : "待确认"}）`,
          )
          .join("、")
      : "未发现明确缺失或进行中覆盖不足的条件";
    const evidence = relevantConditions
      .flatMap((condition) => condition.evidence)
      .slice(0, 4)
      .map((item) => `- ${item.label}：${item.value}（${item.updatedAt}）`)
      .join("\n");

    return {
      content: `**结论**\n\n${diagnosis.student.name}当前${summary}。\n\n**依据**\n\n${evidence || "- 当前没有可用原始证据"}\n\n**建议动作**\n\n${relevantConditions.length ? "优先核对上述条件，再结合学生目标与候选产品准备沟通。" : "保持现有学习安排，并在关键考试或课时节点重新诊断。"}\n\n**需人工确认**\n\n${manualCheck}`,
      sources,
    };
  }

  const studentName =
    students.find((student) => student.id === context.studentId)?.name ?? "该学生";

  if (
    context.studentId === "student-chen-yuan" &&
    context.kind !== "parentReply"
  ) {
    return {
      content: `暂时无法形成${studentName}的查询结果。`,
      card: {
        kind: "empty",
        message: "当前数据不足，请补充后再查询。",
        missing: ["模考、作业和出勤记录"],
      },
    };
  }

  switch (context.kind) {
    case "score":
      return {
        content: `已整理${studentName}近 30 天的学习情况。`,
        card: {
          kind: "score",
          conclusion: "整体有进步，但作业提交需要关注。",
          metrics: [
            { label: "数学模考", value: "78 → 86", note: "提升 8 分" },
            { label: "作业提交", value: "8 / 10", note: "2 次未提交" },
            { label: "出勤", value: "6 / 6" },
          ],
        },
        sources: [
          { id: "score", label: "工作台 · 模考记录" },
          { id: "homework", label: "工作台 · 作业记录" },
          { id: "attendance", label: "工作台 · 出勤记录" },
        ],
      };
    case "order":
      return {
        content: `已找到${studentName}当前有效订单。`,
        card: {
          kind: "order",
          orders: [
            {
              product: "A-Level 数学 1V1",
              usedHours: 24,
              remainingHours: 12,
              status: "进行中",
            },
            {
              product: "雅思写作强化",
              usedHours: 0,
              remainingHours: 8,
              status: "待开课",
            },
          ],
        },
        sources: [{ id: "orders", label: "工作台 · 订单与课消" }],
      };
    case "teacherFeedback":
      return {
        content: `已汇总${studentName}近 30 天的老师反馈。`,
        card: {
          kind: "teacherFeedback",
          conclusion: "课堂理解力较好，执行稳定性仍需加强。",
          points: [
            "函数与微积分知识掌握较快，课堂互动积极。",
            "课后练习有两次延迟提交，建议固定每周复盘时间。",
          ],
        },
        sources: [{ id: "feedback", label: "工作台 · 授课反馈" }],
      };
    case "parentReply":
      return {
        content: "已根据当前情况生成回复草稿。",
        card: {
          kind: "parentReply",
          draft:
            "您好，您的担心我理解。我们刚核对了李明近期的学习记录：课堂参与和模考成绩都有进步，但作业提交还不够稳定。接下来我会和授课老师一起把每周任务再拆细，并在本周内同步一次跟进结果。",
        },
        sources: [
          { id: "chat", label: "企微 · 家长消息" },
          { id: "learning", label: "工作台 · 近期学情" },
        ],
      };
  }
}
