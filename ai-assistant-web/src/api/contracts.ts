export type UserRole =
  | "studentManager"
  | "consultant"
  | "planner"
  | "qualityInspector"
  | "teacher";

export type UserPermission =
  | "assistant.use"
  | "complaintRisk.view"
  | "renewal.view"
  | "renewalConfig.manage"
  | "workReminder.view"
  | "platformAssistantConfig.view"
  | "platformAssistantConfig.edit"
  | "platformAssistantConfig.publish"
  | "platformAssistantConfig.rollback";

export type CurrentUser = {
  id: string;
  name: string;
  avatarUrl?: string;
  organization: string;
  role: {
    id: UserRole;
    label: string;
  };
  permissions: UserPermission[];
};

export type WorkReminderType =
  | "complaintRisk"
  | "renewal"
  | "assignment";

export type WorkReminderPriority = "high" | "medium" | "normal";

export type WorkReminder = {
  id: string;
  type: WorkReminderType;
  priority: WorkReminderPriority;
  title: string;
  description: string;
  createdAt: string;
  targetPath: string;
  read: boolean;
  student?: {
    id: string;
    name: string;
  };
};

export type WorkReminderSummary = {
  unreadCount: number;
  items: WorkReminder[];
};

export type StudentOption = {
  id: string;
  name: string;
};

export type RenewalAssistantFocus =
  | { type: "condition"; id: string; label: string }
  | { type: "product"; id: string; label: string };

export type QueryContext =
  | { kind: "score"; studentId: string; days: 30 }
  | { kind: "order"; studentId: string }
  | { kind: "teacherFeedback"; studentId: string; days: 30 }
  | { kind: "parentReply"; studentId: string; parentMessage: string }
  | { kind: "complaintRisk"; studentId: string }
  | {
      kind: "renewal";
      studentId: string;
      focus?: RenewalAssistantFocus;
    };

export type ConversationScope =
  | {
      kind: "complaintRisk";
      studentId: string;
    }
  | {
      kind: "renewal";
      studentId: string;
    };

export type Source = {
  id: string;
  label: string;
};

export type ScoreCard = {
  kind: "score";
  conclusion: string;
  metrics: Array<{ label: string; value: string; note?: string }>;
};

export type OrderCard = {
  kind: "order";
  orders: Array<{
    product: string;
    usedHours: number;
    remainingHours: number;
    status: "进行中" | "待开课";
  }>;
};

export type TeacherFeedbackCard = {
  kind: "teacherFeedback";
  conclusion: string;
  points: string[];
};

export type ParentReplyCard = {
  kind: "parentReply";
  draft: string;
};

export type EmptyDataCard = {
  kind: "empty";
  message: string;
  missing: string[];
};

export type AssistantCard =
  | ScoreCard
  | OrderCard
  | TeacherFeedbackCard
  | ParentReplyCard
  | EmptyDataCard;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  card?: AssistantCard;
  sources?: Source[];
  configVersion?: string;
  status?: "streaming" | "done" | "error" | "stopped";
};

export type ConversationSummary = {
  id: string;
  title: string;
  updatedAt: string;
  scope?: ConversationScope;
};

export type SendMessageRequest = {
  text: string;
  context?: QueryContext;
  capabilityId?: AssistantCapabilityId;
};

export type AssistantCapabilityId =
  | "studentLearning"
  | "orderQuery"
  | "teacherFeedback"
  | "parentReply"
  | "complaintRisk"
  | "renewalDiagnosis";

export type AssistantOutputType =
  | "scoreCard"
  | "orderCard"
  | "feedbackSummary"
  | "replyDraft"
  | "riskSummary"
  | "renewalDiagnosis";

export type AssistantPromptItem = {
  key: string;
  description: string;
};

export type AssistantCapability = {
  id: AssistantCapabilityId;
  name: string;
  description: string;
  enabled: boolean;
  order: number;
  requiredContext: "none" | "student";
  dataSources: string[];
  outputType: AssistantOutputType;
  requireSources: boolean;
  requireDataTimestamp: boolean;
  disclaimer?: string;
  recommendedPrompts: AssistantPromptItem[];
};

export type AssistantRoleGrant = {
  role: UserRole;
  capabilityIds: AssistantCapabilityId[];
};

export type PlatformAssistantConfig = {
  sceneId: "platformAssistant";
  sceneName: string;
  publishedVersion: string;
  draftVersion: string;
  draftStatus: "published" | "saved";
  basic: {
    name: string;
    avatarUrl?: string;
    welcomeMessage: string;
    description: string;
    disclaimer: string;
    historyEnabled: boolean;
    fallbackMessages: {
      noData: string;
      forbidden: string;
      serviceError: string;
    };
  };
  capabilities: AssistantCapability[];
  roleGrants: AssistantRoleGrant[];
  responsePolicy: {
    tone: "professional" | "friendly" | "concise";
    detailLevel: "brief" | "standard" | "detailed";
    requireSources: boolean;
    requireDataTimestamp: boolean;
    refuseWhenDataMissing: boolean;
    externalDraftRequiresReview: true;
    systemPrompt: string;
  };
  lastSuccessfulTrialAt?: string;
  lastSuccessfulTrialBy?: string;
  updatedAt: string;
  updatedBy: string;
};

