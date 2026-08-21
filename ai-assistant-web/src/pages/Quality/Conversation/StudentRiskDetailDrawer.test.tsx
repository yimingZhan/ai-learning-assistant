import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentRiskDetail } from "./StudentRiskDetailDrawer";
import { riskStudentDetails } from "./riskData";

const linDetail = riskStudentDetails["risk-student-001"];
const linFollowDetail = {
  ...linDetail,
  eventGroups: [
    {
      ...linDetail.eventGroups[0],
      events: [linDetail.eventGroups[0].events[0]],
    },
  ],
};
const linExcludedDetail = structuredClone(linFollowDetail);
Object.assign(linExcludedDetail.eventGroups[0].events[0], {
  status: "excluded",
  excludedBy: "周欣",
  excludedAt: "2026-08-09 12:30:00",
});

afterEach(cleanup);

vi.mock("antd", async () => {
  const actual = await vi.importActual<typeof import("antd")>("antd");
  const React = await import("react");
  const MockList = Object.assign(
    ({
      dataSource = [],
      renderItem,
      className,
    }: {
      dataSource?: unknown[];
      renderItem?: (item: unknown) => ReactNode;
      className?: string;
    }) => (
      <div className={className}>
        {dataSource.map((item, index) => (
          <div key={index}>{renderItem?.(item)}</div>
        ))}
      </div>
    ),
    {
      Item: Object.assign(
        ({ children }: { children?: ReactNode }) => <div>{children}</div>,
        {
          Meta: ({
            avatar,
            title,
            description,
          }: {
            avatar?: ReactNode;
            title?: ReactNode;
            description?: ReactNode;
          }) => (
            <div>
              {avatar}
              {title}
              {description}
            </div>
          ),
        },
      ),
    },
  );
  return {
    ...actual,
    List: MockList,
    Collapse: ({
      items,
      className,
    }: {
      items?: Array<{ key: string; label: ReactNode; children: ReactNode }>;
      className?: string;
    }) => {
      const [openKeys, setOpenKeys] = React.useState<string[]>([]);
      return (
        <div className={className}>
          {items?.map((item) => {
            const open = openKeys.includes(item.key);
            return (
              <div key={item.key}>
                <button
                  type="button"
                  aria-expanded={open}
                  onClick={() => setOpenKeys(open ? [] : [item.key])}
                >
                  {item.label}
                </button>
                {open ? item.children : null}
              </div>
            );
          })}
        </div>
      );
    },
    Timeline: ({
      items,
    }: {
      items?: Array<{ title?: ReactNode; content: ReactNode }>;
    }) => (
      <div>
        {items?.map((item, index) => (
          <section key={index}>
            <div data-timeline-title>{item.title}</div>
            {item.content}
          </section>
        ))}
      </div>
    ),
    Select: ({
      value,
      onChange,
      options,
      "aria-label": ariaLabel,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      options?: Array<{ label: string; value: string }>;
      "aria-label"?: string;
    }) => (
      <select
        aria-label={ariaLabel}
        value={value}
        onChange={(event) => onChange?.(event.target.value)}
      >
        {options?.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    ),
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
          <button type="button" aria-label="关闭" onClick={onClose} />
          {children}
        </section>
      ) : null,
    Modal: ({
      open,
      title,
      children,
      okText,
      cancelText,
      onOk,
      onCancel,
    }: {
      open?: boolean;
      title?: ReactNode;
      children?: ReactNode;
      okText?: ReactNode;
      cancelText?: ReactNode;
      onOk?: () => void;
      onCancel?: () => void;
    }) =>
      open ? (
        <section role="dialog" aria-label={String(title)}>
          <h2>{title}</h2>
          {children}
          <button type="button" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" onClick={onOk}>
            {okText}
          </button>
        </section>
      ) : null,
  };
});

function getEvidenceToggles() {
  return screen.getAllByRole("button", { name: /来源证据/ });
}

