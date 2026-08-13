import type {
  RenewalConditionCategory,
  RenewalConditionDiagnosis,
  RenewalConditionRule,
  RenewalConditionStatus,
  RenewalConfig,
  RenewalConfigVersion,
  RenewalCoverageQuality,
  RenewalDiagnosisCounts,
  RenewalEvidence,
  RenewalOpportunitiesResponse,
  RenewalOpportunity,
  RenewalOpportunityPriority,
  RenewalProductMapping,
  RenewalProductRecommendation,
  RenewalRunRequest,
  RenewalRunResult,
  RenewalStudentDiagnosis,
  RenewalStudentSummary,
} from "../contracts";

export type RenewalConditionSignal = {
  applicable?: boolean;
  hasRequiredData: boolean;
  completed: boolean;
  activeCoverage: boolean;
  atRisk: boolean;
  urgent?: boolean;
  deadlineDate?: string;
  reason: string;
  evidence: RenewalEvidence[];
  coveringProductIds: string[];
};

export type RenewalStudentRecord = RenewalStudentSummary & {
  nextExamDate?: string;
  purchasedProductIds: string[];
  prerequisiteResults: Record<
    string,
    { met: boolean; reason: string } | undefined
  >;
  conditionSignals: Record<string, RenewalConditionSignal | undefined>;
};

const grades = ["9年级", "10年级", "11年级", "12年级"];
const curricula = ["IGCSE", "A-Level"];

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

const requirementCodes: Record<RenewalConditionCategory, string> = {
  language: "language-stage",
  subject: "subject-stage",
  competition: "competition-stage",
  background: "background-stage",
  assessment: "assessment-stage",
  planning: "planning-stage",
};

const currentProductNamesById: Record<string, string> = {
  "product-current-math": "A-Level 数学进阶",
  "product-current-igcse": "IGCSE 英语强化",
  "product-current-bpho": "BPhO 基础班",
  "product-current-physics": "A-Level 物理进阶",
  "product-current-planning": "阶段升学规划服务",
  "product-current-math-bridge": "IGCSE 数学衔接",
};

type RuleTemplate = Omit<RenewalConditionRule, "id" | "grade">;

const conditionTemplates: Record<RenewalConditionCategory, RuleTemplate> = {
  language: {
    requirementCode: requirementCodes.language,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "language",
    name: "阶段语言能力达标",
    type: "common",
    requirement: "完成阶段语言测评，并形成下一考试节点前的学习安排",
    target: "达到当前阶段目标分",
    deadline: "本学年结束前",
    evidenceSources: ["score", "registration", "course", "order"],
    enabled: true,
  },
  subject: {
    requirementCode: requirementCodes.subject,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "subject",
    name: "核心学科持续覆盖",
    type: "common",
    requirement: "核心学科课程能够覆盖当前教学阶段及下一次大考",
    target: "现有课程覆盖至下一考试节点",
    deadline: "下一次大考前",
    evidenceSources: ["score", "course", "order"],
    enabled: true,
  },
  competition: {
    requirementCode: requirementCodes.competition,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "competition",
    name: "专业相关竞赛准备",
    type: "conditional",
    requirement: "在竞赛方向明确时完成报名、前测和备考安排",
    target: "完成适用性确认后判断",
    deadline: "竞赛报名截止前",
    evidenceSources: ["registration", "score", "course"],
    enabled: true,
  },
  background: {
    requirementCode: requirementCodes.background,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "background",
    name: "背景提升项目规划",
    type: "optional",
    requirement: "结合学生方向评估是否需要科研、夏校或活动项目",
    target: "作为可选提升项",
    deadline: "项目申请窗口前",
    evidenceSources: ["planning", "profile"],
    enabled: true,
  },
  assessment: {
    requirementCode: requirementCodes.assessment,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "assessment",
    name: "笔试与面试准备",
    type: "conditional",
    requirement: "在考试要求明确时完成报名、模考和备考安排",
    target: "完成适用性确认后判断",
    deadline: "正式考试前",
    evidenceSources: ["registration", "score", "course"],
    enabled: true,
  },
  planning: {
    requirementCode: requirementCodes.planning,
    scope: "baseline",
    curricula: [],
    countries: [],
    schoolTiers: [],
    majors: [],
    applicationYears: [],
    category: "planning",
    name: "阶段升学规划启动",
    type: "common",
    requirement: "完成当前年级应有的升学规划沟通和阶段任务",
    target: "阶段规划事项有负责人和完成时间",
    deadline: "本学年关键申请节点前",
    evidenceSources: ["planning", "order"],
    enabled: true,
  },
};

