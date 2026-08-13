const REDLINE_TYPES = new Set([
  "complaint",
  "refund",
  "stop_service",
  "change_teacher",
  "deleted_staff",
]);

const SEVERITY_ORDER = { redline: 4, p0: 3, p1: 2, p2: 1 };
const LEVEL_ORDER = { 数据不足: -1, 低: 0, 中: 1, 高: 2 };

export const ROLE_CONFIG = {
  advisor: {
    label: "顾问",
    focus: ["relationship", "history", "service", "financial", "learning"],
    permission: "协调视图",
  },
  manager: {
    label: "学管",
    focus: ["relationship", "service", "learning", "planning", "financial"],
    permission: "一线处置视图",
  },
  planner: {
    label: "规划师",
    focus: ["planning", "learning", "relationship", "service", "financial"],
    permission: "规划服务视图",
  },
  quality: {
    label: "质检",
    focus: ["relationship", "service", "learning", "planning", "financial", "history"],
    permission: "完整审计视图",
  },
};

export const DEFAULT_THRESHOLDS = {
  attendanceRate: 0.75,
  homeworkSubmitRate: 0.7,
  homeworkOverdueRate: 0.3,
  monthlyTrend: -0.03,
  planningOverdueDays: 7,
  scheduleProcessingHours: 48,
  replyHours: 24,
  monthlyCommunicationRate: 1,
  minimumCompleteness: 0.6,
  minimumConsumedHoursForOutcome: 10,
  maximumScoreLiftPerHour: 0.001,
};

function percent(value) {
  return `${Math.round(value * 100)}%`;
}

function formatDateTime(value) {
  if (!value) return "时间未知";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(value));
}

function evidenceItem({
  id,
  title,
  category,
  categoryLabel,
  severity,
  summary,
  currentValue,
  comparison,
  occurredAt,
  source,
  quote = null,
  confidence = "高",
  verified = false,
  sensitiveFor = [],
}) {
  return {
    id,
    title,
    category,
    categoryLabel,
    severity,
    summary,
    currentValue,
    comparison,
    occurredAt,
    source,
    quote,
    confidence,
    verified,
    sensitiveFor,
  };
}

