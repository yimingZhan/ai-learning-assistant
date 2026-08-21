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
    expect(validateConfiguration(noExamples)).toContain("至少添加一条参考案例");

    const blankExample = createInitialComplaintRiskConfig();
    blankExample.riskTypes[0].positiveExamples[0] = "   ";
    expect(validateConfiguration(blankExample)).toContain("参考案例不能为空");

    const duplicateExamples = createInitialComplaintRiskConfig();
    duplicateExamples.riskTypes[0].positiveExamples.push(
      ` ${duplicateExamples.riskTypes[0].positiveExamples[0]} `,
    );
    expect(validateConfiguration(duplicateExamples)).toContain("参考案例不能重复");
  });

  it("拒绝缺失高、中、低风险定义", () => {
    const missingHigh = createInitialComplaintRiskConfig();
    missingHigh.riskTypes[0].highRiskDefinition = "   ";
    expect(validateConfiguration(missingHigh)).toContain("高风险定义不能为空");

    const missingMedium = createInitialComplaintRiskConfig();
    missingMedium.riskTypes[0].mediumRiskDefinition = "";
    expect(validateConfiguration(missingMedium)).toContain("中风险定义不能为空");

    const missingLow = createInitialComplaintRiskConfig();
    missingLow.riskTypes[0].lowRiskDefinition = "  ";
    expect(validateConfiguration(missingLow)).toContain("低风险定义不能为空");
  });

  it("保存前清理类型名称、关键词、案例和等级定义的首尾空格", () => {
    const config = createInitialComplaintRiskConfig();
    config.riskTypes[0].name = "  跟进及时性  ";
    config.riskTypes[0].keywords[0] = "  找不到人  ";
    config.riskTypes[0].positiveExamples[0] = "  我昨天问的问题到现在都没有人回复。  ";
    config.riskTypes[0].highRiskDefinition = "  多次、持续出现联系不上。  ";

    expect(normalizeRiskTypes(config.riskTypes)[0]).toMatchObject({
      name: "跟进及时性",
      keywords: ["找不到人", "联系不上", "未反馈", "没回复", "没人回"],
      positiveExamples: [
        "我昨天问的问题到现在都没有人回复。",
        "这几天一直联系不上老师。",
        "说好了给我反馈，到现在还没有消息。",
        "我已经问了好几次了，一直没人处理。",
        "每次有事情都找不到人。",
      ],
      highRiskDefinition: "多次、持续出现联系不上。",
    });
  });

  it("按稳定 ID 新增、编辑和删除风险类型并保留案例顺序", () => {
    const initial = createInitialComplaintRiskConfig().riskTypes;
    const added = upsertRiskType(initial, {
      id: "price-objection",
      name: " 价格异议 ",
      keywords: [" 价格贵 ", " 不合理 "],
      positiveExamples: [" 这个价格不合理 ", " 价格太贵了 "],
      highRiskDefinition: " 已明确决定退费 ",
      mediumRiskDefinition: " 产生退费倾向 ",
      lowRiskDefinition: " 咨询退费金额 ",
    });
    expect(added.at(-1)).toEqual({
      id: "price-objection",
      name: "价格异议",
      keywords: ["价格贵", "不合理"],
      positiveExamples: ["这个价格不合理", "价格太贵了"],
      highRiskDefinition: "已明确决定退费",
      mediumRiskDefinition: "产生退费倾向",
      lowRiskDefinition: "咨询退费金额",
    });

    const edited = upsertRiskType(added, {
      ...added.at(-1)!,
      name: "费用异议",
    });
    expect(edited).toHaveLength(4);
    expect(edited.at(-1)?.name).toBe("费用异议");

    expect(removeRiskTypeById(edited, "price-objection")).toEqual(initial);
  });
});

describe("ComplaintRiskConfigPage", () => {
  it("展示 3 个指定风险类型、16 个关键词及高/中/低风险定义列", async () => {
    render(<ComplaintRiskConfigPage />);

    expect(await screen.findByText("风险类型配置（3）")).toBeTruthy();
    expect(screen.queryByText("生效方式")).toBeNull();
    expect(screen.queryByText("最近更新")).toBeNull();
    expect(screen.queryByText("即时生效")).toBeNull();
    expect(screen.getByText("跟进及时性")).toBeTruthy();
    expect(screen.getAllByText("退费").length).toBeGreaterThan(0);
    expect(screen.getByText("客诉")).toBeTruthy();
    expect(screen.getByText("共 16 个关键词")).toBeTruthy();
    expect(screen.queryByText("案例数量")).toBeNull();
    expect(screen.getByText("我昨天问的问题到现在都没有人回复。")).toBeTruthy();
    expect(
      screen.getByText(
        "多次、持续出现联系不上、无人反馈、长期未回复等情况，并明显表达强烈不满或认为问题长期无人处理。",
      ),
    ).toBeTruthy();
    expect(screen.getAllByTestId("high-risk-definition")).toHaveLength(3);
    expect(screen.getAllByTestId("medium-risk-definition")).toHaveLength(3);
    expect(screen.getAllByTestId("low-risk-definition")).toHaveLength(3);
    expect(screen.queryByText("反向案例")).toBeNull();
    expect(screen.queryByText("Prompt 配置")).toBeNull();
    expect(screen.queryByText("运行策略")).toBeNull();
    expect(screen.queryByRole("button", { name: "配置试跑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "版本记录" })).toBeNull();
    expect(screen.queryByRole("button", { name: "保存草稿" })).toBeNull();
    expect(screen.queryByRole("button", { name: "发布配置" })).toBeNull();
    expect(screen.queryByText("当前生效版本")).toBeNull();
    expect(screen.queryByText("当前草稿")).toBeNull();
  });
});
