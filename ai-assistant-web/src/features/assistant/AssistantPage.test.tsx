import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { AssistantPage } from "./AssistantPage";

describe("AssistantPage", () => {
  it("restores the standalone assistant welcome and history entry", async () => {
    const user = userEvent.setup();
    render(<AssistantPage />);

    expect(screen.getByRole("region", { name: "AI 助手对话" })).toBeTruthy();
    expect(await screen.findByText("✨ AI 学情助手")).toBeTruthy();
    expect(screen.getByText("👋 你好，我是 AI 学情助手")).toBeTruthy();
    expect(screen.getByText("我可以帮你：")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "打开历史会话" }));
    expect(
      await screen.findByText("李明近 30 天学习情况"),
    ).toBeTruthy();
  });

  it("opens a quick query from the restored action bar", async () => {
    render(<AssistantPage />);

    fireEvent.click(screen.getByRole("button", { name: /学习情况/ }));
    expect(await screen.findByRole("dialog", { name: "学生成绩" })).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByRole("combobox", { name: "选择学生" })).toBeTruthy(),
    );
  });
});
