import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import RenewalConfigPage from ".";

describe("RenewalConfigPage", () => {
  it("展示年级侧栏、目标详情卡片和三个目标维度", async () => {
    render(<RenewalConfigPage />);

    expect(await screen.findByText("9年级目标详情")).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "年级导航" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "选择9年级" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "选择10年级" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "选择11年级" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "选择12年级" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /学科/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /语言/ })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /升学/ })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: /条件—产品映射/ })).toBeNull();
    expect(screen.queryByRole("button", { name: /目标层级/ })).toBeNull();
    expect(screen.queryByText("当前要求", { exact: true })).toBeNull();
    expect(screen.queryByText("本年级维度", { exact: true })).toBeNull();
  });

  it("切换年级和目标维度后更新右侧要求列表", async () => {
    const user = userEvent.setup();
    render(<RenewalConfigPage />);

    await screen.findByText("9年级目标详情");
    await user.click(screen.getByRole("button", { name: "选择10年级" }));

    expect(await screen.findByText("10年级目标详情")).toBeTruthy();
    expect(screen.getByRole("button", { name: "选择10年级" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByText("IG 大考、AL 选课与先修衔接")).toBeTruthy();

    await user.click(screen.getByRole("tab", { name: /升学/ }));

    expect(screen.getByRole("tab", { name: /升学/ }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("专业确定与课程匹配")).toBeTruthy();
  });

  it("按当前年级和维度新增要求，并提供启停与编辑操作", async () => {
    const user = userEvent.setup();
    render(<RenewalConfigPage />);

    await screen.findByText("9年级目标详情");
    expect(screen.getByRole("button", { name: "新增要求" })).toBeTruthy();
    expect(screen.getByRole("switch")).toBeTruthy();
    expect(screen.getByRole("button", { name: /编辑国际课程衔接与 IG 基础夯实/ })).toBeTruthy();

    await user.click(screen.getByRole("switch"));
    expect(screen.getByText("有未保存修改")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "新增要求" }));
    expect(await screen.findByText("新增独立目标")).toBeTruthy();
    expect(screen.getByText("1. 适用范围")).toBeTruthy();
    expect(screen.queryByLabelText("事项编码")).toBeNull();
  }, 15_000);

  it("编辑已有要求打开编辑抽屉", async () => {
    const user = userEvent.setup();
    render(<RenewalConfigPage />);

    await screen.findByText("9年级目标详情");
    await user.click(screen.getByRole("button", { name: /编辑国际课程衔接与 IG 基础夯实/ }));

    expect(await screen.findByText("编辑升学目标")).toBeTruthy();
    expect(screen.getByDisplayValue("国际课程衔接与 IG 基础夯实")).toBeTruthy();
  }, 15_000);
});
