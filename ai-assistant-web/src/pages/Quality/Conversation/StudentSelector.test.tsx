import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  getLinkedRiskStudentFilters,
  StudentQueryBar,
  StudentSelector,
  useRiskStudentSelection,
} from "./StudentSelector";
import { riskStudents } from "./riskData";

function StudentSelectorHarness() {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const selection = useRiskStudentSelection(
    riskStudents,
    selectedStudentId,
    setSelectedStudentId,
  );

  return (
    <>
      <StudentQueryBar selection={selection} />
      <StudentSelector
        selection={selection}
        selectedStudentId={selectedStudentId}
        onSelect={setSelectedStudentId}
      />
    </>
  );
}

describe("StudentSelector", () => {
  it("默认展示待处理学生并展示分组数量", async () => {
    render(<StudentSelectorHarness />);

    expect(screen.getByRole("tab", { name: "全部（6）" })).toBeTruthy();
    const pendingTab = screen.getByRole("tab", { name: "待处理（5）" });
    expect(pendingTab.getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tab", { name: "已处理（1）" })).toBeTruthy();
    expect(screen.queryByRole("tab", { name: /已排除/ })).toBeNull();

    const linCard = await screen.findByRole("option", { name: /林家宁/ });
    await waitFor(() =>
      expect(linCard.getAttribute("aria-selected")).toBe("true"),
    );
    expect(within(linCard).getByText("林家宁", { exact: true })).toBeTruthy();
    expect(within(linCard).getByText("S2026001", { exact: true })).toBeTruthy();
    expect(
      within(linCard).getByText("有待处理风险 · 4", { exact: true }),
    ).toBeTruthy();
    expect(screen.queryByRole("option", { name: /沈雨桐/ })).toBeNull();
  });

  it("切换已处理后仅展示无待处理风险的学生且卡片不展示标签", async () => {
    render(<StudentSelectorHarness />);

    fireEvent.click(screen.getByRole("tab", { name: "已处理（1）" }));

    const closedCard = await screen.findByRole("option", {
      name: /沈雨桐/,
    });
    await waitFor(() =>
      expect(closedCard.getAttribute("aria-selected")).toBe("true"),
    );
    expect(closedCard.querySelectorAll(".ant-tag")).toHaveLength(0);
    expect(
      within(closedCard).queryByText("已全部闭环", { exact: true }),
    ).toBeNull();
    expect(screen.queryByRole("option", { name: /林家宁/ })).toBeNull();
  });

  it("全部列表仍展示学生卡片标签", async () => {
    render(<StudentSelectorHarness />);

    fireEvent.click(screen.getByRole("tab", { name: "全部（6）" }));

    const pendingCard = await screen.findByRole("option", {
      name: /林家宁/,
    });
    expect(
      within(pendingCard).getByText("有待处理风险 · 4", { exact: true }),
    ).toBeTruthy();
    expect(pendingCard.querySelectorAll(".ant-tag")).toHaveLength(2);
  });

  it("筛选项默认只展示一行，可展开全部六项并通过查询按钮应用", async () => {
    render(<StudentSelectorHarness />);

    const formItemFor = (label: string) =>
      screen.getByText(label, { exact: true }).closest(".ant-form-item");

    for (const label of ["学生信息", "风险等级", "风险类型"]) {
      expect(
        formItemFor(label)?.classList.contains("ant-form-item-hidden"),
      ).toBe(false);
    }
    for (const label of ["风险事件时间", "员工部门", "员工姓名"]) {
      expect(
        formItemFor(label)?.classList.contains("ant-form-item-hidden"),
      ).toBe(true);
    }
    expect(screen.getByRole("button", { name: /查\s*询/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: /重\s*置/ })).toBeTruthy();
    fireEvent.click(screen.getByText(/展开/));

    for (const label of [
      "学生信息",
      "风险等级",
      "风险类型",
      "风险事件时间",
      "员工部门",
      "员工姓名",
    ]) {
      expect(
        formItemFor(label)?.classList.contains("ant-form-item-hidden"),
      ).toBe(false);
    }
    expect(screen.getByText(/收起/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "排序" })).toBeNull();
    expect(screen.queryByRole("button", { name: "筛选" })).toBeNull();

    fireEvent.change(
      screen.getByRole("textbox", { name: "搜索学生姓名或客户编号" }),
      { target: { value: "S2026002" } },
    );
    expect(screen.getByRole("option", { name: /林家宁/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /查\s*询/ }));
    await waitFor(() =>
      expect(screen.queryByRole("option", { name: /林家宁/ })).toBeNull(),
    );
    expect(screen.getByRole("option", { name: /陈子轩/ })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /重\s*置/ }));
    expect(await screen.findByRole("option", { name: /林家宁/ })).toBeTruthy();
  });

  it("使用每页五人的紧凑分页并在翻页后选择页首学生", async () => {
    const { container } = render(<StudentSelectorHarness />);

    fireEvent.click(screen.getByRole("tab", { name: "全部（6）" }));
    expect(await screen.findAllByRole("option")).toHaveLength(5);
    const pagination = screen.getByLabelText("学生列表分页");
    expect(pagination.querySelector(".ant-pagination-simple")).toBeTruthy();
    const nextButton = pagination.querySelector(
      ".ant-pagination-next button",
    ) as HTMLButtonElement;
    fireEvent.click(nextButton);

    const secondPageCard = await screen.findByRole("option", {
      name: /沈雨桐/,
    });
    await waitFor(() =>
      expect(secondPageCard.getAttribute("aria-selected")).toBe("true"),
    );
    expect(container.querySelectorAll('[role="option"]')).toHaveLength(1);
  });
});

describe("employee complaint drill-down filters", () => {
  it("从链接解析员工、风险等级和近7天范围", () => {
    expect(
      getLinkedRiskStudentFilters(
        new URLSearchParams({
          owner: "周欣",
          riskLevel: "high",
          period: "7",
        }),
        new Date("2026-08-11T12:00:00+08:00"),
      ),
    ).toEqual({
      relatedPerson: "周欣",
      riskLevel: "high",
      eventTime: ["2026-08-05", "2026-08-11"],
    });
  });

  it("忽略非法等级并保留直接访问的近30天默认值", () => {
    expect(
      getLinkedRiskStudentFilters(
        new URLSearchParams({ riskLevel: "urgent", period: "90" }),
        new Date("2026-08-11T12:00:00+08:00"),
      ),
    ).toEqual({ eventTime: ["2026-07-13", "2026-08-11"] });
  });
});
