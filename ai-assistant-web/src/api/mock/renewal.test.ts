import { describe, expect, it } from "vitest";
import {
  createInitialRenewalConfig,
  diagnoseRenewalStudent,
  listRenewalOpportunities,
  renewalStudentRecords,
  runRenewalDiagnosis,
  renewalConfigurationErrors,
} from "./renewal";

describe("renewal diagnosis engine", () => {
  const config = createInitialRenewalConfig();

  it("merges baseline and goal requirements by stable code with goal taking precedence", () => {
    const diagnosis = diagnoseRenewalStudent(renewalStudentRecords[0], config);
    const language = diagnosis.conditions.filter(
      (condition) => condition.requirementCode === "language-stage",
    );

    expect(language).toHaveLength(1);
    expect(language[0]).toMatchObject({
      ruleId: "goal-12年级-ucl-ic-language",
      requirementSource: "goal",
      sourceLevel: "school",
      goalReference: "英国 · TOP30 · 帝国理工学院 · 数学",
    });
    expect(language[0].sourceChain.map((source) => source.level)).toEqual([
      "grade",
      "destination",
      "school",
    ]);
    expect(language[0].criteria.map((item) => item.label)).toEqual([
      "雅思总分",
      "雅思单项",
    ]);
  });

  it("stacks different goal items while only overriding the same stable code", () => {
    const diagnosis = diagnoseRenewalStudent(renewalStudentRecords[2], config);

    expect(diagnosis.conditions.filter((item) => item.dimension === "admissions").length)
      .toBeGreaterThanOrEqual(4);
    expect(diagnosis.conditions.filter((item) => item.requirementCode === "language-stage"))
      .toHaveLength(1);
    expect(diagnosis.conditions.find((item) => item.requirementCode === "language-stage"))
      .toMatchObject({ sourceLevel: "school", ruleId: "goal-11年级-oxbridge-language" });
  });

  it("rejects equally specific overlapping active rules", () => {
    const invalid = structuredClone(config);
    const source = invalid.conditionRules.find((rule) => rule.id === "goal-12-uk-top30-language");
    if (!source) throw new Error("source rule missing");
    invalid.conditionRules.push({ ...source, id: "goal-conflict", name: "重复英国语言要求" });

    expect(renewalConfigurationErrors(invalid)).toContain(
      "“英国TOP30语言成绩达标”与“重复英国语言要求”在同层级适用范围重叠",
    );
  });

  it("inherits product mappings from the source chain for a newly added override", () => {
    const trialConfig = structuredClone(config);
    const baseline = trialConfig.conditionRules.find((rule) => rule.id === "9-language");
    if (!baseline) throw new Error("baseline rule missing");
    trialConfig.conditionRules.push({
      ...baseline,
      id: "goal-9-uk-language-new",
      scope: "goal",
      level: "destination",
      countries: ["英国"],
      name: "英国方向9年级语言目标",
    });
    const student = structuredClone(renewalStudentRecords[3]);
    student.targetProfile = {
      status: "confirmed",
      countries: ["英国"],
      schoolTiers: [],
      schools: [],
      majors: [],
    };

    const language = diagnoseRenewalStudent(student, trialConfig).conditions
      .find((item) => item.requirementCode === "language-stage");
    expect(language).toMatchObject({ ruleId: "goal-9-uk-language-new" });
    expect(language?.recommendations.map((item) => item.productId)).toContain("product-ielts-stage");
  });

  it("falls back to baseline rules when target is missing and does not default to planning products", () => {
    const diagnosis = diagnoseRenewalStudent(renewalStudentRecords[1], config);

    expect(diagnosis.conditions.every((condition) => condition.requirementSource === "baseline")).toBe(true);
    expect(diagnosis.missingFields).toContain("目标国家/院校梯队/专业");
    expect(
      diagnosis.conditions.find((condition) => condition.category === "planning"),
    ).toMatchObject({ status: "data_pending", recommendations: [] });
  });

  it("does not recommend completed or on-track conditions", () => {
    const diagnosis = diagnoseRenewalStudent(renewalStudentRecords[0], config);
    const language = diagnosis.conditions.find((condition) => condition.category === "language");
    const planning = diagnosis.conditions.find((condition) => condition.category === "planning");

    expect(language).toMatchObject({ status: "completed", coverageQuality: "met", recommendations: [] });
    expect(planning).toMatchObject({ status: "completed", recommendations: [] });
  });

  it("uses score, hours and deadline evidence for an urgent coverage risk", () => {
    const diagnosis = diagnoseRenewalStudent(renewalStudentRecords[0], config);
    const subject = diagnosis.conditions.find((condition) => condition.category === "subject");

    expect(subject).toMatchObject({
      status: "in_progress_at_risk",
      coverageQuality: "at_risk",
      priority: "P0",
    });
    expect(subject?.evidence.map((item) => item.label)).toEqual(
      expect.arrayContaining(["A-Level数学", "下一考试", "数学模考"]),
    );
    expect(subject?.recommendations.length).toBeGreaterThan(0);
  });

  it("aggregates all actionable gaps into one row per student", () => {
    const response = listRenewalOpportunities(config);
    const lin = response.items.find((item) => item.student.id === "renewal-student-001");

    expect(response.items.map((item) => item.student.id)).toEqual(
      Array.from(new Set(response.items.map((item) => item.student.id))),
    );
    expect(lin).toMatchObject({ highestPriority: "P0" });
    expect(lin?.actionableConditions.length).toBeGreaterThanOrEqual(2);
    expect(lin?.topRecommendations.length).toBeLessThanOrEqual(3);
    expect(lin?.referenceAmount).toBeGreaterThan(0);
  });

  it("filters purchased, unavailable, expired and duplicate products", () => {
    const trialConfig = structuredClone(config);
    const original = trialConfig.productMappings.find(
      (item) => item.productId === "product-ielts-stage",
    );
    if (!original) throw new Error("product mapping missing");
    trialConfig.productMappings.push({ ...original, id: "mapping-ielts-duplicate" });

    const available = diagnoseRenewalStudent(renewalStudentRecords[3], trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(available?.recommendations.map((product) => product.productId)).toEqual([
      "product-ielts-stage",
    ]);
    expect(available?.filteredProductReasons).toContain("暑期语言封闭营：当前不可售");

    const purchasedStudent = structuredClone(renewalStudentRecords[0]);
    purchasedStudent.conditionSignals["language-stage"] = {
      hasRequiredData: true,
      completed: false,
      activeCoverage: false,
      atRisk: false,
      reason: "语言条件缺失",
      evidence: [],
      coveringProductIds: [],
    };
    const purchased = diagnoseRenewalStudent(purchasedStudent, trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(purchased?.recommendations).toEqual([]);
    expect(purchased?.filteredProductReasons).toContain("雅思阶段能力提升班：已有有效购买记录");
  });

  it("filters product portrait, prerequisite and course-end mismatches", () => {
    const trialConfig = structuredClone(config);
    const base = trialConfig.productMappings.find(
      (item) => item.productId === "product-ielts-stage",
    );
    if (!base) throw new Error("product mapping missing");
    trialConfig.productMappings.push(
      {
        ...base,
        id: "mapping-wrong-curriculum",
        productId: "product-wrong-curriculum",
        productName: "AP语言班",
        conditionRuleIds: ["9-language"],
        curricula: ["AP"],
      },
      {
        ...base,
        id: "mapping-after-target",
        productId: "product-after-target",
        productName: "考后语言班",
        conditionRuleIds: ["11-language"],
        startDate: "2026-10-01",
        endDate: "2026-12-10",
      },
    );

    const portrait = diagnoseRenewalStudent(renewalStudentRecords[3], trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(portrait?.filteredProductReasons).toContain("AP语言班：不适用当前课程体系");

    const examWindow = diagnoseRenewalStudent(renewalStudentRecords[2], trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(examWindow?.filteredProductReasons).toContain("考后语言班：结课晚于目标节点");

    const prerequisiteStudent = structuredClone(renewalStudentRecords[3]);
    prerequisiteStudent.prerequisiteResults["product-ielts-stage"] = {
      met: false,
      reason: "尚未完成语言测评",
    };
    const prerequisite = diagnoseRenewalStudent(prerequisiteStudent, trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(prerequisite?.filteredProductReasons).toContain("雅思阶段能力提升班：尚未完成语言测评");
  });

  it("caps candidates at three and preserves missing prices without estimation", () => {
    const trialConfig = structuredClone(config);
    const base = trialConfig.productMappings.find(
      (item) => item.productId === "product-ielts-stage",
    );
    if (!base) throw new Error("product mapping missing");
    for (let index = 0; index < 4; index += 1) {
      trialConfig.productMappings.push({
        ...base,
        id: `mapping-extra-${index}`,
        productId: `product-extra-${index}`,
        productName: `语言候选${index + 1}`,
        conditionRuleIds: ["9-language"],
        enrollmentDeadline: `2026-08-${20 + index}`,
        standardPrice: index === 0 ? undefined : 12000 + index * 1000,
      });
    }

    const language = diagnoseRenewalStudent(renewalStudentRecords[3], trialConfig)
      .conditions.find((item) => item.category === "language");
    expect(language?.recommendations).toHaveLength(3);
    expect(language?.recommendations.find((item) => item.productId === "product-extra-0"))
      .toMatchObject({ standardPrice: undefined, referenceAmount: undefined });
  });

  it("produces the same condition result for manual and scheduled runs on one snapshot", () => {
    const manual = runRenewalDiagnosis(
      { scope: "student", studentId: "renewal-student-003", triggerType: "manual" },
      config,
      "2026-08-12 10:00",
    );
    const monthly = runRenewalDiagnosis(
      { scope: "student", studentId: "renewal-student-003", triggerType: "monthly" },
      config,
      "2026-08-12 10:00",
    );
    expect(manual.diagnoses[0].conditions).toEqual(monthly.diagnoses[0].conditions);
  });

  it("keeps business results on the published config until a draft is published", () => {
    const published = createInitialRenewalConfig();
    const draft = structuredClone(published);
    draft.conditionRules = draft.conditionRules.map((rule) =>
      rule.id === "9-language" ? { ...rule, enabled: false } : rule,
    );

    const publishedItem = listRenewalOpportunities(published).items.find(
      (item) => item.student.id === "renewal-student-004",
    );
    const draftItem = listRenewalOpportunities(draft).items.find(
      (item) => item.student.id === "renewal-student-004",
    );
    expect(publishedItem?.actionableConditions.some((item) => item.category === "language")).toBe(true);
    expect(draftItem?.actionableConditions.some((item) => item.category === "language")).toBe(false);
  });
});
