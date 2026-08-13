import {
  type RiskLevel,
  type RiskStudent,
} from "../Conversation/riskData";

export type RiskPeriod = 7 | 30;

export type EmployeeProfile = {
  id: string;
  employeeName: string;
  groupName: string;
  activeStudentCount: number;
};

export type EmployeeRiskRow = EmployeeProfile & {
  totalRiskCount: number;
  totalRiskRate: number;
  highRiskCount: number;
  highRiskRate: number;
  mediumRiskCount: number;
  mediumRiskRate: number;
  lowRiskCount: number;
  lowRiskRate: number;
};

export type EmployeeRiskFilters = {
  period?: RiskPeriod;
  groupName?: string;
  employeeId?: string;
  riskLevel?: RiskLevel;
};

export type EmployeeRiskSummary = {
  activeStudentCount: number;
  totalRiskCount: number;
  totalRiskRate: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
};

export const employeeRiskDataAsOfDate = "2026-08-11";

export const employeeProfiles: EmployeeProfile[] = [
  {
    id: "employee-zhou-xin",
    employeeName: "周欣",
    groupName: "上海学管一组",
    activeStudentCount: 138,
  },
  {
    id: "employee-li-chen",
    employeeName: "李辰",
    groupName: "上海学管一组",
    activeStudentCount: 126,
  },
  {
    id: "employee-qian-yue",
    employeeName: "钱悦",
    groupName: "上海学管一组",
    activeStudentCount: 124,
  },
  {
    id: "employee-wang-shan",
    employeeName: "王珊",
    groupName: "上海学管二组",
    activeStudentCount: 142,
  },
  {
    id: "employee-zhao-min",
    employeeName: "赵敏",
    groupName: "上海学管二组",
    activeStudentCount: 118,
  },
  {
    id: "employee-sun-chao",
    employeeName: "孙超",
    groupName: "上海学管二组",
    activeStudentCount: 131,
  },
  {
    id: "employee-xu-chen",
    employeeName: "徐晨",
    groupName: "上海学管二组",
    activeStudentCount: 109,
  },
];

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getPeriodDateRange(
  period: RiskPeriod,
  endDate = employeeRiskDataAsOfDate,
): [string, string] {
  const end = new Date(`${endDate}T00:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - period + 1);

  return [formatDate(start), formatDate(end)];
}

function rate(count: number, activeStudentCount: number) {
  return activeStudentCount > 0 ? count / activeStudentCount : 0;
}

export function buildEmployeeRiskRows(
  profiles: EmployeeProfile[],
  students: RiskStudent[],
  period: RiskPeriod,
  endDate = employeeRiskDataAsOfDate,
): EmployeeRiskRow[] {
  const [startDate, periodEndDate] = getPeriodDateRange(period, endDate);

  return profiles
    .map((profile) => {
      const employeeStudents = new Map(
        students
          .filter((student) => {
            const riskDate = student.latestRiskTime.slice(0, 10);
            return (
              student.owner === profile.employeeName &&
              riskDate >= startDate &&
              riskDate <= periodEndDate
            );
          })
          .map((student) => [student.id, student]),
      ).values();
      const uniqueStudents = [...employeeStudents];
      const highRiskCount = uniqueStudents.filter(
        (student) => student.riskLevel === "high",
      ).length;
      const mediumRiskCount = uniqueStudents.filter(
        (student) => student.riskLevel === "medium",
      ).length;
      const lowRiskCount = uniqueStudents.filter(
        (student) => student.riskLevel === "low",
      ).length;
      const totalRiskCount = uniqueStudents.length;

      return {
        ...profile,
        totalRiskCount,
        totalRiskRate: rate(totalRiskCount, profile.activeStudentCount),
        highRiskCount,
        highRiskRate: rate(highRiskCount, profile.activeStudentCount),
        mediumRiskCount,
        mediumRiskRate: rate(mediumRiskCount, profile.activeStudentCount),
        lowRiskCount,
        lowRiskRate: rate(lowRiskCount, profile.activeStudentCount),
      };
    })
    .sort(
      (first, second) =>
        second.highRiskCount - first.highRiskCount ||
        second.totalRiskRate - first.totalRiskRate ||
        first.employeeName.localeCompare(second.employeeName, "zh-CN"),
    );
}

export function filterEmployeeRiskRows(
  rows: EmployeeRiskRow[],
  filters: EmployeeRiskFilters,
) {
  return rows.filter((row) => {
    const matchesGroup =
      !filters.groupName || row.groupName === filters.groupName;
    const matchesEmployee =
      !filters.employeeId || row.id === filters.employeeId;
    const matchesRiskLevel =
      !filters.riskLevel ||
      (filters.riskLevel === "high" && row.highRiskCount > 0) ||
      (filters.riskLevel === "medium" && row.mediumRiskCount > 0) ||
      (filters.riskLevel === "low" && row.lowRiskCount > 0);

    return matchesGroup && matchesEmployee && matchesRiskLevel;
  });
}

export function getEmployeeRiskSummary(
  rows: EmployeeRiskRow[],
): EmployeeRiskSummary {
  const summary = rows.reduce(
    (result, row) => ({
      activeStudentCount:
        result.activeStudentCount + row.activeStudentCount,
      totalRiskCount: result.totalRiskCount + row.totalRiskCount,
      highRiskCount: result.highRiskCount + row.highRiskCount,
      mediumRiskCount: result.mediumRiskCount + row.mediumRiskCount,
      lowRiskCount: result.lowRiskCount + row.lowRiskCount,
    }),
    {
      activeStudentCount: 0,
      totalRiskCount: 0,
      highRiskCount: 0,
      mediumRiskCount: 0,
      lowRiskCount: 0,
    },
  );

  return {
    ...summary,
    totalRiskRate: rate(
      summary.totalRiskCount,
      summary.activeStudentCount,
    ),
  };
}

export function formatRiskRate(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export function buildComplaintWarningPath({
  employeeName,
  period,
  riskLevel,
}: {
  employeeName: string;
  period: RiskPeriod;
  riskLevel?: RiskLevel;
}) {
  const searchParams = new URLSearchParams({
    owner: employeeName,
    period: String(period),
  });

  if (riskLevel) searchParams.set("riskLevel", riskLevel);

  return `/quality/conversation?${searchParams.toString()}`;
}