export function ruleId(grade: string, category: RenewalConditionCategory) {
  return `${grade.replace("年级", "")}-${category}`;
}

export function createInitialRenewalRules(): RenewalConditionRule[] {
  const baseline = grades.flatMap((grade) =>
    (Object.keys(conditionTemplates) as RenewalConditionCategory[]).map(
      (category) => ({
        ...conditionTemplates[category],
        id: ruleId(grade, category),
        grade,
      }),
    ),
  );

  const goalRules: RenewalConditionRule[] = [
    {
      ...conditionTemplates.language,
      id: "goal-12-uk-top30-language",
      scope: "goal",
      grade: "12年级",
      countries: ["英国"],
      schoolTiers: ["TOP30"],
      type: "common",
      name: "英国TOP30语言成绩达标",
      requirement: "确认目标院校语言总分、单项要求与最晚提交时间",
      target: "雅思总分7.0且单项满足院校要求",
      deadline: "申请材料提交前",
    },
    {
      ...conditionTemplates.subject,
      id: "goal-12-uk-top30-subject",
      scope: "goal",
      grade: "12年级",
      countries: ["英国"],
      schoolTiers: ["TOP30"],
      type: "common",
      name: "英国TOP30核心学科成绩保障",
      requirement: "核心学科成绩与课程安排覆盖目标院校录取要求",
      target: "核心学科达到A或目标院校等效要求",
      deadline: "下一次大考前",
    },
    {
      ...conditionTemplates.competition,
      id: "goal-11-uk-physics-competition",
      scope: "goal",
      grade: "11年级",
      countries: ["英国"],
      schoolTiers: ["TOP10", "TOP30"],
      majors: ["物理"],
      type: "conditional",
      name: "物理方向竞赛能力证明",
      requirement: "完成BPhO前测、报名并在正式考试前完成进阶训练",
      target: "前测达到进阶班要求并完成竞赛备考",
      deadline: "BPhO正式考试前",
    },
    {
      ...conditionTemplates.assessment,
      id: "goal-12-uk-top30-assessment",
      scope: "goal",
      grade: "12年级",
      countries: ["英国"],
      schoolTiers: ["TOP30"],
      type: "conditional",
      name: "目标院校笔面试准备",
      requirement: "根据目标院校要求完成笔试与面试诊断和训练",
      target: "完成至少一次全真模考与复盘",
      deadline: "院校考核前",
    },
  ];

  return [...baseline, ...goalRules];
}

function idsForCategory(category: RenewalConditionCategory) {
  return createInitialRenewalRules()
    .filter((rule) => rule.category === category)
    .map((rule) => rule.id);
}