describe("StudentRiskDetail", () => {
  it("展示完整风险概览、状态和默认全部事件", () => {
    const { container } = render(<StudentRiskDetail detail={linDetail} />);
    const detailContent = container.querySelector(
      ".student-risk-detail-content",
    ) as HTMLElement;
    const overview = within(detailContent).getByRole("region", {
      name: "风险事件概览",
    });
    const events = within(detailContent).getByRole("region", {
      name: "风险详情",
    });

    expect(within(overview).getByText("高风险 × 2")).toBeTruthy();
    expect(within(overview).getByText("中风险 × 2")).toBeTruthy();
    expect(within(overview).getByText("低风险 × 1")).toBeTruthy();
    expect(within(overview).getByText("跟进及时性 × 2")).toBeTruthy();
    expect(within(overview).getByText("退费 × 1")).toBeTruthy();
    expect(within(overview).getByText("客诉 × 2")).toBeTruthy();

    expect(
      [...events.querySelectorAll(".ant-tag")].filter(
        (element) => element.textContent === "待处理",
      ),
    ).toHaveLength(4);
    expect(
      [...events.querySelectorAll(".ant-tag")].filter(
        (element) => element.textContent === "已处理",
      ),
    ).toHaveLength(1);
    expect(
      within(events).getAllByRole("button", { name: "排除风险" }),
    ).toHaveLength(4);
    expect(
      within(events).queryByText("风险类型", { exact: true }),
    ).toBeNull();
    expect(within(events).getByText("处理人", { exact: true })).toBeTruthy();
    expect(within(events).getByText("周欣", { exact: true })).toBeTruthy();
    expect(within(events).getByText("处理时间", { exact: true })).toBeTruthy();
    expect(
      within(events).getByText("2026-08-07 19:05", { exact: true }),
    ).toBeTruthy();
    const riskDate = within(events).getByLabelText("风险日期 2026-08-09");
    expect(riskDate.tagName).toBe("TIME");
    expect(riskDate.closest("[data-timeline-title]")).toBeTruthy();
    expect(screen.getByRole("combobox", { name: "风险状态筛选" })).toBeTruthy();
  });

  it("风险状态筛选仅过滤时间线且默认值为全部", async () => {
    const { container } = render(<StudentRiskDetail detail={linDetail} />);
    const select = screen.getByRole("combobox", { name: "风险状态筛选" });
    expect((select as HTMLSelectElement).value).toBe("all");
    fireEvent.change(select, { target: { value: "resolved" } });

    const events = within(
      container.querySelector(".student-risk-detail-content") as HTMLElement,
    ).getByRole("region", { name: "风险详情" });
    await waitFor(() =>
      expect(within(events).getByText("客诉", { exact: true })).toBeTruthy(),
    );
    expect(
      within(events).queryByRole("button", { name: "排除风险" }),
    ).toBeNull();

    const overview = within(
      container.querySelector(".student-risk-detail-content") as HTMLElement,
    ).getByRole("region", { name: "风险事件概览" });
    expect(within(overview).getByText("跟进及时性 × 2")).toBeTruthy();
  });

  it("命中关键词独占一行并展示在风险总结上方", () => {
    render(<StudentRiskDetail detail={linFollowDetail} />);

    const keywordLabel = screen.getByText("命中关键词", { exact: true });
    const keywordRow = keywordLabel.parentElement as HTMLElement;
    const summaryLabel = screen.getByText("风险总结", { exact: true });

    expect(
      keywordRow.contains(screen.getByText("找不到人", { exact: true })),
    ).toBe(true);
    expect(within(keywordRow).queryByText("风险等级", { exact: true })).toBeNull();
    expect(summaryLabel.parentElement?.previousElementSibling).toBe(keywordRow);
  });

  it("展开来源证据后展示单聊、群聊名称和第一条原文时间", () => {
    render(<StudentRiskDetail detail={linFollowDetail} />);
    expect(getEvidenceToggles()).toHaveLength(1);

    fireEvent.click(getEvidenceToggles()[0]);
    expect(screen.getAllByText("企微单聊 × 1", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getAllByText("企微群聊 × 1", { exact: true }).length).toBeGreaterThan(0);
    expect(screen.getByText("群聊名称：林家宁服务沟通群")).toBeTruthy();
    expect(screen.getByText("沟通时间：2026-08-09 09:12")).toBeTruthy();
    expect(
      screen.getByText(
        "家长：“我找不到负责的老师，这两天一直联系不上。”",
        { exact: true },
      ),
    ).toBeTruthy();
  });

  it(
    "企微群聊完整聊天继续展示群聊名称",
    () => {
      render(<StudentRiskDetail detail={linFollowDetail} />);
      fireEvent.click(getEvidenceToggles()[0]);
      fireEvent.click(
        screen.getAllByText("查看完整聊天", { exact: true })[1],
      );

      expect(
        screen.getByText("林家宁服务沟通群", { exact: true }),
      ).toBeTruthy();
      expect(screen.getAllByText("周欣", { exact: true }).length).toBeGreaterThan(
        0,
      );
    },
    10_000,
  );

  it("排除风险弹窗取消不提交，确认后提交 excluded", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <StudentRiskDetail
        detail={linFollowDetail}
        operatorName="周欣"
        onUpdateEventStatus={onUpdate}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "排除风险" })[0]);
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("确认排除该风险？")).toBeTruthy();
    expect(
      within(modal).getByText(/不再计入该学生的待处理风险数量/),
    ).toBeTruthy();
    expect(
      within(modal).getByText("系统将以当前账号“周欣”记录本次操作。"),
    ).toBeTruthy();
    fireEvent.click(within(modal).getByRole("button", { name: "取消" }));
    expect(onUpdate).not.toHaveBeenCalled();

    fireEvent.click(screen.getAllByRole("button", { name: "排除风险" })[0]);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "确认排除",
      }),
    );
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith("lin-event-follow-0809", "excluded"),
    );
  });

  it("已排除风险卡片展示排除人和排除时间", () => {
    render(<StudentRiskDetail detail={linExcludedDetail} />);
    const events = screen.getByRole("region", { name: "风险详情" });

    expect(within(events).getByText("排除人", { exact: true })).toBeTruthy();
    expect(within(events).getByText("周欣", { exact: true })).toBeTruthy();
    expect(within(events).getByText("排除时间", { exact: true })).toBeTruthy();
    expect(
      within(events).getByText("2026-08-09 12:30", { exact: true }),
    ).toBeTruthy();
  });

  it("已处理风险弹窗确认后提交 resolved", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <StudentRiskDetail
        detail={linFollowDetail}
        operatorName="周欣"
        onUpdateEventStatus={onUpdate}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "已处理风险" })[0],
    );
    const modal = screen.getByRole("dialog");
    expect(
      within(modal).getByText("确认标记该风险为已处理？"),
    ).toBeTruthy();
    expect(
      within(modal).getByText("系统将以当前账号“周欣”记录本次操作。"),
    ).toBeTruthy();
    fireEvent.click(within(modal).getByRole("button", { name: "确认已处理" }));
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith("lin-event-follow-0809", "resolved"),
    );
  });

  it("状态请求失败时保留确认弹窗和原操作状态", async () => {
    const onUpdate = vi.fn().mockRejectedValue(new Error("更新失败"));
    render(
      <StudentRiskDetail
        detail={linFollowDetail}
        onUpdateEventStatus={onUpdate}
      />,
    );

    fireEvent.click(
      screen.getAllByRole("button", { name: "已处理风险" })[0],
    );
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: "确认已处理" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(
      screen.getAllByRole("button", { name: "已处理风险" }),
    ).toHaveLength(1);
  });
});
