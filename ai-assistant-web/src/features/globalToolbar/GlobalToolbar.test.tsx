import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { GlobalToolbar } from "./GlobalToolbar";
import {
  GlobalToolbarProvider,
  useGlobalToolbar,
} from "./GlobalToolbarProvider";

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

function EmbeddedToolbarHarness() {
  const { registerAssistantSurface, unregisterAssistantSurface } =
    useGlobalToolbar();

  useEffect(() => {
    registerAssistantSurface("embedded");
    return () => unregisterAssistantSurface("embedded");
  }, [registerAssistantSurface, unregisterAssistantSurface]);

  return <GlobalToolbar />;
}

describe("GlobalToolbar", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
    routerMocks.pathname = "/quality/conversation";
  });

  it("shows global actions without a location breadcrumb or search box", async () => {
    renderToolbar();

    expect(screen.getByLabelText("全局工具栏")).toBeTruthy();
    expect(screen.queryByText("AI 质检")).toBeNull();
    expect(screen.queryByText("AI 客诉预警")).toBeNull();
    expect(screen.queryByRole("button", { name: "问 AI" })).toBeNull();
    expect(screen.getByRole("button", { name: "工作提醒" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "帮助" })).toBeTruthy();
    expect(screen.queryByRole("searchbox")).toBeNull();
    expect(await screen.findByText("周欣")).toBeTruthy();
    expect(screen.getByText("学管")).toBeTruthy();
  });

  it("toggles the contextual assistant from the toolbar", async () => {
    const user = userEvent.setup();
    routerMocks.pathname = "/renewal/opportunities";
    renderToolbar();

    const trigger = screen.getByRole("button", { name: "问 AI" });
    await user.click(trigger);
    expect(trigger.getAttribute("aria-pressed")).toBe("true");
    await user.click(trigger);
    expect(trigger.getAttribute("aria-pressed")).toBe("false");
  });

  it("keeps the AI entry visible for embedded assistant surfaces", () => {
    routerMocks.pathname = "/renewal/opportunities";
    render(
      <GlobalToolbarProvider>
        <EmbeddedToolbarHarness />
      </GlobalToolbarProvider>,
    );

    expect(screen.getByRole("button", { name: "问 AI" })).toBeTruthy();
  });

  it("opens reminders, marks one read, and navigates to its student", async () => {
    const user = userEvent.setup();
    renderToolbar();

    await user.click(screen.getByRole("button", { name: "工作提醒" }));
    expect(await screen.findByText("3 条未读")).toBeTruthy();
    await user.click(
      screen.getByRole("button", { name: /林家宁客诉风险升至高风险/ }),
    );

    await waitFor(() => {
      expect(routerMocks.push).toHaveBeenCalledWith(
        "/quality/conversation?studentId=risk-student-001",
      );
    });
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
