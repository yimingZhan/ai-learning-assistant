export type RiskLevel = "high" | "medium" | "low";
export type RiskType = "跟进及时性" | "退费" | "客诉";
export type RiskStudentSort = "risk" | "latest" | "pendingCount";

export type RiskStudent = {
  id: string;
  studentName: string;
  studentNumber: string;
  status: RiskEventStatus;
  riskLevel: RiskLevel;
  coreRisk: string;
  pendingRiskCount: number;
  latestRiskTime: string;
  owner: string;
  relatedPeople?: RelatedPerson[];
  dataStatus?: string;
};

export type RiskStudentFilters = {
  student?: string;
  riskLevel?: RiskLevel;
  riskTypes?: RiskType[];
  eventTime?: [string, string];
  employeeDepartments?: string[];
  relatedPerson?: string;
};

export type EmployeeDepartmentNode = {
  title: string;
  value: string;
  children?: EmployeeDepartmentNode[];
};

export type RelatedPerson = {
  name: string;
  roles: string[];
};

export type RiskTextSegment = {
  text: string;
  highlighted?: boolean;
};

export type FullChatMessage = {
  id: string;
  sender: string;
  role: string;
  occurredAt: string;
  content: RiskTextSegment[];
};

export type EvidenceSourceType = "wechat_direct" | "wechat_group";

export type EvidenceEmployee = {
  name: string;
  role: string;
};

export type RiskKeyQuote = {
  occurredAt: string;
  speaker: string;
  wechatNickname?: string;
  content: string;
};

type BaseWechatEvidence = {
  id: string;
  keyQuotes: [RiskKeyQuote, ...RiskKeyQuote[]];
  contentSummary: RiskTextSegment[];
  employees: EvidenceEmployee[];
  fullChat: FullChatMessage[];
};

export type WechatDirectEvidence = BaseWechatEvidence & {
  sourceType: "wechat_direct";
};

export type WechatGroupEvidence = BaseWechatEvidence & {
  sourceType: "wechat_group";
  groupName: string;
};

export type WechatEvidence = WechatDirectEvidence | WechatGroupEvidence;
export type RiskEvidence = WechatEvidence;

export type RiskEventStatus = "pending" | "resolved" | "excluded";

export type RiskEvent = {
  id: string;
  riskType: RiskType;
  riskLevel: RiskLevel;
  status: RiskEventStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  excludedBy?: string;
  excludedAt?: string;
  riskSummary: string;
  handlingSuggestion: string;
  evidence: RiskEvidence[];
  keywords: string[];
  similarSentences: string[];
};

export type RiskEventGroup = {
  date: string;
  events: RiskEvent[];
};

export type RiskWorkflowStep = {
  id: string;
  title: string;
  owner: string;
  time: string;
  status: "finish" | "process" | "wait";
  action?: string;
};

export type RiskServiceProfile = {
  grade: string;
  currentFollowUpAdvisor: string;
  followUpManager: string;
  sharedAdvisor: string;
  planner: string;
  course: string;
  serviceMode: string;
  guardianContact: string;
  serviceStartDate: string;
};

export type RiskHistoryRecord = {
  id: string;
  date: string;
  type: string;
  summary: string;
  status: "resolved" | "follow-up";
};

export type RiskOperationLog = {
  id: string;
  eventId?: string;
  category: "处理记录" | "系统识别" | "访问记录";
  operationType: string;
  operator: string;
  result: "success" | "error";
  operatedAt: string;
  remark: string;
};

export type RiskProcessingStatus = "待跟进" | "跟进中" | "已处理" | "已排除";

export const riskEventStatusMeta: Record<
  RiskEventStatus,
  { label: string; color: "processing" | "success" | "default" }
> = {
  pending: { label: "待处理", color: "processing" },
  resolved: { label: "已处理", color: "success" },
  excluded: { label: "已排除", color: "default" },
};

export function getRiskStudentStatus(events: RiskEvent[]): RiskEventStatus {
  if (events.some((event) => event.status === "pending")) return "pending";
  if (
    events.length > 0 &&
    events.every((event) => event.status === "excluded")
  ) {
    return "excluded";
  }
  return "resolved";
}

export type RiskStudentDetail = {
  student: RiskStudent;
  assessmentPeriod: [string, string];
  aiSummary: string;
  themes: Array<{ label: string; count: number }>;
  handlingSuggestion: string;
  latestRiskDate: string;
  eventGroups: RiskEventGroup[];
  currentStatus: RiskProcessingStatus;
  riskScore: number;
  workflowSteps: RiskWorkflowStep[];
  serviceProfile: RiskServiceProfile;
  historyRecords: RiskHistoryRecord[];
  operationLogs: RiskOperationLog[];
};