function collectEvidence(student, thresholds) {
  const evidence = [];
  const signals = student.relationship?.signals ?? [];

  for (const signal of signals) {
    const isRedline = REDLINE_TYPES.has(signal.type);
    evidence.push(evidenceItem({
      id: signal.id,
      title: signal.title,
      category: "relationship",
      categoryLabel: isRedline ? "红线信号" : "关系恶化",
      severity: isRedline ? "redline" : "p0",
      summary: signal.summary,
      currentValue: signal.currentValue ?? "已命中",
      comparison: signal.comparison ?? "较上一观察期恶化",
      occurredAt: signal.occurredAt,
      source: signal.source,
      quote: signal.quote,
      confidence: signal.confidence ?? "高",
      verified: signal.verified ?? false,
      sensitiveFor: signal.sensitiveFor ?? [],
    }));
  }

  const learning = student.learning ?? {};
  if (learning.attendanceRate != null && learning.attendanceRate < thresholds.attendanceRate) {
    evidence.push(evidenceItem({
      id: "attendance-rate",
      title: "近30天出勤率偏低",
      category: "learning",
      categoryLabel: "学情恶化",
      severity: "p0",
      summary: "出勤不足可能影响学习效果，并放大家长对课程交付的担忧。",
      currentValue: percent(learning.attendanceRate),
      comparison: `预警线 ${percent(thresholds.attendanceRate)}`,
      occurredAt: learning.updatedAt,
      source: "唯寻工作台 · 出勤记录",
    }));
  }

  if (learning.homeworkSubmitRate != null && learning.homeworkSubmitRate < thresholds.homeworkSubmitRate) {
    evidence.push(evidenceItem({
      id: "homework-submit",
      title: "作业提交率偏低",
      category: "learning",
      categoryLabel: "学情恶化",
      severity: "p0",
      summary: "近30天作业参与度下降，需要区分学生配合问题和课程难度问题。",
      currentValue: percent(learning.homeworkSubmitRate),
      comparison: `预警线 ${percent(thresholds.homeworkSubmitRate)}`,
      occurredAt: learning.updatedAt,
      source: "唯寻工作台 · 作业记录",
    }));
  }

  if (learning.homeworkOverdueRate != null && learning.homeworkOverdueRate > thresholds.homeworkOverdueRate) {
    evidence.push(evidenceItem({
      id: "homework-overdue",
      title: "作业逾期率偏高",
      category: "learning",
      categoryLabel: "学情恶化",
      severity: "p0",
      summary: "逾期作业持续累积，可能导致课程节奏与家长期待不一致。",
      currentValue: percent(learning.homeworkOverdueRate),
      comparison: `预警线 ${percent(thresholds.homeworkOverdueRate)}`,
      occurredAt: learning.updatedAt,
      source: "唯寻工作台 · 作业记录",
    }));
  }

  for (const [key, label] of [["homeworkTrend", "作业"], ["mockTrend", "模考"]]) {
    if (learning[key] != null && learning[key] <= thresholds.monthlyTrend) {
      evidence.push(evidenceItem({
        id: `${key}-trend`,
        title: `${label}成绩趋势下降`,
        category: "learning",
        categoryLabel: "学情恶化",
        severity: "p0",
        summary: `最近3个月${label}得分率呈持续下降趋势。`,
        currentValue: `月均 ${percent(learning[key])}`,
        comparison: `预警线 ≤ ${percent(thresholds.monthlyTrend)}`,
        occurredAt: learning.updatedAt,
        source: `唯寻工作台 · ${label}成绩`,
      }));
    }
  }

  const planning = student.planning ?? {};
  if (planning.overdueDays != null && planning.overdueDays > thresholds.planningOverdueDays) {
    evidence.push(evidenceItem({
      id: "planning-overdue",
      title: "规划/文书节点逾期",
      category: "planning",
      categoryLabel: "学情恶化",
      severity: "p0",
      summary: `${planning.nodeName ?? "当前必做节点"}推进时间超过计划。`,
      currentValue: `逾期 ${planning.overdueDays} 天`,
      comparison: `预警线 ${thresholds.planningOverdueDays} 天`,
      occurredAt: planning.updatedAt,
      source: "唯寻工作台 · 规划/文书节点",
    }));
  }

  const service = student.service ?? {};
  if (service.overdueReplyCount > 0 || service.averageReplyHours > thresholds.replyHours) {
    evidence.push(evidenceItem({
      id: "reply-timeout",
      title: "服务回复超时",
      category: "service",
      categoryLabel: "服务失控",
      severity: "p1",
      summary: "家长或学生的有效问题未在24小时内得到有效回复。",
      currentValue: `${service.overdueReplyCount ?? 0} 次超时，最长 ${service.maxReplyHours ?? service.averageReplyHours} 小时`,
      comparison: `SOP阈值 ${thresholds.replyHours} 小时`,
      occurredAt: service.updatedAt,
      source: "企微聊天记录 · 回复时效",
    }));
  }

  if (service.monthlyCommunicationRate != null && service.monthlyCommunicationRate < thresholds.monthlyCommunicationRate) {
    evidence.push(evidenceItem({
      id: "monthly-communication",
      title: "月度沟通未按SOP完成",
      category: "service",
      categoryLabel: "服务失控",
      severity: "p2",
      summary: "本月有效沟通留痕未达到SOP要求。",
      currentValue: percent(service.monthlyCommunicationRate),
      comparison: "目标 100%",
      occurredAt: service.updatedAt,
      source: "企微/电话外呼 · 服务记录",
    }));
  }

  if (service.scheduleProcessingHours != null && service.scheduleProcessingHours > thresholds.scheduleProcessingHours) {
    evidence.push(evidenceItem({
      id: "schedule-delay",
      title: "排课处理时间过长",
      category: "service",
      categoryLabel: "服务失控",
      severity: "p0",
      summary: "支付后迟迟未完成首次有效课时占用，存在履约体验风险。",
      currentValue: `${service.scheduleProcessingHours} 小时`,
      comparison: `预警线 ${thresholds.scheduleProcessingHours} 小时`,
      occurredAt: service.updatedAt,
      source: "唯寻工作台 · 排课记录",
    }));
  }

  const financial = student.financial ?? {};
  if (financial.refundRate > 0) {
    evidence.push(evidenceItem({
      id: "refund-rate",
      title: "存在历史退款",
      category: "financial",
      categoryLabel: "投入产出失衡",
      severity: "p0",
      summary: "历史退款会提高重复客诉与服务信任风险。",
      currentValue: percent(financial.refundRate),
      comparison: "客户历史全周期",
      occurredAt: financial.updatedAt,
      source: "唯寻工作台 · 财务记录",
      sensitiveFor: ["manager", "planner"],
    }));
  }

  if (
    financial.consumedHours >= thresholds.minimumConsumedHoursForOutcome &&
    financial.scoreLiftPerHour != null &&
    financial.scoreLiftPerHour <= thresholds.maximumScoreLiftPerHour
  ) {
    evidence.push(evidenceItem({
      id: "low-outcome-per-hour",
      title: "课消与成绩提升不匹配",
      category: "financial",
      categoryLabel: "投入产出失衡",
      severity: "p0",
      summary: "近期课时投入较高，但标准化成绩提升幅度较小。",
      currentValue: `${financial.consumedHours} 课时，单位课时提升 ${financial.scoreLiftPerHour.toFixed(3)}`,
      comparison: "近30天同学科数据",
      occurredAt: financial.updatedAt,
      source: "唯寻工作台 · 课消与成绩",
      sensitiveFor: ["manager"],
    }));
  }

  if ((student.history?.complaintCount ?? 0) > 0) {
    evidence.push(evidenceItem({
      id: "complaint-history",
      title: "存在历史客诉",
      category: "history",
      categoryLabel: "服务失控",
      severity: "p2",
      summary: "新接手人员需了解历史根因和已承诺事项，避免同类问题复发。",
      currentValue: `${student.history.complaintCount} 次`,
      comparison: "客户历史全周期",
      occurredAt: student.history.lastComplaintAt,
      source: "质检客诉记录",
      sensitiveFor: ["planner"],
    }));
  }

  return evidence;
}

