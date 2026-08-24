import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import type { MouseEvent, ReactElement, ReactNode } from "react";
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
const paginatedDetail = structuredClone(linFollowDetail);
paginatedDetail.eventGroups = Array.from({ length: 11 }, (_, index) => ({
  date: `2026-08-${String(20 - index).padStart(2, "0")}`,
  events: [
    {
      ...structuredClone(linFollowDetail.eventGroups[0].events[0]),
      id: `pagination-event-${index}`,
      riskSummary: `分页风险事件 ${index + 1}`,
    },
  ],
}));

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
  const MockTable = ({
    columns = [],
    dataSource = [],
    pagination,
    rowKey = "key",
    className,
    locale,
    "aria-label": ariaLabel,
  }: {
    columns?: Array<{
      key?: string;
      title?: ReactNode;
      dataIndex?: string;
      render?: (
        value: unknown,
        row: Record<string, unknown>,
        index: number,
      ) => ReactNode;
    }>;
    dataSource?: Array<Record<string, unknown>>;
    pagination?: {
      current?: number;
      pageSize?: number;
      onChange?: (page: number) => void;
    };
    rowKey?: string;
    className?: string;
    locale?: { emptyText?: ReactNode };
    "aria-label"?: string;
  }) => {
    const current = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? dataSource.length;
    const visibleRows = dataSource.slice(
      (current - 1) * pageSize,
      current * pageSize,
    );
    const lastPage = Math.max(1, Math.ceil(dataSource.length / pageSize));

    return (
      <div className={className}>
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={column.key ?? index}>{column.title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={String(row[rowKey])}>
                  {columns.map((column, columnIndex) => (
                    <td key={column.key ?? columnIndex}>
                      {column.render
                        ? column.render(
                            column.dataIndex
                              ? row[column.dataIndex]
                              : undefined,
                            row,
                            rowIndex,
                          )
                        : column.dataIndex
                          ? String(row[column.dataIndex] ?? "")
                          : null}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length}>{locale?.emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
        {dataSource.length > pageSize ? (
          <div className="ant-pagination-next">
            <button
              type="button"
              aria-label="下一页"
              disabled={current >= lastPage}
              onClick={() => pagination?.onChange?.(current + 1)}
            >
              下一页
            </button>
          </div>
        ) : null}
      </div>
    );
  };
  return {
    ...actual,
    List: MockList,
    Table: MockTable,
    Dropdown: ({
      menu,
      children,
    }: {
      menu: {
        items?: Array<{
          key: string;
          label: ReactNode;
          danger?: boolean;
          disabled?: boolean;
        }>;
        onClick?: (info: {
          key: string;
          domEvent: MouseEvent<HTMLButtonElement>;
        }) => void;
      };
      children: ReactElement<{
        onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
      }>;
    }) => {
      const [open, setOpen] = React.useState(false);
      return (
        <div>
          {React.cloneElement(children, {
            onClick: (event: MouseEvent<HTMLButtonElement>) => {
              children.props.onClick?.(event);
              setOpen((current) => !current);
            },
          })}
          {open ? (
            <div role="menu">
              {menu.items?.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  onClick={(event) => {
                    menu.onClick?.({ key: item.key, domEvent: event });
                    setOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      );
    },
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

function openRiskDetail(name = "跟进及时性") {
  const row = screen.getAllByRole("row", { name: new RegExp(name) })[0];
  fireEvent.click(within(row).getByRole("button", { name: "详情" }));
}

function openRiskMenu(name = "跟进及时性") {
  fireEvent.click(
    screen.getByRole("button", { name: `更多操作 ${name}` }),
  );
}

describe("StudentRiskDetail", () => {
  it("保留学生摘要并将全部风险展示为包含关键词的标准表格", () => {
    const { container } = render(<StudentRiskDetail detail={linDetail} />);
    const detailContent = container.querySelector(
      ".student-risk-detail-content",
    ) as HTMLElement;
    const summary = within(detailContent).getByRole("region", {
      name: "学生风险摘要",
    });
    const events = within(detailContent).getByRole("region", {
      name: "风险详情",
    });
    const riskStats = within(events).getByRole("group", {
      name: "风险统计",
    });

    expect(within(summary).getByText("林家宁", { exact: true })).toBeTruthy();
    expect(within(summary).getByText("S2026001", { exact: true })).toBeTruthy();
    expect(within(summary).getByText("12年级", { exact: true })).toBeTruthy();
    expect(within(summary).queryByText("高风险 × 2")).toBeNull();
    expect(within(riskStats).getByText("高风险 × 2")).toBeTruthy();
    expect(within(riskStats).getByText("中风险 × 2")).toBeTruthy();
    expect(within(riskStats).getByText("低风险 × 1")).toBeTruthy();
    expect(within(riskStats).getByText("跟进及时性 × 2")).toBeTruthy();

    for (const column of [
      "风险日期",
      "风险类型",
      "风险等级",
      "风险总结",
      "命中关键词",
      "处理状态",
      "证据数",
      "操作",
    ]) {
      expect(within(events).getByRole("columnheader", { name: column })).toBeTruthy();
    }
    expect(within(events).getAllByRole("row")).toHaveLength(6);
    expect(within(events).getAllByRole("button", { name: "详情" })).toHaveLength(5);
    expect(
      within(events).getByLabelText("命中关键词 找不到人、联系不上、未反馈"),
    ).toBeTruthy();
    expect(within(events).queryByText("处理建议", { exact: true })).toBeNull();
    expect(screen.getByRole("combobox", { name: "风险状态筛选" })).toBeTruthy();
    expect(
      riskStats.compareDocumentPosition(
        within(events).getByRole("table", { name: "风险事件表格" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("按日期倒序展示且同一天保持原有顺序", () => {
    render(<StudentRiskDetail detail={linDetail} />);
    const rows = within(screen.getByRole("region", { name: "风险详情" }))
      .getAllByRole("row")
      .slice(1);

    expect(rows[0].textContent).toContain("2026-08-09");
    expect(rows[0].textContent).toContain("跟进及时性");
    expect(rows[1].textContent).toContain("2026-08-09");
    expect(rows[1].textContent).toContain("退费");
    expect(rows[2].textContent).toContain("2026-08-09");
    expect(rows[2].textContent).toContain("客诉");
    expect(rows[3].textContent).toContain("2026-08-08");
    expect(rows[4].textContent).toContain("2026-08-07");
  });

  it("状态筛选仅过滤表格且顶部统计保持完整", async () => {
    const { container } = render(<StudentRiskDetail detail={linDetail} />);
    fireEvent.change(
      screen.getByRole("combobox", { name: "风险状态筛选" }),
      { target: { value: "resolved" } },
    );

    const events = within(
      container.querySelector(".student-risk-detail-content") as HTMLElement,
    ).getByRole("region", { name: "风险详情" });
    await waitFor(() => expect(within(events).getAllByRole("row")).toHaveLength(2));
    expect(
      within(events).getAllByText("已处理", { exact: true }),
    ).toHaveLength(2);
    expect(within(events).queryByRole("button", { name: /更多操作/ })).toBeNull();

    const stats = within(events).getByRole("group", { name: "风险统计" });
    expect(within(stats).getByText("跟进及时性 × 2")).toBeTruthy();
  });

  it("详情抽屉完整展示事件信息、建议、关键词和证据", () => {
    render(<StudentRiskDetail detail={linFollowDetail} />);
    openRiskDetail();

    const drawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 跟进及时性风险详情",
    });
    expect(within(drawer).getByText("2026-08-09", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("高风险", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("待处理", { exact: true })).toBeTruthy();
    expect(
      within(drawer).getByText(
        "家长连续反馈找不到负责人、联系不上且未按约定收到反馈。",
      ),
    ).toBeTruthy();
    expect(within(drawer).getByText("找不到人", { exact: true })).toBeTruthy();
    expect(
      within(drawer).getByText(
        "立即确认唯一负责人和反馈时点，并在群内逐项闭环未回复事项。",
      ),
    ).toBeTruthy();
    expect(within(drawer).getByText("企微单聊", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("企微群聊", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("群聊名称：林家宁服务沟通群")).toBeTruthy();
    expect(within(drawer).getByText("沟通时间：2026-08-09 09:12")).toBeTruthy();
  });

  it("详情抽屉可继续打开企微群聊完整聊天", () => {
    render(<StudentRiskDetail detail={linFollowDetail} />);
    openRiskDetail();
    const detailDrawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 跟进及时性风险详情",
    });
    fireEvent.click(
      within(detailDrawer).getAllByText("查看完整聊天", { exact: true })[1],
    );

    const chatDrawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 跟进及时性 · 完整聊天",
    });
    expect(within(chatDrawer).getByText("林家宁服务沟通群", { exact: true })).toBeTruthy();
    expect(within(chatDrawer).getAllByText("周欣", { exact: true }).length).toBeGreaterThan(0);
  });

  it(
    "超过十条时分页，切换筛选后回到第一页并关闭详情",
    async () => {
      const { container } = render(
        <StudentRiskDetail detail={paginatedDetail} />,
      );
      expect(screen.getAllByRole("button", { name: "详情" })).toHaveLength(10);
      openRiskDetail();
      expect(screen.getByRole("dialog", { name: /风险详情/ })).toBeTruthy();

      const nextPageButton = container.querySelector(
        ".ant-pagination-next button",
      ) as HTMLButtonElement;
      expect(nextPageButton).toBeTruthy();
      fireEvent.click(nextPageButton);
      await waitFor(() =>
        expect(screen.getAllByRole("button", { name: "详情" })).toHaveLength(1),
      );
      expect(
        screen.getByText("分页风险事件 11", { exact: true }),
      ).toBeTruthy();

      fireEvent.change(
        screen.getByRole("combobox", { name: "风险状态筛选" }),
        { target: { value: "pending" } },
      );
      await waitFor(() =>
        expect(screen.getAllByRole("button", { name: "详情" })).toHaveLength(
          10,
        ),
      );
      expect(screen.queryByRole("dialog", { name: /风险详情/ })).toBeNull();
      expect(
        screen.getByText("分页风险事件 1", { exact: true }),
      ).toBeTruthy();
    },
    15_000,
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

    openRiskMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "排除风险" }));
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("确认排除该风险？")).toBeTruthy();
    expect(within(modal).getByText(/不再计入该学生的待处理风险数量/)).toBeTruthy();
    expect(within(modal).getByText("系统将以当前账号“周欣”记录本次操作。")).toBeTruthy();
    fireEvent.click(within(modal).getByRole("button", { name: "取消" }));
    expect(onUpdate).not.toHaveBeenCalled();

    openRiskMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "排除风险" }));
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "确认排除",
      }),
    );
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith("lin-event-follow-0809", "excluded"),
    );
  });

  it("已排除风险详情展示排除人和排除时间且无更多操作", () => {
    render(<StudentRiskDetail detail={linExcludedDetail} />);
    expect(screen.queryByRole("button", { name: /更多操作/ })).toBeNull();
    openRiskDetail();
    const drawer = screen.getByRole("dialog", { name: /风险详情/ });

    expect(within(drawer).getByText("排除人", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("周欣", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("排除时间", { exact: true })).toBeTruthy();
    expect(within(drawer).getByText("2026-08-09 12:30", { exact: true })).toBeTruthy();
  });

  it("标记为已处理后提交 resolved", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <StudentRiskDetail
        detail={linFollowDetail}
        operatorName="周欣"
        onUpdateEventStatus={onUpdate}
      />,
    );

    openRiskMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "标记为已处理" }));
    const modal = screen.getByRole("dialog");
    expect(within(modal).getByText("确认标记该风险为已处理？")).toBeTruthy();
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

    openRiskMenu();
    fireEvent.click(screen.getByRole("menuitem", { name: "标记为已处理" }));
    const modal = screen.getByRole("dialog");
    fireEvent.click(within(modal).getByRole("button", { name: "确认已处理" }));

    await waitFor(() => expect(onUpdate).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("button", { name: "更多操作 跟进及时性" })).toBeTruthy();
  });
});
