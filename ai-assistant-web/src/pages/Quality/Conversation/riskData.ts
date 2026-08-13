export type RiskLevel = "high" | "medium" | "low";
export type RiskSource = "wechat" | "phone";
export type RiskStudentSort = "risk" | "latest" | "eventCount";

export type RiskStudent = {
  id: string;
  studentName: string;
  studentNumber: string;
  riskLevel: RiskLevel;
  coreRisk: string;
  riskEventCount: number;
  riskSources: RiskSource[];
  latestRiskTime: string;
  owner: string;
  relatedPeople?: RelatedPerson[];
  dataStatus?: string;
};

export type RiskStudentFilters = {
  student?: string;
  riskLevel?: RiskLevel;
  riskSources?: RiskSource[];
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

export type WechatEvidence = {
  id: string;
  type: "wechat";
  communicationRole: string;
  employee: string;
  occurredAt: string;
  excerpt: RiskTextSegment[];
  fullChat: FullChatMessage[];
};

export type PhoneEvidence = {
  id: string;
  type: "phone";
  outboundRole: string;
  employee: string;
  calledAt: string;
  duration: string;
  transcriptExcerpt: RiskTextSegment[];
  fullTranscript: RiskTextSegment[];
};

export type RiskEvidence = WechatEvidence | PhoneEvidence;

export type RiskEvent = {
  id: string;
  theme: string;
  aiSummary: string;
  aiSuggestion: string;
  riskSources: RiskSource[];
  evidence: RiskEvidence[];
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
  followUpAdvisor: string;
  followUpManager: string;
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
  category: "处理记录" | "系统识别" | "访问记录";
  operationType: string;
  operator: string;
  result: "success" | "error";
  operatedAt: string;
  remark: string;
};

export type RiskProcessingStatus = "待跟进" | "跟进中" | "已处理";

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

export const riskLevelMeta: Record<
  RiskLevel,
  { label: string; fullLabel: string; color: "error" | "warning" | "success" }
> = {
  high: { label: "高", fullLabel: "高风险", color: "error" },
  medium: { label: "中", fullLabel: "中风险", color: "warning" },
  low: { label: "低", fullLabel: "低风险", color: "success" },
};

export const riskSourceMeta: Record<RiskSource, string> = {
  wechat: "微信（云客）",
  phone: "电话外呼",
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
    riskLevel: "high",
    coreRisk: "家长连续表达退费意向，并对当前服务响应速度不满",
    riskEventCount: 5,
    riskSources: ["wechat", "phone"],
    latestRiskTime: "2026-08-09 09:42",
    owner: "周欣",
  },
  {
    id: "risk-student-002",
    studentName: "陈子轩",
    studentNumber: "S2026002",
    riskLevel: "high",
    coreRisk: "近期多次质疑课程效果，存在转班或退费倾向",
    riskEventCount: 3,
    riskSources: ["wechat"],
    latestRiskTime: "2026-08-08 16:20",
    owner: "李辰",
  },
  {
    id: "risk-student-003",
    studentName: "周沐阳",
    studentNumber: "S2026003",
    riskLevel: "medium",
    coreRisk: "排课冲突持续未解决，家长对后续服务安排存疑",
    riskEventCount: 2,
    riskSources: ["phone"],
    latestRiskTime: "2026-08-06 11:05",
    owner: "王珊",
  },
  {
    id: "risk-student-004",
    studentName: "沈雨桐",
    studentNumber: "S2026004",
    riskLevel: "low",
    coreRisk: "家长关注学习反馈时效，当前沟通满意度有所下降",
    riskEventCount: 1,
    riskSources: ["wechat"],
    latestRiskTime: "2026-08-04 14:18",
    owner: "赵敏",
  },
  {
    id: "risk-student-005",
    studentName: "高亦辰",
    studentNumber: "S2026005",
    riskLevel: "medium",
    coreRisk: "多渠道反馈服务问题，当前诉求尚未完全解决",
    riskEventCount: 4,
    riskSources: ["wechat", "phone"],
    latestRiskTime: "2026-08-02 18:36",
    owner: "孙超",
  },
];

