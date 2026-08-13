import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { createInitialPlatformAssistantConfig } from "../../../api/mock/platformAssistantConfig";
import PlatformAssistantConfigPage, {
  validatePlatformAssistantConfiguration,
} from ".";

describe("platform assistant configuration validation", () => {
  it("拒绝无启用能力和缺失能力资料的配置", () => {
    const disabled = createInitialPlatformAssistantConfig();
    disabled.capabilities = disabled.capabilities.map((item) => ({
      ...item,
      enabled: false,
    }));
    expect(validatePlatformAssistantConfiguration(disabled)).toContain(
      "至少启用",
    );

    const missingSources = createInitialPlatformAssistantConfig();
    missingSources.capabilities[0].dataSources = [];
    expect(validatePlatformAssistantConfiguration(missingSources)).toContain(
      "数据源",
    );
  });
});

describe("PlatformAssistantConfigPage", () => {
  it("加载基础设置、能力、岗位授权和安全策略", async () => {
    render(<PlatformAssistantConfigPage />);

    expect(await screen.findByText("v1.0")).toBeTruthy();
    expect(screen.getByText("基础设置")).toBeTruthy();
    expect(screen.getByText("能力管理（6）")).toBeTruthy();
    expect(screen.getByText("功能授权")).toBeTruthy();
    expect(screen.getByText("回复与安全策略")).toBeTruthy();
    expect((screen.getByLabelText("助手名称") as HTMLInputElement).value).toBe(
      "AI 学情助手",
    );
  });

  it("修改基础设置后可保存草稿并要求重新试运行", async () => {
    const user = userEvent.setup();
    render(<PlatformAssistantConfigPage />);
    const name = await screen.findByLabelText("助手名称");

    fireEvent.change(name, { target: { value: "微讯 AI 学情助手" } });
    expect(screen.getByText("有未保存修改")).toBeTruthy();
    expect(
      (screen.getByRole("button", { name: /发布配置/ }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    await user.click(screen.getByRole("button", { name: /保存草稿/ }));
    await waitFor(() => expect(screen.getByText("草稿已保存")).toBeTruthy());
    expect(screen.getByText("待验证")).toBeTruthy();
  });

  it("使用模拟岗位和真实学生试运行当前配置", async () => {
    const user = userEvent.setup();
    render(<PlatformAssistantConfigPage />);
    await screen.findByText("v1.0");

    await user.click(screen.getByRole("button", { name: /配置试跑/ }));
    expect(
      await screen.findByRole("dialog", { name: "平台助手配置试跑" }),
    ).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "真实学生" })).toBeTruthy(),
    );
    await user.click(screen.getByRole("button", { name: "开始试跑" }));

    expect(await screen.findByText("当前配置试运行通过")).toBeTruthy();
    expect(screen.getByText("命中能力")).toBeTruthy();
    expect(screen.getAllByText("学习情况查询").length).toBeGreaterThan(0);
  });
});