export type UpdateRiskEventStatusResponse = {
  student: RiskStudent;
  detail: RiskStudentDetail;
};

export const riskLevelMeta: Record<
  RiskLevel,
  { label: string; fullLabel: string; color: "error" | "warning" | "success" }
> = {
  high: { label: "高", fullLabel: "高风险", color: "error" },
  medium: { label: "中", fullLabel: "中风险", color: "warning" },
  low: { label: "低", fullLabel: "低风险", color: "success" },
};

export const riskTypeOptions: Array<{ label: RiskType; value: RiskType }> = [
  { label: "跟进及时性", value: "跟进及时性" },
  { label: "退费", value: "退费" },
  { label: "客诉", value: "客诉" },
];

export const evidenceSourceMeta: Record<
  EvidenceSourceType,
  { label: string; actionLabel: string }
> = {
  wechat_direct: { label: "企微单聊", actionLabel: "查看完整聊天" },
  wechat_group: { label: "企微群聊", actionLabel: "查看完整聊天" },
};

export const employeeDepartmentTree: EmployeeDepartmentNode[] = [
  {
    title: "上海分校",
    value: "shanghai-campus",
    children: [
      {
        title: "学管部",
        value: "shanghai-student-management",
        children: [
          {
            title: "上海学管一组",
            value: "shanghai-student-management-group-1",
          },
          {
            title: "上海学管二组",
            value: "shanghai-student-management-group-2",
          },
        ],
      },
    ],
  },
];

const employeeDepartmentByName: Record<string, string> = {
  周欣: "shanghai-student-management-group-1",
  李辰: "shanghai-student-management-group-1",
  钱悦: "shanghai-student-management-group-1",
  王珊: "shanghai-student-management-group-2",
  赵敏: "shanghai-student-management-group-2",
  孙超: "shanghai-student-management-group-2",
  徐晨: "shanghai-student-management-group-2",
  孟涵: "shanghai-student-management-group-2",
};

function getSelectedEmployeeDepartmentLeaves(selectedValues: string[]) {
  const leaves = new Set<string>();
  const selected = new Set(selectedValues);

  function visit(node: EmployeeDepartmentNode, ancestorSelected: boolean) {
    const nodeSelected = ancestorSelected || selected.has(node.value);
    if (!node.children?.length) {
      if (nodeSelected) leaves.add(node.value);
      return;
    }
    for (const child of node.children) visit(child, nodeSelected);
  }

  for (const node of employeeDepartmentTree) visit(node, false);
  return leaves;
}

export const riskStudents: RiskStudent[] = [
  {
    id: "risk-student-001",
    studentName: "林家宁",
    studentNumber: "S2026001",
    status: "pending",
    riskLevel: "high",
    coreRisk: "家长持续反馈联系不及时，并同时出现退费和换老师诉求",
    pendingRiskCount: 4,
    latestRiskTime: "2026-08-09 09:12",
    owner: "周欣",
  },
  {
    id: "risk-student-002",
    studentName: "陈子轩",
    studentNumber: "S2026002",
    status: "pending",
    riskLevel: "high",
    coreRisk: "家长对当前老师和服务方案不满，并咨询退费",
    pendingRiskCount: 3,
    latestRiskTime: "2026-08-08 16:20",
    owner: "李辰",
  },
  {
    id: "risk-student-003",
    studentName: "周沐阳",
    studentNumber: "S2026003",
    status: "pending",
    riskLevel: "medium",
    coreRisk: "排课反馈长期未闭环，家长多次催促",
    pendingRiskCount: 1,
    latestRiskTime: "2026-08-06 11:05",
    owner: "王珊",
  },
  {
    id: "risk-student-004",
    studentName: "沈雨桐",
    studentNumber: "S2026004",
    status: "excluded",
    riskLevel: "low",
    coreRisk: "一次反馈时效问题已由人工确认并排除",
    pendingRiskCount: 0,
    latestRiskTime: "2026-08-04 14:18",
    owner: "赵敏",
  },
  {
    id: "risk-student-005",
    studentName: "高亦辰",
    studentNumber: "S2026005",
    status: "pending",
    riskLevel: "medium",
    coreRisk: "服务响应和退费咨询并存，当前仍有事项待闭环",
    pendingRiskCount: 3,
    latestRiskTime: "2026-08-02 18:36",
    owner: "孙超",
  },
  {
    id: "risk-student-006",
    studentName: "吴知夏",
    studentNumber: "S2026006",
    status: "pending",
    riskLevel: "medium",
    coreRisk: "家长对反馈速度和老师风格均有明确意见",
    pendingRiskCount: 2,
    latestRiskTime: "2026-08-01 17:26",
    owner: "孟涵",
  },
];

function normal(text: string): RiskTextSegment {
  return { text };
}

