import type {
  AssistantStreamEvent,
  ConversationSummary,
  ConversationScope,
  ChatMessage,
  ComplaintRiskConfig,
  ComplaintRiskVersion,
  CurrentUser,
  PlatformAssistantAuditLog,
  PlatformAssistantConfig,
  PlatformAssistantRuntime,
  PlatformAssistantTrialRequest,
  PlatformAssistantTrialResult,
  PlatformAssistantVersion,
  RenewalConfig,
  RenewalConfigVersion,
  RenewalOpportunitiesResponse,
  RenewalRunRequest,
  RenewalRunResult,
  RenewalStudentDiagnosis,
  RenewalStudentSummary,
  RenewalTrialResult,
  SendMessageRequest,
  StudentOption,
  WorkReminderSummary,
} from "./contracts";
import type {
  FullChatMessage,
  RiskStudent,
  RiskStudentDetail,
} from "../pages/Quality/Conversation/riskData";
import { getDemoApiBase } from "./mock/serviceWorkerUrl";

const API_BASE =
  typeof window === "undefined" ? "" : getDemoApiBase(window.location.href);

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const errorBody = (await response
      .json()
      .catch(() => undefined)) as { message?: string } | undefined;
    throw new ApiError(
      errorBody?.message ?? "请求失败，请稍后重试",
      response.status,
    );
  }

  return response.json() as Promise<T>;
}

export const assistantApi = {
  messageEndpoint(conversationId: string) {
    return `${API_BASE}/api/v1/assistant/conversations/${conversationId}/messages`;
  },

  searchStudents(keyword = "") {
    return requestJson<StudentOption[]>(
      `/api/v1/students?keyword=${encodeURIComponent(keyword)}`,
    );
  },

  getRuntimeConfig() {
    return requestJson<PlatformAssistantRuntime>("/api/v1/assistant/runtime");
  },

  listConversations() {
    return requestJson<ConversationSummary[]>("/api/v1/assistant/conversations");
  },

  createConversation(scope?: ConversationScope) {
    return requestJson<ConversationSummary>("/api/v1/assistant/conversations", {
      method: "POST",
      body: JSON.stringify({ scope }),
    });
  },

  getMessages(conversationId: string) {
    return requestJson<ChatMessage[]>(
      `/api/v1/assistant/conversations/${conversationId}/messages`,
    );
  },

  async streamMessage(
    conversationId: string,
    request: SendMessageRequest,
    onEvent: (event: AssistantStreamEvent) => void,
    signal?: AbortSignal,
  ) {
    const response = await fetch(
      assistantApi.messageEndpoint(conversationId),
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(request),
        signal,
      },
    );

    if (!response.ok || !response.body) {
      throw new ApiError("回答生成失败，请稍后重试", response.status);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const frames = buffer.split("\n\n");
      buffer = frames.pop() ?? "";

      for (const frame of frames) {
        const dataLine = frame
          .split("\n")
          .find((line) => line.startsWith("data:"));
        if (!dataLine) continue;
        onEvent(JSON.parse(dataLine.slice(5).trim()) as AssistantStreamEvent);
      }
    }
  },
};

export const toolbarApi = {
  getCurrentUser() {
    return requestJson<CurrentUser>("/api/v1/me");
  },

  getWorkReminders() {
    return requestJson<WorkReminderSummary>("/api/v1/work-reminders");
  },

  markReminderRead(reminderId: string) {
    return requestJson<WorkReminderSummary>(
      `/api/v1/work-reminders/${encodeURIComponent(reminderId)}/read`,
      { method: "PATCH" },
    );
  },
};

export type ComplaintRiskStudentPage = {
  items: RiskStudent[];
  total: number;
  page: number;
  pageSize: number;
};

export const complaintRiskApi = {
  listStudents() {
    return requestJson<ComplaintRiskStudentPage>(
      "/api/v1/complaint-risks/students?page=1&pageSize=100",
    );
  },

  getStudentDetail(studentId: string) {
    return requestJson<RiskStudentDetail>(
      `/api/v1/complaint-risks/students/${encodeURIComponent(studentId)}`,
    );
  },

  getEvidenceContext(evidenceId: string) {
    return requestJson<FullChatMessage[]>(
      `/api/v1/complaint-risks/evidence/${encodeURIComponent(evidenceId)}/context`,
    );
  },
};

