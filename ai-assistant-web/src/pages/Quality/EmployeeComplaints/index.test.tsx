import { describe, expect, it } from "vitest";
import { riskStudents } from "../Conversation/riskData";
import {
  buildComplaintWarningPath,
  buildEmployeeRiskRows,
  employeeProfiles,
  filterEmployeeRiskRows,
  formatRiskRate,
  getEmployeeRiskSummary,
  getPeriodDateRange,
} from "./employeeRiskData";

describe("employee complaint risk aggregation", () => {
  it("按数据日期生成包含当天的近7天和近30天区间", () => {
    expect(getPeriodDateRange(7, "2026-08-11")).toEqual([
      "2026-08-05",
      "2026-08-11",
    ]);
    expect(getPeriodDateRange(30, "2026-08-11")).toEqual([
      "2026-07-13",
      "2026-08-11",
    ]);
  });

  it("近7天按员工聚合学生数、三档风险和占比", () => {
    const rows = buildEmployeeRiskRows(employeeProfiles, riskStudents, 7);
    const zhouXin = rows.find((row) => row.employeeName === "周欣");
    const wangShan = rows.find((row) => row.employeeName === "王珊");
    const zhaoMin = rows.find((row) => row.employeeName === "赵敏");

    expect(zhouXin).toMatchObject({
      activeStudentCount: 138,
      totalRiskCount: 1,
      highRiskCount: 1,
      mediumRiskCount: 0,
      lowRiskCount: 0,
    });
    expect(zhouXin?.totalRiskRate).toBeCloseTo(1 / 138);
    expect(wangShan).toMatchObject({
      totalRiskCount: 1,
      highRiskCount: 0,
      mediumRiskCount: 1,
      lowRiskCount: 0,
    });
    expect(zhaoMin?.totalRiskCount).toBe(0);
  });

  it("近30天包含全部五名风险学生，并保留零风险员工", () => {
    const rows = buildEmployeeRiskRows(employeeProfiles, riskStudents, 30);
    const summary = getEmployeeRiskSummary(rows);

    expect(rows).toHaveLength(employeeProfiles.length);
    expect(summary).toMatchObject({
      activeStudentCount: 888,
      totalRiskCount: 5,
      highRiskCount: 2,
      mediumRiskCount: 2,
      lowRiskCount: 1,
    });
    expect(rows.filter((row) => row.totalRiskCount === 0)).toHaveLength(2);
  });

  it("组合筛选小组、员工和风险等级", () => {
    const rows = buildEmployeeRiskRows(employeeProfiles, riskStudents, 7);

    expect(
      filterEmployeeRiskRows(rows, { groupName: "上海学管一组" }),
    ).toHaveLength(3);
    expect(
      filterEmployeeRiskRows(rows, { employeeId: "employee-wang-shan" }),
    ).toHaveLength(1);
    expect(
      filterEmployeeRiskRows(rows, { riskLevel: "medium" }).map(
        (row) => row.employeeName,
      ),
    ).toEqual(["王珊"]);
  });

  it("统一百分比展示并生成可对账的下钻链接", () => {
    expect(formatRiskRate(1 / 138)).toBe("0.7%");
    expect(formatRiskRate(0)).toBe("0.0%");

    const path = buildComplaintWarningPath({
      employeeName: "周欣",
      period: 7,
      riskLevel: "high",
    });
    const url = new URL(path, "https://example.test");

    expect(url.pathname).toBe("/quality/conversation");
    expect(url.searchParams.get("owner")).toBe("周欣");
    expect(url.searchParams.get("period")).toBe("7");
    expect(url.searchParams.get("riskLevel")).toBe("high");
  });
});