function highlighted(text: string): RiskTextSegment {
  return { text, highlighted: true };
}

type WechatEvidenceCommonInput = {
  id: string;
  occurredAt: string;
  employee: string;
  employeeRole?: string;
  parentWechatNickname?: string;
  parentText: string;
  reply: string;
  additionalEmployees?: EvidenceEmployee[];
  additionalMessages?: FullChatMessage[];
  extraQuotes?: RiskKeyQuote[];
};

type WechatEvidenceInput =
  | (WechatEvidenceCommonInput & { sourceType: "wechat_direct" })
  | (WechatEvidenceCommonInput & {
      sourceType: "wechat_group";
      groupName: string;
    });

function addMinutes(timestamp: string, minutesToAdd: number) {
  const match = /(\d{2}):(\d{2})$/.exec(timestamp);
  if (!match) return timestamp;
  const totalMinutes = Number(match[1]) * 60 + Number(match[2]) + minutesToAdd;
  return timestamp.replace(
    /(\d{2}):(\d{2})$/,
    `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(
      totalMinutes % 60,
    ).padStart(2, "0")}`,
  );
}

function createWechatEvidence(input: WechatEvidenceInput): WechatEvidence {
  const employeeRole = input.employeeRole ?? "学管";
  const base: BaseWechatEvidence = {
    id: input.id,
    keyQuotes: [
      {
        occurredAt: input.occurredAt,
        speaker: "家长",
        wechatNickname: input.parentWechatNickname ?? "家长",
        content: input.parentText,
      },
      ...(input.extraQuotes ?? []),
    ],
    contentSummary: [normal("家长反馈："), highlighted(input.parentText)],
    employees: [
      { name: input.employee, role: employeeRole },
      ...(input.additionalEmployees ?? []),
    ],
    fullChat: [
      {
        id: `${input.id}-message-1`,
        sender: input.parentWechatNickname ?? "家长",
        role: "家长",
        occurredAt: input.occurredAt,
        content: [highlighted(input.parentText)],
      },
      {
        id: `${input.id}-message-2`,
        sender: input.employee,
        role: employeeRole,
        occurredAt: addMinutes(input.occurredAt, 3),
        content: [normal(input.reply)],
      },
      ...(input.additionalMessages ?? []),
    ],
  };

  return input.sourceType === "wechat_group"
    ? { ...base, sourceType: "wechat_group", groupName: input.groupName }
    : { ...base, sourceType: "wechat_direct" };
}

const similarSentencesByRiskType: Record<RiskType, string[]> = {
  跟进及时性: [
    "这几天一直联系不上老师。",
    "说好了给我反馈，到现在还没有消息。",
  ],
  退费: [
    "剩下还有多少课时？退费的话能退多少钱？",
    "我已经申请退费了，大概什么时候能到账？",
  ],
  客诉: [
    "我对现在这个老师真的不满意。",
    "这个老师的教学风格不适合孩子，能不能换一个？",
  ],
};

type RiskEventInput = Omit<RiskEvent, "similarSentences"> & {
  similarSentences?: string[];
};

function createEvent(event: RiskEventInput): RiskEvent {
  return {
    ...event,
    similarSentences:
      event.similarSentences ??
      structuredClone(similarSentencesByRiskType[event.riskType]),
  };
}

const linFollowDirect = createWechatEvidence({
  id: "lin-follow-direct",
  sourceType: "wechat_direct",
  occurredAt: "2026-08-09 09:12",
  employee: "周欣",
  parentWechatNickname: "家宁妈妈",
  parentText: "我找不到负责的老师，这两天一直联系不上。",
  reply: "抱歉让您久等，我马上确认负责人并在今天给您完整反馈。",
});

const linFollowGroup = createWechatEvidence({
  id: "lin-follow-group",
  sourceType: "wechat_group",
  groupName: "林家宁服务沟通群",
  occurredAt: "2026-08-09 09:25",
  employee: "周欣",
  parentWechatNickname: "家宁妈妈",
  parentText: "昨天说好今天反馈，到现在还未反馈。",
  reply: "我正在汇总处理进度，十点前在群里逐项回复。",
  additionalEmployees: [{ name: "李辰", role: "课程顾问" }],
});

const linRefundDirect = createWechatEvidence({
  id: "lin-refund-direct",
  sourceType: "wechat_direct",
  occurredAt: "2026-08-09 10:18",
  employee: "周欣",
  parentWechatNickname: "家宁妈妈",
  parentText: "这个课想退费，现在还剩多少钱、还有多少课时？",
  reply: "我先核对剩余课时和可退金额，今天内给您准确答复。",
});