export function createInitialProductMappings(): RenewalProductMapping[] {
  return [
    {
      id: "mapping-ielts-stage",
      conditionRuleIds: idsForCategory("language"),
      productId: "product-ielts-stage",
      productName: "雅思阶段能力提升班",
      productLine: "语言课程",
      grades,
      curricula,
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "完成语言测评",
      mode: "班课",
      recommendationType: "new",
      suggestedPackage: "24课时",
      enrollmentDeadline: "2026-09-15",
      startDate: "2026-09-20",
      endDate: "2026-10-10",
      standardPrice: 26800,
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-subject-boost",
      conditionRuleIds: idsForCategory("subject"),
      productId: "product-subject-boost",
      productName: "国际课程学科补强 1V1",
      productLine: "学科课程",
      grades,
      curricula,
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "完成学科诊断",
      mode: "1V1",
      recommendationType: "reinforcement",
      suggestedPackage: "20课时",
      enrollmentDeadline: "2026-09-10",
      startDate: "2026-08-20",
      endDate: "2026-10-10",
      standardPrice: 32800,
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-subject-sprint",
      conditionRuleIds: idsForCategory("subject"),
      productId: "product-subject-sprint",
      productName: "国际课程考前冲刺小班",
      productLine: "学科课程",
      grades: ["11年级", "12年级"],
      curricula: ["A-Level"],
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "距离考试不少于6周",
      mode: "班课",
      recommendationType: "renewal",
      suggestedPackage: "12课时",
      enrollmentDeadline: "2026-09-01",
      startDate: "2026-09-05",
      endDate: "2026-10-12",
      standardPrice: 16800,
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-competition-boost",
      conditionRuleIds: idsForCategory("competition"),
      productId: "product-competition-boost",
      productName: "国际竞赛进阶训练营",
      productLine: "竞赛课程",
      grades: ["10年级", "11年级"],
      curricula,
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "竞赛方向已确认且完成前测",
      mode: "班课",
      recommendationType: "advanced",
      suggestedPackage: "16课时",
      enrollmentDeadline: "2026-09-05",
      startDate: "2026-09-12",
      endDate: "2026-10-25",
      standardPrice: 23800,
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-assessment-uk",
      conditionRuleIds: ["goal-12-uk-top30-assessment"],
      productId: "product-assessment-uk",
      productName: "英国院校笔面试强化 1V1",
      productLine: "笔面试课程",
      grades: ["12年级"],
      curricula: ["A-Level"],
      countries: ["英国"],
      schoolTiers: ["TOP30"],
      majors: [],
      prerequisite: "目标院校考核要求已确认",
      mode: "1V1",
      recommendationType: "new",
      suggestedPackage: "12课时",
      enrollmentDeadline: "2026-10-01",
      startDate: "2026-09-20",
      endDate: "2026-11-20",
      standardPrice: 19800,
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-planning-stage",
      conditionRuleIds: idsForCategory("planning"),
      productId: "product-planning-stage",
      productName: "阶段升学规划服务",
      productLine: "升学规划",
      grades: ["10年级", "11年级", "12年级"],
      curricula,
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "完成首次规划访谈",
      mode: "服务产品",
      recommendationType: "new",
      suggestedPackage: "阶段服务包",
      enrollmentDeadline: "2026-12-31",
      startDate: "2026-08-15",
      endDate: "2027-06-30",
      sellable: true,
      enabled: true,
    },
    {
      id: "mapping-expired-language",
      conditionRuleIds: idsForCategory("language"),
      productId: "product-expired-language",
      productName: "暑期语言封闭营",
      productLine: "语言课程",
      grades,
      curricula,
      countries: [],
      schoolTiers: [],
      majors: [],
      prerequisite: "完成语言测评",
      mode: "班课",
      recommendationType: "new",
      suggestedPackage: "暑期营",
      enrollmentDeadline: "2026-07-15",
      startDate: "2026-07-20",
      endDate: "2026-08-10",
      standardPrice: 29800,
      sellable: false,
      enabled: true,
    },
  ];
}

function evidence(
  id: string,
  source: RenewalEvidence["source"],
  label: string,
  value: string,
  updatedAt: string,
): RenewalEvidence {
  return { id, source, label, value, updatedAt };
}

function signal(
  input: Partial<RenewalConditionSignal> & Pick<RenewalConditionSignal, "reason">,
): RenewalConditionSignal {
  return {
    hasRequiredData: true,
    completed: false,
    activeCoverage: false,
    atRisk: false,
    evidence: [],
    coveringProductIds: [],
    ...input,
  };
}

