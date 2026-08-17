import type {
  RenewalConditionCategory,
  RenewalConditionRule,
  RenewalCriterion,
  RenewalGoalDimension,
  RenewalRuleLevel,
  RenewalRuleSource,
  RenewalStudentSummary,
} from "../../api/contracts";

export const renewalGoalDimensionMeta: Record<
  RenewalGoalDimension,
  { label: string; description: string; color: string }
> = {
  subject: {
    label: "学科",
    description: "课程衔接、选课、校内成绩与大考目标",
    color: "blue",
  },
  language: {
    label: "语言",
    description: "阶段语言能力、院校分数与提交节点",
    color: "cyan",
  },
  admissions: {
    label: "升学",
    description: "方向、规划、竞赛、申请与录取条件",
    color: "purple",
  },
};

export const renewalRuleLevelMeta: Record<
  RenewalRuleLevel,
  { label: string; shortLabel: string; rank: number; color: string }
> = {
  grade: { label: "年级基线", shortLabel: "基线", rank: 0, color: "blue" },
  destination: { label: "留学方向", shortLabel: "方向", rank: 1, color: "geekblue" },
  school: { label: "学校要求", shortLabel: "学校", rank: 2, color: "purple" },
  major: { label: "专业要求", shortLabel: "专业", rank: 3, color: "magenta" },
};

export function dimensionForCategory(
  category: RenewalConditionCategory,
): RenewalGoalDimension {
  if (category === "subject") return "subject";
  if (category === "language") return "language";
  return "admissions";
}

export function formatCriterion(criterion: RenewalCriterion) {
  if (criterion.metric === "text") return criterion.value ? String(criterion.value) : criterion.label;
  const operator = {
    gte: "≥",
    lte: "≤",
    eq: "=",
    contains: "包含",
  }[criterion.operator ?? "eq"];
  return [criterion.label, operator, criterion.value, criterion.unit]
    .filter((value) => value !== undefined && value !== "")
    .join(" ");
}

export function formatCriteria(rule: Pick<RenewalConditionRule, "criteria" | "target">) {
  if (!rule.criteria.length) return rule.target || "未配置达标标准";
  return rule.criteria.map(formatCriterion).join("；");
}

export function ruleScopeValues(rule: RenewalConditionRule) {
  return [
    ...rule.countries,
    ...rule.schoolTiers,
    ...rule.schools,
    ...rule.majors,
  ];
}

export function describeRuleScope(rule: RenewalConditionRule) {
  if (rule.level === "grade") return `${rule.grade}基线`;
  const values = ruleScopeValues(rule);
  return values.length ? values.join(" · ") : renewalRuleLevelMeta[rule.level].label;
}

export function ruleScopeKey(rule: RenewalConditionRule) {
  const normalize = (values: Array<string | number>) => [...values].sort().join(",");
  return [
    rule.level,
    normalize(rule.curricula),
    normalize(rule.countries),
    normalize(rule.schoolTiers),
    normalize(rule.schools),
    normalize(rule.majors),
    normalize(rule.applicationYears),
  ].join("|");
}

function matchesDimension(required: string[], actual: string[]) {
  return required.length === 0 || required.some((item) => actual.includes(item));
}

export function matchesRenewalRule(
  rule: RenewalConditionRule,
  student: Pick<RenewalStudentSummary, "grade" | "curriculum" | "applicationYear" | "targetProfile">,
) {
  if (!rule.enabled || rule.grade !== student.grade) return false;
  if (!matchesDimension(rule.curricula, [student.curriculum])) return false;
  if (rule.level === "grade") return true;
  if (student.targetProfile.status !== "confirmed") return false;
  const applicationYear = student.applicationYear ?? student.targetProfile.applicationYear;
  return (
    matchesDimension(rule.countries, student.targetProfile.countries) &&
    matchesDimension(rule.schoolTiers, student.targetProfile.schoolTiers) &&
    matchesDimension(rule.schools, student.targetProfile.schools) &&
    matchesDimension(rule.majors, student.targetProfile.majors) &&
    (rule.applicationYears.length === 0 ||
      (applicationYear !== undefined && rule.applicationYears.includes(applicationYear)))
  );
}