const linRefundGroup = createWechatEvidence({
  id: "lin-refund-group",
  sourceType: "wechat_group",
  groupName: "林家宁课程服务群",
  occurredAt: "2026-08-09 10:32",
  employee: "李辰",
  parentWechatNickname: "家宁妈妈",
  employeeRole: "课程顾问",
  parentText: "如果决定退了，什么时候到账？",
  reply: "到账时间需要结合审核节点确认，我会把完整流程同步到群里。",
});

const linComplaintDirect = createWechatEvidence({
  id: "lin-complaint-direct",
  sourceType: "wechat_direct",
  occurredAt: "2026-08-09 11:06",
  employee: "周欣",
  parentWechatNickname: "家宁妈妈",
  parentText: "我对现在这个老师不满意，孩子也不喜欢。",
  reply: "我会先了解孩子不适应的具体环节，再给您匹配调整方案。",
});

const linComplaintGroup = createWechatEvidence({
  id: "lin-complaint-group",
  sourceType: "wechat_group",
  groupName: "林家宁升学规划群",
  occurredAt: "2026-08-09 11:20",
  employee: "李辰",
  parentWechatNickname: "家宁妈妈",
  employeeRole: "课程顾问",
  parentText: "老师风格不合适，请尽快换老师；这次申请结果还全拒了。",
  reply: "我们会分别复盘老师匹配和申请结果，并在今天给出负责人和时间点。",
  additionalEmployees: [{ name: "周欣", role: "学管" }],
});

function buildThemes(groups: RiskEventGroup[]) {
  const counts = new Map<string, number>();
  for (const event of groups.flatMap((group) => group.events)) {
    counts.set(event.riskType, (counts.get(event.riskType) ?? 0) + 1);
  }
  return [...counts].map(([label, count]) => ({ label, count }));
}

function createDetail(
  student: RiskStudent,
  eventGroups: RiskEventGroup[],
  profile: RiskServiceProfile,
  aiSummary: string,
  handlingSuggestion: string,
): RiskStudentDetail {
  const totalEvents = eventGroups.reduce(
    (total, group) => total + group.events.length,
    0,
  );
  const terminalOperationLogs: RiskOperationLog[] = eventGroups.flatMap(
    (group) =>
      group.events.flatMap((event) => {
        if (
          event.status === "resolved" &&
          event.resolvedBy &&
          event.resolvedAt
        ) {
          return [
            {
              id: `${student.id}-operation-resolved-${event.id}`,
              eventId: event.id,
              category: "处理记录",
              operationType: "标记风险为已处理",
              operator: event.resolvedBy,
              result: "success",
              operatedAt: event.resolvedAt,
              remark: `${event.riskType}风险已处理`,
            } satisfies RiskOperationLog,
          ];
        }
        if (
          event.status === "excluded" &&
          event.excludedBy &&
          event.excludedAt
        ) {
          return [
            {
              id: `${student.id}-operation-excluded-${event.id}`,
              eventId: event.id,
              category: "处理记录",
              operationType: "排除风险",
              operator: event.excludedBy,
              result: "success",
              operatedAt: event.excludedAt,
              remark: `${event.riskType}风险已排除`,
            } satisfies RiskOperationLog,
          ];
        }
        return [];
      }),
  );
  return {
    student,
    assessmentPeriod: ["2026-07-10", eventGroups[0].date],
    aiSummary,
    themes: buildThemes(eventGroups),
    handlingSuggestion,
    latestRiskDate: eventGroups[0].date,
    eventGroups,
    currentStatus:
      student.status === "pending"
        ? "跟进中"
        : student.status === "excluded"
          ? "已排除"
          : "已处理",
    riskScore:
      student.riskLevel === "high"
        ? 88
        : student.riskLevel === "medium"
          ? 64
          : 32,
    workflowSteps: [
      {
        id: `${student.id}-workflow-1`,
        title: "AI 识别风险",
        owner: "系统",
        time: student.latestRiskTime,
        status: "finish",
      },
      {
        id: `${student.id}-workflow-2`,
        title: "负责人跟进",
        owner: student.owner,
        time: "待完成",
        status: student.pendingRiskCount ? "process" : "finish",
      },
    ],
    serviceProfile: profile,
    historyRecords: [],
    operationLogs: [
      ...terminalOperationLogs,
      {
        id: `${student.id}-operation-1`,
        category: "系统识别",
        operationType: "生成客诉风险",
        operator: "AI 客诉预警",
        result: "success",
        operatedAt: student.latestRiskTime,
        remark: `命中 ${totalEvents} 条风险事件`,
      },
    ],
  };
}

