import { delay, http, HttpResponse } from "msw";
import type {
  AssistantStreamEvent,
  ChatMessage,
  ComplaintRiskConfig,
  ConversationSummary,
  PlatformAssistantConfig,
  PlatformAssistantTrialRequest,
  RenewalConfig,
  RenewalRunRequest,
  RenewalTrialRequest,
  SendMessageRequest,
  WorkReminderSummary,
} from "../contracts";
import {
  currentUser,
  createAssistantPayload,
  createInitialStore,
  inferQueryContext,
  students,
  type MockStore,
} from "./data";
import {
  capabilityIdForContext,
  createPlatformAssistantRuntime,
  platformAssistantConfigSignature,
  roleCanUseCapability,
} from "./platformAssistantConfig";
import {
  diagnoseRenewalStudent,
  getRenewalStudentDiagnosis,
  listRenewalOpportunities,
  renewalConfigurationErrors,
  renewalStudentRecords,
  runRenewalDiagnosis,
} from "./renewal";
import {
  riskStudentDetails,
  riskStudents,
} from "../../pages/Quality/Conversation/riskData";

let store: MockStore = createInitialStore();

export function resetMockStore() {
  store = createInitialStore();
}

function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

function currentTimestamp() {
  return new Date().toLocaleString("sv-SE", {
    timeZone: "Asia/Shanghai",
    hour12: false,
  });
}

function nextVersion(version: string) {
  const match = /^v(\d+)\.(\d+)/.exec(version);
  if (!match) return "v1.0";
  return `v${match[1]}.${Number(match[2]) + 1}`;
}

function addPlatformAssistantAudit(
  action: MockStore["platformAssistantAuditLogs"][number]["action"],
  summary: string,
  options: {
    configVersion?: string;
    capabilityId?: MockStore["platformAssistantAuditLogs"][number]["capabilityId"];
    role?: MockStore["platformAssistantAuditLogs"][number]["role"];
  } = {},
) {
  store.platformAssistantAuditLogs.unshift({
    id: createId("assistant-audit"),
    action,
    operator: currentUser.name,
    role: options.role ?? currentUser.role.id,
    occurredAt: currentTimestamp(),
    summary,
    configVersion: options.configVersion,
    capabilityId: options.capabilityId,
    requestId: createId("request"),
  });
}

function hasPermission(
  permission: (typeof currentUser.permissions)[number],
) {
  return currentUser.permissions.includes(permission);
}

function platformAssistantConfigurationError(
  config: PlatformAssistantConfig,
) {
  if (!config.basic.name.trim() || !config.basic.welcomeMessage.trim()) {
    return "请补全助手名称和欢迎语";
  }
  const enabledCapabilities = config.capabilities.filter(
    (item) => item.enabled,
  );
  if (!enabledCapabilities.length) return "至少启用一项 AI 能力";
  if (
    enabledCapabilities.some(
      (item) =>
        !item.dataSources.length ||
        !item.recommendedPrompts.some((prompt) => prompt.description.trim()),
    )
  ) {
    return "已启用能力必须配置数据源和推荐问题";
  }
  return undefined;
}

function contextForTrial(body: PlatformAssistantTrialRequest) {
  switch (body.capabilityId) {
    case "studentLearning":
      return { kind: "score", studentId: body.studentId, days: 30 } as const;
    case "orderQuery":
      return { kind: "order", studentId: body.studentId } as const;
    case "teacherFeedback":
      return {
        kind: "teacherFeedback",
        studentId: body.studentId,
        days: 30,
      } as const;
    case "parentReply":
      return {
        kind: "parentReply",
        studentId: body.studentId,
        parentMessage: body.question,
      } as const;
    case "complaintRisk":
      return { kind: "complaintRisk", studentId: body.studentId } as const;
    case "renewalDiagnosis":
      return { kind: "renewal", studentId: body.studentId } as const;
  }
}