function calculateCompleteness(student) {
  const availability = student.dataAvailability ?? {};
  const keys = [
    "chat",
    "attendance",
    "homework",
    "mock",
    "planning",
    "reply",
    "monthlyCommunication",
    "courseConsumption",
    "finance",
    "complaintHistory",
  ];
  const available = keys.filter((key) => availability[key]).length;
  const learningAvailable = Boolean(availability.attendance || availability.homework || availability.mock);
  return {
    available,
    total: keys.length,
    ratio: available / keys.length,
    chatAvailable: Boolean(availability.chat),
    learningAvailable,
  };
}

function determineLevel(evidence, completeness, thresholds) {
  const hasRedline = evidence.some((item) => item.severity === "redline");
  if (hasRedline) return "高";

  if (
    completeness.ratio < thresholds.minimumCompleteness ||
    (!completeness.chatAvailable && !completeness.learningAvailable)
  ) {
    return "数据不足";
  }

  const p0Categories = new Set(
    evidence.filter((item) => item.severity === "p0").map((item) => item.category),
  );
  const supportingSignals = evidence.filter((item) => item.severity === "p1" || item.severity === "p2");

  if (p0Categories.size >= 2) return "高";
  if (p0Categories.size === 1 || supportingSignals.length >= 2) return "中";
  return "低";
}

function determineTrend(currentLevel, previousLevel) {
  if (!previousLevel || currentLevel === "数据不足") return "持平";
  const current = LEVEL_ORDER[currentLevel];
  const previous = LEVEL_ORDER[previousLevel];
  if (current > previous) return "上升";
  if (current < previous) return "下降";
  return "持平";
}