export const renewalStudentRecords: RenewalStudentRecord[] = [
  {
    id: "renewal-student-001",
    name: "林家宁",
    customerNumber: "VA100213",
    grade: "12年级",
    curriculum: "A-Level",
    applicationYear: 2027,
    targetProfile: {
      status: "confirmed",
      countries: ["英国"],
      schoolTiers: ["TOP30"],
      majors: ["数学"],
      applicationYear: 2027,
      updatedAt: "2026-08-08",
    },
    owner: "周欣（A1024）",
    currentProducts: ["A-Level 数学进阶", "雅思精品班"],
    remainingHours: 4,
    latestScore: "雅思 7.0；数学模考 B",
    nextExam: "A-Level 数学 · 2026-10-18",
    nextExamDate: "2026-10-18",
    triggerReasons: [
      { type: "event", label: "数学剩余课时不足", occurredAt: "2026-08-12 09:20" },
      { type: "monthly", label: "8月顾问月度盘点", occurredAt: "2026-08-01 09:00" },
    ],
    diagnosedAt: "2026-08-12 09:30",
    updatedAt: "2026-08-12 09:20",
    purchasedProductIds: ["product-ielts-stage"],
    prerequisiteResults: {},
    conditionSignals: {
      [requirementCodes.language]: signal({
        completed: true,
        reason: "雅思成绩已达到当前阶段目标",
        evidence: [evidence("e-001", "score", "最近雅思成绩", "总分 7.0", "2026-07-26")],
      }),
      [requirementCodes.subject]: signal({
        activeCoverage: true,
        atRisk: true,
        urgent: true,
        deadlineDate: "2026-10-18",
        reason: "课程进行中，但剩余4课时且数学模考为B，无法覆盖10月大考目标",
        evidence: [
          evidence("e-002", "course", "A-Level数学", "剩余4课时", "2026-08-12"),
          evidence("e-003", "registration", "下一考试", "2026-10-18", "2026-08-10"),
          evidence("e-004", "score", "数学模考", "B，低于目标A", "2026-08-06"),
        ],
        coveringProductIds: ["product-current-math"],
      }),
      [requirementCodes.competition]: signal({ hasRequiredData: false, reason: "缺少竞赛方向和适用性信息" }),
      [requirementCodes.background]: signal({ hasRequiredData: false, reason: "可选提升项，待确认是否需要" }),
      [requirementCodes.assessment]: signal({
        applicable: true,
        deadlineDate: "2026-12-15",
        reason: "目标院校存在笔面试要求，尚无诊断或训练安排",
        evidence: [evidence("e-005", "planning", "申请清单", "存在笔面试要求", "2026-08-08")],
      }),
      [requirementCodes.planning]: signal({
        completed: true,
        reason: "本阶段规划任务已完成",
        evidence: [evidence("e-006", "planning", "规划任务", "申请清单已确认", "2026-08-08")],
      }),
    },
  },
  {
    id: "renewal-student-002",
    name: "陈子轩",
    customerNumber: "VA100246",
    grade: "10年级",
    curriculum: "IGCSE",
    targetProfile: { status: "missing", countries: [], schoolTiers: [], majors: [] },
    owner: "李辰（A1058）",
    currentProducts: ["IGCSE 英语强化"],
    remainingHours: 18,
    latestScore: "校内英语 B+",
    triggerReasons: [{ type: "monthly", label: "8月顾问月度盘点", occurredAt: "2026-08-01 09:00" }],
    diagnosedAt: "2026-08-12 08:50",
    updatedAt: "2026-08-12 08:40",
    purchasedProductIds: [],
    prerequisiteResults: {},
    conditionSignals: {
      [requirementCodes.language]: signal({
        hasRequiredData: false,
        reason: "缺少标准化语言测评和考试计划",
        evidence: [evidence("e-101", "score", "校内英语", "B+", "2026-07-18")],
      }),
      [requirementCodes.subject]: signal({
        activeCoverage: true,
        reason: "当前课程课时充足，可覆盖本学期",
        evidence: [evidence("e-102", "course", "IGCSE英语强化", "剩余18课时", "2026-08-12")],
        coveringProductIds: ["product-current-igcse"],
      }),
      [requirementCodes.competition]: signal({ hasRequiredData: false, reason: "竞赛方向尚未确认" }),
      [requirementCodes.background]: signal({ hasRequiredData: false, reason: "可选提升项，待确认是否需要" }),
      [requirementCodes.assessment]: signal({ hasRequiredData: false, reason: "笔面试适用性尚未确认" }),
      [requirementCodes.planning]: signal({
        hasRequiredData: false,
        reason: "目标尚未确认，不默认生成规划产品推荐",
        evidence: [evidence("e-103", "planning", "目标记录", "暂无已确认目标", "2026-08-12")],
      }),
    },
  },
  {
    id: "renewal-student-003",
    name: "王若曦",
    customerNumber: "VA100278",
    grade: "11年级",
    curriculum: "A-Level",
    applicationYear: 2028,
    targetProfile: {
      status: "confirmed",
      countries: ["英国"],
      schoolTiers: ["TOP10"],
      majors: ["物理"],
      applicationYear: 2028,
      updatedAt: "2026-08-09",
    },
    owner: "周欣（A1024）",
    currentProducts: ["A-Level 物理进阶", "BPhO 基础班", "阶段升学规划服务"],
    remainingHours: 6,
    latestScore: "物理模考 A；BPhO前测 48分",
    nextExam: "BPhO · 2026-11-05",
    nextExamDate: "2026-11-05",
    triggerReasons: [
      { type: "event", label: "BPhO前测未达进阶目标", occurredAt: "2026-08-11 18:10" },
      { type: "monthly", label: "8月顾问月度盘点", occurredAt: "2026-08-01 09:00" },
    ],
    diagnosedAt: "2026-08-11 18:20",
    updatedAt: "2026-08-11 18:10",
    purchasedProductIds: ["product-current-bpho"],
    prerequisiteResults: {
      "product-competition-boost": { met: true, reason: "已完成BPhO前测" },
    },
    conditionSignals: {
      [requirementCodes.language]: signal({
        reason: "没有语言成绩、报名记录或在读语言课程",
        evidence: [evidence("e-201", "registration", "语言考试报名", "无记录", "2026-08-11")],
      }),
      [requirementCodes.subject]: signal({
        activeCoverage: true,
        reason: "物理课程进行正常，可覆盖下一次校内考试",
        evidence: [
          evidence("e-202", "score", "物理模考", "A", "2026-07-30"),
          evidence("e-203", "course", "A-Level物理", "剩余14课时", "2026-08-11"),
        ],
        coveringProductIds: ["product-current-physics"],
      }),
      [requirementCodes.competition]: signal({
        applicable: true,
        activeCoverage: true,
        atRisk: true,
        urgent: true,
        deadlineDate: "2026-11-05",
        reason: "已报名BPhO，但基础班将提前结课且前测未达阶段目标",
        evidence: [
          evidence("e-204", "registration", "BPhO报名", "已报名", "2026-08-01"),
          evidence("e-205", "score", "BPhO前测", "48分", "2026-08-06"),
          evidence("e-206", "course", "BPhO基础班", "剩余6课时", "2026-08-11"),
        ],
        coveringProductIds: ["product-current-bpho"],
      }),
      [requirementCodes.background]: signal({ hasRequiredData: false, reason: "可选提升项，待确认是否需要" }),
      [requirementCodes.assessment]: signal({ hasRequiredData: false, reason: "笔面试适用性尚未确认" }),
      [requirementCodes.planning]: signal({
        activeCoverage: true,
        reason: "阶段规划课程进行中，当前节点正常",
        evidence: [evidence("e-207", "planning", "规划任务", "选校准备中", "2026-08-09")],
        coveringProductIds: ["product-current-planning"],
      }),
    },
  },
  {
    id: "renewal-student-004",
    name: "许博文",
    customerNumber: "VA100355",
    grade: "9年级",
    curriculum: "IGCSE",
    targetProfile: { status: "missing", countries: [], schoolTiers: [], majors: [] },
    owner: "张敏（A1116）",
    currentProducts: ["IGCSE 数学衔接"],
    remainingHours: 12,
    latestScore: "数学诊断 82分",
    triggerReasons: [
      { type: "event", label: "新学年基础要求重新计算", occurredAt: "2026-08-11 15:35" },
    ],
    diagnosedAt: "2026-08-11 15:45",
    updatedAt: "2026-08-11 15:35",
    purchasedProductIds: [],
    prerequisiteResults: {},
    conditionSignals: {
      [requirementCodes.language]: signal({
        reason: "尚无语言测评、考试报名或语言课程覆盖",
        evidence: [evidence("e-301", "profile", "语言学习记录", "暂无", "2026-08-11")],
      }),
      [requirementCodes.subject]: signal({
        activeCoverage: true,
        reason: "数学衔接课程正常进行，课时充足",
        evidence: [
          evidence("e-302", "score", "数学诊断", "82分", "2026-07-25"),
          evidence("e-303", "course", "IGCSE数学衔接", "剩余12课时", "2026-08-11"),
        ],
        coveringProductIds: ["product-current-math-bridge"],
      }),
      [requirementCodes.competition]: signal({ hasRequiredData: false, reason: "竞赛方向尚未确认" }),
      [requirementCodes.background]: signal({ hasRequiredData: false, reason: "可选提升项，待确认是否需要" }),
      [requirementCodes.assessment]: signal({ hasRequiredData: false, reason: "笔面试适用性尚未确认" }),
      [requirementCodes.planning]: signal({
        activeCoverage: true,
        reason: "年级规划沟通已安排",
        evidence: [evidence("e-304", "planning", "规划沟通", "已安排9月沟通", "2026-08-10")],
      }),
    },
  },
];

