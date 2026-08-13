import { describe, expect, it } from "vitest";
import {
  createComplaintRiskTrialResult,
  createInitialComplaintRiskConfig,
} from "./complaintRiskConfig";

describe("complaint risk configuration trial", () => {
  it("按启用规则累加文本风险分并应用强制等级", () => {
    const config = createInitialComplaintRiskConfig();
    const result = createComplaintRiskTrialResult({
      config,
      input: {
        mode: "text",
        text: "这个问题再不处理，我就正式投诉你们并要求退费。",
      },
    });

    expect(result.riskLevel).toBe("high");
    expect(result.riskScore).toBe(100);
    expect(result.matchedRules.map((rule) => rule.ruleName)).toEqual([
      "正式投诉或外部升级",
      "明确退费倾向",
    ]);
  });

  it("旧学生样本试跑不再应用跨渠道加分", () => {
    const result = createComplaintRiskTrialResult({
      config: createInitialComplaintRiskConfig(),
      input: { mode: "student", studentId: "risk-student-001" },
    });

    expect(result.riskLevel).toBe("high");
    expect(result.crossChannelBonusApplied).toBe(false);
    expect(result.matchedRules).toHaveLength(2);
    expect(result.summary).toContain("家长三次质疑学习效果");
  });

  it("无规则命中时不生成预警", () => {
    const config = createInitialComplaintRiskConfig();
    config.rules = config.rules.map((rule) => ({ ...rule, enabled: false }));
    const result = createComplaintRiskTrialResult({
      config,
      input: { mode: "text", text: "今天上课很顺利，谢谢老师。" },
    });

    expect(result.riskLevel).toBeUndefined();
    expect(result.riskScore).toBe(0);
    expect(result.matchedRules).toEqual([]);
  });
});
