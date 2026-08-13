import type { QueryContext, StudentOption } from "../../api/contracts";

export type QuickAction =
  | "score"
  | "order"
  | "teacherFeedback"
  | "parentReply";

export const quickActionLabels: Record<QuickAction, string> = {
  score: "学生成绩",
  order: "订单查询",
  teacherFeedback: "老师反馈",
  parentReply: "家长回复建议",
};

export function buildQuerySubmission(
  action: QuickAction,
  student: StudentOption,
  parentMessage = "",
): { text: string; context: QueryContext } {
  switch (action) {
    case "score":
      return {
        text: `查询${student.name}近 30 天的学习情况`,
        context: { kind: "score", studentId: student.id, days: 30 },
      };
    case "order":
      return {
        text: `查询${student.name}当前有效订单`,
        context: { kind: "order", studentId: student.id },
      };
    case "teacherFeedback":
      return {
        text: `汇总${student.name}近 30 天的老师反馈`,
        context: {
          kind: "teacherFeedback",
          studentId: student.id,
          days: 30,
        },
      };
    case "parentReply": {
      const message = parentMessage.trim();
      if (!message) throw new Error("请输入家长消息");
      return {
        text: `请根据家长的消息给出回复建议：${message}`,
        context: {
          kind: "parentReply",
          studentId: student.id,
          parentMessage: message,
        },
      };
    }
  }
}

