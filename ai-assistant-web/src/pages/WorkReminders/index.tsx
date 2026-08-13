import { history } from "@umijs/max";
import { PageContainer } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Space,
  Spin,
  Tag,
  theme,
  Typography,
} from "antd";
import type { WorkReminder } from "../../api/contracts";
import { useGlobalToolbar } from "../../features/globalToolbar/GlobalToolbarProvider";

const typeLabels: Record<WorkReminder["type"], string> = {
  complaintRisk: "客诉",
  renewal: "续费",
  assignment: "任务",
};

const priorityColors: Record<WorkReminder["priority"], string> = {
  high: "error",
  medium: "warning",
  normal: "default",
};

export default function WorkRemindersPage() {
  const { token } = theme.useToken();
  const {
    reminders,
    remindersLoading,
    remindersError,
    reloadReminders,
    markReminderRead,
  } = useGlobalToolbar();

  async function openReminder(reminder: WorkReminder) {
    if (!reminder.read) await markReminderRead(reminder.id);
    history.push(reminder.targetPath);
  }

  return (
    <PageContainer title={false}>
      <Card
        title={
          <Space>
            <Typography.Title level={4} style={{ margin: 0 }}>
              工作提醒
            </Typography.Title>
            <Typography.Text type="secondary">
              {reminders?.unreadCount ?? 0} 条未读
            </Typography.Text>
          </Space>
        }
        styles={{ body: { paddingBlock: 0 } }}
      >
        {remindersLoading ? (
          <Flex justify="center" style={{ paddingBlock: 48 }}>
            <Spin size="small" aria-label="正在加载工作提醒" />
          </Flex>
        ) : remindersError ? (
          <Alert
            type="error"
            showIcon
            title={remindersError}
            style={{ marginBlock: 24 }}
            action={
              <Button size="small" onClick={() => void reloadReminders()}>
                重试
              </Button>
            }
          />
        ) : reminders?.items.length ? (
          <Flex vertical>
            {reminders.items.map((reminder) => (
              <Flex
                key={reminder.id}
                align="center"
                justify="space-between"
                gap={16}
                style={{
                  minWidth: 0,
                  paddingBlock: 16,
                  borderBottom: `1px solid ${token.colorBorderSecondary}`,
                }}
              >
                <Flex vertical gap={4} style={{ minWidth: 0 }}>
                  <Space wrap>
                    <Typography.Text strong={!reminder.read}>
                      {reminder.title}
                    </Typography.Text>
                    <Tag color={priorityColors[reminder.priority]}>
                      {typeLabels[reminder.type]}
                    </Tag>
                  </Space>
                  <Typography.Text type="secondary">
                    {reminder.description}
                  </Typography.Text>
                </Flex>
                <Button
                  type="link"
                  onClick={() => void openReminder(reminder)}
                >
                  查看
                </Button>
              </Flex>
            ))}
          </Flex>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="暂无工作提醒"
            style={{ paddingBlock: 48 }}
          />
        )}
      </Card>
    </PageContainer>
  );
}