export type PlatformAssistantRuntime = {
  configVersion: string;
  role: UserRole;
  basic: PlatformAssistantConfig["basic"];
  capabilities: AssistantCapability[];
};

export type PlatformAssistantTrialRequest = {
  config: PlatformAssistantConfig;
  role: UserRole;
  capabilityId: AssistantCapabilityId;
  studentId: string;
  question: string;
};

export type PlatformAssistantTrialResult = {
  success: boolean;
  trialAt: string;
  capabilityId: AssistantCapabilityId;
  capabilityName: string;
  role: UserRole;
  aiAuthorized: boolean;
  businessDataAuthorized: boolean;
  dataSources: string[];
  answer: string;
  sources: Source[];
  configVersion: string;
};

export type PlatformAssistantVersion = {
  version: string;
  status: "current" | "history";
  changeNote: string;
  publishedAt: string;
  publishedBy: string;
};

export type PlatformAssistantAuditAction =
  | "draftSaved"
  | "trialSucceeded"
  | "trialRejected"
  | "published"
  | "rolledBack"
  | "capabilityUsed"
  | "accessDenied";

export type PlatformAssistantAuditLog = {
  id: string;
  action: PlatformAssistantAuditAction;
  operator: string;
  role: UserRole;
  occurredAt: string;
  summary: string;
  configVersion?: string;
  capabilityId?: AssistantCapabilityId;
  requestId: string;
};

export type AssistantStreamEvent =
  | { type: "delta"; value: string }
  | { type: "card"; card: AssistantCard }
  | { type: "sources"; sources: Source[] }
  | { type: "done"; messageId: string };

export type ComplaintRiskTypeConfig = {
  id: string;
  name: string;
  keywords: string[];
  positiveExamples: string[];
  highRiskDefinition: string;
  mediumRiskDefinition: string;
  lowRiskDefinition: string;
};

export type ComplaintRiskConfig = {
  sceneId: "complaintRisk";
  sceneName: string;
  publishedVersion: string;
  draftVersion: string;
  draftStatus: "published" | "saved";
  updatedAt: string;
  updatedBy: string;
  riskTypes: ComplaintRiskTypeConfig[];
};

export type ComplaintRiskVersion = {
  version: string;
  status: "current" | "history";
  changeNote: string;
  publishedAt: string;
  publishedBy: string;
  riskTypes: ComplaintRiskTypeConfig[];
};

export type RenewalConditionCategory =
  | "language"
  | "subject"
  | "competition"
  | "background"
  | "assessment"
  | "planning";

export type RenewalConditionType = "common" | "conditional" | "optional";

export type RenewalConditionStatus =
  | "completed"
  | "in_progress_on_track"
  | "in_progress_at_risk"
  | "missing"
  | "applicability_pending"
  | "data_pending";

export type RenewalOpportunityPriority = "P0" | "P1";

export type RenewalRuleScope = "baseline" | "goal";

export type RenewalRuleLevel = "grade" | "destination" | "school" | "major";

export type RenewalGoalDimension = "subject" | "language" | "admissions";

export type RenewalCriterionMetric =
  | "score"
  | "grade"
  | "count"
  | "completion"
  | "text";

export type RenewalCriterionOperator = "gte" | "lte" | "eq" | "contains";

export type RenewalCriterion = {
  id: string;
  label: string;
  metric: RenewalCriterionMetric;
  operator?: RenewalCriterionOperator;
  value?: string | number;
  unit?: string;
};

export type RenewalRuleSource = {
  ruleId: string;
  level: RenewalRuleLevel;
  label: string;
  effective: boolean;
};

export type RenewalCoverageQuality =
  | "met"
  | "on_track"
  | "at_risk"
  | "uncovered"
  | "pending";

export type RenewalTriggerType = "monthly" | "manual" | "event";

export type RenewalTriggerReason = {
  type: RenewalTriggerType;
  label: string;
  occurredAt: string;
};

export type RenewalTargetProfile = {
  status: "confirmed" | "missing";
  countries: string[];
  schoolTiers: string[];
  schools: string[];
  majors: string[];
  applicationYear?: number;
  updatedAt?: string;
};

export type RenewalEvidence = {
  id: string;
  source: "score" | "registration" | "planning" | "order" | "course" | "profile";
  label: string;
  value: string;
  updatedAt: string;
};

