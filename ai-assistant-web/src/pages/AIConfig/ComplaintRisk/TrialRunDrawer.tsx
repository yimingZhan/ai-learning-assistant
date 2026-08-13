import { ExperimentOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Progress,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { aiConfigApi } from "../../../api/client";
import type {
  ComplaintRiskConfig,
  ComplaintRiskTrialInput,
  ComplaintRiskTrialResult,
} from "../../../api/contracts";
import { riskLevelMeta } from "./meta";

type TrialFormValues = {
  mode: "text";
  text?: string;
};

type TrialRunDrawerProps = {
  open: boolean;
  config: ComplaintRiskConfig | null;
  onClose: () => void;
};

export function TrialRunDrawer({ open, config, onClose }: TrialRunDrawerProps) {
  const [form] = Form.useForm<TrialFormValues>();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComplaintRiskTrialResult | null>(null);

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({ mode: "text", text: undefined });
    setResult(null);
  }, [form, open]);

  async function runTrial(values: TrialFormValues) {
    if (!config) return;
    const input: ComplaintRiskTrialInput = {
      mode: "text",
      text: values.text!.trim(),
    };
    setLoading(true);
    try {
      setResult(await aiConfigApi.trialComplaintRisk(config, input));
    } catch {
      message.error("试跑失败，当前配置和输入内容已保留");
    } finally {
      setLoading(false);
    }
  }

  const levelMeta = result?.riskLevel
    ? riskLevelMeta[result.riskLevel]
    : undefined;

  return (
    <Drawer
      title="配置试跑"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
    >
      <Alert
        showIcon
        type="info"
        title="试跑使用当前页面中的 Prompt、规则和运行策略，不会修改正在生效的版本。"
        style={{ marginBottom: 16 }}
      />

      <Form<TrialFormValues>
        form={form}
        layout="vertical"
        initialValues={{ mode: "text" }}
        onFinish={(values) => void runTrial(values)}
      >
        <Form.Item
          name="text"
          label="家长沟通文本（云客微信）"
          rules={[{ required: true, whitespace: true, message: "请输入需要识别的沟通文本" }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 5, maxRows: 10 }}
            placeholder="例如：课程一直没有改善，再不解决我们就要正式投诉并退费。"
          />
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          icon={<ExperimentOutlined />}
          loading={loading}
        >
          开始试跑
        </Button>
      </Form>

      <div style={{ marginTop: 24 }} aria-live="polite">
        {result ? (
          <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
            <Card size="small" title="识别结果">
              <Descriptions
                column={{ xs: 1, sm: 3 }}
                items={[
                  {
                    key: "level",
                    label: "风险等级",
                    children: levelMeta ? (
                      <Tag color={levelMeta.color}>{levelMeta.label}</Tag>
                    ) : (
                      <Tag>不生成预警</Tag>
                    ),
                  },
                  {
                    key: "score",
                    label: "风险分数",
                    children: <Typography.Text strong>{result.riskScore}</Typography.Text>,
                  },
                  {
                    key: "confidence",
                    label: "AI 置信度",
                    children: (
                      <Progress
                        percent={result.confidence}
                        size="small"
                        status={
                          config && result.confidence < config.strategy.minimumConfidence
                            ? "exception"
                            : "normal"
                        }
                      />
                    ),
                  },
                ]}
              />
            </Card>

            <Card size="small" title="命中规则">
              {result.matchedRules.length ? (
                <List
                  dataSource={result.matchedRules}
                  renderItem={(item) => (
                    <List.Item extra={<Tag color="processing">+{item.score} 分</Tag>}>
                      <List.Item.Meta
                        title={
                          <Space wrap>
                            <Typography.Text strong>{item.ruleName}</Typography.Text>
                            <Tag>{item.theme}</Tag>
                          </Space>
                        }
                        description={item.evidence}
                      />
                    </List.Item>
                  )}
                />
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="未命中已启用规则" />
              )}
            </Card>

            <Card size="small" title="AI 风险摘要">
              <Typography.Paragraph>{result.summary}</Typography.Paragraph>
              <Typography.Text strong>建议动作</Typography.Text>
              <Typography.Paragraph style={{ marginTop: 8, marginBottom: 0 }}>
                {result.suggestion}
              </Typography.Paragraph>
            </Card>
          </Space>
        ) : null}
      </div>
    </Drawer>
  );
}
