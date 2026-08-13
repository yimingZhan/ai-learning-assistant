import { Button, Flex } from "antd";
import type { QuickAction } from "./query";
import { quickActionLabels } from "./query";

const actions: QuickAction[] = [
  "score",
  "order",
  "teacherFeedback",
  "parentReply",
];

type QuickActionBarProps = {
  disabled?: boolean;
  onSelect: (action: QuickAction) => void;
};

export function QuickActionBar({ disabled, onSelect }: QuickActionBarProps) {
  return (
    <Flex role="group" aria-label="快捷查询" gap="small" wrap>
      {actions.map((action) => (
        <Button
          key={action}
          disabled={disabled}
          onClick={() => onSelect(action)}
        >
          {quickActionLabels[action]}
        </Button>
      ))}
    </Flex>
  );
}