const profiles: Record<string, RiskServiceProfile> = {
  "risk-student-001": {
    grade: "12年级",
    currentFollowUpAdvisor: "周欣",
    followUpManager: "周欣",
    sharedAdvisor: "钱悦",
    planner: "钱悦",
    course: "A-Level 数学进阶",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2025-09-01",
  },
  "risk-student-002": {
    grade: "11年级",
    currentFollowUpAdvisor: "李辰",
    followUpManager: "李辰",
    sharedAdvisor: "徐晨",
    planner: "徐晨",
    course: "国际课程规划",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2025-10-12",
  },
  "risk-student-003": {
    grade: "10年级",
    currentFollowUpAdvisor: "王珊",
    followUpManager: "王珊",
    sharedAdvisor: "李辰",
    planner: "李辰",
    course: "托福基础提升",
    serviceMode: "小班课",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-01-06",
  },
  "risk-student-004": {
    grade: "9年级",
    currentFollowUpAdvisor: "赵敏",
    followUpManager: "赵敏",
    sharedAdvisor: "周欣",
    planner: "周欣",
    course: "学业能力提升",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-02-18",
  },
  "risk-student-005": {
    grade: "11年级",
    currentFollowUpAdvisor: "孙超",
    followUpManager: "孙超",
    sharedAdvisor: "王珊",
    planner: "王珊",
    course: "雅思冲刺课程",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2025-11-20",
  },
  "risk-student-006": {
    grade: "10年级",
    currentFollowUpAdvisor: "孟涵",
    followUpManager: "孟涵",
    sharedAdvisor: "徐晨",
    planner: "徐晨",
    course: "国际课程衔接",
    serviceMode: "小班课",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-03-03",
  },
};

const linGroups: RiskEventGroup[] = [
  {
    date: "2026-08-09",
    events: [
      createEvent({
        id: "lin-event-follow-0809",
        riskType: "跟进及时性",
        riskLevel: "high",
        status: "pending",
        riskSummary: "家长连续反馈找不到负责人、联系不上且未按约定收到反馈。",
        handlingSuggestion:
          "立即确认唯一负责人和反馈时点，并在群内逐项闭环未回复事项。",
        keywords: ["找不到人", "联系不上", "未反馈"],
        evidence: [linFollowDirect, linFollowGroup],
      }),
      createEvent({
        id: "lin-event-refund-0809",
        riskType: "退费",
        riskLevel: "high",
        status: "pending",
        riskSummary: "家长已咨询退费金额、剩余课时和退款到账时间。",
        handlingSuggestion:
          "当天核对可退金额、剩余课时、审核步骤和预计到账时间并一次性回复。",
        keywords: [
          "退费",
          "退了",
          "还剩多少钱",
          "还有多少课时",
          "什么时候到账",
        ],
        evidence: [linRefundDirect, linRefundGroup],
      }),
      createEvent({
        id: "lin-event-complaint-0809",
        riskType: "客诉",
        riskLevel: "medium",
        status: "pending",
        riskSummary:
          "家长明确表示对老师不满意、孩子不喜欢当前风格并提出换老师。",
        handlingSuggestion:
          "复盘老师匹配和申请结果，提供可选师资与明确调整时间。",
        keywords: ["不满意", "不喜欢", "风格不合适", "换老师", "全拒"],
        evidence: [linComplaintDirect, linComplaintGroup],
      }),
    ],
  },
  {
    date: "2026-08-08",
    events: [
      createEvent({
        id: "lin-event-follow-0808",
        riskType: "跟进及时性",
        riskLevel: "medium",
        status: "pending",
        riskSummary: "家长催促前一日提出的课程调整事项，希望得到明确反馈。",
        handlingSuggestion: "补充当前处理进度并明确下一次主动同步时间。",
        keywords: ["未反馈"],
        evidence: [
          createWechatEvidence({
            id: "lin-follow-0808-direct",
            sourceType: "wechat_direct",
            occurredAt: "2026-08-08 16:08",
            employee: "周欣",
            parentWechatNickname: "家宁妈妈",
            parentText: "昨天提的课程调整还没有反馈，今天能给结论吗？",
            reply: "可以，我确认完老师时间后在今天六点前回复您。",
          }),
        ],
      }),
    ],
  },
  {
    date: "2026-08-07",
    events: [
      createEvent({
        id: "lin-event-complaint-0807",
        riskType: "客诉",
        riskLevel: "low",
        status: "resolved",
        resolvedBy: "周欣",
        resolvedAt: "2026-08-07 19:05:00",
        riskSummary: "家长对一次课堂节奏提出意见，负责人已完成解释和调整。",
        handlingSuggestion: "继续观察下一节课反馈，无需新增处理动作。",
        keywords: ["不喜欢"],
        evidence: [
          createWechatEvidence({
            id: "lin-complaint-0807-group",
            sourceType: "wechat_group",
            groupName: "林家宁课程服务群",
            occurredAt: "2026-08-07 18:45",
            employee: "周欣",
            parentWechatNickname: "家宁妈妈",
            parentText: "孩子不太喜欢今天的课堂节奏，希望下次慢一点。",
            reply: "已经和老师确认，下节课会调整节奏并增加理解检查。",
          }),
        ],
      }),
    ],
  },
];

