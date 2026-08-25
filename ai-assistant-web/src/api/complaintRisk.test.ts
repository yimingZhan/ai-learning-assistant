import { describe, expect, it } from "vitest";
import { complaintRiskApi } from "./client";

describe("complaintRiskApi event status workflow", () => {
  it("标记已处理后同时更新详情状态和学生待处理数量", async () => {
    const before = await complaintRiskApi.getStudentDetail("risk-student-001");
    expect(before.student.pendingRiskCount).toBe(4);

    const response = await complaintRiskApi.updateEventStatus(
      "risk-student-001",
      "lin-event-follow-0809",
      "resolved",
    );
    expect(response.student.pendingRiskCount).toBe(3);
    expect(response.student.status).toBe("pending");
    const resolvedEvent = response.detail.eventGroups
      .flatMap((group) => group.events)
      .find((event) => event.id === "lin-event-follow-0809");
    expect(resolvedEvent).toMatchObject({
      status: "resolved",
      resolvedBy: "周欣",
    });
    expect(resolvedEvent?.resolvedAt).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    expect(response.detail.operationLogs[0]).toMatchObject({
      category: "处理记录",
      eventId: "lin-event-follow-0809",
      operationType: "标记风险为已处理",
      operator: "周欣",
      operatedAt: resolvedEvent?.resolvedAt,
    });

    const list = await complaintRiskApi.listStudents();
    expect(
      list.items.find((student) => student.id === "risk-student-001")
        ?.pendingRiskCount,
    ).toBe(3);
  });

  it("排除风险后持久化状态并拒绝重复处理", async () => {
    await complaintRiskApi.updateEventStatus(
      "risk-student-001",
      "lin-event-refund-0809",
      "excluded",
    );
    const detail = await complaintRiskApi.getStudentDetail("risk-student-001");
    const excludedEvent = detail.eventGroups
      .flatMap((group) => group.events)
      .find((event) => event.id === "lin-event-refund-0809");
    expect(excludedEvent).toMatchObject({
      status: "excluded",
      excludedBy: "周欣",
    });
    expect(excludedEvent?.excludedAt).toMatch(
      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
    );
    expect(detail.operationLogs[0]).toMatchObject({
      category: "处理记录",
      eventId: "lin-event-refund-0809",
      operationType: "排除风险",
      operator: "周欣",
      operatedAt: excludedEvent?.excludedAt,
    });

    await expect(
      complaintRiskApi.updateEventStatus(
        "risk-student-001",
        "lin-event-refund-0809",
        "resolved",
      ),
    ).rejects.toMatchObject({ status: 409 });
  });

  it("不存在的学生和事件不会污染原数据", async () => {
    await expect(
      complaintRiskApi.updateEventStatus(
        "missing-student",
        "missing-event",
        "resolved",
      ),
    ).rejects.toMatchObject({ status: 404 });
    await expect(
      complaintRiskApi.updateEventStatus(
        "risk-student-001",
        "missing-event",
        "excluded",
      ),
    ).rejects.toMatchObject({ status: 404 });

    const detail = await complaintRiskApi.getStudentDetail("risk-student-001");
    expect(detail.student.pendingRiskCount).toBe(4);
  });

  it("最后一条待处理风险完成后更新学生整体状态", async () => {
    for (const eventId of [
      "lin-event-follow-0809",
      "lin-event-refund-0809",
      "lin-event-complaint-0809",
      "lin-event-follow-0808",
    ]) {
      await complaintRiskApi.updateEventStatus(
        "risk-student-001",
        eventId,
        "resolved",
      );
    }

    const resolvedList = await complaintRiskApi.listStudents();
    expect(
      resolvedList.items.find((student) => student.id === "risk-student-001"),
    ).toMatchObject({ pendingRiskCount: 0, status: "resolved" });

    for (const eventId of [
      "chen-event-complaint",
      "chen-event-refund",
      "chen-event-follow",
    ]) {
      await complaintRiskApi.updateEventStatus(
        "risk-student-002",
        eventId,
        "excluded",
      );
    }

    const excludedList = await complaintRiskApi.listStudents();
    expect(
      excludedList.items.find((student) => student.id === "risk-student-002"),
    ).toMatchObject({ pendingRiskCount: 0, status: "excluded" });
  });
});