export type RenewalProductRecommendation = {
  productId: string;
  productName: string;
  productLine: string;
  mode: "班课" | "1V1" | "服务产品";
  recommendationType: "renewal" | "reinforcement" | "new" | "advanced";
  suggestedPackage: string;
  reason: string;
  matchReasons: string[];
  enrollmentDeadline: string;
  startDate: string;
  endDate: string;
  standardPrice?: number;
  referenceAmount?: number;
};

export type RenewalConditionDiagnosis = {
  conditionId: string;
  ruleId: string;
  requirementCode: string;
  requirementSource: RenewalRuleScope;
  sourceLevel: RenewalRuleLevel;
  sourceChain: RenewalRuleSource[];
  goalReference?: string;
  dimension: RenewalGoalDimension;
  category: RenewalConditionCategory;
  conditionName: string;
  conditionType: RenewalConditionType;
  requirement: string;
  target?: string;
  criteria: RenewalCriterion[];
  deadline: string;
  status: RenewalConditionStatus;
  coverageQuality: RenewalCoverageQuality;
  priority?: RenewalOpportunityPriority;
  statusReason: string;
  evidence: RenewalEvidence[];
  coveringProducts: string[];
  recommendations: RenewalProductRecommendation[];
  filteredProductReasons: string[];
};

export type RenewalStudentSummary = {
  id: string;
  name: string;
  customerNumber: string;
  grade: string;
  curriculum: string;
  applicationYear?: number;
  targetProfile: RenewalTargetProfile;
  owner: string;
  currentProducts: string[];
  remainingHours: number;
  latestScore?: string;
  nextExam?: string;
  triggerReasons: RenewalTriggerReason[];
  diagnosedAt: string;
  updatedAt: string;
};

export type RenewalDiagnosisCounts = Record<RenewalConditionStatus, number>;

export type RenewalStudentDiagnosis = {
  student: RenewalStudentSummary;
  counts: RenewalDiagnosisCounts;
  conditions: RenewalConditionDiagnosis[];
  missingFields: string[];
  topRecommendations: RenewalProductRecommendation[];
};

export type RenewalOpportunity = {
  id: string;
  student: RenewalStudentSummary;
  highestPriority?: RenewalOpportunityPriority;
  triggerReasons: RenewalTriggerReason[];
  actionableConditions: RenewalConditionDiagnosis[];
  pendingConditions: RenewalConditionDiagnosis[];
  topRecommendations: RenewalProductRecommendation[];
  missingFields: string[];
  referenceAmount?: number;
  updatedAt: string;
};

export type RenewalOpportunitySummary = {
  opportunityStudents: number;
  p0Students: number;
  p1Students: number;
  pendingStudents: number;
  updatedAt: string;
};

export type RenewalOpportunitiesResponse = {
  summary: RenewalOpportunitySummary;
  items: RenewalOpportunity[];
};

export type RenewalConditionRule = {
  id: string;
  requirementCode: string;
  scope: RenewalRuleScope;
  level: RenewalRuleLevel;
  grade: string;
  curricula: string[];
  countries: string[];
  schoolTiers: string[];
  schools: string[];
  majors: string[];
  applicationYears: number[];
  dimension: RenewalGoalDimension;
  category: RenewalConditionCategory;
  name: string;
  type: RenewalConditionType;
  requirement: string;
  target?: string;
  criteriaLogic: "all";
  criteria: RenewalCriterion[];
  deadline: string;
  evidenceSources: RenewalEvidence["source"][];
  enabled: boolean;
};

export type RenewalProductMapping = {
  id: string;
  conditionRuleIds: string[];
  productId: string;
  productName: string;
  productLine: string;
  grades: string[];
  curricula: string[];
  countries: string[];
  schoolTiers: string[];
  majors: string[];
  prerequisite: string;
  mode: RenewalProductRecommendation["mode"];
  recommendationType: RenewalProductRecommendation["recommendationType"];
  suggestedPackage: string;
  enrollmentDeadline: string;
  startDate: string;
  endDate: string;
  standardPrice?: number;
  sellable: boolean;
  enabled: boolean;
};

export type RenewalConfig = {
  sceneId: "renewalDiagnosis";
  sceneName: string;
  publishedVersion: string;
  draftVersion: string;
  draftStatus: "published" | "saved";
  updatedAt: string;
  updatedBy: string;
  conditionRules: RenewalConditionRule[];
  productMappings: RenewalProductMapping[];
};

export type RenewalConfigVersion = {
  version: string;
  status: "current" | "history";
  changeNote: string;
  publishedAt: string;
  publishedBy: string;
};

export type RenewalTrialRequest = {
  config: RenewalConfig;
  studentId: string;
};

export type RenewalTrialResult = {
  student: RenewalStudentSummary;
  conditions: RenewalConditionDiagnosis[];
};

export type RenewalRunRequest = {
  scope: "student" | "owner";
  studentId?: string;
  owner?: string;
  triggerType: RenewalTriggerType;
};

export type RenewalRunResult = {
  evaluatedAt: string;
  diagnoses: RenewalStudentDiagnosis[];
};
