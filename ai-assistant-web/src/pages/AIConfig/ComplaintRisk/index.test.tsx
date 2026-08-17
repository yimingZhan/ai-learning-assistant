import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import ComplaintRiskConfigPage, {
  normalizeRiskTypes,
  removeRiskTypeById,
  upsertRiskType,
  validateConfiguration,
} from ".";
import { createInitialComplaintRiskConfig } from "../../../api/mock/complaintRiskConfig";

describe("complaint risk type configuration validation", () => {
  it("拒绝空配置、重复类型、非法关键词和非法案例", () => {
    const noTypes = createInitialComplaintRiskConfig();
    noTypes.riskTypes = [];
    expect(validateConfiguration(noTypes)).toContain("至少保留一个风险类型");

    const duplicateTypes = createInitialComplaintRiskConfig();
    duplicateTypes.riskTypes[1].name = ` ${duplicateTypes.riskTypes[0].name} `;
    expect(validateConfiguration(duplicateTypes)).toContain("风险类型名称不能重复");

    const blankKeyword = createInitialComplaintRiskConfig();
    blankKeyword.riskTypes[0].keywords.push("   ");
    expect(validateConfiguration(blankKeyword)).toContain("关键词不能为空");

    const duplicateKeywords = createInitialComplaintRiskConfig();
    duplicateKeywords.riskTypes[0].keywords.push(
      ` ${duplicateKeywords.riskTypes[0].keywords[0]} `,
    );
    expect(validateConfiguration(duplicateKeywords)).toContain("关键词不能重复");

    const noExamples = createInitialComplaintRiskConfig();
    noExamples.riskTypes[0].positiveExamples = [];
    expect(validateConfiguration(noExamples)).toContain("至少添加一条正向参考案例");

    const blankExample = createInitialComplaintRiskConfig();
    blankExample.riskTypes[0].positiveExamples[0] = "   ";
    expect(validateConfiguration(blankExample)).toContain("正向参考案例不能为空");

    const duplicateExamples = createInitialComplaintRiskConfig();
    duplicateExamples.riskTypes[0].positiveExamples.push(
      ` ${duplicateExamples.riskTypes[0].positiveExamples[0]} `,
    );
    expect(validateConfiguration(duplicateExamples)).toContain("正向参考案例不能重复");

    const duplicateAcrossDirections = createInitialComplaintRiskConfig();
    duplicateAcrossDirections.riskTypes[0].negativeExamples.push(
      duplicateAcrossDirections.riskTypes[0].positiveExamples[0],
    );
    expect(validateConfiguration(duplicateAcrossDirections)).toContain("正向和反向参考案例不能重复");
  });

  it("保存前清理类型名称、关键词和案例的首尾空格", () => {
    const config = createInitialComplaintRiskConfig();
    config.riskTypes[0].name = "  跟进及时性  ";
    config.riskTypes[0].keywords[0] = "  联系不上  ";
    config.riskTypes[0].positiveExamples[0] = "  一直联系不上你  ";

    expect(normalizeRiskTypes(config.riskTypes)[0]).toMatchObject({
      name: "跟进及时性",
      keywords: ["联系不上", "没回复", "没有反馈"],
      positiveExamples: [
        "一直联系不上你",
        "老师很久没回复消息",
        "咨询的问题一直没有反馈",
      ],
      negativeExamples: ["老师已经及时回复了", "问题已经得到反馈", "一直都有联系"],
    });
  });

  it("按稳定 ID 新增、编辑和删除风险类型并保留案例顺序", () => {
    const initial = createInitialComplaintRiskConfig().riskTypes;
    const added = upsertRiskType(initial, {
      id: "price-objection",
      name: " 价格异议 ",
      keywords: [" 价格贵 ", " 不合理 "],
      positiveExamples: [" 这个价格不合理 ", " 价格太贵了 "],
      negativeExamples: [],
    });
    expect(added.at(-1)).toEqual({
      id: "price-objection",
      name: "价格异议",
      keywords: ["价格贵", "不合理"],
      positiveExamples: ["这个价格不合理", "价格太贵了"],
      negativeExamples: [],
    });

    const edited = upsertRiskType(added, {
      ...added.at(-1)!,
      name: "费用异议",
    });
    expect(edited).toHaveLength(6);
    expect(edited.at(-1)?.name).toBe("费用异议");

    expect(removeRiskTypeById(edited, "price-objection")).toEqual(initial);
  });
});

describe("ComplaintRiskConfigPage", () => {
  it("只展示 5 个风险类型、21 个关键词和 16 条参考案例", async () => {
    render(<ComplaintRiskConfigPage />);

    expect(await screen.findByText("v1.0")).toBeTruthy();
    expect(screen.getByText("风险类型配置（5）")).toBeTruthy();
    expect(screen.getByText("跟进及时性")).toBeTruthy();
    expect(screen.getByText("退费倾向")).toBeTruthy();
    expect(screen.getByText("服务不满")).toBeTruthy();
    expect(screen.getByText("学习效果质疑")).toBeTruthy();
    expect(screen.getByText("沟通问题")).toBeTruthy();
    expect(screen.getByText("共 21 个关键词")).toBeTruthy();
    expect(screen.queryByText("案例数量")).toBeNull();
    expect(screen.getByText("退费")).toBeTruthy();
    expect(screen.getByText("我没有要退费，只是问一下规则")).toBeTruthy();
    expect(screen.getByText("一直联系不上你")).toBeTruthy();
    expect(screen.getByText("算了，不沟通了")).toBeTruthy();
    expect(screen.queryByText("Prompt 配置")).toBeNull();
    expect(screen.queryByText("运行策略")).toBeNull();
    expect(screen.queryByRole("button", { name: "配置试跑" })).toBeNull();
  });

});
