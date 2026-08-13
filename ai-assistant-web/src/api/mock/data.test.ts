import { describe, expect, it } from "vitest";
import { createAssistantPayload } from "./data";

describe("complaint risk assistant payload", () => {
  const context = {
    kind: "complaintRisk" as const,
    studentId: "risk-student-001",
  };

  it("基于当前学生生成风险总结、跟进动作和沟通话术", () => {
    expect(
      createAssistantPayload(context, "总结该生当前客诉风险").content,
    ).toContain("林家宁当前为高风险");
    expect(
      createAssistantPayload(context, "给出优先跟进动作").content,
    ).toContain("建议按以下顺序跟进林家宁");
    expect(
      createAssistantPayload(context, "生成家长沟通话术").content,
    ).toContain("建议回复");
  });
});

describe("renewal assistant payload", () => {
  const context = {
    kind: "renewal" as const,
    studentId: "renewal-student-003",
  };

  it("按结论、依据、动作和人工确认组织续费建议", () => {
    const result = createAssistantPayload(
      context,
      "为什么判断为续费机会",
    );

    expect(result.content).toContain("**结论**");
    expect(result.content).toContain("**依据**");
    expect(result.content).toContain("**建议动作**");
    expect(result.content).toContain("**需人工确认**");
    expect(result.content).toContain("不代表续费概率");
    expect(result.sources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "renewal-analysis" }),
        expect.objectContaining({ id: "renewal-evidence" }),
      ]),
    );
  });

  it("分别生成产品比较、沟通草稿和跟进清单", () => {
    expect(
      createAssistantPayload(context, "比较推荐产品").content,
    ).toContain("产品比较");
    expect(
      createAssistantPayload(context, "生成家长沟通话术").content,
    ).toContain("沟通草稿");
    expect(
      createAssistantPayload(context, "生成分步骤跟进清单").content,
    ).toContain("跟进清单");
  });
});
