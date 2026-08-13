import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import {
  getLinkedRiskStudentFilters,
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
    <StudentSelector
      selection={selection}
      selectedStudentId={selectedStudentId}
      onSelect={setSelectedStudentId}
    />
  );
}

describe("StudentSelector", () => {
  it("自动选择风险最高的学生，卡片展示姓名、编号、等级和事件数", async () => {
    render(<StudentSelectorHarness />);

    const linCard = await screen.findByRole("option", { name: /林家宁/ });
    await waitFor(() => expect(linCard.getAttribute("aria-selected")).toBe("true"));

    expect(within(linCard).getByText("林家宁", { exact: true })).toBeTruthy();
    expect(within(linCard).getByText("S2026001", { exact: true })).toBeTruthy();
    expect(within(linCard).getByText("高", { exact: true })).toBeTruthy();
    expect(
      within(linCard).getByText("风险事件 5", { exact: true }),
    ).toBeTruthy();
    for (const hiddenValue of [
      riskStudents[0].coreRisk,
      riskStudents[0].latestRiskTime,
      riskStudents[0].owner,
    ]) {
      expect(within(linCard).queryByText(hiddenValue, { exact: true })).toBeNull();
    }
  });

  it("按学生姓名或客户编号即时搜索并更新选择", async () => {
    render(<StudentSelectorHarness />);

    fireEvent.change(
      screen.getByRole("searchbox", {
        name: "搜索学生姓名或客户编号",
      }),
      { target: { value: "S2026002" } },
    );

    const chenCard = await screen.findByRole("option", { name: /陈子轩/ });
    await waitFor(() =>
      expect(chenCard.getAttribute("aria-selected")).toBe("true"),
    );
    expect(screen.queryByRole("option", { name: /林家宁/ })).toBeNull();
  });

  it("在高级筛选中展示员工部门树形多选", async () => {
    render(<StudentSelectorHarness />);

    fireEvent.click(screen.getByRole("button", { name: "筛选" }));

    expect(await screen.findByText("员工部门", { exact: true })).toBeTruthy();
    fireEvent.mouseDown(
      screen.getByRole("combobox", { name: "员工部门" }),
    );
    expect(await screen.findByText("上海分校", { exact: true })).toBeTruthy();
    expect(screen.getByText("学管部", { exact: true })).toBeTruthy();
    expect(screen.getByText("上海学管一组", { exact: true })).toBeTruthy();
    expect(screen.getByText("上海学管二组", { exact: true })).toBeTruthy();
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
    ).toEqual({
      eventTime: ["2026-07-13", "2026-08-11"],
    });
  });
});