export const renewalApi = {
  listOpportunities() {
    return requestJson<RenewalOpportunitiesResponse>(
      "/api/v1/renewal/opportunities",
    );
  },

  listStudents(keyword = "") {
    return requestJson<RenewalStudentSummary[]>(
      `/api/v1/renewal/students?keyword=${encodeURIComponent(keyword)}`,
    );
  },

  getStudentDiagnosis(studentId: string) {
    return requestJson<RenewalStudentDiagnosis>(
      `/api/v1/renewal/students/${encodeURIComponent(studentId)}/diagnosis`,
    );
  },

  runDiagnosis(request: RenewalRunRequest) {
    return requestJson<RenewalRunResult>("/api/v1/renewal/diagnoses/run", {
      method: "POST",
      body: JSON.stringify(request),
    });
  },
};

export const aiConfigApi = {
  getPlatformAssistantConfig() {
    return requestJson<PlatformAssistantConfig>(
      "/api/v1/ai-config/platform-assistant",
    );
  },

  savePlatformAssistantDraft(config: PlatformAssistantConfig) {
    return requestJson<PlatformAssistantConfig>(
      "/api/v1/ai-config/platform-assistant/draft",
      {
        method: "PATCH",
        body: JSON.stringify(config),
      },
    );
  },

  trialPlatformAssistant(request: PlatformAssistantTrialRequest) {
    return requestJson<PlatformAssistantTrialResult>(
      "/api/v1/ai-config/platform-assistant/trial",
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  },

  publishPlatformAssistant(
    config: PlatformAssistantConfig,
    changeNote: string,
  ) {
    return requestJson<PlatformAssistantConfig>(
      "/api/v1/ai-config/platform-assistant/publish",
      {
        method: "POST",
        body: JSON.stringify({ config, changeNote }),
      },
    );
  },

  listPlatformAssistantVersions() {
    return requestJson<PlatformAssistantVersion[]>(
      "/api/v1/ai-config/platform-assistant/versions",
    );
  },

  rollbackPlatformAssistant(version: string) {
    return requestJson<PlatformAssistantConfig>(
      `/api/v1/ai-config/platform-assistant/versions/${encodeURIComponent(version)}/rollback`,
      { method: "POST" },
    );
  },

  listPlatformAssistantAuditLogs() {
    return requestJson<PlatformAssistantAuditLog[]>(
      "/api/v1/ai-config/platform-assistant/audit-logs",
    );
  },

  getComplaintRiskConfig() {
    return requestJson<ComplaintRiskConfig>(
      "/api/v1/ai-config/complaint-risk",
    );
  },

  saveComplaintRiskDraft(config: ComplaintRiskConfig) {
    return requestJson<ComplaintRiskConfig>(
      "/api/v1/ai-config/complaint-risk/draft",
      {
        method: "PATCH",
        body: JSON.stringify(config),
      },
    );
  },

  publishComplaintRisk(config: ComplaintRiskConfig, changeNote: string) {
    return requestJson<ComplaintRiskConfig>(
      "/api/v1/ai-config/complaint-risk/publish",
      {
        method: "POST",
        body: JSON.stringify({ config, changeNote }),
      },
    );
  },

  listComplaintRiskVersions() {
    return requestJson<ComplaintRiskVersion[]>(
      "/api/v1/ai-config/complaint-risk/versions",
    );
  },

  rollbackComplaintRisk(version: string) {
    return requestJson<ComplaintRiskConfig>(
      `/api/v1/ai-config/complaint-risk/versions/${encodeURIComponent(version)}/rollback`,
      { method: "POST" },
    );
  },

  getRenewalConfig() {
    return requestJson<RenewalConfig>("/api/v1/ai-config/renewal");
  },

  saveRenewalDraft(config: RenewalConfig) {
    return requestJson<RenewalConfig>("/api/v1/ai-config/renewal", {
      method: "PATCH",
      body: JSON.stringify(config),
    });
  },

  trialRenewal(config: RenewalConfig, studentId: string) {
    return requestJson<RenewalTrialResult>("/api/v1/ai-config/renewal/trial", {
      method: "POST",
      body: JSON.stringify({ config, studentId }),
    });
  },

  publishRenewal(config: RenewalConfig, changeNote: string) {
    return requestJson<RenewalConfig>("/api/v1/ai-config/renewal/publish", {
      method: "POST",
      body: JSON.stringify({ config, changeNote }),
    });
  },

  listRenewalVersions() {
    return requestJson<RenewalConfigVersion[]>(
      "/api/v1/ai-config/renewal/versions",
    );
  },

  rollbackRenewal(version: string) {
    return requestJson<RenewalConfig>(
      `/api/v1/ai-config/renewal/versions/${encodeURIComponent(version)}/rollback`,
      { method: "POST" },
    );
  },
};
