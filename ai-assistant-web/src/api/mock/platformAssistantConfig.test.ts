import { describe, expect, it } from "vitest";
import { aiConfigApi, assistantApi } from "../client";
import {
  capabilityIdForContext,
  createInitialPlatformAssistantConfig,
  createPlatformAssistantRuntime,
  platformAssistantConfigSignature,
  roleCanUseCapability,
} from "./platformAssistantConfig";

describe("platform assistant configuration", () => {
  it("按岗位返回已启用且已授权的能力", () => {
    const config = createInitialPlatformAssistantConfig();
    const runtime = createPlatformAssistantRuntime(config, "consultant");

    expect(runtime.capabilities.map((item) => item.id)).toEqual([
      "studentLearning",
      "orderQuery",
      "parentReply",
      "renewalDiagnosis",
    ]);
    expect(
      roleCanUseCapability(config, "consultant", "complaintRisk"),
    ).toBe(false);
  });

  it("从查询上下文推导能力而不依赖客户端角色", () => {
    expect(
      capabilityIdForContext({
        kind: "teacherFeedback",
        studentId: "student-li-ming",
        days: 30,
      }),
    ).toBe("teacherFeedback");
  });

  it("试运行前拒绝发布变更，试运行后发布并下发新版本", async () => {
    const config = await aiConfigApi.getPlatformAssistantConfig();
    config.basic.welcomeMessage = "👋 你好，我是新版 AI 学情助手";
    const saved = await aiConfigApi.savePlatformAssistantDraft(config);

    await expect(
      aiConfigApi.publishPlatformAssistant(saved, "更新欢迎语"),
    ).rejects.toMatchObject({ status: 409 });

    const trial = await aiConfigApi.trialPlatformAssistant({
      config: saved,
      role: "studentManager",
      capabilityId: "studentLearning",
      studentId: "student-li-ming",
      question: "查询李明近 30 天的学习情况",
    });
    expect(trial.success).toBe(true);

    const published = await aiConfigApi.publishPlatformAssistant(
      saved,
      "更新欢迎语",
    );
    expect(published.publishedVersion).toBe("v1.1");
    expect((await assistantApi.getRuntimeConfig()).configVersion).toBe("v1.1");
  });

  it("配置签名忽略版本和审计元数据", () => {
    const config = createInitialPlatformAssistantConfig();
    const changedMetadata = {
      ...structuredClone(config),
      updatedAt: "2099-01-01 00:00:00",
      publishedVersion: "v99.0",
    };
    expect(platformAssistantConfigSignature(changedMetadata)).toBe(
      platformAssistantConfigSignature(config),
    );
  });
});