function adaptEvidenceForRole(item, role) {
  if (role === "quality") return { ...item, redacted: false };

  if (item.sensitiveFor.includes(role)) {
    return {
      ...item,
      title: item.category === "relationship" ? "存在需核实的沟通风险" : item.title,
      summary: "存在与当前服务相关的敏感风险信息，原始内容仅主管/质检可见。",
      currentValue: "已发现异常",
      comparison: "请由主管协同核实",
      source: "跨端口风险汇总",
      quote: null,
      redacted: true,
    };
  }

  return { ...item, redacted: false };
}

function sortEvidenceForRole(evidence, role) {
  const focus = ROLE_CONFIG[role].focus;
  return evidence.sort((a, b) => {
    const severityDiff = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
    if (severityDiff !== 0) return severityDiff;
    const focusDiff = focus.indexOf(a.category) - focus.indexOf(b.category);
    if (focusDiff !== 0) return focusDiff;
    return new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0);
  });
}

function buildActions(level, role) {
  if (level === "数据不足") {
    return [
      { timing: "24小时内", owner: ROLE_CONFIG[role].label, task: "补齐聊天、学情和服务记录", criteria: "关键数据完整度达到60%以上" },
      { timing: "补齐后", owner: "系统", task: "重新运行客诉风险判断", criteria: "形成可追溯的风险结论" },
    ];
  }

  if (level === "低") {
    return [
      { timing: "持续观察", owner: ROLE_CONFIG[role].label, task: "按当前服务节奏跟进", criteria: "未来7天无新增异常信号" },
      { timing: "下次沟通", owner: ROLE_CONFIG[role].label, task: "确认学生学习状态和家长预期", criteria: "完成有效沟通留痕" },
    ];
  }

  const roleActions = {
    advisor: [
      { timing: level === "高" ? "2小时内" : "24小时内", owner: "顾问", task: "核实家长真实诉求并统一联系窗口", criteria: "确认是否需主管介入，形成客户沟通口径" },
      { timing: "当天", owner: "顾问", task: "协调学管、教师和规划师补齐处理信息", criteria: "责任人与下一步动作清晰" },
      { timing: "未来7天", owner: "顾问", task: "暂缓强销售动作并跟踪关系变化", criteria: "风险下降或完成升级" },
    ],
    manager: [
      { timing: level === "高" ? "2小时内" : "24小时内", owner: "学管", task: "确认家长诉求并补充线下沟通情况", criteria: "完成有效回复和沟通留痕" },
      { timing: "当天", owner: "学管", task: "推动教师/规划师提交原因和调整建议", criteria: "形成统一处理方案" },
      { timing: "未来7天", owner: "学管", task: "跟踪出勤、作业、回复和家长情绪", criteria: "关键异常至少两项改善" },
    ],
    planner: [
      { timing: level === "高" ? "2小时内" : "24小时内", owner: "规划师/规划主管", task: "核对规划节点、目标变化和家庭沟通偏好", criteria: "确认是否需调整规划和沟通方式" },
      { timing: "当天", owner: "规划主管", task: "协调跨端口信息并复核敏感沟通风险", criteria: "形成可执行的规划修正方案" },
      { timing: "未来7天", owner: "规划师", task: "跟踪节点推进和家庭反馈", criteria: "逾期收敛且沟通反馈转正" },
    ],
    quality: [
      { timing: level === "高" ? "2小时内" : "24小时内", owner: "质检", task: "核验规则命中、原始证据和历史客诉", criteria: "确认是否构成正式客诉及严重等级" },
      { timing: "当天", owner: "质检/主管", task: "确定责任端口、升级路径和处理SOP", criteria: "建立处理记录并指派责任人" },
      { timing: "完结后", owner: "质检", task: "沉淀根因、轮次和有效方案", criteria: "案例可检索、可复用" },
    ],
  };
  return roleActions[role];
}

function buildVerificationItems(evidence, completeness) {
  const items = [];
  if (evidence.some((item) => item.severity === "redline" && !item.verified)) {
    items.push("明确负面表达是正式诉求，还是情绪性表达");
  }
  if (evidence.some((item) => item.id === "reply-timeout")) {
    items.push("超时问题是否已通过电话或线下方式回复");
  }
  if (evidence.some((item) => item.id.includes("Trend") || item.id.includes("trend"))) {
    items.push("成绩下降是否受到试卷难度或评分口径变化影响");
  }
  if (evidence.some((item) => item.id === "planning-overdue")) {
    items.push("节点延期是否已与家庭协商并重新约定日期");
  }
  if (completeness.ratio < 1) {
    items.push("缺失数据是否会改变当前风险判断");
  }
  return items.slice(0, 4);
}

