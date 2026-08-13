import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { GlobalAssistantDrawer } from "./GlobalAssistantDrawer";
import {
  GlobalToolbarProvider,
  useGlobalToolbar,
} from "./GlobalToolbarProvider";

function RenewalDrawerHarness() {
  const { setAssistantContext, setAssistantOpen } = useGlobalToolbar();

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setAssistantContext({
            kind: "renewal",
            studentId: "renewal-student-001",
            studentName: "林家宁",
          });
          setAssistantOpen(true);
        }}
      >
        打开续费助手
      </button>
      <GlobalAssistantDrawer />
    </>
  );
}

describe("global assistant surfaces", () => {
  beforeEach(() => window.sessionStorage.clear());

  it("opens a renewal-scoped drawer and restores the student context", async () => {
    const user = userEvent.setup();
    render(
      <GlobalToolbarProvider>
        <RenewalDrawerHarness />
      </GlobalToolbarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "打开续费助手" }));
    expect(
      await screen.findByRole("dialog", { name: "AI 助手" }),
    ).toBeTruthy();
    expect(screen.getByText("基于 林家宁的续费条件诊断")).toBeTruthy();
    expect(
      screen
        .getByRole("region", { name: "续费 AI 助手" })
        .querySelector("header")?.textContent,
    ).toBe("AI 学情助手");
    await user.click(screen.getByText("总结该生当前续费条件诊断"));
    await waitFor(() => {
      expect(document.body.textContent).toContain("林家宁当前");
      expect(document.body.textContent).toContain("结论");
      expect(document.body.textContent).toContain("依据");
      expect(document.body.textContent).toContain("建议动作");
      expect(document.body.textContent).toContain("需人工确认");
      expect(document.body.textContent).toContain("不代表续费概率");
    });
  });

  it("closes the unified drawer from the panel header", async () => {
    const user = userEvent.setup();
    render(
      <GlobalToolbarProvider>
        <RenewalDrawerHarness />
      </GlobalToolbarProvider>,
    );

    await user.click(screen.getByRole("button", { name: "打开续费助手" }));
    await user.click(screen.getByRole("button", { name: "关闭 AI 助手" }));
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "AI 助手" })).toBeNull(),
    );
  });
});