export function createInitialRenewalConfig(): RenewalConfig {
  return {
    sceneId: "renewalDiagnosis",
    sceneName: "AI续费诊断与产品推荐",
    publishedVersion: "v1.0",
    draftVersion: "v1.1-draft",
    draftStatus: "published",
    updatedAt: "2026-08-12 09:30",
    updatedBy: "规则管理员",
    conditionRules: createInitialRenewalRules(),
    productMappings: createInitialProductMappings(),
  };
}

export function createInitialRenewalVersions(): RenewalConfigVersion[] {
  return [
    {
      version: "v1.0",
      status: "current",
      changeNote: "双层要求模型与学生级产品推荐",
      publishedAt: "2026-08-12 09:30",
      publishedBy: "规则管理员",
    },
  ];
}

function emptyCounts(): RenewalDiagnosisCounts {
  return {
    completed: 0,
    in_progress_on_track: 0,
    in_progress_at_risk: 0,
    missing: 0,
    applicability_pending: 0,
    data_pending: 0,
  };
}

function matchesDimension(required: string[], actual: string[]) {
  return required.length === 0 || required.some((item) => actual.includes(item));
}

function matchesRule(rule: RenewalConditionRule, student: RenewalStudentRecord) {
  if (!rule.enabled || rule.grade !== student.grade) return false;
  if (!matchesDimension(rule.curricula, [student.curriculum])) return false;
  if (rule.scope === "baseline") return true;
  if (student.targetProfile.status !== "confirmed") return false;
  const applicationYear = student.applicationYear ?? student.targetProfile.applicationYear;
  return (
    matchesDimension(rule.countries, student.targetProfile.countries) &&
    matchesDimension(rule.schoolTiers, student.targetProfile.schoolTiers) &&
    matchesDimension(rule.majors, student.targetProfile.majors) &&
    (rule.applicationYears.length === 0 ||
      (applicationYear !== undefined && rule.applicationYears.includes(applicationYear)))
  );
}

