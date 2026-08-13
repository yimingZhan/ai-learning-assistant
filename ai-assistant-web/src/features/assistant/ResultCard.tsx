import { useState } from "react";
import { CheckOutlined, CopyOutlined } from "@ant-design/icons";
import { ProCard } from "@ant-design/pro-components";
import {
  Button,
  Collapse,
  Descriptions,
  Flex,
  Input,
  Tag,
  Typography,
} from "antd";
import type { AssistantCard, Source } from "../../api/contracts";

type ResultCardProps = {
  card: AssistantCard;
  sources?: Source[];
};

function Sources({ sources }: { sources?: Source[] }) {
  if (!sources?.length) return null;
  return (
    <Collapse
      items={[
        {
          key: "sources",
          label: "查看依据",
          children: (
            <Descriptions
              size="small"
              column={1}
              items={sources.map((source) => ({
                key: source.id,
                children: source.label,
              }))}
            />
          ),
        },
      ]}
    />
  );
}

function ReplyDraft({ draft, sources }: { draft: string; sources?: Source[] }) {
  const [value, setValue] = useState(draft);
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <ProCard title="回复草稿">
      <Flex vertical gap="small">
        <Input.TextArea
          aria-label="回复草稿"
          value={value}
          autoSize={{ minRows: 5, maxRows: 10 }}
          onChange={(event) => setValue(event.target.value)}
        />
        <Flex align="center" justify="space-between">
          <Typography.Text type="secondary">请核对后使用</Typography.Text>
          <Button
            aria-label={copied ? "已复制" : "复制"}
            icon={copied ? <CheckOutlined /> : <CopyOutlined />}
            onClick={() => void copy()}
          >
            {copied ? "已复制" : "复制"}
          </Button>
        </Flex>
        <Sources sources={sources} />
      </Flex>
    </ProCard>
  );
}

export function ResultCard({ card, sources }: ResultCardProps) {
  if (card.kind === "parentReply") {
    return <ReplyDraft draft={card.draft} sources={sources} />;
  }

  if (card.kind === "score") {
    return (
      <ProCard title="学习情况">
        <Flex vertical gap="middle">
          <Typography.Paragraph>{card.conclusion}</Typography.Paragraph>
          <Descriptions
            column={1}
            items={card.metrics.map((metric) => ({
              key: metric.label,
              label: metric.label,
              children: (
                <Flex gap="small" wrap>
                  <Typography.Text strong>{metric.value}</Typography.Text>
                  {metric.note && (
                    <Typography.Text type="secondary">
                      {metric.note}
                    </Typography.Text>
                  )}
                </Flex>
              ),
            }))}
          />
          <Sources sources={sources} />
        </Flex>
      </ProCard>
    );
  }

  if (card.kind === "order") {
    return (
      <ProCard title="有效订单">
        <Flex vertical gap="middle">
          <Descriptions
            column={1}
            items={card.orders.map((order) => ({
              key: order.product,
              label: order.product,
              children: (
                <Flex gap="small" wrap>
                  <Typography.Text>
                    已用 {order.usedHours} 课时 · 剩余 {order.remainingHours} 课时
                  </Typography.Text>
                  <Tag>{order.status}</Tag>
                </Flex>
              ),
            }))}
          />
          <Sources sources={sources} />
        </Flex>
      </ProCard>
    );
  }

  if (card.kind === "empty") {
    return (
      <ProCard title="数据不足">
        <Flex vertical gap="small">
          <Typography.Text>{card.message}</Typography.Text>
          {card.missing.length > 0 && (
            <Typography.Text>
              缺少：{card.missing.join("、")}
            </Typography.Text>
          )}
          <Sources sources={sources} />
        </Flex>
      </ProCard>
    );
  }

  return (
    <ProCard title="老师反馈">
      <Flex vertical gap="middle">
        <Typography.Paragraph>{card.conclusion}</Typography.Paragraph>
        <Flex vertical gap="small">
          {card.points.map((point) => (
            <Typography.Text key={point}>• {point}</Typography.Text>
          ))}
        </Flex>
        <Sources sources={sources} />
      </Flex>
    </ProCard>
  );
}