function buildConclusion(student, level, trend, evidence) {
  if (level === "数据不足") {
    return `${student.name}的关键数据不足，当前无法形成可靠的客诉风险判断。建议先补齐聊天、学情和服务记录，再重新分析。`;
  }
  const causes = evidence.slice(0, 3).map((item) => item.title).join("、") || "未发现明显异常";
  const statusText = student.workflowStatus === "AI预警未核实" ? "尚未正式登记客诉" : `当前处于“${student.workflowStatus}”状态`;
  const timing = level === "高" ? "建议2小时内完成内部核实，并在当天形成跨端口处理方案" : level === "中" ? "建议24小时内核实并安排跟进" : "建议按现有服务节奏持续观察";
  return `${student.name}当前为${level}风险，风险${trend}，${statusText}。主要依据为${causes}。${timing}。`;
}

function buildTimeline(evidence, role, extraEvents = []) {
  const evidenceEvents = evidence.map((item) => ({
    id: `timeline-${item.id}`,
    occurredAt: item.occurredAt,
    title: item.title,
    detail: item.redacted ? "敏感信息已按角色权限隐藏" : item.summary,
    source: item.source,
  }));

  const visibleExtra = extraEvents
    .filter((event) => !event.visibleTo || event.visibleTo.includes(role))
    .map((event) => ({ ...event }));

  return [...evidenceEvents, ...visibleExtra]
    .sort((a, b) => new Date(b.occurredAt ?? 0) - new Date(a.occurredAt ?? 0))
    .slice(0, 5)
    .map((item) => ({ ...item, displayTime: formatDateTime(item.occurredAt) }));
}

export function evaluateComplaintRisk(student, role = "manager", options = {}) {
  if (!ROLE_CONFIG[role]) throw new Error(`Unsupported role: ${role}`);
  const thresholds = { ...DEFAULT_THRESHOLDS, ...(options.thresholds ?? {}) };
  const rawEvidence = collectEvidence(student, thresholds);
  const completeness = calculateCompleteness(student);
  const level = determineLevel(rawEvidence, completeness, thresholds);
  const trend = determineTrend(level, student.previousRiskLevel);
  const adaptedEvidence = rawEvidence.map((item) => adaptEvidenceForRole(item, role));
  const sortedEvidence = sortEvidenceForRole(adaptedEvidence, role);

  return {
    meta: {
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      servicePort: student.servicePort,
      role: ROLE_CONFIG[role].label,
      permission: ROLE_CONFIG[role].permission,
      updatedAt: student.updatedAt,
      observationWindow: "近30天",
      scoreWindow: "最近3个月",
    },
    risk: {
      level,
      trend,
      status: student.workflowStatus,
      disclaimer: "AI预警，不等于正式客诉判定",
    },
    completeness: {
      ...completeness,
      label: `${completeness.available}/${completeness.total}`,
    },
    conclusion: buildConclusion(student, level, trend, sortedEvidence),
    allEvidence: sortedEvidence,
    evidence: sortedEvidence.slice(0, 5),
    evidenceTotal: sortedEvidence.length,
    timeline: buildTimeline(sortedEvidence, role, student.extraEvents),
    actions: buildActions(level, role),
    verificationItems: buildVerificationItems(sortedEvidence, completeness),
    permissions: {
      canViewRawCrossPortEvidence: role === "quality",
      canViewFinancialDetails: role === "advisor" || role === "quality",
      canConfirmComplaint: role === "quality",
    },
  };
}

export function getRiskLevelForAllRoles(student) {
  return Object.keys(ROLE_CONFIG).reduce((result, role) => {
    result[role] = evaluateComplaintRisk(student, role).risk.level;
    return result;
  }, {});
}
