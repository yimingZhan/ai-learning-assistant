import { describe, expect, it } from "vitest";
import { buildQuerySubmission } from "./query";

const student = { id: "student-li-ming", name: "李明" };

describe("buildQuerySubmission", () => {
  it("builds the fixed 30-day score query", () => {
    expect(buildQuerySubmission("score", student)).toEqual({
      text: "查询李明近 30 天的学习情况",
      context: { kind: "score", studentId: student.id, days: 30 },
    });
  });

  it("builds the active order query without optional filters", () => {
    expect(buildQuerySubmission("order", student)).toEqual({
      text: "查询李明当前有效订单",
      context: { kind: "order", studentId: student.id },
    });
  });

  it("builds the fixed 30-day teacher feedback query", () => {
    expect(buildQuerySubmission("teacherFeedback", student)).toEqual({
      text: "汇总李明近 30 天的老师反馈",
      context: {
        kind: "teacherFeedback",
        studentId: student.id,
        days: 30,
      },
    });
  });

  it("trims the parent message and requires it", () => {
    expect(buildQuerySubmission("parentReply", student, "  最近怎么没进步？ "))
      .toEqual({
        text: "请根据家长的消息给出回复建议：最近怎么没进步？",
        context: {
          kind: "parentReply",
          studentId: student.id,
          parentMessage: "最近怎么没进步？",
        },
      });
    expect(() => buildQuerySubmission("parentReply", student, "  ")).toThrow(
      "请输入家长消息",
    );
  });
});

