import {
  AppstoreAddOutlined,
  CommentOutlined,
  PlusOutlined,
  ProductOutlined,
  ReloadOutlined,
  ScheduleOutlined,
} from "@ant-design/icons";
import {
  Actions,
  Bubble,
  Conversations,
  Prompts,
  Sender,
  Welcome,
  XProvider,
} from "@ant-design/x";
import type { BubbleListRef } from "@ant-design/x/es/bubble";
import type { SenderRef } from "@ant-design/x/es/sender";
import xZhCN from "@ant-design/x/locale/zh_CN";
import { Alert, Button, Flex, Popover, Space, Spin, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import type { QueryContext } from "../../api/contracts";
import { useOptionalGlobalToolbar } from "../globalToolbar/GlobalToolbarProvider";
import { AssistantReply, formatAssistantReply } from "./AssistantReply";
import { useAssistantPageStyles } from "./AssistantPage.styles";
import { QuickQueryModal } from "./QuickQueryModal";
import type { QuickAction } from "./query";
import { useAssistantChat } from "./useAssistantChat";
import { useAssistantRuntime } from "./useAssistantRuntime";

type FeedbackValue = "like" | "dislike" | "default";

const fallbackPromptItems = [
  { key: "study", description: "查询李明近 30 天的学习情况" },
  { key: "orders", description: "查看李明的订单与续费建议" },
  { key: "feedback", description: "汇总老师反馈并生成家长回复建议" },
];

function getFeedback(value: unknown): FeedbackValue {
  return value === "like" || value === "dislike" ? value : "default";
}

export function AssistantPage() {
  const { styles } = useAssistantPageStyles();
  const toolbar = useOptionalGlobalToolbar();
  const registerAssistantSurface = toolbar?.registerAssistantSurface;
  const unregisterAssistantSurface = toolbar?.unregisterAssistantSurface;
  const assistantFocusRequest = toolbar?.assistantFocusRequest;
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAction, setQuickAction] = useState<QuickAction>();
  const listRef = useRef<BubbleListRef>(null);
  const senderRef = useRef<SenderRef>(null);
  const chat = useAssistantChat();
  const assistantRuntime = useAssistantRuntime();
  const promptItems = useMemo(
    () =>
      assistantRuntime.runtime?.capabilities
        .flatMap((capability) => capability.recommendedPrompts)
        .slice(0, 3) ?? fallbackPromptItems,
    [assistantRuntime.runtime],
  );
  const capabilityIds = useMemo(
    () =>
      new Set(
        assistantRuntime.runtime?.capabilities.map((capability) =>
          capability.id,
        ) ?? [],
      ),
    [assistantRuntime.runtime],
  );

  useEffect(() => {
    registerAssistantSurface?.("embedded");
    return () => unregisterAssistantSurface?.("embedded");
  }, [registerAssistantSurface, unregisterAssistantSurface]);

  useEffect(() => {
    if (assistantFocusRequest) senderRef.current?.focus();
  }, [assistantFocusRequest]);

  const bubbleItems = useMemo(
    () =>
      chat.messages.map(({ id, message, status, extraInfo }) => {
        const streaming = status === "loading" || status === "updating";
        const replyText = formatAssistantReply(message);

        return {
          key: id,
          role: message.role,
          content:
            message.role === "assistant" ? (
              <AssistantReply {...message} streaming={streaming} />
            ) : (
              message.content
            ),
          loading: status === "loading" && !message.content,
          status,
          footer:
            message.role === "assistant" && !streaming ? (
              <Actions
                items={[
                  {
                    key: "retry",
                    label: "重试",
                    icon: <ReloadOutlined />,
                    onItemClick: () => chat.retry(id),
                  },
                  {
                    key: "copy",
                    actionRender: <Actions.Copy text={replyText} />,
                  },
                  {
                    key: "feedback",
                    actionRender: (
                      <Actions.Feedback
                        value={getFeedback(extraInfo?.feedback)}
                        onChange={(feedback) => chat.setFeedback(id, feedback)}
                      />
                    ),
                  },
                ]}
              />
            ) : null,
        };
      }),
    [chat],
  );

  async function submit(text: string, context?: QueryContext) {
    const normalizedText = text.trim();
    if (!normalizedText) return;
    setDraft("");
    await chat.sendMessage(normalizedText, context);
    listRef.current?.scrollTo({ top: "bottom", behavior: "smooth" });
  }

  return (
    <XProvider locale={xZhCN}>
      <section className={styles.root} aria-label="AI 助手对话">
        <header className={styles.chatHeader}>
          <div className={styles.headerTitle}>
            ✨ {assistantRuntime.runtime?.basic.name ?? "AI 助手"}
          </div>
          <Space size={0}>
            <Button
              type="text"
              aria-label="新对话"
              icon={<PlusOutlined />}
              className={styles.headerButton}
              onClick={() => void chat.startNewConversation()}
            />
            {assistantRuntime.runtime?.basic.historyEnabled !== false ? <Popover
              placement="bottomRight"
              open={historyOpen}
              onOpenChange={setHistoryOpen}
              styles={{ container: { padding: 0 } }}
              content={
                <Spin spinning={chat.historyLoading} size="small">
                  <Conversations
                    className={styles.conversations}
                    items={chat.conversations}
                    activeKey={chat.activeConversationId}
                    onActiveChange={(key) => {
                      void chat.openConversation(key);
                      setHistoryOpen(false);
                    }}
                    groupable
                  />
                </Spin>
              }
            >
              <Button
                type="text"
                aria-label="打开历史会话"
                icon={<CommentOutlined />}
                className={styles.headerButton}
              />
            </Popover> : null}
          </Space>
        </header>

        <div className={styles.chatBody} aria-live="polite">
          <div className={styles.content}>
            {chat.messages.length ? (
              <Bubble.List
                ref={listRef}
                className={styles.messageList}
                items={bubbleItems}
                autoScroll
                role={{
                  user: { placement: "end" },
                  assistant: { placement: "start" },
                }}
              />
            ) : (
              <div className={styles.emptyState}>
                <Welcome
                  variant="borderless"
                  title={assistantRuntime.runtime?.basic.welcomeMessage ?? "👋 你好，我是 AI 学情助手"}
                  description={assistantRuntime.runtime?.basic.description ?? "查询学生学习情况、订单与老师反馈，或生成家长回复建议。"}
                  className={styles.chatWelcome}
                />
                <Prompts
                  vertical
                  title="我可以帮你："
                  items={promptItems}
                  onItemClick={({ data }) =>
                    void submit(data.description as string)
                  }
                />
              </div>
            )}
          </div>
        </div>

        <div className={styles.chatSend}>
          <div className={styles.content}>
            <Flex className={styles.quickActions} gap="small" wrap>
              {!assistantRuntime.runtime || capabilityIds.has("studentLearning") ? <Button
                icon={<ScheduleOutlined />}
                onClick={() => setQuickAction("score")}
              >
                学习情况
              </Button> : null}
              {!assistantRuntime.runtime || capabilityIds.has("orderQuery") ? <Button
                icon={<ProductOutlined />}
                onClick={() => setQuickAction("order")}
              >
                订单续费
              </Button> : null}
              {!assistantRuntime.runtime || capabilityIds.has("teacherFeedback") ? <Button
                icon={<AppstoreAddOutlined />}
                onClick={() => setQuickAction("teacherFeedback")}
              >
                反馈建议
              </Button> : null}
            </Flex>
            {assistantRuntime.error ? (
              <Alert
                className={styles.alert}
                type="warning"
                showIcon
                title={assistantRuntime.error}
              />
            ) : null}
            {chat.error ? (
              <Alert
                className={styles.alert}
                type="error"
                showIcon
                title={chat.error}
              />
            ) : null}
            {assistantRuntime.runtime?.basic.disclaimer ? (
              <Typography.Text type="secondary">
                {assistantRuntime.runtime.basic.disclaimer}
              </Typography.Text>
            ) : null}
            <Sender
              ref={senderRef}
              value={draft}
              loading={chat.loading}
              placeholder="输入你想了解的问题"
              submitType="enter"
              onChange={setDraft}
              onSubmit={(value) => void submit(value)}
              onCancel={chat.stopGenerating}
            />
          </div>
        </div>

        <QuickQueryModal
          action={quickAction}
          open={Boolean(quickAction)}
          onClose={() => setQuickAction(undefined)}
          onSubmit={(text, context) => {
            setQuickAction(undefined);
            void submit(text, context);
          }}
        />
      </section>
    </XProvider>
  );
}
