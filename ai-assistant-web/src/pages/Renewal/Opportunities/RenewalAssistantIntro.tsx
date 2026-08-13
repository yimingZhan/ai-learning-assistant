import {
  CheckCircleOutlined,
  FormOutlined,
  MessageOutlined,
} from "@ant-design/icons";
import { Button, Flex, Typography } from "antd";
import type {
  RenewalAssistantFocus,
  RenewalStudentDiagnosis,
} from "../../../api/contracts";
import { useRenewalWorkbenchStyles } from "./index.styles";

export function RenewalAssistantIntro({
  diagnosis,
  onFocus,
}: {
  diagnosis: RenewalStudentDiagnosis;
  onFocus: (focus: RenewalAssistantFocus) => void;
}) {
  const { styles } = useRenewalWorkbenchStyles();
  const priorityCondition = diagnosis.conditions.find((condition) =>
    ["missing", "in_progress_at_risk"].includes(condition.status),
  );
  const firstProduct = diagnosis.topRecommendations[0];

  return (
    <section className={styles.assistantIntro} aria-labelledby="renewal-assistant-brief-title">
      <Typography.Text
        id="renewal-assistant-brief-title"
        strong
        className={styles.assistantIntroTitle}
      >
        本次建议
      </Typography.Text>

      <Flex vertical>
        {priorityCondition ? (
          <Button
            type="text"
            className={styles.assistantAction}
            icon={<CheckCircleOutlined />}
            onClick={() =>
              onFocus({
                type: "condition",
                id: priorityCondition.conditionId,
                label: priorityCondition.conditionName,
              })
            }
          >
            优先处理：{priorityCondition.conditionName}
          </Button>
        ) : (
          <Typography.Text>当前没有需要优先处理的条件。</Typography.Text>
        )}

        {firstProduct ? (
          <Button
            type="text"
            className={styles.assistantAction}
            icon={<MessageOutlined />}
            onClick={() =>
              onFocus({
                type: "product",
                id: firstProduct.productId,
                label: firstProduct.productName,
              })
            }
          >
            沟通重点：说明 {firstProduct.productName} 与当前缺口的关系
          </Button>
        ) : null}

        {diagnosis.missingFields.length ? (
          <Button
            type="text"
            className={styles.assistantAction}
            icon={<FormOutlined />}
            onClick={() => {
              const pendingCondition = diagnosis.conditions.find((condition) =>
                ["data_pending", "applicability_pending"].includes(condition.status),
              );
              if (pendingCondition) {
                onFocus({
                  type: "condition",
                  id: pendingCondition.conditionId,
                  label: pendingCondition.conditionName,
                });
              }
            }}
          >
            执行前补齐：{diagnosis.missingFields.join("、")}
          </Button>
        ) : null}
      </Flex>

      <Typography.Text type="secondary" className={styles.assistantSource}>
        依据：规则判断、学生原始证据 · {diagnosis.student.diagnosedAt}
      </Typography.Text>
    </section>
  );
}