function simpleEvidence(
  id: string,
  sourceType: EvidenceSourceType,
  occurredAt: string,
  employee: string,
  parentText: string,
  reply: string,
  groupName?: string,
) {
  return sourceType === "wechat_group"
    ? createWechatEvidence({
        id,
        sourceType,
        groupName: groupName ?? `${employee}服务沟通群`,
        occurredAt,
        employee,
        parentText,
        reply,
      })
    : createWechatEvidence({
        id,
        sourceType,
        occurredAt,
        employee,
        parentText,
        reply,
      });
}

const detailDefinitions: Array<{
  student: RiskStudent;
  groups: RiskEventGroup[];
  summary: string;
  suggestion: string;
}> = [
  {
    student: riskStudents[0],
    groups: linGroups,
    summary:
      "家长当前同时存在跟进时效、退费与老师服务客诉，需优先完成明确回复和责任人升级。",
    suggestion:
      "由周欣牵头，在当日完成未反馈事项、退费口径和师资调整三项闭环。",
  },
  {
    student: riskStudents[1],
    groups: [
      {
        date: "2026-08-08",
        events: [
          createEvent({
            id: "chen-event-complaint",
            riskType: "客诉",
            riskLevel: "high",
            status: "pending",
            riskSummary: "家长认为老师教学风格与孩子不匹配并要求换老师。",
            handlingSuggestion: "提供两名备选老师及试听安排。",
            keywords: ["风格不合适", "换老师"],
            evidence: [
              simpleEvidence(
                "chen-complaint",
                "wechat_direct",
                "2026-08-08 16:20",
                "李辰",
                "这个老师风格不合适，我们想换老师。",
                "我今天提供两名备选老师供您确认。",
              ),
            ],
          }),
          createEvent({
            id: "chen-event-refund",
            riskType: "退费",
            riskLevel: "high",
            status: "pending",
            riskSummary: "家长表示若师资无法调整将申请退费。",
            handlingSuggestion: "同步师资调整方案和退费流程边界。",
            keywords: ["退费"],
            evidence: [
              simpleEvidence(
                "chen-refund",
                "wechat_group",
                "2026-08-08 16:46",
                "李辰",
                "老师换不了的话我们就退费。",
                "我先确认师资方案，今晚同步结果。",
                "陈子轩课程服务群",
              ),
            ],
          }),
        ],
      },
      {
        date: "2026-08-06",
        events: [
          createEvent({
            id: "chen-event-follow",
            riskType: "跟进及时性",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "家长反馈课程方案两日未获得答复。",
            handlingSuggestion: "立即回复进度并设定固定同步节点。",
            keywords: ["未反馈"],
            evidence: [
              simpleEvidence(
                "chen-follow",
                "wechat_direct",
                "2026-08-06 15:12",
                "李辰",
                "课程方案问了两天还没有反馈。",
                "我今天五点前把完整方案发给您。",
              ),
            ],
          }),
        ],
      },
    ],
    summary: "师资客诉已升级为潜在退费，需要在明确时限内给出替代方案。",
    suggestion: "由李辰当日完成师资调整方案并同步退费边界。",
  },
  {
    student: riskStudents[2],
    groups: [
      {
        date: "2026-08-06",
        events: [
          createEvent({
            id: "zhou-event-follow-pending",
            riskType: "跟进及时性",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "排课冲突多次沟通后仍未得到最终反馈。",
            handlingSuggestion: "提供两个无冲突时段并完成群内确认。",
            keywords: ["未反馈", "联系不上"],
            evidence: [
              simpleEvidence(
                "zhou-follow-pending",
                "wechat_group",
                "2026-08-06 11:05",
                "王珊",
                "排课问题说了几次还没反馈最终时间。",
                "我午后给您两个可选时间。",
                "周沐阳排课沟通群",
              ),
            ],
          }),
        ],
      },
      {
        date: "2026-08-05",
        events: [
          createEvent({
            id: "zhou-event-follow-resolved",
            riskType: "跟进及时性",
            riskLevel: "low",
            status: "resolved",
            resolvedBy: "王珊",
            resolvedAt: "2026-08-05 16:10:00",
            riskSummary: "首次调课催办已完成反馈。",
            handlingSuggestion: "保持固定时段，后续主动同步。",
            keywords: ["未反馈"],
            evidence: [
              simpleEvidence(
                "zhou-follow-resolved",
                "wechat_direct",
                "2026-08-05 15:40",
                "王珊",
                "调课结果还没收到。",
                "新的固定时段已确认并发送给您。",
              ),
            ],
          }),
        ],
      },
    ],
    summary: "当前仍有一项排课反馈待闭环。",
    suggestion: "由王珊确认固定时段并主动回传结果。",
  },
  {
    student: riskStudents[3],
    groups: [
      {
        date: "2026-08-04",
        events: [
          createEvent({
            id: "shen-event-follow-excluded",
            riskType: "跟进及时性",
            riskLevel: "low",
            status: "excluded",
            excludedBy: "赵敏",
            excludedAt: "2026-08-04 14:30:00",
            riskSummary: "系统识别到催促表达，人工确认当时已在约定时限内回复。",
            handlingSuggestion: "无需处理，保留识别记录供后续校准。",
            keywords: ["未反馈"],
            evidence: [
              simpleEvidence(
                "shen-follow-excluded",
                "wechat_direct",
                "2026-08-04 14:18",
                "赵敏",
                "今天的课后反馈稍后能发我吗？",
                "可以，按约定会在晚上八点前发送。",
              ),
            ],
          }),
        ],
      },
    ],
    summary: "当前事件已排除，不存在待处理风险。",
    suggestion: "维持原反馈节奏。",
  },
  {
    student: riskStudents[4],
    groups: [
      {
        date: "2026-08-02",
        events: [
          createEvent({
            id: "gao-event-follow",
            riskType: "跟进及时性",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "多个服务问题回复缓慢且没有明确处理结论。",
            handlingSuggestion: "建立未结事项清单并逐项标注负责人和截止时间。",
            keywords: ["联系不上", "未反馈"],
            evidence: [
              simpleEvidence(
                "gao-follow",
                "wechat_group",
                "2026-08-02 18:36",
                "孙超",
                "之前提的问题一直联系不上负责人，也没有反馈。",
                "我已汇总所有事项，明早逐项回复。",
                "高亦辰服务沟通群",
              ),
            ],
          }),
          createEvent({
            id: "gao-event-refund",
            riskType: "退费",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "家长开始咨询退费流程和到账时间。",
            handlingSuggestion: "先回应未结诉求，同时准确说明退费节点。",
            keywords: ["退费", "什么时候到账"],
            evidence: [
              simpleEvidence(
                "gao-refund",
                "wechat_direct",
                "2026-08-02 19:00",
                "孙超",
                "如果退费，大概什么时候到账？",
                "我先解决当前问题，也会把退费流程说明清楚。",
              ),
            ],
          }),
        ],
      },
      {
        date: "2026-08-01",
        events: [
          createEvent({
            id: "gao-event-complaint",
            riskType: "客诉",
            riskLevel: "low",
            status: "pending",
            riskSummary: "家长对周末课程频繁变化表示不满。",
            handlingSuggestion: "锁定固定周末时段并避免未经确认的调整。",
            keywords: ["不满意"],
            evidence: [
              simpleEvidence(
                "gao-complaint",
                "wechat_direct",
                "2026-08-01 10:40",
                "孙超",
                "我对周末时间一直变很不满意。",
                "我重新锁定固定时段，未经您确认不再调整。",
              ),
            ],
          }),
        ],
      },
      {
        date: "2026-07-31",
        events: [
          createEvent({
            id: "gao-event-follow-resolved",
            riskType: "跟进及时性",
            riskLevel: "low",
            status: "resolved",
            resolvedBy: "孙超",
            resolvedAt: "2026-07-31 16:40:00",
            riskSummary: "首次催办事项已完成回复。",
            handlingSuggestion: "继续按节点主动同步。",
            keywords: ["未反馈"],
            evidence: [
              simpleEvidence(
                "gao-follow-resolved",
                "wechat_group",
                "2026-07-31 16:10",
                "孙超",
                "上次的问题还没有反馈。",
                "处理结果已经整理好，现在同步到群里。",
                "高亦辰服务沟通群",
              ),
            ],
          }),
        ],
      },
    ],
    summary: "服务反馈和退费咨询并存，三项风险仍待处理。",
    suggestion: "由孙超建立清单并在下一工作日上午完成首轮闭环。",
  },
  {
    student: riskStudents[5],
    groups: [
      {
        date: "2026-08-01",
        events: [
          createEvent({
            id: "wu-event-follow",
            riskType: "跟进及时性",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "家长反馈两次留言均未得到及时回复。",
            handlingSuggestion: "当天回复并确认后续固定联系人。",
            keywords: ["找不到人", "未反馈"],
            evidence: [
              simpleEvidence(
                "wu-follow",
                "wechat_direct",
                "2026-08-01 17:26",
                "孟涵",
                "我留言两次都未反馈，也找不到人。",
                "抱歉，我会作为固定联系人持续跟进。",
              ),
            ],
          }),
          createEvent({
            id: "wu-event-complaint",
            riskType: "客诉",
            riskLevel: "medium",
            status: "pending",
            riskSummary: "家长表示孩子不喜欢当前老师的课堂风格。",
            handlingSuggestion: "安排一次师资匹配复盘并提供试听选择。",
            keywords: ["不喜欢", "风格不合适"],
            evidence: [
              simpleEvidence(
                "wu-complaint",
                "wechat_group",
                "2026-08-01 17:40",
                "孟涵",
                "孩子不喜欢现在老师，感觉风格不合适。",
                "我会准备备选老师并安排试听。",
                "吴知夏课程服务群",
              ),
            ],
          }),
        ],
      },
    ],
    summary: "反馈时效和老师风格问题同时存在。",
    suggestion: "由孟涵当天确认固定联系人和备选老师安排。",
  },
];

