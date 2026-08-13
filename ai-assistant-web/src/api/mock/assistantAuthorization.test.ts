import { afterEach, describe, expect, it } from "vitest";
import { assistantApi } from "../client";
import type { ConversationSummary } from "../contracts";
import { currentUser } from "./data";

const originalRole = structuredClone(currentUser.role);

async function createConversation() {
  const response = await fetch(`${window.location.origin}/api/v1/assistant/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  return (await response.json()) as ConversationSummary;
}

describe("assistant runtime authorization", () => {
  afterEach(() => {
    currentUser.role = structuredClone(originalRole);
  });

  it("从服务端登录态获取岗位并忽略客户端伪造角色", async () => {
    currentUser.role = { id: "consultant", label: "顾问" };
    const runtime = await assistantApi.getRuntimeConfig();
    expect(runtime.role).toBe("consultant");
    expect(runtime.capabilities.some((item) => item.id === "complaintRisk")).toBe(
      false,
    );

    const conversation = await createConversation();
    const response = await fetch(
      `${window.location.origin}/api/v1/assistant/conversations/${conversation.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "总结该生当前客诉风险",
          role: "studentManager",
          capabilityId: "complaintRisk",
          context: { kind: "complaintRisk", studentId: "risk-student-001" },
        }),
      },
    );
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      message: expect.stringContaining("暂无权限"),
    });
  });

  it("AI 功能已授权时仍会拦截无权访问的业务数据", async () => {
    const conversation = await createConversation();
    const response = await fetch(
      `${window.location.origin}/api/v1/assistant/conversations/${conversation.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "查询该生学习情况",
          capabilityId: "studentLearning",
          context: {
            kind: "score",
            studentId: "student-restricted",
            days: 30,
          },
        }),
      },
    );
    expect(response.status).toBe(403);
  });

  it("在每条 AI 回答上记录实际使用的配置版本", async () => {
    const conversation = await createConversation();
    const response = await fetch(
      `${window.location.origin}/api/v1/assistant/conversations/${conversation.id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "查询李明近 30 天的学习情况",
          capabilityId: "studentLearning",
          context: { kind: "score", studentId: "student-li-ming", days: 30 },
        }),
      },
    );
    expect(response.status).toBe(200);
    await response.text();

    const messages = await assistantApi.getMessages(conversation.id);
    expect(messages.at(-1)?.configVersion).toBe("v1.0");
  });
});