function applicableRules(student: RenewalStudentRecord, config: RenewalConfig) {
  const selected = new Map<string, RenewalConditionRule>();
  config.conditionRules
    .filter((rule) => matchesRule(rule, student) && rule.scope === "baseline")
    .forEach((rule) => selected.set(rule.requirementCode, rule));
  config.conditionRules
    .filter((rule) => matchesRule(rule, student) && rule.scope === "goal")
    .forEach((rule) => selected.set(rule.requirementCode, rule));
  return Array.from(selected.values());
}

function deriveStatus(
  rule: RenewalConditionRule,
  value: RenewalConditionSignal | undefined,
): RenewalConditionStatus {
  if (!value) return "data_pending";
  if (
    rule.scope === "baseline" &&
    rule.type !== "common" &&
    value.applicable !== true
  ) {
    return "applicability_pending";
  }
  if (!value.hasRequiredData) return "data_pending";
  if (value.completed) return "completed";
  if (value.activeCoverage) {
    return value.atRisk ? "in_progress_at_risk" : "in_progress_on_track";
  }
  return "missing";
}

function coverageQuality(status: RenewalConditionStatus): RenewalCoverageQuality {
  if (status === "completed") return "met";
  if (status === "in_progress_on_track") return "on_track";
  if (status === "in_progress_at_risk") return "at_risk";
  if (status === "missing") return "uncovered";
  return "pending";
}

function conditionPriority(
  rule: RenewalConditionRule,
  status: RenewalConditionStatus,
  value: RenewalConditionSignal | undefined,
): RenewalOpportunityPriority | undefined {
  if (status === "in_progress_at_risk") return value?.urgent ? "P0" : "P1";
  if (status !== "missing") return undefined;
  if (rule.scope === "goal") return rule.type === "optional" ? "P1" : "P0";
  if (rule.type === "common") return "P0";
  if (rule.type === "conditional" && value?.applicable) return "P1";
  return undefined;
}

function goalReference(student: RenewalStudentRecord) {
  if (student.targetProfile.status !== "confirmed") return undefined;
  return [
    student.targetProfile.countries.join("/"),
    student.targetProfile.schoolTiers.join("/"),
    student.targetProfile.majors.join("/"),
  ]
    .filter(Boolean)
    .join(" · ");
}