function normal(text: string): RiskTextSegment {
  return { text };
}

function highlighted(text: string): RiskTextSegment {
  return { text, highlighted: true };
}

function createWechatEvidence({
  id,
  employee,
  occurredAt,
  lead,
  riskText,
  reply,
  communicationRole = "学管",
}: {
  id: string;
  employee: string;
  occurredAt: string;
  lead: string;
  riskText: string;
  reply: string;
  communicationRole?: string;
}): WechatEvidence {
  return {
    id,
    type: "wechat",
    communicationRole,
    employee,
    occurredAt,
    excerpt: [normal(lead), highlighted(riskText)],
    fullChat: [
      {
        id: `${id}-message-1`,
        sender: "家长",
        role: "家长",
        occurredAt,
        content: [normal(lead), highlighted(riskText)],
      },
      {
        id: `${id}-message-2`,
        sender: employee,
        role: communicationRole,
        occurredAt: occurredAt.replace(/(\d{2}):(\d{2})$/, (_value, hour, minute) => {
          const totalMinutes = Number(hour) * 60 + Number(minute) + 3;
          return `${String(Math.floor(totalMinutes / 60)).padStart(2, "0")}:${String(totalMinutes % 60).padStart(2, "0")}`;
        }),
        content: [normal(reply)],
      },
    ],
  };
}

function createPhoneEvidence({
  id,
  employee,
  calledAt,
  duration,
  lead,
  riskText,
  response,
  outboundRole = "课程顾问",
}: {
  id: string;
  employee: string;
  calledAt: string;
  duration: string;
  lead: string;
  riskText: string;
  response: string;
  outboundRole?: string;
}): PhoneEvidence {
  return {
    id,
    type: "phone",
    outboundRole,
    employee,
    calledAt,
    duration,
    transcriptExcerpt: [normal(lead), highlighted(riskText)],
    fullTranscript: [
      normal(`家长：${lead}`),
      highlighted(riskText),
      normal(`\n${employee}：${response}`),
    ],
  };
}

const linWechatEffect = createWechatEvidence({
  id: "lin-wechat-effect",
  employee: "周欣",
  occurredAt: "2026-08-09 09:12",
  lead: "这段时间孩子一直在上课，但从成绩和作业状态来看，",
  riskText: "我们没有看到明显效果。",
  reply: "我理解您的担心，我会马上汇总近期成绩、作业和老师反馈，今天给您一个具体说明。",
});

const linPhoneEffect = createPhoneEvidence({
  id: "lin-phone-effect",
  employee: "周欣",
  calledAt: "2026-08-09 09:42",
  duration: "04:36",
  lead: "家长反馈最近两次测评结果都没有达到预期，认为课程安排没有解决薄弱点。",
  riskText: "继续上课是否还有意义，需要学校给出明确答复。",
  response: "我会在今天协调授课老师复盘学习目标，并向您同步调整方案。",
});

const linPhoneRefund = createPhoneEvidence({
  id: "lin-phone-refund",
  employee: "周欣",
  calledAt: "2026-08-09 10:18",
  duration: "03:21",
  lead: "家长表示已经等待过几次改进，",
  riskText: "如果还是这样，我们就考虑退费了。",
  response: "我已记录您的诉求，会立即升级给负责人，并在今天内反馈处理方案。",
});

const linWechatResponse = createWechatEvidence({
  id: "lin-wechat-response",
  employee: "周欣",
  occurredAt: "2026-08-09 11:06",
  lead: "前两天问的课程调整一直没有结论，",
  riskText: "每次都要我们催，服务响应太慢了。",
  reply: "抱歉让您久等了，我已经确认到处理节点，下午两点前给您完整回复。",
});

