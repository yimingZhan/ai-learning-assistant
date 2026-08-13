import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import ComplaintRiskConfigPage, { validateConfiguration } from ".";
import { createInitialComplaintRiskConfig } from "../../../api/mock/complaintRiskConfig";

describe("complaint risk configuration validation", () => {
  it("拒绝错误阈值、空数据源和无启用规则", () => {
    const invalidThresholds = createInitialComplaintRiskConfig();
    invalidThresholds.strategy.thresholds = { high: 40, medium: 70, low: 20 };
    expect(validateConfiguration(invalidThresholds)).toContain("风险阈值");

    const noSources = createInitialComplaintRiskConfig();
    noSources.strategy.dataSources = [];
    expect(validateConfiguration(noSources)).toContain("数据来源");

    const noRules = createInitialComplaintRiskConfig();
    noRules.rules = noRules.rules.map((rule) => ({ ...rule, enabled: false }));
    expect(validateConfiguration(noRules)).toContain("判断规则");
  });
});

describe("ComplaintRiskConfigPage", () => {
  it("加载 Prompt、规则与运行策略配置", async () => {
    render(<ComplaintRiskConfigPage />);

    expect(await screen.findByText("v1.0")).toBeTruthy();
    expect(screen.getByText("Prompt 配置")).toBeTruthy();
    expect(screen.getByText("判断规则（6）")).toBeTruthy();
    expect(screen.getByText("运行策略")).toBeTruthy();
    expect(
      (
        screen.getByLabelText(
          "系统角色与安全边界 Prompt",
        ) as HTMLTextAreaElement
      ).value,
    ).toContain("禁止虚构事实");
  });

  it("修改 Prompt 后可保存草稿", async () => {
    const user = userEvent.setup();
    render(<ComplaintRiskConfigPage />);
    const prompt = await screen.findByLabelText(
      "系统角色与安全边界 Prompt",
    );

    fireEvent.change(prompt, {
      target: { value: `${(prompt as HTMLTextAreaElement).value}\n新增证据完整性要求。` },
    });
    expect(screen.getByText("有未保存修改")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: /保存草稿$/ }));

    await waitFor(() =>
      expect(screen.getByText("草稿已保存")).toBeTruthy(),
    );
  });

  it("支持用文本试跑当前配置", async () => {
    const user = userEvent.setup();
    render(<ComplaintRiskConfigPage />);
    await screen.findByText("v1.0");
    await user.click(screen.getByRole("button", { name: /配置试跑$/ }));

    const dialog = await screen.findByRole("dialog", { name: "配置试跑" });
    const input = dialog.querySelector("textarea");
    expect(input).toBeTruthy();
    await user.type(input!, "我要正式投诉你们，并申请退费。");
    await user.click(screen.getByRole("button", { name: /开始试跑$/ }));

    expect(await screen.findByText("高风险")).toBeTruthy();
    expect(screen.getByText("正式投诉或外部升级")).toBeTruthy();
    expect(screen.getByText("明确退费倾向")).toBeTruthy();
  });

  it("填写变更说明后发布新版本", async () => {
    const user = userEvent.setup();
    render(<ComplaintRiskConfigPage />);
    await screen.findByText("v1.0");
    await user.click(screen.getByRole("button", { name: /发布配置$/ }));

    const dialog = await screen.findByRole("dialog", {
      name: "发布 AI 客诉预警配置",
    });
    const note = dialog.querySelector("textarea");
    expect(note).toBeTruthy();
    await user.type(note!, "优化风险判断要求。");
    await user.click(screen.getByRole("button", { name: "确认发布" }));

    await waitFor(() => expect(screen.getByText("v1.1")).toBeTruthy());
  });
});