function matchProducts(
  rule: RenewalConditionRule,
  priority: RenewalOpportunityPriority | undefined,
  student: RenewalStudentRecord,
  signalValue: RenewalConditionSignal | undefined,
  config: RenewalConfig,
  evaluationDate = "2026-08-12",
) {
  if (!priority) return { recommendations: [], filteredProductReasons: [] };

  const recommendations: RenewalProductRecommendation[] = [];
  const filteredProductReasons: string[] = [];
  const targetDate = signalValue?.deadlineDate ?? student.nextExamDate;

  for (const mapping of config.productMappings.filter((item) =>
    item.conditionRuleIds.includes(rule.id),
  )) {
    let filteredReason: string | undefined;
    const prerequisite = student.prerequisiteResults[mapping.productId];
    if (!mapping.enabled || !mapping.sellable) filteredReason = `${mapping.productName}：当前不可售`;
    else if (!mapping.grades.includes(student.grade)) filteredReason = `${mapping.productName}：不适用当前年级`;
    else if (!matchesDimension(mapping.curricula, [student.curriculum])) filteredReason = `${mapping.productName}：不适用当前课程体系`;
    else if (!matchesDimension(mapping.countries, student.targetProfile.countries)) filteredReason = `${mapping.productName}：目标国家不匹配`;
    else if (!matchesDimension(mapping.schoolTiers, student.targetProfile.schoolTiers)) filteredReason = `${mapping.productName}：院校梯队不匹配`;
    else if (!matchesDimension(mapping.majors, student.targetProfile.majors)) filteredReason = `${mapping.productName}：目标专业不匹配`;
    else if (prerequisite?.met === false) filteredReason = `${mapping.productName}：${prerequisite.reason}`;
    else if (student.purchasedProductIds.includes(mapping.productId)) filteredReason = `${mapping.productName}：已有有效购买记录`;
    else if (mapping.enrollmentDeadline < evaluationDate) filteredReason = `${mapping.productName}：已超过报名时间`;
    else if (targetDate && mapping.startDate > targetDate) filteredReason = `${mapping.productName}：开班晚于目标节点`;
    else if (targetDate && mapping.endDate > targetDate) filteredReason = `${mapping.productName}：结课晚于目标节点`;

    if (filteredReason) {
      filteredProductReasons.push(filteredReason);
      continue;
    }
    if (recommendations.some((item) => item.productId === mapping.productId)) continue;

    const matchReasons = [
      `适用${student.grade}·${student.curriculum}`,
      rule.scope === "goal" ? `匹配${goalReference(student)}` : "覆盖年级基础要求",
      targetDate ? `课程可在${targetDate}前完成` : "当前报名时间有效",
    ];
    recommendations.push({
      productId: mapping.productId,
      productName: mapping.productName,
      productLine: mapping.productLine,
      mode: mapping.mode,
      recommendationType: mapping.recommendationType,
      suggestedPackage: mapping.suggestedPackage,
      reason: `可覆盖“${rule.name}”；${mapping.prerequisite}`,
      matchReasons,
      enrollmentDeadline: mapping.enrollmentDeadline,
      startDate: mapping.startDate,
      endDate: mapping.endDate,
      standardPrice: mapping.standardPrice,
      referenceAmount: mapping.standardPrice,
    });
  }

  recommendations.sort((left, right) =>
    left.enrollmentDeadline.localeCompare(right.enrollmentDeadline),
  );
  return {
    recommendations: recommendations.slice(0, 3),
    filteredProductReasons,
  };
}

function uniqueRecommendations(conditions: RenewalConditionDiagnosis[]) {
  const products = new Map<string, RenewalProductRecommendation>();
  for (const product of conditions.flatMap((condition) => condition.recommendations)) {
    if (!products.has(product.productId)) products.set(product.productId, product);
  }
  return Array.from(products.values()).slice(0, 3);
}

function toStudentSummary(student: RenewalStudentRecord): RenewalStudentSummary {
  const {
    conditionSignals: _conditionSignals,
    purchasedProductIds: _purchasedProductIds,
    prerequisiteResults: _prerequisiteResults,
    nextExamDate: _nextExamDate,
    ...summary
  } = student;
  return summary;
}

