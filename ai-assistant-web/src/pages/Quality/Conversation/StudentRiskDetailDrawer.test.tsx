import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { StudentRiskDetail } from "./StudentRiskDetailDrawer";
import { riskStudentDetails } from "./riskData";

const linDetail = riskStudentDetails["risk-student-001"];

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");

  return {
    ...actual,
    Drawer: ({
      open,
      title,
      children,
      onClose,
    }: {
      open?: boolean;
      title?: ReactNode;
      children?: ReactNode;
      onClose?: () => void;
    }) =>
      open ? (
        <section role="dialog" aria-label={String(title)}>
          <button type="button" aria-label="Close" onClick={onClose} />
          <h2>{title}</h2>
          <div className="ant-drawer-content">{children}</div>
        </section>
      ) : null,
    Button: ({
      children,
      icon,
      onClick,
      disabled,
      "aria-pressed": ariaPressed,
    }: {
      children?: ReactNode;
      icon?: ReactNode;
      onClick?: () => void;
      disabled?: boolean;
      "aria-pressed"?: boolean;
    }) => (
      <button
        type="button"
        disabled={disabled}
        aria-pressed={ariaPressed}
        onClick={onClick}
      >
        <span aria-hidden="true">{icon}</span>
        {children}
      </button>
    ),
  };
});

function renderDetail() {
  return render(<StudentRiskDetail detail={linDetail} />);
}

function getEvidenceToggles() {
  return screen.getAllByRole("button", { name: /\u6765\u6e90\u8bc1\u636e/ });
}

describe("StudentRiskDetail", () => {
  it("以日期和风险类型展示结论，来源证据默认收起", () => {
    const { container } = renderDetail();
    const detailContent = container.querySelector(
      ".student-risk-detail-content",
    ) as HTMLElement;

    expect(within(detailContent).getByText("学生与服务信息")).toBeTruthy();
    expect(within(detailContent).getByText("风险详情")).toBeTruthy();
    expect(within(detailContent).queryByText("AI 风险分析")).toBeNull();

    const eventsSection = within(detailContent).getByRole("region", {
      name: "风险详情",
    });
    expect(within(eventsSection).getAllByText("风险类型")).toHaveLength(5);
    expect(within(eventsSection).getAllByText("风险总结")).toHaveLength(5);
    expect(within(eventsSection).getAllByText("处理建议")).toHaveLength(5);
    expect(
      within(eventsSection).getByText(
        "家长在企微和电话中连续质疑近期课程效果，认为成绩与作业表现未体现出与投入相匹配的改善。",
        { exact: true },
      ),
    ).toBeTruthy();

    for (const date of ["2026-08-09", "2026-08-08", "2026-08-07"]) {
      expect(within(eventsSection).getByText(date, { exact: true })).toBeTruthy();
    }

    const toggles = getEvidenceToggles();
    expect(toggles).toHaveLength(5);
    for (const toggle of toggles) {
      expect(toggle.getAttribute("aria-expanded")).toBe("false");
    }
    expect(
      within(eventsSection).queryByText("聊天内容总结", { exact: true }),
    ).toBeNull();
    expect(
      within(eventsSection).queryByText("我们没有看到明显效果。", { exact: true }),
    ).toBeNull();
  });

  it("展开后按来源突出内容总结并弱化会话信息", () => {
    const { container } = renderDetail();

    fireEvent.click(getEvidenceToggles()[0]);

    expect(
      screen.getAllByText("企微单聊 × 1", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("电话外呼 × 1", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText("学情信息 × 1", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByText("聊天内容总结", { exact: true })).toBeTruthy();
    expect(screen.getByText("通话内容总结", { exact: true })).toBeTruthy();
    expect(screen.getByText("学情信息总结", { exact: true })).toBeTruthy();
    expect(screen.getByText("沟通员工：周欣（学管）", { exact: true })).toBeTruthy();
    expect(screen.getByText("我们没有看到明显效果。", { exact: true })).toBeTruthy();
    expect(screen.getByRole("button", { name: "查看完整聊天" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "查看完整转写" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "查看学情详情" })).toBeTruthy();

    expect(
      container.querySelectorAll('[data-evidence-source="wechat_direct"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-evidence-source="phone_outbound"]'),
    ).toHaveLength(1);
    expect(
      container.querySelectorAll('[data-evidence-source="learning_info"]'),
    ).toHaveLength(1);
  });

  it("企微群聊展示多名沟通员工并可查看完整聊天", () => {
    renderDetail();

    fireEvent.click(getEvidenceToggles()[2]);
    expect(
      screen.getAllByText("企微群聊 × 1", { exact: true }).length,
    ).toBeGreaterThan(0);
    expect(
      screen.getByText(
        "沟通员工：周欣（学管）、李辰（课程顾问）",
        { exact: true },
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "查看完整聊天" }));
    const drawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 服务响应不满 · 完整聊天",
    });
    expect(within(drawer).getByText("周欣", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("李辰", { exact: true })).toBeTruthy();
    fireEvent.click(within(drawer).getByLabelText("Close"));
    expect(
      screen.queryByRole("dialog", {
        name: "2026-08-09 · 服务响应不满 · 完整聊天",
      }),
    ).toBeNull();
  });

  it("可查看完整转写和学情详情", () => {
    renderDetail();
    fireEvent.click(getEvidenceToggles()[0]);

    fireEvent.click(screen.getByRole("button", { name: "查看完整转写" }));
    expect(
      screen.getByRole("dialog", {
        name: "2026-08-09 · 学习效果质疑 · 完整转写",
      }),
    ).toBeTruthy();
    fireEvent.click(screen.getByLabelText("Close"));

    fireEvent.click(screen.getByRole("button", { name: "查看学情详情" }));
    const learningDrawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 学习效果质疑 · 学情详情",
    });
    expect(within(learningDrawer).getByText("最近两次测评")).toBeTruthy();
    expect(within(learningDrawer).getByText("72 分 → 68 分")).toBeTruthy();
  });

  it("同一时间只保留一条模拟通话处于播放状态", () => {
    renderDetail();
    fireEvent.click(getEvidenceToggles()[0]);
    fireEvent.click(getEvidenceToggles()[1]);

    const firstPlayButton = screen.getAllByRole("button", {
      name: "播放通话录音",
    })[0];
    fireEvent.click(firstPlayButton);
    expect(
      screen
        .getByRole("button", { name: "暂停通话录音" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "播放通话录音" }));
    expect(
      screen
        .getAllByRole("button", { name: "播放通话录音" })[0]
        .getAttribute("aria-pressed"),
    ).toBe("false");
    expect(
      screen
        .getByRole("button", { name: "暂停通话录音" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
