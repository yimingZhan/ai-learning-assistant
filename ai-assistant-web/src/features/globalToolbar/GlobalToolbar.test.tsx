import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalToolbar } from "./GlobalToolbar";
import { GlobalToolbarProvider } from "./GlobalToolbarProvider";

const routerMocks = vi.hoisted(() => ({
  push: vi.fn(),
  pathname: "/quality/conversation",
}));

vi.mock("@umijs/max", () => ({
  useLocation: () => ({ pathname: routerMocks.pathname }),
  history: { push: routerMocks.push },
}));

function renderToolbar() {
  return render(
    <GlobalToolbarProvider>
      <GlobalToolbar />
    </GlobalToolbarProvider>,
  );
}

describe("GlobalToolbar", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    routerMocks.pathname = "/quality/conversation";
  });

  it("仅保留帮助和用户入口，不展示问 AI 与工作提醒", async () => {
    renderToolbar();

    expect(screen.getByLabelText("全局工具栏")).toBeTruthy();
    expect(screen.queryByText("AI 质检")).toBeNull();
    expect(screen.queryByText("AI 客诉预警")).toBeNull();
    expect(screen.queryByRole("button", { name: "问 AI" })).toBeNull();
    expect(screen.queryByRole("button", { name: "工作提醒" })).toBeNull();
    expect(screen.getByRole("button", { name: "帮助" })).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(await screen.findByText("周欣")).toBeTruthy();
    expect(screen.getByText("学管")).toBeTruthy();
  });

  it("在其他业务页面同样不展示问 AI 与工作提醒", async () => {
    routerMocks.pathname = "/renewal/opportunities";
    renderToolbar();

    expect(screen.queryByRole("button", { name: "问 AI" })).toBeNull();
    expect(screen.queryByRole("button", { name: "工作提醒" })).toBeNull();
    expect(screen.getByRole("button", { name: "帮助" })).toBeTruthy();
    expect(await screen.findByRole("button", { name: "用户菜单" })).toBeTruthy();
  });

  it("exposes help topics and account identity details", async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole("button", { name: "帮助" }));
    expect(await screen.findByText("指标口径")).toBeTruthy();
    expect(screen.getByText("AI 判断说明")).toBeTruthy();
    expect(screen.getByText("问题反馈")).toBeTruthy();
    await user.keyboard("{Escape}");

    await screen.findByRole("button", { name: "用户菜单" });
    await user.click(screen.getByRole("button", { name: "用户菜单" }));
    expect(await screen.findByText("上海中心 · 学管组")).toBeTruthy();
    expect(screen.getByText("当前角色：学管")).toBeTruthy();
    expect(screen.getByText("个人设置")).toBeTruthy();
    expect(screen.getByText("退出登录")).toBeTruthy();
  });
});