export function diagnoseRenewalStudent(
  student: RenewalStudentRecord,
  config: RenewalConfig,
): RenewalStudentDiagnosis {
  const conditions = applicableRules(student, config).map((rule) => {
    const value = student.conditionSignals[rule.requirementCode];
    const status = deriveStatus(rule, value);
    const priority = conditionPriority(rule, status, value);
    const matched = matchProducts(rule, priority, student, value, config);
    return {
      conditionId: `${student.id}-${rule.id}`,
      ruleId: rule.id,
      requirementCode: rule.requirementCode,
      requirementSource: rule.scope,
      goalReference: rule.scope === "goal" ? goalReference(student) : undefined,
      category: rule.category,
      conditionName: rule.name,
      conditionType: rule.type,
      requirement: rule.requirement,
      target: rule.target,
      deadline: rule.deadline,
      status,
      coverageQuality: coverageQuality(status),
      priority,
      statusReason: value?.reason ?? "未找到判断所需的数据",
      evidence: value?.evidence ?? [],
      coveringProducts: (value?.coveringProductIds ?? []).map(
        (productId) => currentProductNamesById[productId] ?? productId,
      ),
      recommendations: matched.recommendations,
      filteredProductReasons: matched.filteredProductReasons,
    } satisfies RenewalConditionDiagnosis;
  });

  const counts = conditions.reduce((result, condition) => {
    result[condition.status] += 1;
    return result;
  }, emptyCounts());
  const missingFields = [
    ...(student.targetProfile.status === "missing" ? ["目标国家/院校梯队/专业"] : []),
    ...conditions
      .filter((condition) => condition.status === "data_pending")
      .map((condition) => condition.conditionName),
  ].filter((item, index, list) => list.indexOf(item) === index);
  const actionable = conditions.filter((condition) => condition.priority);

  return {
    student: toStudentSummary(student),
    counts,
    conditions,
    missingFields,
    topRecommendations: uniqueRecommendations(actionable),
  };
}

export function getRenewalStudentDiagnosis(
  studentId: string,
  config: RenewalConfig,
) {
  const student = renewalStudentRecords.find((item) => item.id === studentId);
  return student ? diagnoseRenewalStudent(student, config) : undefined;
}

function opportunityFromDiagnosis(
  diagnosis: RenewalStudentDiagnosis,
): RenewalOpportunity | undefined {
  const actionableConditions = diagnosis.conditions.filter(
    (condition) => condition.priority && condition.recommendations.length > 0,
  );
  const pendingConditions = diagnosis.conditions.filter((condition) =>
    ["applicability_pending", "data_pending"].includes(condition.status),
  );
  if (
    actionableConditions.length === 0 &&
    pendingConditions.length === 0 &&
    diagnosis.missingFields.length === 0
  ) {
    return undefined;
  }
  const highestPriority = actionableConditions.some(
    (condition) => condition.priority === "P0",
  )
    ? "P0"
    : actionableConditions.some((condition) => condition.priority === "P1")
      ? "P1"
      : undefined;
  const referenceAmounts = diagnosis.topRecommendations
    .map((product) => product.referenceAmount)
    .filter((amount): amount is number => amount !== undefined);

  return {
    id: diagnosis.student.id,
    student: diagnosis.student,
    highestPriority,
    triggerReasons: diagnosis.student.triggerReasons,
    actionableConditions,
    pendingConditions,
    topRecommendations: diagnosis.topRecommendations,
    missingFields: diagnosis.missingFields,
    referenceAmount: referenceAmounts.length
      ? referenceAmounts.reduce((sum, amount) => sum + amount, 0)
      : undefined,
    updatedAt: diagnosis.student.diagnosedAt,
  };
}

export function listRenewalOpportunities(
  config: RenewalConfig,
): RenewalOpportunitiesResponse {
  const items = renewalStudentRecords
    .map((student) => opportunityFromDiagnosis(diagnoseRenewalStudent(student, config)))
    .filter((item): item is RenewalOpportunity => Boolean(item));
  return {
    summary: {
      opportunityStudents: items.filter((item) => item.actionableConditions.length > 0).length,
      p0Students: items.filter((item) => item.highestPriority === "P0").length,
      p1Students: items.filter((item) => item.highestPriority === "P1").length,
      pendingStudents: items.filter(
        (item) => item.pendingConditions.length > 0 || item.missingFields.length > 0,
      ).length,
      updatedAt: "2026-08-12 09:30",
    },
    items,
  };
}

export function runRenewalDiagnosis(
  request: RenewalRunRequest,
  config: RenewalConfig,
  evaluatedAt: string,
): RenewalRunResult {
  const students = renewalStudentRecords.filter((student) =>
    request.scope === "student"
      ? student.id === request.studentId
      : !request.owner || student.owner === request.owner,
  );
  const diagnoses = students.map((student) =>
    diagnoseRenewalStudent(
      {
        ...student,
        diagnosedAt: evaluatedAt,
        triggerReasons: [
          {
            type: request.triggerType,
            label:
              request.triggerType === "manual"
                ? "顾问手动重新诊断"
                : request.triggerType === "monthly"
                  ? "顾问月度盘点"
                  : "业务数据变化触发",
            occurredAt: evaluatedAt,
          },
          ...student.triggerReasons.filter((item) => item.type !== request.triggerType),
        ],
      },
      config,
    ),
  );
  return { evaluatedAt, diagnoses };
}
