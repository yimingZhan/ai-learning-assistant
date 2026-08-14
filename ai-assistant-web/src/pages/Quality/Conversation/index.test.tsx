import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  CoreRiskSummaries,
  filterRiskStudents,
  getDefaultEventTime,
  getCoreRiskSummaries,
  getRiskEventRelatedPeople,
  RelatedPeopleText,
  RiskSourceTags,
  riskStudentDetails,
  riskStudents,
  sortRiskStudents,
  toRiskSource,
} from ".";

describe("CoreRiskSummaries", () => {
  it("按事件展示带日期的详情摘要", () => {
    const summaries = getCoreRiskSummaries("risk-student-001");

    expect(summaries).toHaveLength(5);
    expect(summaries.map((item) => item.date)).toEqual([
      "2026-08-09",
      "2026-08-09",
      "2026-08-09",
      "2026-08-08",
      "2026-08-07",
    ]);
    expect(summaries.map((item) => item.summary)).toEqual(
      riskStudentDetails["risk-student-001"].eventGroups.flatMap((group) =>
        group.events.map((event) => event.riskSummary),
      ),
    );
  });

  it("鼠标悬浮时展示所有事件的完整摘要", async () => {
    const record = riskStudents[0];
    const { container } = render(<CoreRiskSummaries record={record} />);
    const trigger = container.firstElementChild;

    expect(trigger).toBeTruthy();
    fireEvent.mouseEnter(trigger as Element);

    const tooltip = await waitFor(() => {
      const element = document.querySelector(".ant-tooltip");
      expect(element).toBeTruthy();
      return element as HTMLElement;
    });

    for (const item of getCoreRiskSummaries(record.id)) {
      expect(within(tooltip).getByText(item.summary)).toBeTruthy();
    }
  });

  it("列表最多展示两行，有更多事件时标记省略", () => {
    const { container } = render(
      <CoreRiskSummaries record={riskStudents[0]} />,
    );
    const visibleItems = container.firstElementChild?.children;

    expect(visibleItems).toHaveLength(2);
    expect(visibleItems?.[1].textContent).toMatch(/…$/);
  });
});

describe("RiskSourceTags", () => {
  it("将云客微信和电话分开显示为独立标签", () => {
    render(<RiskSourceTags values={["wechat", "phone"]} />);

    const wechatTag = screen.getByText("云客微信").closest(".ant-tag");
    const phoneTag = screen.getByText("电话").closest(".ant-tag");

    expect(wechatTag).toBeTruthy();
    expect(phoneTag).toBeTruthy();
    expect(wechatTag).not.toBe(phoneTag);
    expect(screen.queryByText("云客微信+电话")).toBeNull();
  });
});

describe("RelatedPeopleText", () => {
  it("从风险事件证据中提取员工姓名并合并职务", () => {
    expect(getRiskEventRelatedPeople("risk-student-001")).toEqual([
      { name: "周欣", roles: ["学管", "课程顾问"] },
      { name: "李辰", roles: ["课程顾问"] },
    ]);

    const { container } = render(
      <RelatedPeopleText
        people={getRiskEventRelatedPeople("risk-student-001")}
      />,
    );
    expect(screen.getByText("周欣（学管、课程顾问）")).toBeTruthy();
    expect(screen.getByText("李辰（课程顾问）")).toBeTruthy();
    expect(container.querySelector(".ant-tag")).toBeNull();
  });

  it("相关人最多展示两行，超出时标记省略", () => {
    const { container } = render(
      <RelatedPeopleText
        people={[
          { name: "周欣", roles: ["学管"] },
          { name: "李辰", roles: ["课程顾问"] },
          { name: "王珊", roles: ["班主任"] },
        ]}
      />,
    );
    const visibleItems = container.firstElementChild?.children;

    expect(visibleItems).toHaveLength(2);
    expect(visibleItems?.[1].textContent).toMatch(/…$/);
    expect(container.querySelector(".ant-tag")).toBeNull();
  });
});