export const riskStudentDetails: Record<string, RiskStudentDetail> =
  Object.fromEntries(
    detailDefinitions.map(({ student, groups, summary, suggestion }) => [
      student.id,
      createDetail(student, groups, profiles[student.id], summary, suggestion),
    ]),
  );

export function getEvidenceCommunicationAt(evidence: RiskEvidence) {
  return evidence.keyQuotes[0].occurredAt;
}

export function getRiskEventRelatedPeople(studentId: string): RelatedPerson[] {
  const detail = riskStudentDetails[studentId];
  if (!detail) return [];
  const people = new Map<string, RelatedPerson>();

  for (const event of detail.eventGroups.flatMap((group) => group.events)) {
    for (const evidence of event.evidence) {
      for (const employee of evidence.employees) {
        const person = people.get(employee.name);
        if (!person) {
          people.set(employee.name, {
            name: employee.name,
            roles: [employee.role],
          });
        } else if (!person.roles.includes(employee.role)) {
          person.roles.push(employee.role);
        }
      }
    }
  }

  return [...people.values()];
}

export const relatedPersonOptions = (() => {
  const people = new Map<string, string[]>();
  for (const student of riskStudents) {
    for (const person of getRiskEventRelatedPeople(student.id)) {
      const roles = people.get(person.name) ?? [];
      for (const role of person.roles) {
        if (!roles.includes(role)) roles.push(role);
      }
      people.set(person.name, roles);
    }
  }
  return [...people].map(([name, roles]) => ({
    label: `${name}（${roles.join("、")}）`,
    value: name,
  }));
})();

