import { QuestionCircleOutlined } from "@ant-design/icons";
import { Button, Dropdown, Input, Modal, Space, Typography, message } from "antd";
import { useState, type ReactNode } from "react";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";

type HelpTopic = "guide" | "metrics" | "ai" | "feedback";

const topicTitles: Record<HelpTopic, string> = {
  guide: "使用指南",
  metrics: "指标口径",
  ai: "AI 判断说明",
  feedback: "问题反馈",
};

function TopicContent({ topic }: { topic: HelpTopic }) {
  const { styles } = useGlobalToolbarStyles();
  const [feedback, setFeedback] = useState("");

  if (topic === "guide") {
    return (
      <div className={styles.helpContent}>
        通过左侧导航切换业务模块；页面内筛选只影响当前列表；“问 AI”会自动携带当前页面和已选学生信息。
      </div>
    );
  }

  if (topic === "metrics") {
    return (
      <div className={styles.helpContent}>
        客诉风险综合近期沟通、学习效果与服务响应判断；续费机会综合学习进展、课消、客户意向和产品匹配度判断。页面中的原始证据与更新时间优先于 AI 摘要。
      </div>
    );
  }

  if (topic === "ai") {
    return (
      <div className={styles.helpContent}>
        AI 只提供信息汇总、风险提示和行动建议，不替代业务判断。对外沟通、客诉定性和产品推荐都需要负责人核对原始证据后确认。
      </div>
    );
  }

  async function copyFeedback() {
    const content = [
      "唯寻 AI 问题反馈",
      `页面：${window.location.href}`,
      `问题：${feedback.trim() || "请补充问题描述"}`,
    ].join("\n");
    await navigator.clipboard.writeText(content);
    message.success("反馈内容已复制");
  }

  return (
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      <Typography.Text type="secondary">
        描述你遇到的问题，复制后发送到内部产品反馈渠道。
      </Typography.Text>
      <Input.TextArea
        aria-label="反馈内容"
        value={feedback}
        onChange={(event) => setFeedback(event.target.value)}
        autoSize={{ minRows: 4, maxRows: 8 }}
        placeholder="请描述操作步骤、预期结果和实际结果"
      />
      <Button type="primary" onClick={() => void copyFeedback()}>
        复制反馈内容
      </Button>
    </Space>
  );
}

export const helpMenuItems = (
  onSelect: (topic: HelpTopic) => void,
) => [
  { key: "guide", label: "使用指南", onClick: () => onSelect("guide") },
  { key: "metrics", label: "指标口径", onClick: () => onSelect("metrics") },
  { key: "ai", label: "AI 判断说明", onClick: () => onSelect("ai") },
  { type: "divider" as const },
  {
    key: "feedback",
    label: "问题反馈",
    onClick: () => onSelect("feedback"),
  },
];

export function HelpMenu({
  trigger,
  className,
}: {
  trigger?: ReactNode;
  className?: string;
}) {
  const { styles } = useGlobalToolbarStyles();
  const [topic, setTopic] = useState<HelpTopic>();

  return (
    <>
      <Dropdown trigger={["click"]} menu={{ items: helpMenuItems(setTopic) }}>
        {trigger ?? (
          <Button
            type="text"
            aria-label="帮助"
            className={`${styles.actionButton} ${className ?? ""}`}
            icon={<QuestionCircleOutlined />}
          >
            <span className={styles.actionLabel}>帮助</span>
          </Button>
        )}
      </Dropdown>
      <Modal
        title={topic ? topicTitles[topic] : undefined}
        open={Boolean(topic)}
        onCancel={() => setTopic(undefined)}
        footer={null}
        destroyOnHidden
      >
        {topic ? <TopicContent topic={topic} /> : null}
      </Modal>
    </>
  );
}
