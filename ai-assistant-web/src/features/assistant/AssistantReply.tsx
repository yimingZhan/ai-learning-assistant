import XMarkdown from "@ant-design/x-markdown";
import type { AssistantCard, Source } from "../../api/contracts";

type AssistantReplyProps = {
  content: string;
  card?: AssistantCard;
  sources?: Source[];
  streaming?: boolean;
};

function cardToMarkdown(card: AssistantCard): string[] {
  if (card.kind === "score") {
    return [
      card.conclusion,
      "",
      ...card.metrics.map(
        (metric) =>
          `- **${metric.label}：** ${metric.value}${metric.note ? `（${metric.note}）` : ""}`,
      ),
    ];
  }

  if (card.kind === "order") {
    return [
      "**有效订单**",
      "",
      ...card.orders.map(
        (order) =>
          `- **${order.product}：** 已用 ${order.usedHours} 课时，剩余 ${order.remainingHours} 课时（${order.status}）`,
      ),
    ];
  }

  if (card.kind === "teacherFeedback") {
    return [
      card.conclusion,
      "",
      ...card.points.map((point) => `- ${point}`),
    ];
  }

  if (card.kind === "parentReply") {
    return ["**回复建议**", "", card.draft];
  }

  return [
    "**数据不足**",
    "",
    card.message,
    ...(card.missing.length ? ["", `缺少：${card.missing.join("、")}`] : []),
  ];
}

export function formatAssistantReply({
  content,
  card,
  sources,
}: Omit<AssistantReplyProps, "streaming">) {
  const sections: string[] = [];
  if (content) sections.push(content);
  if (card) sections.push(...cardToMarkdown(card));
  if (sources?.length) {
    sections.push(
      "",
      `> 依据：${sources.map((source) => source.label).join("、")}`,
    );
  }
  return sections.join("\n");
}

export function AssistantReply({
  content,
  card,
  sources,
  streaming = false,
}: AssistantReplyProps) {
  return (
    <XMarkdown
      content={formatAssistantReply({ content, card, sources })}
      streaming={{ hasNextChunk: streaming }}
    />
  );
}
