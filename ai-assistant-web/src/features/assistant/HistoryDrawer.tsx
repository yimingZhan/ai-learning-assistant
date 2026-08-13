import { Conversations } from "@ant-design/x";
import { Drawer, Empty, Flex, Spin } from "antd";
import type { ConversationSummary } from "../../api/contracts";

type HistoryDrawerProps = {
  open: boolean;
  loading: boolean;
  conversations: ConversationSummary[];
  activeConversationId?: string;
  onClose: () => void;
  onSelect: (conversationId: string) => void;
};

type GroupName = "今天" | "近 7 天" | "更早";

function groupConversation(updatedAt: string): GroupName {
  const now = new Date();
  const date = new Date(updatedAt);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const days = Math.floor((todayStart.getTime() - date.getTime()) / 86_400_000);
  if (days <= 0) return "今天";
  if (days < 7) return "近 7 天";
  return "更早";
}

export function HistoryDrawer({
  open,
  loading,
  conversations,
  activeConversationId,
  onClose,
  onSelect,
}: HistoryDrawerProps) {
  const items = conversations.map((conversation) => ({
    key: conversation.id,
    label: conversation.title,
    group: groupConversation(conversation.updatedAt),
  }));

  return (
    <Drawer title="历史记录" open={open} onClose={onClose}>
      {loading ? (
        <Flex justify="center">
          <Spin size="small" />
        </Flex>
      ) : conversations.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无历史记录" />
      ) : (
        <Conversations
          groupable
          activeKey={activeConversationId}
          items={items}
          onActiveChange={(conversationId) => onSelect(conversationId)}
        />
      )}
    </Drawer>
  );
}
