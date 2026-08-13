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
    Modal: {
      confirm: ({ onOk }: { onOk?: () => void }) => {
        onOk?.();
      },
    },
    message: {
      success: vi.fn(),
    },
  };
});

function renderDetail() {
  return render(<StudentRiskDetail detail={linDetail} />);
}

describe("StudentRiskDetail", () => {
  it("直接展示核心业务分区和完整证据，不再使用外层抽屉", () => {
    const { container } = renderDetail();
    const detailContent = container.querySelector(
      ".student-risk-detail-content",
    ) as HTMLElement;

    expect(screen.queryByRole("dialog", { name: "学生客诉风险详情" })).toBeNull();
    expect(within(detailContent).getByText("学生与服务信息")).toBeTruthy();
    expect(within(detailContent).getByText("AI 风险分析")).toBeTruthy();
    expect(within(detailContent).getByText("风险事件与原始证据")).toBeTruthy();
    expect(within(detailContent).getByText("客户编号")).toBeTruthy();
    expect(within(detailContent).getByText("跟进顾问")).toBeTruthy();
    expect(within(detailContent).getByText("跟进学管")).toBeTruthy();
    expect(within(detailContent).getAllByText("周欣", { exact: true }).length).toBeGreaterThan(0);
    for (const deletedField of [
      "当前课程",
      "服务模式",
      "当前负责人",
      "家长联系状态",
      "服务开始日期",
      "风险主题摘要",
      "风险评分",
      "风险来源",
      "风险总结",
      "风险事件数",
      "共 5 条事件",
      "历史客诉记录",
      "操作日志",
    ]) {
      expect(within(detailContent).queryByText(deletedField, { exact: true })).toBeNull();
    }

    const overview = screen.getByTestId("risk-overview");
    expect(
      within(overview).getByText(
        "学习效果质疑 × 3、退费倾向 × 1、服务响应不满 × 1",
      ),
    ).toBeTruthy();
    expect(within(overview).getByText("处理建议", { exact: true })).toBeTruthy();
    expect(
      within(overview).getByText(
        "优先由周欣牵头，在24小时内完成学习效果复盘并形成量化改进方案；同步明确课程调整、家长回访和服务事项的负责人及完成时间，对退费意向持续跟进至闭环。",
        { exact: true },
      ),
    ).toBeTruthy();
    expect(overview.querySelectorAll(".ant-tag")).toHaveLength(0);

    const eventsSection = within(detailContent).getByRole("region", {
      name: /风险事件与原始证据/,
    });
    expect(within(eventsSection).getAllByText("风险主题")).toHaveLength(5);
    expect(within(eventsSection).getAllByText("AI建议")).toHaveLength(5);
    expect(
      within(eventsSection).queryByText("原始证据", { exact: true }),
    ).toBeNull();
    for (const date of ["2026-08-09", "2026-08-08", "2026-08-07"]) {
      expect(within(eventsSection).getByText(date, { exact: true })).toBeTruthy();
    }
    expect(within(eventsSection).getAllByText("沟通角色")).toHaveLength(6);
    expect(within(eventsSection).getAllByText("沟通时间")).toHaveLength(6);
    expect(within(eventsSection).getAllByText("聊天内容总结")).toHaveLength(6);
    expect(eventsSection.querySelectorAll('[data-evidence-type="wechat"]')).toHaveLength(3);
    expect(eventsSection.querySelectorAll('[data-evidence-type="phone"]')).toHaveLength(3);
    expect(
      within(eventsSection).getAllByRole("button", {
        name: "查看当天完整聊天",
      }),
    ).toHaveLength(3);
    expect(eventsSection.querySelectorAll(".ant-alert")).toHaveLength(0);
    expect(eventsSection.querySelectorAll(".ant-tag")).toHaveLength(0);

    expect(
      within(detailContent).getByText("我们没有看到明显效果。", { exact: true }),
    ).toBeTruthy();
    expect(
      within(eventsSection).getByText(
        "建议先完成一次学习效果复盘：汇总最近两次测评、作业错题和老师反馈，定位未改善的薄弱点；由当前负责人在本次沟通后向家长同步量化结论和调整后的学习计划。",
        { exact: true },
      ),
    ).toBeTruthy();
  });

  it("可打开并关闭当天完整聊天和完整转写", () => {
    renderDetail();

    fireEvent.click(
      screen.getAllByRole("button", { name: "查看当天完整聊天" })[0],
    );
    expect(screen.getByText("2026-08-09 完整聊天")).toBeTruthy();
    expect(screen.getAllByText("家长").length).toBeGreaterThan(0);

    const openDrawers = screen.getAllByRole("dialog");
    const nestedChatDrawer = openDrawers[openDrawers.length - 1];
    fireEvent.click(within(nestedChatDrawer).getByLabelText("Close"));
    expect(screen.queryByText("2026-08-09 完整聊天")).toBeNull();

    fireEvent.click(screen.getAllByRole("button", { name: "查看完整转写" })[0]);
    expect(screen.getByText("2026-08-09 完整转写")).toBeTruthy();
    expect(
      screen.getAllByText(
        "继续上课是否还有意义，需要学校给出明确答复。",
        { exact: true },
      ).length,
    ).toBeGreaterThanOrEqual(2);
  });

  it("同一时间只保留一条模拟通话处于播放状态", () => {
    renderDetail();

    const firstPlayButton = screen.getAllByRole("button", {
      name: "播放通话录音",
    })[0];
    fireEvent.click(firstPlayButton);
    expect(
      screen
        .getByRole("button", { name: "暂停通话录音" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    const playButtons = screen.getAllByRole("button", {
      name: "播放通话录音",
    });
    fireEvent.click(playButtons[playButtons.length - 1]);

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
