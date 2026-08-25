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
const linRefundDetail = {
  ...linDetail,
  eventGroups: [
    {
      ...linDetail.eventGroups[0],
      events: [linDetail.eventGroups[0].events[1]],
    },
  ],
};
const linExcludedDetail = structuredClone(linFollowDetail);
Object.assign(linExcludedDetail.eventGroups[0].events[0], {
  status: "excluded",
  excludedBy: "周欣",
  excludedAt: "2026-08-09 12:30:00",
});
const linResolvedDetail = structuredClone(linFollowDetail);
Object.assign(linResolvedDetail.eventGroups[0].events[0], {
  status: "resolved",
  resolvedBy: "钱悦",
  resolvedAt: "2026-08-09 11:45:00",
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
    size,
    rowSelection,
    locale,
    onChange,
    "aria-label": ariaLabel,
  }: {
    columns?: Array<{
      key?: string;
      title?: ReactNode;
      dataIndex?: string;
      filters?: Array<{
        text: ReactNode;
        value: string | number | boolean;
      }>;
      filteredValue?: Array<string | number | boolean> | null;
      onFilter?: (
        value: string | number | boolean,
        row: Record<string, unknown>,
      ) => boolean;
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
      hideOnSinglePage?: boolean;
      size?: "small" | "medium" | "middle" | "large";
      onChange?: (page: number) => void;
    };
    rowKey?: string;
    className?: string;
    size?: "large" | "middle" | "small";
    rowSelection?: {
      selectedRowKeys?: Array<string | number>;
      onChange?: (
        keys: Array<string | number>,
        rows: Array<Record<string, unknown>>,
      ) => void;
      getCheckboxProps?: (row: Record<string, unknown>) => {
        disabled?: boolean;
        "aria-label"?: string;
      };
    };
    locale?: { emptyText?: ReactNode };
    onChange?: (
      pagination: Record<string, never>,
      filters: Record<string, Array<string | number | boolean> | null>,
      sorter: Record<string, never>,
      extra: { action: "filter" },
    ) => void;
    "aria-label"?: string;
  }) => {
    const filteredRows = columns.reduce(
      (rows, column) =>
        column.filteredValue?.length && column.onFilter
          ? rows.filter((row) =>
              column.filteredValue?.some((value) =>
                column.onFilter?.(value, row),
              ),
            )
          : rows,
      dataSource,
    );
    const current = pagination?.current ?? 1;
    const pageSize = pagination?.pageSize ?? filteredRows.length;
    const visibleRows = filteredRows.slice(
      (current - 1) * pageSize,
      current * pageSize,
    );
    const lastPage = Math.max(1, Math.ceil(filteredRows.length / pageSize));
    const paginationSize =
      pagination?.size ?? (size === "small" ? "small" : "default");

    return (
      <div className={className}>
        <table aria-label={ariaLabel}>
          <thead>
            <tr>
              {rowSelection ? <th aria-label="选择风险" /> : null}
              {columns.map((column, index) => {
                const columnKey = String(
                  column.key ?? column.dataIndex ?? index,
                );
                return (
                  <th key={columnKey}>
                    {column.title}
                    {column.filters ? (
                      <select
                        aria-label={`筛选${String(column.title)}`}
                        value={String(column.filteredValue?.[0] ?? "")}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          onChange?.(
                            {},
                            Object.fromEntries(
                              columns.map((candidate, candidateIndex) => [
                                String(
                                  candidate.key ??
                                    candidate.dataIndex ??
                                    candidateIndex,
                                ),
                                candidate === column
                                  ? nextValue
                                    ? [nextValue]
                                    : null
                                  : (candidate.filteredValue ?? null),
                              ]),
                            ),
                            {},
                            { action: "filter" },
                          );
                        }}
                      >
                        <option value="">全部状态</option>
                        {column.filters.map((filter) => (
                          <option
                            key={String(filter.value)}
                            value={String(filter.value)}
                          >
                            {filter.text}
                          </option>
                        ))}
                      </select>
                    ) : null}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {visibleRows.length ? (
              visibleRows.map((row, rowIndex) => (
                <tr key={String(row[rowKey])}>
                  {rowSelection ? (
                    <td>
                      <input
                        type="checkbox"
                        checked={rowSelection.selectedRowKeys?.includes(
                          row[rowKey] as string | number,
                        )}
                        {...rowSelection.getCheckboxProps?.(row)}
                        onChange={(event) => {
                          const key = row[rowKey] as string | number;
                          const current = rowSelection.selectedRowKeys ?? [];
                          const next = event.target.checked
                            ? [...current, key]
                            : current.filter((candidate) => candidate !== key);
                          rowSelection.onChange?.(
                            next,
                            filteredRows.filter((candidate) =>
                              next.includes(
                                candidate[rowKey] as string | number,
                              ),
                            ),
                          );
                        }}
                      />
                    </td>
                  ) : null}
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
                <td colSpan={columns.length + (rowSelection ? 1 : 0)}>
                  {locale?.emptyText}
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {pagination &&
        (!pagination.hideOnSinglePage || filteredRows.length > pageSize) ? (
          <div
            className={`ant-pagination${
              paginationSize === "small" ? " ant-pagination-mini" : ""
            }`}
          >
            <span>{`${current} / ${lastPage}`}</span>
            <div className="ant-pagination-next">
              <button
                type="button"
                aria-label="下一页"
                disabled={current >= lastPage}
                onClick={() => pagination.onChange?.(current + 1)}
              >
                下一页
              </button>
            </div>
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
  fireEvent.click(screen.getByRole("button", { name: `更多操作 ${name}` }));
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
    expect(within(summary).queryByText("高风险", { exact: true })).toBeNull();
    expect(within(summary).queryByText("高风险 × 2")).toBeNull();
    expect(
      within(summary).getByText("当前跟进顾问", { exact: true }),
    ).toBeTruthy();
    expect(within(summary).getByText("共享顾问", { exact: true })).toBeTruthy();
    expect(within(summary).queryByText("跟进顾问", { exact: true })).toBeNull();
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
      "命中相似句",
      "操作",
    ]) {
      expect(
        within(events).getByRole("columnheader", { name: column }),
      ).toBeTruthy();
    }
    expect(
      within(events).getByRole("columnheader", { name: /处理状态/ }),
    ).toBeTruthy();
    expect(within(events).getAllByRole("row")).toHaveLength(6);
    expect(
      within(events).queryByRole("columnheader", { name: "证据数" }),
    ).toBeNull();
    expect(
      within(events).getAllByRole("button", { name: "详情" }),
    ).toHaveLength(5);
    expect(events.querySelector(".ant-pagination")).toBeTruthy();
    expect(events.querySelector(".ant-pagination-mini")).toBeNull();
    expect(
      (
        within(events).getByRole("button", {
          name: "下一页",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      within(events).getByLabelText("命中关键词 找不到人、联系不上、未反馈"),
    ).toBeTruthy();
    const keywordHeader = within(events).getByRole("columnheader", {
      name: "命中关键词",
    });
    const similarSentenceHeader = within(events).getByRole("columnheader", {
      name: "命中相似句",
    });
    expect(
      keywordHeader.compareDocumentPosition(similarSentenceHeader) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    const followUpRow = within(events)
      .getAllByRole("row")
      .find((row) => row.textContent?.includes("家长连续反馈找不到负责人"));
    expect(followUpRow?.textContent).toContain("这几天一直联系不上老师。");
    expect(within(events).queryByText("处理建议", { exact: true })).toBeNull();
    expect(within(events).queryByText("风险详情", { exact: true })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "风险状态筛选" })).toBeNull();
    expect(screen.getByRole("combobox", { name: "筛选处理状态" })).toBeTruthy();
    expect(
      riskStats.compareDocumentPosition(
        within(events).getByRole("table", { name: "风险事件表格" }),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("仅待处理风险可选并可批量标记为已处理", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <StudentRiskDetail
        detail={linDetail}
        operatorName="周欣"
        onUpdateEventStatus={onUpdate}
      />,
    );

    const followCheckbox = screen.getByRole("checkbox", {
      name: "选择风险 2026-08-09 跟进及时性",
    }) as HTMLInputElement;
    const refundCheckbox = screen.getByRole("checkbox", {
      name: "选择风险 2026-08-09 退费",
    }) as HTMLInputElement;
    const resolvedCheckbox = screen.getByRole("checkbox", {
      name: "选择风险 2026-08-07 客诉",
    }) as HTMLInputElement;
    const batchResolveButton = screen.getByRole("button", {
      name: "批量标记已处理",
    }) as HTMLButtonElement;

    expect(followCheckbox.disabled).toBe(false);
    expect(refundCheckbox.disabled).toBe(false);
    expect(resolvedCheckbox.disabled).toBe(true);
    expect(batchResolveButton.disabled).toBe(true);
    expect(screen.getByText("已选择 0 项", { exact: true })).toBeTruthy();

    fireEvent.click(followCheckbox);
    fireEvent.click(refundCheckbox);
    expect(screen.getByText("已选择 2 项", { exact: true })).toBeTruthy();
    expect(batchResolveButton.disabled).toBe(false);
    fireEvent.click(batchResolveButton);

    const modal = screen.getByRole("dialog", {
      name: "确认将 2 条风险标记为已处理？",
    });
    expect(within(modal).getByText("已选择 2 条待处理风险。")).toBeTruthy();
    fireEvent.click(within(modal).getByRole("button", { name: "确认已处理" }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(
        ["lin-event-follow-0809", "lin-event-refund-0809"],
        "resolved",
      ),
    );
    await waitFor(() =>
      expect(screen.getByText("已选择 0 项", { exact: true })).toBeTruthy(),
    );
  });

  it("批量排除取消时保留选择，确认后提交全部事件", async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <StudentRiskDetail detail={linDetail} onUpdateEventStatus={onUpdate} />,
    );

    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "选择风险 2026-08-09 跟进及时性",
      }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", {
        name: "选择风险 2026-08-09 客诉",
      }),
    );
    const batchExcludeButton = screen.getByRole("button", {
      name: "批量排除风险",
    });
    fireEvent.click(batchExcludeButton);
    const modal = screen.getByRole("dialog", {
      name: "确认排除选中的 2 条风险？",
    });
    fireEvent.click(within(modal).getByRole("button", { name: "取消" }));
    expect(onUpdate).not.toHaveBeenCalled();
    expect(screen.getByText("已选择 2 项", { exact: true })).toBeTruthy();

    fireEvent.click(batchExcludeButton);
    fireEvent.click(
      within(screen.getByRole("dialog")).getByRole("button", {
        name: "确认排除",
      }),
    );
    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith(
        ["lin-event-follow-0809", "lin-event-complaint-0809"],
        "excluded",
      ),
    );
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

  it("处理状态列筛选仅过滤表格且顶部统计保持完整", async () => {
    const { container } = render(<StudentRiskDetail detail={linDetail} />);
    fireEvent.change(screen.getByRole("combobox", { name: "筛选处理状态" }), {
      target: { value: "resolved" },
    });

    const events = within(
      container.querySelector(".student-risk-detail-content") as HTMLElement,
    ).getByRole("region", { name: "风险详情" });
    await waitFor(() =>
      expect(within(events).getAllByRole("row")).toHaveLength(2),
    );
    expect(within(events).getAllByText("已处理", { exact: true })).toHaveLength(
      2,
    );
    expect(
      within(events).queryByRole("button", { name: /更多操作/ }),
    ).toBeNull();

    const stats = within(events).getByRole("group", { name: "风险统计" });
    expect(within(stats).getByText("跟进及时性 × 2")).toBeTruthy();
  });

  it("详情抽屉按基本信息、AI 总结和来源证据统一分区", () => {
    render(<StudentRiskDetail detail={linFollowDetail} />);
    openRiskDetail();

    const drawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 跟进及时性风险详情",
    });
    const basic = within(drawer).getByRole("region", {
      name: "风险基本信息",
    });
    const summary = within(drawer).getByRole("region", {
      name: "AI风险总结",
    });
    const evidence = within(drawer).getByRole("region", {
      name: "来源证据",
    });

    for (const field of [
      "风险日期",
      "风险类型",
      "风险等级",
      "处理状态",
      "命中关键词",
      "命中相似句",
    ]) {
      expect(within(basic).getByText(field, { exact: true })).toBeTruthy();
    }
    expect(within(basic).getByText("2026-08-09", { exact: true })).toBeTruthy();
    expect(within(basic).getByText("高风险", { exact: true })).toBeTruthy();
    expect(within(basic).getByText("待处理", { exact: true })).toBeTruthy();
    expect(within(basic).getByText("找不到人", { exact: true })).toBeTruthy();
    expect(
      within(basic).getByText("这几天一直联系不上老师。", {
        exact: true,
      }),
    ).toBeTruthy();
    const keywordLabel = within(basic).getByText("命中关键词", {
      exact: true,
    });
    const similarSentenceLabel = within(basic).getByText("命中相似句", {
      exact: true,
    });
    expect(
      keywordLabel.compareDocumentPosition(similarSentenceLabel) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(basic).queryByText("处理人", { exact: true })).toBeNull();
    expect(within(basic).queryByText("处理时间", { exact: true })).toBeNull();
    expect(within(basic).queryByText("证据数", { exact: true })).toBeNull();

    expect(within(summary).getByText("风险总结", { exact: true })).toBeTruthy();
    expect(
      within(summary).getByText(
        "家长连续反馈找不到负责人、联系不上且未按约定收到反馈。",
      ),
    ).toBeTruthy();
    expect(within(summary).getByText("处理建议", { exact: true })).toBeTruthy();
    expect(
      within(summary).getByText(
        "立即确认唯一负责人和反馈时点，并在群内逐项闭环未回复事项。",
      ),
    ).toBeTruthy();

    expect(
      within(evidence).getAllByText("关键风险原文", { exact: true }),
    ).toHaveLength(2);
    expect(
      within(evidence).getByText("企微单聊", { exact: true }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("企微群聊", { exact: true }),
    ).toBeTruthy();
    expect(
      within(evidence).getAllByText("原文渠道", { exact: true }),
    ).toHaveLength(2);
    expect(
      within(evidence).getAllByText("沟通员工", { exact: true }),
    ).toHaveLength(2);
    expect(
      within(evidence).getAllByText("沟通时间", { exact: true }),
    ).toHaveLength(2);
    expect(
      within(evidence).getByText("周欣（学管）", { exact: true }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("周欣（学管）、李辰（课程顾问）", {
        exact: true,
      }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("2026-08-09 09:12", { exact: true }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("2026-08-09 09:25", { exact: true }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("2026-08-09 09:12｜家宁妈妈：", {
        exact: true,
      }),
    ).toBeTruthy();
    expect(
      within(evidence).getByText("2026-08-09 09:25｜家宁妈妈：", {
        exact: true,
      }),
    ).toBeTruthy();
    expect(
      within(evidence).getAllByRole("button", { name: "查看原文" }),
    ).toHaveLength(2);
    expect(
      within(evidence).queryByText("查看完整聊天", { exact: true }),
    ).toBeNull();
    const directEvidence = within(evidence).getByRole("article", {
      name: "企微单聊来源证据",
    });
    const groupEvidence = within(evidence).getByRole("article", {
      name: "企微群聊来源证据",
    });
    expect(
      within(directEvidence).queryByText("群聊名称", { exact: true }),
    ).toBeNull();
    expect(
      within(groupEvidence).getByText("群聊名称", { exact: true }),
    ).toBeTruthy();
    expect(
      within(groupEvidence).getByText("林家宁服务沟通群", { exact: true }),
    ).toBeTruthy();

    expect(
      basic.compareDocumentPosition(summary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      summary.compareDocumentPosition(evidence) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    fireEvent.click(
      within(evidence).getAllByRole("button", { name: "查看原文" })[0],
    );
    const originalDrawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 跟进及时性 · 原文",
    });
    expect(
      within(originalDrawer).getByText("完整聊天记录", { exact: true }),
    ).toBeTruthy();
    expect(
      within(originalDrawer).getByText("家宁妈妈", { exact: true }),
    ).toBeTruthy();
    expect(
      within(originalDrawer).getByText(
        "我找不到负责的老师，这两天一直联系不上。",
        { exact: true },
      ),
    ).toBeTruthy();
  });

  it("关键风险原文按完整时间和微信昵称开头，并加粗命中关键词", () => {
    render(<StudentRiskDetail detail={linRefundDetail} />);
    openRiskDetail("退费");

    const drawer = screen.getByRole("dialog", {
      name: "2026-08-09 · 退费风险详情",
    });
    const evidence = within(drawer).getByRole("region", {
      name: "来源证据",
    });
    const metadata = within(evidence).getByText(
      "2026-08-09 10:18｜家宁妈妈：",
      { exact: true },
    );
    const keyword = within(evidence).getByText("退费", { exact: true });

    expect(metadata).toBeTruthy();
    expect(keyword.tagName).toBe("STRONG");
    expect(keyword.parentElement?.textContent).toBe(
      "这个课想退费，现在还剩多少钱、还有多少课时？",
    );
  });

  it("默认每页十条，切换筛选后回到第一页并关闭详情", async () => {
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
    expect(screen.getByText("分页风险事件 11", { exact: true })).toBeTruthy();

    fireEvent.change(screen.getByRole("combobox", { name: "筛选处理状态" }), {
      target: { value: "pending" },
    });
    await waitFor(() =>
      expect(screen.getAllByRole("button", { name: "详情" })).toHaveLength(10),
    );
    expect(screen.queryByRole("dialog", { name: /风险详情/ })).toBeNull();
    expect(screen.getByText("分页风险事件 1", { exact: true })).toBeTruthy();
  }, 15_000);

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
    expect(
      within(modal).getByText(/不再计入该学生的待处理风险数量/),
    ).toBeTruthy();
    expect(
      within(modal).getByText("系统将以当前账号“周欣”记录本次操作。"),
    ).toBeTruthy();
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
      expect(onUpdate).toHaveBeenCalledWith(
        ["lin-event-follow-0809"],
        "excluded",
      ),
    );
  });

  it.each([
    {
      status: "已处理",
      detail: linResolvedDetail,
      actor: "钱悦",
      time: "2026-08-09 11:45",
    },
    {
      status: "已排除",
      detail: linExcludedDetail,
      actor: "周欣",
      time: "2026-08-09 12:30",
    },
  ])(
    "$status 风险在基本信息中展示处理人和处理时间",
    ({ detail, actor, time }) => {
      render(<StudentRiskDetail detail={detail} />);
      expect(screen.queryByRole("button", { name: /更多操作/ })).toBeNull();
      openRiskDetail();
      const drawer = screen.getByRole("dialog", { name: /风险详情/ });
      const basic = within(drawer).getByRole("region", {
        name: "风险基本信息",
      });

      expect(within(basic).getByText("处理人", { exact: true })).toBeTruthy();
      expect(within(basic).getByText(actor, { exact: true })).toBeTruthy();
      expect(within(basic).getByText("处理时间", { exact: true })).toBeTruthy();
      expect(within(basic).getByText(time, { exact: true })).toBeTruthy();
      expect(within(basic).queryByText("排除人", { exact: true })).toBeNull();
      expect(within(basic).queryByText("排除时间", { exact: true })).toBeNull();
    },
  );

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
      expect(onUpdate).toHaveBeenCalledWith(
        ["lin-event-follow-0809"],
        "resolved",
      ),
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
    expect(
      screen.getByRole("button", { name: "更多操作 跟进及时性" }),
    ).toBeTruthy();
  });
});
