import { BellOutlined, ReloadOutlined } from "@ant-design/icons";
import { history } from "@umijs/max";
import { Alert, Badge, Button, Empty, Popover, Spin, Tag, Typography } from "antd";
import { useState } from "react";
import type { WorkReminder } from "../../api/contracts";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";
import { useGlobalToolbar } from "./GlobalToolbarProvider";

const reminderTypeLabels: Record<WorkReminder["type"], string> = {
  complaintRisk: "客诉",
  renewal: "续费",
  assignment: "任务",
};

const reminderTypeColors: Record<WorkReminder["priority"], string> = {
  high: "error",
  medium: "warning",
  normal: "default",
};

function formatReminderTime(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function WorkReminderPopover() {
  const { styles } = useGlobalToolbarStyles();
  const {
    reminders,
    remindersLoading,
    remindersError,
    reloadReminders,
    markReminderRead,
  } = useGlobalToolbar();
  const [open, setOpen] = useState(false);

  async function openReminder(reminder: WorkReminder) {
    if (!reminder.read) {
      await markReminderRead(reminder.id);
    }
    setOpen(false);
    history.push(reminder.targetPath);
  }

  const content = (
    <div className={styles.reminderPopover}>
      <div className={styles.reminderHeader}>
        <Typography.Text strong>工作提醒</Typography.Text>
        <Typography.Text type="secondary">
          {reminders?.unreadCount ?? 0} 条未读
        </Typography.Text>
      </div>
      <div className={styles.reminderBody}>
        {remindersLoading ? (
          <div className={styles.reminderState}>
            <Spin size="small" aria-label="正在加载工作提醒" />
          </div>
        ) : remindersError ? (
          <div className={styles.reminderState}>
            <Alert
              type="error"
              showIcon
              title={remindersError}
              action={
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={() => void reloadReminders()}
                >
                  重试
                </Button>
              }
            />
          </div>
        ) : reminders?.items.length ? (
          reminders.items.map((reminder) => (
            <button
              type="button"
              className={styles.reminderItem}
              key={reminder.id}
              onClick={() => void openReminder(reminder)}
            >
              <span className={styles.reminderTitle}>
                <Badge status={reminder.read ? "default" : "processing"} />
                <span className={styles.reminderTitleText}>{reminder.title}</span>
                <Tag color={reminderTypeColors[reminder.priority]}>
                  {reminderTypeLabels[reminder.type]}
                </Tag>
              </span>
              <span className={styles.reminderDescription}>
                {reminder.description}
              </span>
              <span className={styles.reminderMeta}>
                {formatReminderTime(reminder.createdAt)}
              </span>
            </button>
          ))
        ) : (
          <div className={styles.reminderState}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无工作提醒" />
          </div>
        )}
      </div>
      <div className={styles.reminderFooter}>
        <Button
          type="link"
          onClick={() => {
            setOpen(false);
            history.push("/work-reminders");
          }}
        >
          查看全部
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      open={open}
      onOpenChange={setOpen}
      content={content}
      styles={{ container: { padding: 0 } }}
    >
      <Badge count={reminders?.unreadCount} size="small" offset={[-4, 4]}>
        <Button
          type="text"
          aria-label="工作提醒"
          className={styles.actionButton}
          icon={<BellOutlined />}
        >
          <span className={styles.actionLabel}>工作提醒</span>
        </Button>
      </Badge>
    </Popover>
  );
}