export function filterRiskStudents(
  records: RiskStudent[],
  filters: RiskStudentFilters,
) {
  const keyword = filters.student?.trim().toLocaleLowerCase();
  const [startDate, endDate] = filters.eventTime ?? [];
  const selectedDepartments = getSelectedEmployeeDepartmentLeaves(
    filters.employeeDepartments ?? [],
  );

  return records.filter((record) => {
    const matchesStudent =
      !keyword ||
      record.studentName.toLocaleLowerCase().includes(keyword) ||
      record.studentNumber.toLocaleLowerCase().includes(keyword);
    const matchesLevel =
      !filters.riskLevel || record.riskLevel === filters.riskLevel;
    const matchesRiskType =
      !filters.riskTypes?.length ||
      riskStudentDetails[record.id]?.eventGroups.some((group) =>
        group.events.some((event) =>
          filters.riskTypes?.includes(event.riskType),
        ),
      );
    const eventDate = record.latestRiskTime.slice(0, 10);
    const matchesTime =
      (!startDate || eventDate >= startDate) &&
      (!endDate || eventDate <= endDate);
    const relatedPeople = record.relatedPeople?.length
      ? record.relatedPeople
      : getRiskEventRelatedPeople(record.id);
    const matchesPerson =
      !filters.relatedPerson ||
      relatedPeople.some((person) => person.name === filters.relatedPerson);
    const matchesDepartment =
      selectedDepartments.size === 0 ||
      relatedPeople.some((person) => {
        const department = employeeDepartmentByName[person.name];
        return department ? selectedDepartments.has(department) : false;
      });

    return (
      matchesStudent &&
      matchesLevel &&
      matchesRiskType &&
      matchesTime &&
      matchesPerson &&
      matchesDepartment
    );
  });
}

const riskLevelWeight: Record<RiskLevel, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function sortRiskStudents(
  records: RiskStudent[],
  sort: RiskStudentSort,
) {
  return [...records].sort((left, right) => {
    if (sort === "pendingCount") {
      return (
        right.pendingRiskCount - left.pendingRiskCount ||
        right.latestRiskTime.localeCompare(left.latestRiskTime)
      );
    }
    if (sort === "latest") {
      return right.latestRiskTime.localeCompare(left.latestRiskTime);
    }
    return (
      riskLevelWeight[right.riskLevel] - riskLevelWeight[left.riskLevel] ||
      right.latestRiskTime.localeCompare(left.latestRiskTime)
    );
  });
}