type BaseRiskStudentDetail = Omit<
  RiskStudentDetail,
  | "currentStatus"
  | "riskScore"
  | "workflowSteps"
  | "serviceProfile"
  | "historyRecords"
  | "operationLogs"
>;

const riskStudentDetailList: BaseRiskStudentDetail[] = [
  {
    student: riskStudents[0],
    assessmentPeriod: ["2026-07-10", "2026-08-09"],
    aiSummary:
      "评估周期内家长三次质疑学习效果，并明确出现退费倾向；同时对服务响应速度不满。风险集中在最近三天，建议当前负责人优先核验学习改善方案并完成家长回访。",
    themes: [
      { label: "学习效果质疑", count: 3 },
      { label: "退费倾向", count: 1 },
      { label: "服务响应不满", count: 1 },
    ],
    handlingSuggestion:
      "优先由周欣牵头，在24小时内完成学习效果复盘并形成量化改进方案；同步明确课程调整、家长回访和服务事项的负责人及完成时间，对退费意向持续跟进至闭环。",
    latestRiskDate: "2026-08-09",
    eventGroups: [
      {
        date: "2026-08-09",
        events: [
          {
            id: "lin-event-20260809-effect",
            theme: "学习效果质疑",
            aiSummary:
              "家长在企微和电话中连续质疑近期课程效果，认为成绩与作业表现未体现出与投入相匹配的改善。",
            aiSuggestion:
              "建议先完成一次学习效果复盘：汇总最近两次测评、作业错题和老师反馈，定位未改善的薄弱点；由当前负责人在本次沟通后向家长同步量化结论和调整后的学习计划。",
            riskSources: ["wechat", "phone"],
            evidence: [linWechatEffect, linPhoneEffect],
          },
          {
            id: "lin-event-20260809-refund",
            theme: "退费倾向",
            aiSummary:
              "家长首次明确提出若后续仍无改善将考虑退费，表达已从效果质疑升级为终止服务倾向。",
            aiSuggestion:
              "建议立即升级负责人介入，先确认家长的核心诉求和可接受的改进窗口；在本次沟通后给出明确的课程调整方案与回访时间，避免继续让家长等待。",
            riskSources: ["phone"],
            evidence: [linPhoneRefund],
          },
          {
            id: "lin-event-20260809-response",
            theme: "服务响应不满",
            aiSummary:
              "家长认为课程调整反馈多次延迟且需要反复催促，对当前服务响应效率表达明显不满。",
            aiSuggestion:
              "建议一次性梳理尚未闭环的课程调整事项，明确每项的处理人、完成时间和主动同步节点，并在下一次承诺时间前向家长回传进度。",
            riskSources: ["wechat"],
            evidence: [linWechatResponse],
          },
        ],
      },
      {
        date: "2026-08-08",
        events: [
          {
            id: "lin-event-20260808-effect",
            theme: "学习效果质疑",
            aiSummary:
              "家长将近期测评结果与课程投入进行对比，认为核心薄弱点仍未得到改善。",
            aiSuggestion:
              "建议按本次测评的错题类型拆解薄弱点，和授课老师共同确认后续训练重点，并向家长说明每个重点的验证方式和复盘时间。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "lin-wechat-0808-effect",
                employee: "周欣",
                occurredAt: "2026-08-08 16:28",
                lead: "新出的测评结果还是不理想，",
                riskText: "上了这么久，薄弱项看起来一点没解决。",
                reply: "我先和老师核对这次试卷的错题分布，今晚把原因和改进安排发给您。",
              }),
            ],
          },
        ],
      },
      {
        date: "2026-08-07",
        events: [
          {
            id: "lin-event-20260807-effect",
            theme: "学习效果质疑",
            aiSummary:
              "家长在回访中质疑阶段性学习目标是否达成，并要求提供可以量化的改进依据。",
            aiSuggestion:
              "建议对照阶段目标整理“目标—实际结果—差距原因”清单，补充下一阶段的量化目标和检查节点，再由负责人向家长完成一次正式回访。",
            riskSources: ["phone"],
            evidence: [
              createPhoneEvidence({
                id: "lin-phone-0807-effect",
                employee: "周欣",
                calledAt: "2026-08-07 18:12",
                duration: "05:08",
                lead: "家长询问本阶段原定学习目标的完成情况，",
                riskText: "目前看不出孩子达到了之前承诺的效果。",
                response: "我会把阶段目标、实际结果和下一步调整整理成一份清单发给您。",
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    student: riskStudents[1],
    assessmentPeriod: ["2026-07-10", "2026-08-08"],
    aiSummary:
      "家长近期连续质疑课程效果，并在最新沟通中提出转班或退费可能。风险集中于学习目标与实际结果不一致。",
    themes: [
      { label: "学习效果质疑", count: 2 },
      { label: "退费倾向", count: 1 },
    ],
    handlingSuggestion:
      "由李辰在当日联合授课老师复核目标校要求与当前课程差距，提供可执行的师资或课程调整方案，并与家长确认转班、继续学习或退费的下一步选择。",
    latestRiskDate: "2026-08-08",
    eventGroups: [
      {
        date: "2026-08-08",
        events: [
          {
            id: "chen-event-0808-effect",
            theme: "学习效果质疑",
            aiSummary: "家长认为课程进度与目标校要求存在差距，对继续当前课程方案持怀疑态度。",
            aiSuggestion:
              "建议先按目标校要求复核课程节奏与当前结果，邀请授课老师给出可执行的调整方案；由课程顾问向家长展示目标、差距和改进节点。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "chen-wechat-0808-effect",
                employee: "李辰",
                occurredAt: "2026-08-08 16:20",
                lead: "现在的课程进度和目标校差得比较多，",
                riskText: "我们对目前的课程效果没有信心。",
                reply: "我会立即结合目标校要求复核课程节奏，并和老师确认调整空间。",
                communicationRole: "课程顾问",
              }),
            ],
          },
          {
            id: "chen-event-0808-refund",
            theme: "退费倾向",
            aiSummary: "家长提出若无法调整师资和方案，将在转班与退费之间做选择。",
            aiSuggestion:
              "建议立即确认师资和课程方案的可调整范围，同步可行的转班选项；安排负责人尽快完成一次方案沟通，再根据家长选择决定是否进入退费流程。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "chen-wechat-0808-refund",
                employee: "李辰",
                occurredAt: "2026-08-08 16:35",
                lead: "如果师资和方案都不能调整，",
                riskText: "那我们只能考虑转班或者退费。",
                reply: "我已把诉求升级，今天确认可选方案后第一时间联系您。",
                communicationRole: "课程顾问",
              }),
            ],
          },
        ],
      },
      {
        date: "2026-08-06",
        events: [
          {
            id: "chen-event-0806-effect",
            theme: "学习效果质疑",
            aiSummary: "家长认为近期作业表现没有改善，并要求重新说明课程目标。",
            aiSuggestion:
              "建议拉取近期作业错题和老师批改反馈，重新明确课程目标与训练重点，并用下一次作业结果验证调整是否有效。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "chen-wechat-0806-effect",
                employee: "李辰",
                occurredAt: "2026-08-06 19:02",
                lead: "这几次作业还是同样的问题，",
                riskText: "课程到底解决了什么我们没有看到。",
                reply: "我会让老师按错题类型复盘，并把后续训练重点同步给您。",
                communicationRole: "课程顾问",
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    student: riskStudents[2],
    assessmentPeriod: ["2026-07-08", "2026-08-06"],
    aiSummary:
      "两次排课冲突均未在家长期望时间内解决，家长对后续服务安排的稳定性产生疑虑，当前风险处于中等水平。",
    themes: [{ label: "排课服务不满", count: 2 }],
    handlingSuggestion:
      "由王珊尽快核对教师与家长可用时间，提供至少两个无冲突时段并确认固定排课；首节调整后的课程前主动复核安排，避免再次变更。",
    latestRiskDate: "2026-08-06",
    eventGroups: [
      {
        date: "2026-08-06",
        events: [
          {
            id: "zhou-event-0806-schedule",
            theme: "排课服务不满",
            aiSummary: "家长反馈调整后的时间仍与校内课程冲突，认为排课沟通没有形成有效结果。",
            aiSuggestion:
              "建议先锁定教师可用时间和家长可接受时段，提供至少两个不冲突的排课选项；确认后建立固定课时，避免再次反复调整。",
            riskSources: ["phone"],
            evidence: [
              createPhoneEvidence({
                id: "zhou-phone-0806-schedule",
                employee: "王珊",
                calledAt: "2026-08-06 11:05",
                duration: "03:46",
                lead: "家长说明新安排仍与校内课程冲突，",
                riskText: "排课问题来回沟通了几次还是没有解决。",
                response: "我会重新协调老师可用时间，并在午后给您两个可选安排。",
                outboundRole: "学管",
              }),
            ],
          },
        ],
      },
      {
        date: "2026-08-05",
        events: [
          {
            id: "zhou-event-0805-schedule",
            theme: "排课服务不满",
            aiSummary: "家长首次反馈临时调课影响既定安排，希望尽快确认稳定时段。",
            aiSuggestion:
              "建议优先确认后续可持续的固定上课时段，核对老师资源后一次性同步给家长，并在排课完成后主动确认首节课安排。",
            riskSources: ["phone"],
            evidence: [
              createPhoneEvidence({
                id: "zhou-phone-0805-schedule",
                employee: "王珊",
                calledAt: "2026-08-05 15:18",
                duration: "02:54",
                lead: "家长表示临时调课影响了原有计划，",
                riskText: "希望后面不要再反复变动时间。",
                response: "我先锁定老师后续可用时段，确认后一次性同步给您。",
                outboundRole: "学管",
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    student: riskStudents[3],
    assessmentPeriod: ["2026-07-06", "2026-08-04"],
    aiSummary:
      "家长对学习反馈时效提出一次明确意见，尚未出现退费或终止服务表达，当前风险较低，但需关注后续反馈是否按时送达。",
    themes: [{ label: "反馈时效不满", count: 1 }],
    handlingSuggestion:
      "由赵敏建立固定的课后反馈节点，明确每次课程后的责任人和最晚发送时间；连续跟踪两次反馈时效，并主动向家长确认满意度。",
    latestRiskDate: "2026-08-04",
    eventGroups: [
      {
        date: "2026-08-04",
        events: [
          {
            id: "shen-event-0804-response",
            theme: "反馈时效不满",
            aiSummary: "家长希望课后学习反馈更及时，目前不满集中在信息同步速度。",
            aiSuggestion:
              "建议将课后反馈设置为固定发送节点，明确每次课程后的责任人和完成时间；连续跟踪两次，确认反馈时效是否恢复稳定。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "shen-wechat-0804-response",
                employee: "赵敏",
                occurredAt: "2026-08-04 14:18",
                lead: "上周的课后反馈今天才收到，",
                riskText: "我们希望以后不要等这么久。",
                reply: "收到，我会把反馈节点前置，并在每次课后第二天完成同步。",
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    student: riskStudents[4],
    assessmentPeriod: ["2026-07-04", "2026-08-02"],
    aiSummary:
      "家长通过企微和电话持续反馈服务响应、排课及退费相关问题，多个诉求仍未完全闭环，综合风险处于中等水平。",
    themes: [
      { label: "服务响应不满", count: 2 },
      { label: "排课服务不满", count: 1 },
      { label: "退费倾向", count: 1 },
    ],
    handlingSuggestion:
      "由孙超将服务响应、排课及退费相关未结事项合并为清单，逐项明确负责人、截止时间和同步节点；每日主动反馈进度，直至全部诉求闭环。",
    latestRiskDate: "2026-08-02",
    eventGroups: [
      {
        date: "2026-08-02",
        events: [
          {
            id: "gao-event-0802-response",
            theme: "服务响应不满",
            aiSummary: "家长认为近期多个服务问题回复缓慢，诉求没有形成明确处理结论。",
            aiSuggestion:
              "建议将现有未结事项合并成一份清单，逐项标注负责人、截止时间和当前状态，由当前负责人主动同步处理进度，直到全部闭环。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "gao-wechat-0802-response",
                employee: "孙超",
                occurredAt: "2026-08-02 18:36",
                lead: "之前提的几个问题到现在都没有明确说法，",
                riskText: "每次回复都很慢，也没有处理结果。",
                reply: "我已重新汇总所有未结事项，明天上午逐项给您确认处理人和完成时间。",
              }),
            ],
          },
          {
            id: "gao-event-0802-refund",
            theme: "退费倾向",
            aiSummary: "家长提出若本轮问题继续无法解决，将进一步咨询退费流程。",
            aiSuggestion:
              "建议先由负责人集中回应未结诉求并明确一次改进期限；若仍无法解决，再向家长清晰说明退费规则与后续办理流程。",
            riskSources: ["phone"],
            evidence: [
              createPhoneEvidence({
                id: "gao-phone-0802-refund",
                employee: "孙超",
                calledAt: "2026-08-02 18:36",
                duration: "04:18",
                lead: "家长表示愿意再等待一次集中处理，",
                riskText: "如果这次还解决不了，就要了解退费流程。",
                response: "我会亲自跟进本轮处理，并在每个节点主动同步进度。",
                outboundRole: "学管",
              }),
            ],
          },
        ],
      },
      {
        date: "2026-08-01",
        events: [
          {
            id: "gao-event-0801-schedule",
            theme: "排课服务不满",
            aiSummary: "家长反馈周末课程时间多次变动，影响家庭安排。",
            aiSuggestion:
              "建议先与家长确认可接受的固定周末时段，再锁定老师资源并在系统留痕；未经家长确认，不再调整已约定的上课时间。",
            riskSources: ["phone"],
            evidence: [
              createPhoneEvidence({
                id: "gao-phone-0801-schedule",
                employee: "孙超",
                calledAt: "2026-08-01 10:14",
                duration: "03:12",
                lead: "家长反馈周末上课时间再次调整，",
                riskText: "频繁变动已经影响了家庭安排。",
                response: "我会重新确认固定时段，未得到您确认前不再变更。",
                outboundRole: "学管",
              }),
            ],
          },
        ],
      },
      {
        date: "2026-07-31",
        events: [
          {
            id: "gao-event-0731-response",
            theme: "服务响应不满",
            aiSummary: "家长首次指出问题反馈后等待时间过长，希望明确处理节点。",
            aiSuggestion:
              "建议立即回复当前处理进度和下一次更新时间，同时建立服务问题跟踪清单，确保后续每个节点都由负责人主动反馈。",
            riskSources: ["wechat"],
            evidence: [
              createWechatEvidence({
                id: "gao-wechat-0731-response",
                employee: "孙超",
                occurredAt: "2026-07-31 17:42",
                lead: "昨天反馈的问题今天还没有回复，",
                riskText: "至少应该告诉我们现在处理到哪一步。",
                reply: "抱歉没有及时同步，我马上核对进度并在一小时内回复您。",
              }),
            ],
          },
        ],
      },
    ],
  },
];

const serviceProfileMeta: Record<string, RiskServiceProfile> = {
  "risk-student-001": {
    grade: "12年级",
    followUpAdvisor: "周欣",
    followUpManager: "周欣",
    course: "A-Level 数学进阶",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-03-18",
  },
  "risk-student-002": {
    grade: "11年级",
    followUpAdvisor: "李辰",
    followUpManager: "李辰",
    course: "国际课程规划",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-04-06",
  },
  "risk-student-003": {
    grade: "10年级",
    followUpAdvisor: "王珊",
    followUpManager: "王珊",
    course: "托福基础提升",
    serviceMode: "小班课",
    guardianContact: "家长电话已登记",
    serviceStartDate: "2026-02-22",
  },
  "risk-student-004": {
    grade: "9年级",
    followUpAdvisor: "赵敏",
    followUpManager: "赵敏",
    course: "学业能力提升",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-05-12",
  },
  "risk-student-005": {
    grade: "11年级",
    followUpAdvisor: "孙超",
    followUpManager: "孙超",
    course: "雅思冲刺课程",
    serviceMode: "1 对 1",
    guardianContact: "家长企微已绑定",
    serviceStartDate: "2026-01-20",
  },
};

function createWorkflowSteps(student: RiskStudent): RiskWorkflowStep[] {
  const isLowRisk = student.riskLevel === "low";
  const verifiedAt = `${student.latestRiskTime.slice(0, 10)} 10:06`;
  const followUpAt = `${student.latestRiskTime.slice(0, 10)} 11:06`;

  return [
    {
      id: `${student.id}-identified`,
      title: "AI 识别",
      owner: "系统",
      time: student.latestRiskTime,
      status: "finish",
      action: "查看规则",
    },
    {
      id: `${student.id}-verified`,
      title: "人工核验",
      owner: "质检团队",
      time: verifiedAt,
      status: "finish",
      action: "已完成",
    },
    {
      id: `${student.id}-follow-up`,
      title: "跟进处理中",
      owner: student.owner,
      time: followUpAt,
      status: isLowRisk ? "finish" : "process",
      action: isLowRisk ? "已完成" : "提醒负责人",
    },
    {
      id: `${student.id}-closed`,
      title: "风险关闭",
      owner: isLowRisk ? student.owner : "待分配",
      time: isLowRisk ? `${student.latestRiskTime.slice(0, 10)} 17:20` : "待完成",
      status: isLowRisk ? "process" : "wait",
      action: isLowRisk ? "待确认" : "待完成",
    },
  ];
}

function createOperationLogs(student: RiskStudent): RiskOperationLog[] {
  const date = student.latestRiskTime.slice(0, 10);

  return [
    {
      id: `${student.id}-log-1`,
      category: "系统识别",
      operationType: "生成客诉风险预警",
      operator: "AI 风险引擎",
      result: "success",
      operatedAt: student.latestRiskTime,
      remark: `命中 ${student.riskEventCount} 条风险事件`,
    },
    {
      id: `${student.id}-log-2`,
      category: "处理记录",
      operationType: "完成风险核验",
      operator: "质检团队",
      result: "success",
      operatedAt: `${date} 10:06`,
      remark: "已核对聊天与电话证据",
    },
    {
      id: `${student.id}-log-3`,
      category: "处理记录",
      operationType: "提醒负责人跟进",
      operator: "系统",
      result: "error",
      operatedAt: `${date} 11:08`,
      remark: "等待负责人补充回访结果",
    },
    {
      id: `${student.id}-log-4`,
      category: "访问记录",
      operationType: "查看风险详情",
      operator: student.owner,
      result: "success",
      operatedAt: `${date} 11:16`,
      remark: "打开学生风险详情页",
    },
    {
      id: `${student.id}-log-5`,
      category: "访问记录",
      operationType: "查看原始证据",
      operator: student.owner,
      result: "success",
      operatedAt: `${date} 11:18`,
      remark: "查看最近一次企微沟通记录",
    },
  ];
}

function createDetailEnhancements(student: RiskStudent) {
  const riskScore =
    student.riskLevel === "high"
      ? 88
      : student.riskLevel === "medium"
        ? 64
        : 32;

  return {
    currentStatus: student.riskLevel === "low" ? "跟进中" : "跟进中",
    riskScore,
    workflowSteps: createWorkflowSteps(student),
    serviceProfile: serviceProfileMeta[student.id],
    historyRecords: [],
    operationLogs: createOperationLogs(student),
  } satisfies Pick<
    RiskStudentDetail,
    | "currentStatus"
    | "riskScore"
    | "workflowSteps"
    | "serviceProfile"
    | "historyRecords"
    | "operationLogs"
  >;
}

export const riskStudentDetails: Record<string, RiskStudentDetail> = Object.fromEntries(
  riskStudentDetailList.map((detail) => [
    detail.student.id,
    { ...detail, ...createDetailEnhancements(detail.student) },
  ]),
);

export function getRiskEventRelatedPeople(studentId: string): RelatedPerson[] {
  const detail = riskStudentDetails[studentId];
  if (!detail) return [];

  const people = new Map<string, RelatedPerson>();

  for (const group of detail.eventGroups) {
    for (const event of group.events) {
      for (const evidence of event.evidence) {
        const role =
          evidence.type === "wechat"
            ? evidence.communicationRole
            : evidence.outboundRole;
        const person = people.get(evidence.employee);

        if (!person) {
          people.set(evidence.employee, {
            name: evidence.employee,
            roles: [role],
          });
        } else if (!person.roles.includes(role)) {
          person.roles.push(role);
        }
      }
    }
  }

  return [...people.values()];
}

export const relatedPersonOptions = (() => {
  const people = new Map<string, string[]>();

  for (const detail of riskStudentDetailList) {
    for (const person of getRiskEventRelatedPeople(detail.student.id)) {
      const roles = people.get(person.name) ?? [];
      for (const role of person.roles) {
        if (!roles.includes(role)) roles.push(role);
      }
      people.set(person.name, roles);
    }
  }

  return [...people.entries()].map(([name, roles]) => ({
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
  const selectedEmployeeDepartments = getSelectedEmployeeDepartmentLeaves(
    filters.employeeDepartments ?? [],
  );

  return records.filter((record) => {
    const matchesStudent =
      !keyword ||
      record.studentName.toLocaleLowerCase().includes(keyword) ||
      record.studentNumber.toLocaleLowerCase().includes(keyword);
    const matchesLevel =
      !filters.riskLevel || record.riskLevel === filters.riskLevel;
    const matchesSource =
      !filters.riskSources?.length ||
      record.riskSources.some((source) =>
        filters.riskSources?.includes(source),
      );
    const eventDate = record.latestRiskTime.slice(0, 10);
    const matchesTime =
      (!startDate || eventDate >= startDate) &&
      (!endDate || eventDate <= endDate);
    const relatedPeople = record.relatedPeople?.length
      ? record.relatedPeople
      : getRiskEventRelatedPeople(record.id);
    const matchesRelatedPerson =
      !filters.relatedPerson ||
      relatedPeople.some(
        (person) => person.name === filters.relatedPerson,
      );
    const matchesEmployeeDepartment =
      selectedEmployeeDepartments.size === 0 ||
      relatedPeople.some((person) => {
        const department = employeeDepartmentByName[person.name];
        return (
          department !== undefined &&
          selectedEmployeeDepartments.has(department)
        );
      });

    return (
      matchesStudent &&
      matchesLevel &&
      matchesSource &&
      matchesTime &&
      matchesEmployeeDepartment &&
      matchesRelatedPerson
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
    if (sort === "eventCount") {
      return (
        right.riskEventCount - left.riskEventCount ||
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

export function formatRiskSources(values: RiskSource[]) {
  if (values.length === 2) return "云客微信+电话";
  return values[0] === "wechat" ? "云客微信" : "电话";
}