describe("filterRiskStudents", () => {
  it("按学生名称或编号模糊搜索", () => {
    expect(filterRiskStudents(riskStudents, { student: "林家" })).toHaveLength(1);
    expect(
      filterRiskStudents(riskStudents, { student: "S2026002" }),
    ).toHaveLength(1);
  });

  it("组合筛选等级、来源、时间、员工部门和相关人", () => {
    expect(
      filterRiskStudents(riskStudents, {
        riskLevel: "high",
        riskSources: ["wechat"],
        eventTime: ["2026-08-01", "2026-08-09"],
        employeeDepartments: ["shanghai-student-management-group-1"],
        relatedPerson: "周欣",
      }),
    ).toHaveLength(1);
  });

  it("支持选择父级部门或多个小组", () => {
    expect(
      filterRiskStudents(riskStudents, {
        employeeDepartments: ["shanghai-student-management"],
      }),
    ).toHaveLength(5);
    expect(
      filterRiskStudents(riskStudents, {
        employeeDepartments: ["shanghai-student-management-group-2"],
      }).map((student) => student.owner),
    ).toEqual(["王珊", "赵敏", "孙超"]);
  });
});

describe("risk student selection defaults", () => {
  it("默认筛选最近 30 天（包含当天）", () => {
    expect(getDefaultEventTime(new Date("2026-08-11T12:00:00+08:00"))).toEqual([
      "2026-07-13",
      "2026-08-11",
    ]);
  });

  it("支持风险、最近时间和事件数三种倒序排序", () => {
    expect(sortRiskStudents(riskStudents, "risk").map((item) => item.id)).toEqual([
      "risk-student-001",
      "risk-student-002",
      "risk-student-003",
      "risk-student-005",
      "risk-student-004",
    ]);
    expect(sortRiskStudents(riskStudents, "latest")[0].id).toBe(
      "risk-student-001",
    );
    expect(sortRiskStudents(riskStudents, "eventCount")[0].id).toBe(
      "risk-student-001",
    );
  });
});

describe("riskStudentDetails", () => {
  it("为列表中的每名学生提供一致的完整风险详情", () => {
    expect(Object.keys(riskStudentDetails)).toHaveLength(riskStudents.length);

    for (const student of riskStudents) {
      const detail = riskStudentDetails[student.id];
      const events = detail.eventGroups.flatMap((group) => group.events);
      const themeCount = detail.themes.reduce(
        (total, theme) => total + theme.count,
        0,
      );
      const eventSources = [
        ...new Set(events.flatMap((event) => event.riskSources)),
      ].sort();

      expect(detail.student).toBe(student);
      expect(detail.handlingSuggestion.trim().length).toBeGreaterThan(0);
      expect(events).toHaveLength(student.riskEventCount);
      expect(themeCount).toBe(student.riskEventCount);
      expect(detail.latestRiskDate).toBe(detail.eventGroups[0].date);
      expect(eventSources).toEqual([...student.riskSources].sort());

      for (const event of events) {
        const evidenceSources = [
          ...new Set(
            event.evidence
              .map((evidence) => toRiskSource(evidence.sourceType))
              .filter((source) => source !== null),
          ),
        ].sort();
        expect(evidenceSources).toEqual([...event.riskSources].sort());
      }
    }
  });

  it("按指定结构生成林家宁的五条风险事件", () => {
    const detail = riskStudentDetails["risk-student-001"];

    expect(detail.eventGroups.map((group) => group.date)).toEqual([
      "2026-08-09",
      "2026-08-08",
      "2026-08-07",
    ]);
    expect(detail.eventGroups.map((group) => group.events.length)).toEqual([
      3, 1, 1,
    ]);
    expect(detail.themes).toEqual([
      { label: "学习效果质疑", count: 3 },
      { label: "退费倾向", count: 1 },
      { label: "服务响应不满", count: 1 },
    ]);
    expect(
      new Set(
        detail.eventGroups.flatMap((group) =>
          group.events.flatMap((event) =>
            event.evidence.map((evidence) => evidence.sourceType),
          ),
        ),
      ),
    ).toEqual(
      new Set([
        "wechat_direct",
        "wechat_group",
        "phone_outbound",
        "learning_info",
      ]),
    );
  });
});