function hasMockBusinessDataAccess(studentId: string) {
  return studentId !== "student-restricted";
}

function inferCapabilityIdFromText(text: string) {
  if (/客诉|投诉|风险/.test(text)) return "complaintRisk" as const;
  if (/订单|课时|课消/.test(text)) return "orderQuery" as const;
  if (/续费|条件诊断|产品推荐/.test(text)) return "renewalDiagnosis" as const;
  if (/家长|回复|话术/.test(text)) return "parentReply" as const;
  if (/老师|反馈/.test(text)) return "teacherFeedback" as const;
  if (/成绩|学习|模考|作业|出勤/.test(text)) return "studentLearning" as const;
  return undefined;
}

function sseStream(events: AssistantStreamEvent[]) {
  const encoder = new TextEncoder();
  let index = 0;

  return new ReadableStream({
    async pull(controller) {
      if (index >= events.length) {
        controller.close();
        return;
      }
      await delay(index === 0 ? 120 : 70);
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(events[index])}\n\n`),
      );
      index += 1;
    },
  });
}

export const handlers = [
  http.get("*/api/v1/me", () => HttpResponse.json(currentUser)),

  http.get("*/api/v1/complaint-risks/students", () =>
    HttpResponse.json({
      items: structuredClone(riskStudents),
      total: riskStudents.length,
      page: 1,
      pageSize: 100,
    }),
  ),

  http.get(
    "*/api/v1/complaint-risks/students/:studentId",
    ({ params }) => {
      const detail = riskStudentDetails[String(params.studentId)];
      return detail
        ? HttpResponse.json(structuredClone(detail))
        : HttpResponse.json({ message: "学生风险记录不存在" }, { status: 404 });
    },
  ),

  http.get(
    "*/api/v1/complaint-risks/evidence/:evidenceId/context",
    ({ params }) => {
      const evidence = Object.values(riskStudentDetails)
        .flatMap((detail) => detail.eventGroups)
        .flatMap((group) => group.events)
        .flatMap((event) => event.evidence)
        .find((item) => item.id === String(params.evidenceId));
      return HttpResponse.json(
        evidence?.sourceType === "wechat_direct" ||
          evidence?.sourceType === "wechat_group"
          ? structuredClone(evidence.fullChat)
          : [],
      );
    },
  ),

  http.get("*/api/v1/assistant/runtime", () => {
    if (!hasPermission("assistant.use")) {
      return HttpResponse.json({ message: "暂无权限使用 AI 助手" }, { status: 403 });
    }
    return HttpResponse.json(
      createPlatformAssistantRuntime(
        store.platformAssistantPublishedConfig,
        currentUser.role.id,
      ),
    );
  }),

  http.get("*/api/v1/ai-config/platform-assistant", () => {
    if (!hasPermission("platformAssistantConfig.view")) {
      return HttpResponse.json({ message: "暂无权限查看平台助手配置" }, { status: 403 });
    }
    return HttpResponse.json(structuredClone(store.platformAssistantConfig));
  }),

  http.patch(
    "*/api/v1/ai-config/platform-assistant/draft",
    async ({ request }) => {
      if (!hasPermission("platformAssistantConfig.edit")) {
        return HttpResponse.json({ message: "暂无权限编辑平台助手配置" }, { status: 403 });
      }
      const config = (await request.json()) as PlatformAssistantConfig;
      const configError = platformAssistantConfigurationError(config);
      if (configError) {
        return HttpResponse.json({ message: configError }, { status: 400 });
      }
      const trialIsCurrent =
        store.platformAssistantLastTrialSignature ===
        platformAssistantConfigSignature(config);
      store.platformAssistantConfig = {
        ...structuredClone(config),
        draftStatus: "saved",
        lastSuccessfulTrialAt: trialIsCurrent
          ? config.lastSuccessfulTrialAt ?? currentTimestamp()
          : undefined,
        lastSuccessfulTrialBy: trialIsCurrent
          ? config.lastSuccessfulTrialBy ?? currentUser.name
          : undefined,
        updatedAt: currentTimestamp(),
        updatedBy: currentUser.name,
      };
      addPlatformAssistantAudit("draftSaved", "保存平台助手配置草稿。", {
        configVersion: store.platformAssistantConfig.draftVersion,
      });
      return HttpResponse.json(structuredClone(store.platformAssistantConfig));
    },
  ),

  http.post(
    "*/api/v1/ai-config/platform-assistant/trial",
    async ({ request }) => {
      if (!hasPermission("platformAssistantConfig.edit")) {
        return HttpResponse.json({ message: "暂无权限试运行平台助手配置" }, { status: 403 });
      }
      const body = (await request.json()) as PlatformAssistantTrialRequest;
      const configError = platformAssistantConfigurationError(body.config);
      if (configError) {
        return HttpResponse.json({ message: configError }, { status: 400 });
      }
      const capability = body.config.capabilities.find(
        (item) => item.id === body.capabilityId,
      );
      if (!capability) {
        return HttpResponse.json({ message: "AI 能力不存在" }, { status: 400 });
      }
      const aiAuthorized = roleCanUseCapability(
        body.config,
        body.role,
        body.capabilityId,
      );
      const businessDataAuthorized = hasMockBusinessDataAccess(body.studentId);
      const trialAt = currentTimestamp();
      if (!aiAuthorized || !businessDataAuthorized) {
        addPlatformAssistantAudit(
          "trialRejected",
          !aiAuthorized
            ? `试运行岗位未授权：${capability.name}`
            : `业务数据权限拒绝：${capability.name}`,
          { capabilityId: capability.id, role: body.role },
        );
        return HttpResponse.json({
          success: false,
          trialAt,
          capabilityId: capability.id,
          capabilityName: capability.name,
          role: body.role,
          aiAuthorized,
          businessDataAuthorized,
          dataSources: capability.dataSources,
          answer: body.config.basic.fallbackMessages.forbidden,
          sources: [],
          configVersion: body.config.draftVersion,
        });
      }

      const payload = createAssistantPayload(
        contextForTrial(body),
        body.question,
        store.renewalPublishedConfig,
      );
      store.platformAssistantLastTrialSignature =
        platformAssistantConfigSignature(body.config);
      if (
        platformAssistantConfigSignature(store.platformAssistantConfig) ===
        store.platformAssistantLastTrialSignature
      ) {
        store.platformAssistantConfig.lastSuccessfulTrialAt = trialAt;
        store.platformAssistantConfig.lastSuccessfulTrialBy = currentUser.name;
      }
      addPlatformAssistantAudit("trialSucceeded", `试运行通过：${capability.name}`, {
        configVersion: body.config.draftVersion,
        capabilityId: capability.id,
        role: body.role,
      });
      return HttpResponse.json({
        success: true,
        trialAt,
        capabilityId: capability.id,
        capabilityName: capability.name,
        role: body.role,
        aiAuthorized: true,
        businessDataAuthorized: true,
        dataSources: capability.dataSources,
        answer: payload.content,
        sources: payload.sources ?? [],
        configVersion: body.config.draftVersion,
      });
    },
  ),

  http.post(
    "*/api/v1/ai-config/platform-assistant/publish",
    async ({ request }) => {
      if (!hasPermission("platformAssistantConfig.publish")) {
        return HttpResponse.json({ message: "暂无权限发布平台助手配置" }, { status: 403 });
      }
      const body = (await request.json()) as {
        config: PlatformAssistantConfig;
        changeNote: string;
      };
      const configError = platformAssistantConfigurationError(body.config);
      if (configError) {
        return HttpResponse.json({ message: configError }, { status: 400 });
      }
      if (!body.changeNote.trim()) {
        return HttpResponse.json({ message: "请填写变更说明" }, { status: 400 });
      }
      if (
        store.platformAssistantLastTrialSignature !==
        platformAssistantConfigSignature(body.config)
      ) {
        return HttpResponse.json(
          { message: "当前配置尚未通过试运行" },
          { status: 409 },
        );
      }
      const version = nextVersion(
        store.platformAssistantConfig.publishedVersion,
      );
      const publishedAt = currentTimestamp();
      store.platformAssistantVersions = store.platformAssistantVersions.map(
        (item) => ({ ...item, status: "history" }),
      );
      const publishedConfig: PlatformAssistantConfig = {
        ...structuredClone(body.config),
        publishedVersion: version,
        draftVersion: `${nextVersion(version)}-draft`,
        draftStatus: "published",
        lastSuccessfulTrialAt: publishedAt,
        lastSuccessfulTrialBy: currentUser.name,
        updatedAt: publishedAt,
        updatedBy: currentUser.name,
      };
      store.platformAssistantConfig = structuredClone(publishedConfig);
      store.platformAssistantPublishedConfig = structuredClone(publishedConfig);
      store.platformAssistantVersions.unshift({
        version,
        status: "current",
        changeNote: body.changeNote,
        publishedAt,
        publishedBy: currentUser.name,
      });
      store.platformAssistantVersionSnapshots[version] =
        structuredClone(publishedConfig);
      store.platformAssistantLastTrialSignature =
        platformAssistantConfigSignature(publishedConfig);
      addPlatformAssistantAudit("published", `发布平台助手配置 ${version}。`, {
        configVersion: version,
      });
      return HttpResponse.json(structuredClone(publishedConfig));
    },
  ),

  http.get("*/api/v1/ai-config/platform-assistant/versions", () =>
    HttpResponse.json(structuredClone(store.platformAssistantVersions)),
  ),

  http.post(
    "*/api/v1/ai-config/platform-assistant/versions/:version/rollback",
    ({ params }) => {
      if (!hasPermission("platformAssistantConfig.rollback")) {
        return HttpResponse.json({ message: "暂无权限回滚平台助手配置" }, { status: 403 });
      }
      const targetVersion = String(params.version);
      const snapshot =
        store.platformAssistantVersionSnapshots[targetVersion];
      if (!snapshot) {
        return HttpResponse.json({ message: "版本不存在" }, { status: 404 });
      }
      const version = nextVersion(
        store.platformAssistantConfig.publishedVersion,
      );
      const publishedAt = currentTimestamp();
      store.platformAssistantVersions = store.platformAssistantVersions.map(
        (item) => ({ ...item, status: "history" }),
      );
      const rolledBackConfig: PlatformAssistantConfig = {
        ...structuredClone(snapshot),
        publishedVersion: version,
        draftVersion: `${nextVersion(version)}-draft`,
        draftStatus: "published",
        lastSuccessfulTrialAt: publishedAt,
        lastSuccessfulTrialBy: currentUser.name,
        updatedAt: publishedAt,
        updatedBy: currentUser.name,
      };
      store.platformAssistantConfig = structuredClone(rolledBackConfig);
      store.platformAssistantPublishedConfig =
        structuredClone(rolledBackConfig);
      store.platformAssistantVersions.unshift({
        version,
        status: "current",
        changeNote: `回滚至 ${targetVersion}`,
        publishedAt,
        publishedBy: currentUser.name,
      });
      store.platformAssistantVersionSnapshots[version] =
        structuredClone(rolledBackConfig);
      store.platformAssistantLastTrialSignature =
        platformAssistantConfigSignature(rolledBackConfig);
      addPlatformAssistantAudit("rolledBack", `回滚 ${targetVersion} 并发布为 ${version}。`, {
        configVersion: version,
      });
      return HttpResponse.json(structuredClone(rolledBackConfig));
    },
  ),

  http.get("*/api/v1/ai-config/platform-assistant/audit-logs", () =>
    HttpResponse.json(structuredClone(store.platformAssistantAuditLogs)),
  ),

  http.get("*/api/v1/ai-config/complaint-risk", () =>
    HttpResponse.json(structuredClone(store.complaintRiskConfig)),
  ),

  http.patch(
    "*/api/v1/ai-config/complaint-risk/draft",
    async ({ request }) => {
      const config = (await request.json()) as ComplaintRiskConfig;
      store.complaintRiskConfig = {
        ...structuredClone(config),
        draftStatus: "saved",
        updatedAt: currentTimestamp(),
        updatedBy: currentUser.name,
      };
      return HttpResponse.json(structuredClone(store.complaintRiskConfig));
    },
  ),

  http.post(
    "*/api/v1/ai-config/complaint-risk/publish",
    async ({ request }) => {
      const body = (await request.json()) as {
        config: ComplaintRiskConfig;
        changeNote: string;
      };
      const version = nextVersion(store.complaintRiskConfig.publishedVersion);
      const publishedAt = currentTimestamp();
      store.complaintRiskVersions = store.complaintRiskVersions.map((item) => ({
        ...item,
        status: "history",
      }));
      store.complaintRiskConfig = {
        ...structuredClone(body.config),
        publishedVersion: version,
        draftVersion: `${nextVersion(version)}-draft`,
        draftStatus: "published",
        updatedAt: publishedAt,
        updatedBy: currentUser.name,
      };
      store.complaintRiskVersions.unshift({
        version,
        status: "current",
        changeNote: body.changeNote,
        publishedAt,
        publishedBy: currentUser.name,
        riskTypes: structuredClone(store.complaintRiskConfig.riskTypes),
      });
      store.complaintRiskVersionSnapshots[version] = structuredClone(
        store.complaintRiskConfig,
      );
      return HttpResponse.json(structuredClone(store.complaintRiskConfig));
    },
  ),

  http.get("*/api/v1/ai-config/complaint-risk/versions", () =>
    HttpResponse.json(structuredClone(store.complaintRiskVersions)),
  ),

  http.post(
    "*/api/v1/ai-config/complaint-risk/versions/:version/rollback",
    ({ params }) => {
      const targetVersion = String(params.version);
      const snapshot = store.complaintRiskVersionSnapshots[targetVersion];
      if (!snapshot) {
        return HttpResponse.json({ message: "版本不存在" }, { status: 404 });
      }
      const version = nextVersion(store.complaintRiskConfig.publishedVersion);
      const publishedAt = currentTimestamp();
      store.complaintRiskVersions = store.complaintRiskVersions.map((item) => ({
        ...item,
        status: "history",
      }));
      store.complaintRiskConfig = {
        ...structuredClone(snapshot),
        publishedVersion: version,
        draftVersion: `${nextVersion(version)}-draft`,
        draftStatus: "published",
        updatedAt: publishedAt,
        updatedBy: currentUser.name,
      };
      store.complaintRiskVersions.unshift({
        version,
        status: "current",
        changeNote: `回滚至 ${targetVersion}`,
        publishedAt,
        publishedBy: currentUser.name,
        riskTypes: structuredClone(store.complaintRiskConfig.riskTypes),
      });
      store.complaintRiskVersionSnapshots[version] = structuredClone(
        store.complaintRiskConfig,
      );
      return HttpResponse.json(structuredClone(store.complaintRiskConfig));
    },
  ),

  http.get("*/api/v1/renewal/opportunities", () =>
    HttpResponse.json(
      structuredClone(listRenewalOpportunities(store.renewalPublishedConfig)),
    ),
  ),

  http.get("*/api/v1/renewal/students", ({ request }) => {
    const keyword =
      new URL(request.url).searchParams.get("keyword")?.trim() ?? "";
    return HttpResponse.json(
      renewalStudentRecords
        .filter(
          (student) =>
            student.name.includes(keyword) ||
            student.customerNumber.includes(keyword),
        )
        .map(({ conditionSignals: _conditionSignals, purchasedProductIds: _purchasedProductIds, prerequisiteResults: _prerequisiteResults, nextExamDate: _nextExamDate, ...student }) => student),
    );
  }),

  http.get(
    "*/api/v1/renewal/students/:studentId/diagnosis",
    ({ params }) => {
      const diagnosis = getRenewalStudentDiagnosis(
        String(params.studentId),
        store.renewalPublishedConfig,
      );
      if (!diagnosis) {
        return HttpResponse.json({ message: "学生不存在" }, { status: 404 });
      }
      return HttpResponse.json(structuredClone(diagnosis));
    },
  ),

  http.post("*/api/v1/renewal/diagnoses/run", async ({ request }) => {
    const body = (await request.json()) as RenewalRunRequest;
    const evaluatedAt = currentTimestamp();
    const result = runRenewalDiagnosis(
      body,
      store.renewalPublishedConfig,
      evaluatedAt,
    );
    if (body.scope === "student" && result.diagnoses.length === 0) {
      return HttpResponse.json({ message: "学生不存在" }, { status: 404 });
    }
    result.diagnoses.forEach((diagnosis) => {
      const record = renewalStudentRecords.find(
        (student) => student.id === diagnosis.student.id,
      );
      if (!record) return;
      record.diagnosedAt = diagnosis.student.diagnosedAt;
      record.triggerReasons = diagnosis.student.triggerReasons;
    });
    return HttpResponse.json(structuredClone(result));
  }),

  http.get("*/api/v1/ai-config/renewal", () =>
    HttpResponse.json(structuredClone(store.renewalConfig)),
  ),

  http.patch("*/api/v1/ai-config/renewal", async ({ request }) => {
    const config = (await request.json()) as RenewalConfig;
    const errors = renewalConfigurationErrors(config);
    if (errors.length) {
      return HttpResponse.json({ message: errors[0] }, { status: 400 });
    }
    store.renewalConfig = {
      ...structuredClone(config),
      draftStatus: "saved",
      updatedAt: currentTimestamp(),
      updatedBy: currentUser.name,
    };
    return HttpResponse.json(structuredClone(store.renewalConfig));
  }),

  http.post("*/api/v1/ai-config/renewal/trial", async ({ request }) => {
    const body = (await request.json()) as RenewalTrialRequest;
    const errors = renewalConfigurationErrors(body.config);
    if (errors.length) {
      return HttpResponse.json({ message: errors[0] }, { status: 400 });
    }
    const student = renewalStudentRecords.find(
      (item) => item.id === body.studentId,
    );
    if (!student) {
      return HttpResponse.json({ message: "学生不存在" }, { status: 404 });
    }
    const diagnosis = diagnoseRenewalStudent(student, body.config);
    return HttpResponse.json({
      student: diagnosis.student,
      conditions: diagnosis.conditions,
    });
  }),

  http.post("*/api/v1/ai-config/renewal/publish", async ({ request }) => {
    const body = (await request.json()) as {
      config: RenewalConfig;
      changeNote: string;
    };
    const errors = renewalConfigurationErrors(body.config);
    if (errors.length) {
      return HttpResponse.json({ message: errors[0] }, { status: 400 });
    }
    const version = nextVersion(store.renewalConfig.publishedVersion);
    const publishedAt = currentTimestamp();
    store.renewalVersions = store.renewalVersions.map((item) => ({
      ...item,
      status: "history",
    }));
    const publishedConfig: RenewalConfig = {
      ...structuredClone(body.config),
      publishedVersion: version,
      draftVersion: `${nextVersion(version)}-draft`,
      draftStatus: "published",
      updatedAt: publishedAt,
      updatedBy: currentUser.name,
    };
    store.renewalConfig = structuredClone(publishedConfig);
    store.renewalPublishedConfig = structuredClone(publishedConfig);
    store.renewalVersions.unshift({
      version,
      status: "current",
      changeNote: body.changeNote,
      publishedAt,
      publishedBy: currentUser.name,
    });
    store.renewalVersionSnapshots[version] = structuredClone(publishedConfig);
    return HttpResponse.json(structuredClone(publishedConfig));
  }),

  http.get("*/api/v1/ai-config/renewal/versions", () =>
    HttpResponse.json(structuredClone(store.renewalVersions)),
  ),

  http.post(
    "*/api/v1/ai-config/renewal/versions/:version/rollback",
    ({ params }) => {
      const targetVersion = String(params.version);
      const snapshot = store.renewalVersionSnapshots[targetVersion];
      if (!snapshot) {
        return HttpResponse.json({ message: "版本不存在" }, { status: 404 });
      }
      const version = nextVersion(store.renewalConfig.publishedVersion);
      const publishedAt = currentTimestamp();
      store.renewalVersions = store.renewalVersions.map((item) => ({
        ...item,
        status: "history",
      }));
      const rolledBackConfig: RenewalConfig = {
        ...structuredClone(snapshot),
        publishedVersion: version,
        draftVersion: `${nextVersion(version)}-draft`,
        draftStatus: "published",
        updatedAt: publishedAt,
        updatedBy: currentUser.name,
      };
      store.renewalConfig = structuredClone(rolledBackConfig);
      store.renewalPublishedConfig = structuredClone(rolledBackConfig);
      store.renewalVersions.unshift({
        version,
        status: "current",
        changeNote: `回滚至 ${targetVersion}`,
        publishedAt,
        publishedBy: currentUser.name,
      });
      store.renewalVersionSnapshots[version] =
        structuredClone(rolledBackConfig);
      return HttpResponse.json(structuredClone(rolledBackConfig));
    },
  ),

  http.get("*/api/v1/work-reminders", () => {
    const summary: WorkReminderSummary = {
      unreadCount: store.reminders.filter((item) => !item.read).length,
      items: store.reminders,
    };
    return HttpResponse.json(summary);
  }),

  http.patch(
    "*/api/v1/work-reminders/:reminderId/read",
    ({ params }) => {
      const reminder = store.reminders.find(
        (item) => item.id === String(params.reminderId),
      );
      if (!reminder) {
        return HttpResponse.json({ message: "提醒不存在" }, { status: 404 });
      }
      reminder.read = true;
      const summary: WorkReminderSummary = {
        unreadCount: store.reminders.filter((item) => !item.read).length,
        items: store.reminders,
      };
      return HttpResponse.json(summary);
    },
  ),

  http.get("*/api/v1/students", ({ request }) => {
    const keyword = new URL(request.url).searchParams.get("keyword")?.trim() ?? "";
    return HttpResponse.json(
      students.filter((student) => student.name.includes(keyword)),
    );
  }),

  http.get("*/api/v1/assistant/conversations", () =>
    HttpResponse.json(
      [...store.conversations].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
    ),
  ),

  http.post("*/api/v1/assistant/conversations", async ({ request }) => {
    const body = (await request.json()) as {
      scope?: ConversationSummary["scope"];
    };
    const conversation: ConversationSummary = {
      id: createId("conversation"),
      title: "新对话",
      updatedAt: new Date().toISOString(),
      scope: body.scope,
    };
    store.conversations.unshift(conversation);
    store.messages[conversation.id] = [];
    return HttpResponse.json(conversation, { status: 201 });
  }),

  http.get(
    "*/api/v1/assistant/conversations/:conversationId/messages",
    ({ params }) => {
      const messages = store.messages[String(params.conversationId)];
      if (!messages) {
        return HttpResponse.json({ message: "会话不存在" }, { status: 404 });
      }
      return HttpResponse.json(messages);
    },
  ),

  http.post(
    "*/api/v1/assistant/conversations/:conversationId/messages",
    async ({ params, request }) => {
      const conversationId = String(params.conversationId);
      const messages = store.messages[conversationId];
      if (!messages) {
        return HttpResponse.json({ message: "会话不存在" }, { status: 404 });
      }

      const body = (await request.json()) as SendMessageRequest;
      const context = body.context ?? inferQueryContext(body.text);
      const inferredCapabilityId =
        capabilityIdForContext(context) ?? inferCapabilityIdFromText(body.text);
      const capabilityId = inferredCapabilityId ?? body.capabilityId;
      if (
        body.capabilityId &&
        inferredCapabilityId &&
        body.capabilityId !== inferredCapabilityId
      ) {
        return HttpResponse.json(
          { message: "AI 能力与请求上下文不匹配" },
          { status: 400 },
        );
      }
      if (
        capabilityId &&
        !roleCanUseCapability(
          store.platformAssistantPublishedConfig,
          currentUser.role.id,
          capabilityId,
        )
      ) {
        addPlatformAssistantAudit(
          "accessDenied",
          `岗位未授权访问 AI 能力：${capabilityId}`,
          {
            configVersion:
              store.platformAssistantPublishedConfig.publishedVersion,
            capabilityId,
          },
        );
        return HttpResponse.json(
          {
            message:
              store.platformAssistantPublishedConfig.basic.fallbackMessages
                .forbidden,
          },
          { status: 403 },
        );
      }
      if (context && !hasMockBusinessDataAccess(context.studentId)) {
        addPlatformAssistantAudit(
          "accessDenied",
          `业务数据权限拒绝：${context.studentId}`,
          {
            configVersion:
              store.platformAssistantPublishedConfig.publishedVersion,
            capabilityId,
          },
        );
        return HttpResponse.json(
          {
            message:
              store.platformAssistantPublishedConfig.basic.fallbackMessages
                .forbidden,
          },
          { status: 403 },
        );
      }
      const createdAt = new Date().toISOString();
      const userMessage: ChatMessage = {
        id: createId("message-user"),
        role: "user",
        content: body.text,
        createdAt,
        status: "done",
      };
      messages.push(userMessage);

      const payload = createAssistantPayload(
        context,
        body.text,
        store.renewalPublishedConfig,
      );
      if (payload.card?.kind === "empty") {
        payload.content =
          store.platformAssistantPublishedConfig.basic.fallbackMessages.noData;
      }
      if (capabilityId) {
        addPlatformAssistantAudit(
          "capabilityUsed",
          `调用 AI 能力：${capabilityId}`,
          {
            configVersion:
              store.platformAssistantPublishedConfig.publishedVersion,
            capabilityId,
          },
        );
      }
      const messageId = createId("message-assistant");
      const assistantMessage: ChatMessage = {
        id: messageId,
        role: "assistant",
        content: payload.content,
        createdAt: new Date().toISOString(),
        card: payload.card,
        sources: payload.sources,
        configVersion:
          store.platformAssistantPublishedConfig.publishedVersion,
        status: "done",
      };
      messages.push(assistantMessage);

      const conversation = store.conversations.find(
        (item) => item.id === conversationId,
      );
      if (conversation) {
        if (conversation.title === "新对话") {
          conversation.title = body.text.length > 22 ? `${body.text.slice(0, 22)}…` : body.text;
        }
        conversation.updatedAt = assistantMessage.createdAt;
      }

      const events: AssistantStreamEvent[] = [
        { type: "delta", value: payload.content },
      ];
      if (payload.card) events.push({ type: "card", card: payload.card });
      if (payload.sources) {
        events.push({ type: "sources", sources: payload.sources });
      }
      events.push({ type: "done", messageId });

      return new HttpResponse(sseStream(events), {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    },
  ),
];
