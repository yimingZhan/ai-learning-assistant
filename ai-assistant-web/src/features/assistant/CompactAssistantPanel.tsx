import {
  CloseOutlined,
  CommentOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import {
  Actions,
  Bubble,
  Conversations,
  Sender,
  XProvider,
} from "@ant-design/x";
import type { BubbleListRef } from "@ant-design/x/es/bubble";
import type { SenderRef } from "@ant-design/x/es/sender";
import xZhCN from "@ant-design/x/locale/zh_CN";
import { Alert, Button, Popover, Space, Spin, Typography } from "antd";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ConversationScope, QueryContext } from "../../api/contracts";
import { AssistantReply, formatAssistantReply } from "./AssistantReply";
import { useAssistantChat } from "./useAssistantChat";
import { useCompactAssistantPanelStyles } from "./CompactAssistantPanel.styles";

type FeedbackValue = "like" | "dislike" | "default";

export type CompactAssistantPrompt = {
  key: string;
  description: string;
  disabled?: boolean;
};

type CompactAssistantPanelProps = {
  ariaLabel: string;
  title?: string;
  contextLabel?: string;
  prompts: CompactAssistantPrompt[];
  scope?: ConversationScope;
  defaultContext?: QueryContext;
  restoreLatest?: boolean;
  historyEnabled?: boolean;
  focusRequest?: number;
  emptyIntro?: ReactNode;
  placeholder?: string;
  onClose?: () => void;
};

function getFeedback(value: unknown): FeedbackValue {
  return value === "like" || value === "dislike" ? value : "default";
}

export function CompactAssistantPanel({
  ariaLabel,
  title = "AI 助手",
  contextLabel,
  prompts,
  scope,
  defaultContext,
  restoreLatest = true,
  historyEnabled = true,
  focusRequest = 0,
  emptyIntro,
  placeholder = "输入问题",
  onClose,
}: CompactAssistantPanelProps) {
  const { styles } = useCompactAssistantPanelStyles();
  const [draft, setDraft] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const listRef = useRef<BubbleListRef>(null);
  const senderRef = useRef<SenderRef>(null);
  const chat = useAssistantChat({ scope, defaultContext, restoreLatest });
  const loadingRef = useRef(chat.loading);

  useEffect(() => {
    loadingRef.current = chat.loading;
  }, [chat.loading]);

  useEffect(
    () => () => {
      if (loadingRef.current) chat.stopGenerating();
    },
    [chat.stopGenerating],
  );

  useEffect(() => {
    if (focusRequest > 0) senderRef.current?.focus();
  }, [focusRequest]);

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

  async function submit(text: string) {
    const normalizedText = text.trim();
    if (!normalizedText) return;
    setDraft("");
    await chat.sendMessage(normalizedText);
    listRef.current?.scrollTo({ top: "bottom", behavior: "smooth" });
  }

  return (
    <XProvider locale={xZhCN}>
      <section className={styles.root} aria-label={ariaLabel}>
        <header className={styles.header}>
          <span className={styles.title}>{title}</span>
          <Space size={0}>
            <Button
              type="text"
              aria-label="新对话"
              icon={<PlusOutlined />}
              className={styles.headerButton}
              onClick={() => void chat.startNewConversation()}
            />
            {historyEnabled ? <Popover
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
            {onClose ? (
              <Button
                type="text"
                aria-label="关闭 AI 助手"
                icon={<CloseOutlined />}
                className={styles.headerButton}
                onClick={onClose}
              />
            ) : null}
          </Space>
        </header>

        <div className={styles.messageArea} aria-live="polite">
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
              {emptyIntro}
              <div className={styles.prompts} aria-label="快捷提问">
                {prompts.map((prompt) => (
                  <Button
                    key={prompt.key}
                    className={styles.promptButton}
                    disabled={prompt.disabled}
                    onClick={() => void submit(prompt.description)}
                  >
                    {prompt.description}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className={styles.senderArea}>
          {chat.error ? <Alert type="error" showIcon title={chat.error} /> : null}
          {contextLabel ? (
            <Typography.Text
              type="secondary"
              className={styles.context}
              ellipsis={{ tooltip: contextLabel }}
            >
              {contextLabel}
            </Typography.Text>
          ) : null}
          <Sender
            ref={senderRef}
            value={draft}
            loading={chat.loading}
            placeholder={placeholder}
            submitType="enter"
            onChange={setDraft}
            onSubmit={(value) => void submit(value)}
            onCancel={chat.stopGenerating}
          />
        </div>
      </section>
    </XProvider>
  );
}