function ruleSpecificity(rule: RenewalConditionRule) {
  return (
    renewalRuleLevelMeta[rule.level].rank * 10 +
    [
      rule.curricula,
      rule.countries,
      rule.schoolTiers,
      rule.schools,
      rule.majors,
      rule.applicationYears,
    ].filter((values) => values.length > 0).length
  );
}

export type ResolvedRenewalRule = {
  rule: RenewalConditionRule;
  sourceRules: RenewalConditionRule[];
  sourceChain: RenewalRuleSource[];
};

export function resolveRenewalRules(
  rules: RenewalConditionRule[],
  student: Pick<RenewalStudentSummary, "grade" | "curriculum" | "applicationYear" | "targetProfile">,
): ResolvedRenewalRule[] {
  const matchedByCode = new Map<string, RenewalConditionRule[]>();
  rules.filter((rule) => matchesRenewalRule(rule, student)).forEach((rule) => {
    const current = matchedByCode.get(rule.requirementCode) ?? [];
    current.push(rule);
    matchedByCode.set(rule.requirementCode, current);
  });

  return Array.from(matchedByCode.values()).map((matchedRules) => {
    const sorted = [...matchedRules].sort((left, right) => {
      const specificity = ruleSpecificity(left) - ruleSpecificity(right);
      return specificity || left.id.localeCompare(right.id);
    });
    const rule = sorted.at(-1)!;
    return {
      rule,
      sourceRules: sorted,
      sourceChain: sorted.map((source) => ({
        ruleId: source.id,
        level: source.level,
        label: `${renewalRuleLevelMeta[source.level].label} · ${describeRuleScope(source)}`,
        effective: source.id === rule.id,
      })),
    };
  });
}

function arraysOverlap<T>(left: T[], right: T[]) {
  return left.length === 0 || right.length === 0 || left.some((item) => right.includes(item));
}

function overlappingScope(left: RenewalConditionRule, right: RenewalConditionRule) {
  return (
    left.grade === right.grade &&
    arraysOverlap(left.curricula, right.curricula) &&
    arraysOverlap(left.countries, right.countries) &&
    arraysOverlap(left.schoolTiers, right.schoolTiers) &&
    arraysOverlap(left.schools, right.schools) &&
    arraysOverlap(left.majors, right.majors) &&
    arraysOverlap(left.applicationYears, right.applicationYears)
  );
}

export function validateRenewalRules(rules: RenewalConditionRule[]) {
  const errors: string[] = [];
  const enabledRules = rules.filter((rule) => rule.enabled);

  enabledRules.forEach((rule) => {
    if (rule.level === "destination" && !rule.countries.length && !rule.schoolTiers.length) {
      errors.push(`“${rule.name}”需要选择留学方向或院校梯队`);
    }
    if (rule.level === "school" && !rule.schools.length) {
      errors.push(`“${rule.name}”需要选择学校`);
    }
    if (rule.level === "major" && !rule.majors.length) {
      errors.push(`“${rule.name}”需要选择专业`);
    }
  });

  for (let leftIndex = 0; leftIndex < enabledRules.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < enabledRules.length; rightIndex += 1) {
      const left = enabledRules[leftIndex];
      const right = enabledRules[rightIndex];
      if (
        left.requirementCode === right.requirementCode &&
        left.level === right.level &&
        ruleSpecificity(left) === ruleSpecificity(right) &&
        overlappingScope(left, right)
      ) {
        errors.push(`“${left.name}”与“${right.name}”在同层级适用范围重叠`);
      }
    }
  }

  return Array.from(new Set(errors));
}

export function buildPreviewStudent(rule: RenewalConditionRule): RenewalStudentSummary {
  return {
    id: "rule-preview",
    name: "规则预览",
    customerNumber: "PREVIEW",
    grade: rule.grade,
    curriculum: rule.curricula[0] ?? "A-Level",
    applicationYear: rule.applicationYears[0],
    targetProfile: {
      status: rule.level === "grade" ? "missing" : "confirmed",
      countries: rule.countries,
      schoolTiers: rule.schoolTiers,
      schools: rule.schools,
      majors: rule.majors,
      applicationYear: rule.applicationYears[0],
    },
    owner: "总部产品运营",
    currentProducts: [],
    remainingHours: 0,
    triggerReasons: [],
    diagnosedAt: "",
    updatedAt: "",
  };
}
