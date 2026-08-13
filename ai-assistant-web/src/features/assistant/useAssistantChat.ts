import { useCallback, useEffect, useRef, useState } from "react";
import {
  useXChat,
  useXConversations,
  type DefaultMessageInfo,
  type SSEOutput,
} from "@ant-design/x-sdk";
import { ApiError, assistantApi } from "../../api/client";
import type {
  AssistantCapabilityId,
  ChatMessage,
  ConversationScope,
  ConversationSummary,
  QueryContext,
  SendMessageRequest,
} from "../../api/contracts";
import {
  AssistantChatProvider,
  type AssistantChatInput,
  type AssistantXMessage,
} from "./AssistantChatProvider";

const NEW_CONVERSATION_PREFIX = "__new_conversation__";

function createNewConversationKey() {
  return `${NEW_CONVERSATION_PREFIX}:${crypto.randomUUID()}`;
}

function isNewConversationKey(key: string) {
  return key.startsWith(NEW_CONVERSATION_PREFIX);
}

type ConversationItem = ConversationSummary & {
  key: string;
  label: string;
  group: "今天" | "近 7 天" | "更早";
};

function groupConversation(updatedAt: string): ConversationItem["group"] {
  const now = new Date();
  const date = new Date(updatedAt);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor(
    (todayStart.getTime() - date.getTime()) / 86_400_000,
  );
  if (days <= 0) return "今天";
  if (days < 7) return "近 7 天";
  return "更早";
}

function toConversationItem(
  conversation: ConversationSummary,
): ConversationItem {
  return {
    ...conversation,
    key: conversation.id,
    label: conversation.title,
    group: groupConversation(conversation.updatedAt),
  };
}

function toXMessage(message: ChatMessage): AssistantXMessage {
  const { id: _id, status: _status, ...content } = message;
  return content;
}

type UseAssistantChatOptions = {
  scope?: ConversationScope;
  defaultContext?: QueryContext;
  restoreLatest?: boolean;
};

function matchesScope(
  conversation: ConversationSummary,
  scope?: ConversationScope,
) {
  if (!scope) return !conversation.scope;
  return (
    conversation.scope?.kind === scope.kind &&
    conversation.scope.studentId === scope.studentId
  );
}

function capabilityIdForQueryContext(
  context?: QueryContext,
): AssistantCapabilityId | undefined {
  if (!context) return undefined;
  const mapping: Record<QueryContext["kind"], AssistantCapabilityId> = {
    score: "studentLearning",
    order: "orderQuery",
    teacherFeedback: "teacherFeedback",
    parentReply: "parentReply",
    complaintRisk: "complaintRisk",
    renewal: "renewalDiagnosis",
  };
  return mapping[context.kind];
}

