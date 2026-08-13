import {
  AbstractChatProvider,
  XRequest,
  type SSEOutput,
  type TransformMessage,
  type XRequestOptions,
} from "@ant-design/x-sdk";
import { ApiError } from "../../api/client";
import type {
  AssistantStreamEvent,
  ChatMessage,
  SendMessageRequest,
} from "../../api/contracts";

export type AssistantXMessage = Omit<ChatMessage, "id" | "status">;
export type AssistantChatInput = SendMessageRequest;

type ProviderCallbacks = {
  onSuccess: () => void;
  onError: () => void;
};

async function requestWithApiError(
  input: Parameters<typeof fetch>[0],
  init?: RequestInit,
) {
  const response = await fetch(input, init);
  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => undefined)) as { message?: string } | undefined;
    throw new ApiError(
      body?.message ?? "回答生成失败，请稍后重试",
      response.status,
    );
  }
  return response;
}

function emptyAssistantMessage(): AssistantXMessage {
  return {
    role: "assistant",
    content: "",
    createdAt: new Date().toISOString(),
  };
}

export class AssistantChatProvider extends AbstractChatProvider<
  AssistantXMessage,
  AssistantChatInput,
  SSEOutput
> {
  constructor(endpoint: string, callbacks: ProviderCallbacks) {
    super({
      request: XRequest<AssistantChatInput, SSEOutput, AssistantXMessage>(
        endpoint,
        {
          manual: true,
          fetch: requestWithApiError,
          callbacks: {
            onSuccess: callbacks.onSuccess,
            onError: callbacks.onError,
          },
        },
      ),
    });
  }

  transformParams(
    requestParams: Partial<AssistantChatInput>,
    options: XRequestOptions<
      AssistantChatInput,
      SSEOutput,
      AssistantXMessage
    >,
  ): AssistantChatInput {
    return {
      ...options.params,
      ...requestParams,
    } as AssistantChatInput;
  }

  transformLocalMessage(
    requestParams: Partial<AssistantChatInput>,
  ): AssistantXMessage {
    return {
      role: "user",
      content: requestParams.text?.trim() ?? "",
      createdAt: new Date().toISOString(),
    };
  }

  transformMessage({
    originMessage,
    chunk,
  }: TransformMessage<AssistantXMessage, SSEOutput>): AssistantXMessage {
    const current = originMessage ?? emptyAssistantMessage();
    if (!chunk?.data) return current;

    const event = JSON.parse(String(chunk.data)) as AssistantStreamEvent;
    switch (event.type) {
      case "delta":
        return { ...current, content: current.content + event.value };
      case "card":
        return { ...current, card: event.card };
      case "sources":
        return { ...current, sources: event.sources };
      case "done":
        return current;
    }
  }
}
