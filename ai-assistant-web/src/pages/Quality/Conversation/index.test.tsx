import { describe, expect, it } from "vitest";
import {
  filterRiskStudents,
  getEvidenceCommunicationAt,
  riskStudentDetails,
  riskStudents,
  sortRiskStudents,
} from "./riskData";

describe("filterRiskStudents", () => {
  it("按学生名称或编号模糊搜索", () => {
    expect(filterRiskStudents(riskStudents, { student: "林家" })).toHaveLength(1);
    expect(
      filterRiskStudents(riskStudents, { student: "S2026002" }),
    ).toHaveLength(1);
  });

  it("组合筛选等级、时间、员工部门和员工姓名", () => {
    expect(
      filterRiskStudents(riskStudents, {
        riskLevel: "high",
        eventTime: ["2026-08-01", "2026-08-09"],
        employeeDepartments: ["shanghai-student-management-group-1"],
        relatedPerson: "周欣",
      }).map((student) => student.id),
    ).toEqual(["risk-student-001"]);
  });

  it("支持选择父级部门和具体小组", () => {
    expect(
      filterRiskStudents(riskStudents, {
        employeeDepartments: ["shanghai-student-management"],
      }),
    ).toHaveLength(6);
    expect(
      filterRiskStudents(riskStudents, {
        employeeDepartments: ["shanghai-student-management-group-2"],
      }).map((student) => student.owner),
    ).toEqual(["王珊", "赵敏", "孙超", "孟涵"]);
  });

  it("风险类型多选按任一类型匹配学生", () => {
    expect(
      filterRiskStudents(riskStudents, { riskTypes: ["退费"] }).map(
        (student) => student.id,
      ),
    ).toEqual(["risk-student-001", "risk-student-002", "risk-student-005"]);

    expect(
      filterRiskStudents(riskStudents, { riskTypes: ["退费", "客诉"] }).map(
        (student) => student.id,
      ),
    ).toEqual([
      "risk-student-001",
      "risk-student-002",
      "risk-student-005",
      "risk-student-006",
    ]);
  });
});

describe("risk student ordering", () => {
  it("支持风险、最近时间和待处理数量三种倒序排序", () => {
    expect(sortRiskStudents(riskStudents, "risk").map((item) => item.id)).toEqual([
      "risk-student-001",
      "risk-student-002",
      "risk-student-003",
      "risk-student-005",
      "risk-student-006",
      "risk-student-004",
    ]);
    expect(sortRiskStudents(riskStudents, "latest")[0].id).toBe(
      "risk-student-001",
    );
    expect(sortRiskStudents(riskStudents, "pendingCount").map((item) => item.pendingRiskCount)).toEqual([
      4, 3, 3, 2, 1, 0,
    ]);
  });
});

describe("riskStudentDetails", () => {
  it("待处理数量只统计 pending 事件", () => {
    for (const student of riskStudents) {
      const events = riskStudentDetails[student.id].eventGroups.flatMap(
        (group) => group.events,
      );
      expect(student.pendingRiskCount).toBe(
        events.filter((event) => event.status === "pending").length,
      );
    }
    expect(riskStudents.find((student) => student.id === "risk-student-004")?.pendingRiskCount).toBe(0);
  });

  it("已处理的 Mock 风险包含处理人和处理时间", () => {
    const resolvedEvents = Object.values(riskStudentDetails).flatMap((detail) =>
      detail.eventGroups
        .flatMap((group) => group.events)
        .filter((event) => event.status === "resolved"),
    );

    expect(resolvedEvents.length).toBeGreaterThan(0);
    for (const event of resolvedEvents) {
      expect(event.resolvedBy).toBeTruthy();
      expect(event.resolvedAt).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
    }
  });

  it("已排除的 Mock 风险包含排除人和排除时间", () => {
    const excludedEvents = Object.values(riskStudentDetails).flatMap((detail) =>
      detail.eventGroups
        .flatMap((group) => group.events)
        .filter((event) => event.status === "excluded"),
    );

    expect(excludedEvents.length).toBeGreaterThan(0);
    for (const event of excludedEvents) {
      expect(event.excludedBy).toBeTruthy();
      expect(event.excludedAt).toMatch(
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
      );
    }
  });

  it("Demo 仅包含跟进及时性、退费和客诉三种风险类型", () => {
    const events = Object.values(riskStudentDetails).flatMap((detail) =>
      detail.eventGroups.flatMap((group) => group.events),
    );
    expect(new Set(events.map((event) => event.riskType))).toEqual(
      new Set(["跟进及时性", "退费", "客诉"]),
    );
  });

  it("每个风险类型均覆盖企微单聊与带群名的企微群聊", () => {
    const events = Object.values(riskStudentDetails).flatMap((detail) =>
      detail.eventGroups.flatMap((group) => group.events),
    );

    for (const riskType of ["跟进及时性", "退费", "客诉"] as const) {
      const evidence = events
        .filter((event) => event.riskType === riskType)
        .flatMap((event) => event.evidence);
      expect(new Set(evidence.map((item) => item.sourceType))).toEqual(
        new Set(["wechat_direct", "wechat_group"]),
      );
      for (const groupEvidence of evidence.filter(
        (item) => item.sourceType === "wechat_group",
      )) {
        expect(groupEvidence.groupName.trim()).toBeTruthy();
      }
    }
  });

  it("沟通时间取关键风险原文第一条消息时间", () => {
    for (const detail of Object.values(riskStudentDetails)) {
      for (const evidence of detail.eventGroups.flatMap((group) =>
        group.events.flatMap((event) => event.evidence),
      )) {
        expect(getEvidenceCommunicationAt(evidence)).toBe(
          evidence.keyQuotes[0].occurredAt,
        );
        expect(evidence.fullChat[0].occurredAt).toBe(
          evidence.keyQuotes[0].occurredAt,
        );
      }
    }
  });

  it("关键字样例覆盖用户指定表达", () => {
    const linEvents = riskStudentDetails["risk-student-001"].eventGroups.flatMap(
      (group) => group.events,
    );
    const keywords = Object.fromEntries(
      linEvents.slice(0, 3).map((event) => [event.riskType, event.keywords]),
    );
    expect(keywords["跟进及时性"]).toEqual(
      expect.arrayContaining(["找不到人", "联系不上", "未反馈"]),
    );
    expect(keywords["退费"]).toEqual(
      expect.arrayContaining([
        "退费",
        "退了",
        "还剩多少钱",
        "还有多少课时",
        "什么时候到账",
      ]),
    );
    expect(keywords["客诉"]).toEqual(
      expect.arrayContaining(["不满意", "不喜欢", "风格不合适", "换老师", "全拒"]),
    );
  });
});