export function useAssistantChat({
  scope,
  defaultContext,
  restoreLatest = false,
}: UseAssistantChatOptions = {}) {
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState<string>();
  const restoreLatestRef = useRef(restoreLatest);
  const newConversationTargetRef = useRef<{
    draftKey: string;
    conversationId: string;
  } | undefined>(undefined);
  const providerCachesRef = useRef(
    new Map<string, AssistantChatProvider>(),
  );

  const {
    conversations,
    activeConversationKey,
    setActiveConversationKey,
    addConversation,
    setConversations,
  } = useXConversations({
    defaultConversations: [],
    defaultActiveConversationKey: createNewConversationKey(),
  });

  const refreshConversations = useCallback(async () => {
    const items = (await assistantApi.listConversations()).filter((item) =>
      matchesScope(item, scope),
    );
    setConversations(items.map(toConversationItem));
    if (restoreLatestRef.current) {
      restoreLatestRef.current = false;
      if (items[0]) setActiveConversationKey(items[0].id);
    }
  }, [scope, setActiveConversationKey, setConversations]);

  useEffect(() => {
    refreshConversations()
      .catch(() => setError("历史记录加载失败"))
      .finally(() => setHistoryLoading(false));
  }, [refreshConversations]);

  const providerFactory = useCallback(
    (conversationKey: string) => {
      const providers = providerCachesRef.current;
      if (!providers.has(conversationKey)) {
        providers.set(
          conversationKey,
          new AssistantChatProvider(
            assistantApi.messageEndpoint(conversationKey),
            {
              onSuccess: () => {
                void refreshConversations();
                const target = newConversationTargetRef.current;
                if (target?.draftKey === conversationKey) {
                  newConversationTargetRef.current = undefined;
                  setActiveConversationKey(target.conversationId);
                }
              },
              onError: () => void refreshConversations(),
            },
          ),
        );
      }
      return providers.get(conversationKey)!;
    },
    [refreshConversations, setActiveConversationKey],
  );

  const loadHistory = useCallback(
    async ({
      conversationKey,
    }: {
      conversationKey?: string;
    }): Promise<DefaultMessageInfo<AssistantXMessage>[]> => {
      if (!conversationKey || isNewConversationKey(conversationKey)) {
        return [];
      }
      const messages = await assistantApi.getMessages(conversationKey);
      return messages.map((message) => ({
        id: message.id,
        message: toXMessage(message),
        status: message.status === "stopped" ? "abort" : "success",
      }));
    },
    [],
  );

  const {
    messages,
    isRequesting,
    isDefaultMessagesRequesting,
    onRequest,
    abort,
    onReload,
    setMessage,
  } = useXChat<
    AssistantXMessage,
    AssistantXMessage,
    AssistantChatInput,
    SSEOutput
  >({
    provider: providerFactory(activeConversationKey),
    conversationKey: activeConversationKey,
    defaultMessages: loadHistory,
    requestPlaceholder: {
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    },
    requestFallback: (_request, { error: requestError, messageInfo }) => {
      const content =
        requestError.name === "AbortError"
          ? messageInfo?.message.content || "已停止生成。"
          : requestError instanceof ApiError && requestError.status === 403
            ? requestError.message
            : "回答生成失败，请重试";
      return {
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
      };
    },
  });

  const sendMessage = useCallback(
    async (text: string, context?: QueryContext) => {
      const normalizedText = text.trim();
      if (!normalizedText || isRequesting) return;

      setError(undefined);
      const requestContext = context ?? defaultContext;
      const request: SendMessageRequest = {
        text: normalizedText,
        context: requestContext,
        capabilityId: capabilityIdForQueryContext(requestContext),
      };

      if (!isNewConversationKey(activeConversationKey)) {
        onRequest(request);
        return;
      }

      try {
        const conversation = await assistantApi.createConversation(scope);
        const item = toConversationItem({
          ...conversation,
          title: normalizedText,
        });
        newConversationTargetRef.current = {
          draftKey: activeConversationKey,
          conversationId: conversation.id,
        };
        addConversation(item, "prepend");
        providerFactory(activeConversationKey).request.baseURL =
          assistantApi.messageEndpoint(conversation.id);
        onRequest(request);
      } catch {
        setError("新对话创建失败，请重试");
      }
    },
    [
      activeConversationKey,
      addConversation,
      defaultContext,
      isRequesting,
      onRequest,
      providerFactory,
      scope,
    ],
  );

  const openConversation = useCallback(
    (conversationId: string) => {
      if (isRequesting) abort();
      newConversationTargetRef.current = undefined;
      setError(undefined);
      setActiveConversationKey(conversationId);
    },
    [abort, isRequesting, setActiveConversationKey],
  );

  const startNewConversation = useCallback(() => {
    if (isRequesting) abort();
    newConversationTargetRef.current = undefined;
    setError(undefined);
    setActiveConversationKey(createNewConversationKey());
  }, [abort, isRequesting, setActiveConversationKey]);

  const stopGenerating = useCallback(() => {
    abort();
  }, [abort]);

  const retry = useCallback(
    (messageId: string | number) => {
      const messageIndex = messages.findIndex(({ id }) => id === messageId);
      const userMessage = messages
        .slice(0, messageIndex)
        .reverse()
        .find(({ message }) => message.role === "user");
      if (!userMessage) return;
      onReload(messageId, {
        text: userMessage.message.content,
        context: defaultContext,
        capabilityId: capabilityIdForQueryContext(defaultContext),
      });
    },
    [defaultContext, messages, onReload],
  );

  const setFeedback = useCallback(
    (messageId: string | number, feedback: "like" | "dislike" | "default") => {
      setMessage(messageId, (current) => ({
        extraInfo: { ...current.extraInfo, feedback },
      }));
    },
    [setMessage],
  );

  return {
    conversations: conversations as ConversationItem[],
    activeConversationId:
      isNewConversationKey(activeConversationKey)
        ? newConversationTargetRef.current?.conversationId
        : activeConversationKey,
    messages,
    loading: isRequesting,
    historyLoading: historyLoading || isDefaultMessagesRequesting,
    error,
    sendMessage,
    openConversation,
    startNewConversation,
    stopGenerating,
    retry,
    setFeedback,
  };
}
