import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Typography,
} from "antd";
import { useEffect } from "react";
import type { ComplaintRiskTypeConfig } from "../../../api/contracts";
import { useComplaintRiskConfigStyles } from "./index.styles";

type RiskTypeEditorDrawerProps = {
  open: boolean;
  riskType: ComplaintRiskTypeConfig | null;
  existingRiskTypes: ComplaintRiskTypeConfig[];
  onClose: () => void;
  onSave: (riskType: ComplaintRiskTypeConfig) => void;
};

type RiskTypeFormValues = Pick<
  ComplaintRiskTypeConfig,
  "name" | "keywords" | "positiveExamples" | "negativeExamples"
>;

type ExampleListProps = {
  name: "positiveExamples" | "negativeExamples";
  label: string;
  description: string;
  required: boolean;
};

function ExampleList({
  name,
  label,
  description,
  required,
}: ExampleListProps) {
  const { styles } = useComplaintRiskConfigStyles();

  return (
    <>
      <Typography.Title level={5} className={styles.examplesTitle}>
        {label}
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        {description}
      </Typography.Paragraph>
      <Form.List
        name={name}
        rules={[
          {
            validator: async (_, examples?: string[]) => {
              if (required && !examples?.length) {
                throw new Error(`至少添加一条${label}`);
              }
              const normalized = (examples ?? [])
                .filter((example) => example?.trim())
                .map((example) => example.trim().toLocaleLowerCase());
              if (new Set(normalized).size !== normalized.length) {
                throw new Error(`同一风险类型下的${label}不能重复`);
              }
            },
          },
        ]}
      >
        {(fields, { add, remove, move }, { errors }) => (
          <div className={styles.examplesStack}>
            {fields.map((field, index) => (
              <div key={field.key} className={styles.exampleRow}>
                <Form.Item
                  {...field}
                  className={styles.exampleInput}
                  rules={[
                    {
                      required: true,
                      whitespace: true,
                      message: `请输入${label}`,
                    },
                  ]}
                >
                  <Input.TextArea
                    aria-label={`${label} ${index + 1}`}
                    autoSize={{ minRows: 1, maxRows: 3 }}
                    placeholder={`输入一条${label}`}
                    maxLength={200}
                    showCount
                  />
                </Form.Item>
                <Space.Compact className={styles.exampleActions}>
                  <Button
                    icon={<ArrowUpOutlined />}
                    aria-label={`上移${label} ${index + 1}`}
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  />
                  <Button
                    icon={<ArrowDownOutlined />}
                    aria-label={`下移${label} ${index + 1}`}
                    disabled={index === fields.length - 1}
                    onClick={() => move(index, index + 1)}
                  />
                  <Button
                    danger
                    icon={<DeleteOutlined />}
                    aria-label={`删除${label} ${index + 1}`}
                    disabled={required && fields.length === 1}
                    onClick={() => remove(index)}
                  />
                </Space.Compact>
              </div>
            ))}
            <Form.ErrorList errors={errors} />
            <Button
              type="dashed"
              block
              icon={<PlusOutlined />}
              onClick={() => add("")}
            >
              新增{label}
            </Button>
          </div>
        )}
      </Form.List>
    </>
  );
}

function createRiskTypeId() {
  return `risk-type-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RiskTypeEditorDrawer({
  open,
  riskType,
  existingRiskTypes,
  onClose,
  onSave,
}: RiskTypeEditorDrawerProps) {
  const { styles } = useComplaintRiskConfigStyles();
  const [form] = Form.useForm<RiskTypeFormValues>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      riskType
        ? {
            name: riskType.name,
            keywords: [...riskType.keywords],
            positiveExamples: [...riskType.positiveExamples],
            negativeExamples: [...riskType.negativeExamples],
          }
        : { name: "", keywords: [], positiveExamples: [""], negativeExamples: [] },
    );
  }, [form, open, riskType]);

  const otherNames = new Set(
    existingRiskTypes
      .filter((item) => item.id !== riskType?.id)
      .map((item) => item.name.trim().toLocaleLowerCase()),
  );

  return (
    <Drawer
      title={riskType ? "编辑风险类型" : "新增风险类型"}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
      footer={
        <Flex justify="end">
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              保存风险类型
            </Button>
          </Space>
        </Flex>
      }
    >
      <Form<RiskTypeFormValues>
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSave({
            id: riskType?.id ?? createRiskTypeId(),
            name: values.name.trim(),
            keywords: (values.keywords ?? []).map((keyword) => keyword.trim()),
            positiveExamples: values.positiveExamples.map((example) =>
              example.trim(),
            ),
            negativeExamples: (values.negativeExamples ?? []).map((example) =>
              example.trim(),
            ),
          });
          onClose();
        }}
      >
        <Form.Item
          name="name"
          label="风险类型名称"
          validateTrigger="onBlur"
          rules={[
            {
              required: true,
              whitespace: true,
              message: "请输入风险类型名称",
            },
            {
              validator: async (_, value?: string) => {
                if (
                  value?.trim() &&
                  otherNames.has(value.trim().toLocaleLowerCase())
                ) {
                  throw new Error("风险类型名称不能重复");
                }
              },
            },
          ]}
        >
          <Input
            aria-label="风险类型名称"
            placeholder="例如：投诉升级倾向"
            maxLength={50}
            showCount
          />
        </Form.Item>

        <Form.Item
          name="keywords"
          label="关键词"
          extra="关键词用于快速召回候选聊天；命中后仍需由 AI 结合上下文确认风险类型。"
          rules={[
            {
              validator: async (_, keywords?: string[]) => {
                const normalized = (keywords ?? []).map((keyword) =>
                  keyword.trim().toLocaleLowerCase(),
                );
                if (normalized.some((keyword) => !keyword)) {
                  throw new Error("关键词不能为空");
                }
                if (new Set(normalized).size !== normalized.length) {
                  throw new Error("同一风险类型下的关键词不能重复");
                }
              },
            },
          ]}
        >
          <Select
            mode="tags"
            open={false}
            tokenSeparators={[",", "，", "、"]}
            aria-label="关键词"
            placeholder="输入关键词后按回车添加"
          />
        </Form.Item>

        <ExampleList
          name="positiveExamples"
          label="正向参考案例"
          description="表达应当命中该风险类型的典型语义，至少配置一条。"
          required
        />
        <ExampleList
          name="negativeExamples"
          label="反向参考案例"
          description="表达不应命中该风险类型的相似语义，可用于排除否定、转述和其他类型。"
          required={false}
        />
      </Form>
    </Drawer>
  );
}
