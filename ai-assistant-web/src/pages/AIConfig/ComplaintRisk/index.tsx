import {
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import {
  PageContainer,
  ProTable,
  type ProColumns,
} from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Tabs,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { aiConfigApi } from "../../../api/client";
import type {
  ComplaintRiskConfig,
  ComplaintRiskTypeConfig,
} from "../../../api/contracts";
import { RiskTypeEditorDrawer } from "./RiskTypeEditorDrawer";
import { useComplaintRiskConfigStyles } from "./index.styles";

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function normalizeSummaryPrompt(summaryPrompt: string) {
  return summaryPrompt.trim();
}

export function normalizeRiskTypes(
  riskTypes: ComplaintRiskTypeConfig[],
): ComplaintRiskTypeConfig[] {
  return riskTypes.map((riskType) => ({
    ...riskType,
    name: riskType.name.trim(),
    keywords: riskType.keywords.map((keyword) => keyword.trim()),
    positiveExamples: riskType.positiveExamples.map((example) =>
      example.trim(),
    ),
    highRiskDefinition: riskType.highRiskDefinition.trim(),
    mediumRiskDefinition: riskType.mediumRiskDefinition.trim(),
    lowRiskDefinition: riskType.lowRiskDefinition.trim(),
  }));
}

export function upsertRiskType(
  riskTypes: ComplaintRiskTypeConfig[],
  riskType: ComplaintRiskTypeConfig,
) {
  const normalized = normalizeRiskTypes([riskType])[0];
  const exists = riskTypes.some((item) => item.id === normalized.id);
  return exists
    ? riskTypes.map((item) => (item.id === normalized.id ? normalized : item))
    : [...riskTypes, normalized];
}

export function removeRiskTypeById(
  riskTypes: ComplaintRiskTypeConfig[],
  riskTypeId: string,
) {
  return riskTypes.filter((riskType) => riskType.id !== riskTypeId);
}

export function validateConfiguration(
  config: ComplaintRiskConfig,
): string | undefined {
  if (!normalizeSummaryPrompt(config.summaryPrompt)) {
    return "AI 总结提示词不能为空";
  }

  if (!config.riskTypes.length) {
    return "至少保留一个风险类型";
  }

  const names = config.riskTypes.map((riskType) => normalizedKey(riskType.name));
  if (names.some((name) => !name)) {
    return "风险类型名称不能为空";
  }
  if (new Set(names).size !== names.length) {
    return "风险类型名称不能重复";
  }

  for (const riskType of config.riskTypes) {
    const keywords = riskType.keywords.map(normalizedKey);
    if (keywords.some((keyword) => !keyword)) {
      return `“${riskType.name.trim()}”的关键词不能为空`;
    }
    if (new Set(keywords).size !== keywords.length) {
      return `“${riskType.name.trim()}”的关键词不能重复`;
    }
    if (!riskType.positiveExamples.length) {
      return `“${riskType.name.trim()}”至少添加一条参考案例`;
    }
    const positiveExamples = riskType.positiveExamples.map(normalizedKey);
    if (positiveExamples.some((example) => !example)) {
      return `“${riskType.name.trim()}”的参考案例不能为空`;
    }
    if (new Set(positiveExamples).size !== positiveExamples.length) {
      return `“${riskType.name.trim()}”的参考案例不能重复`;
    }
    if (!riskType.highRiskDefinition.trim()) {
      return `“${riskType.name.trim()}”的高风险定义不能为空`;
    }
    if (!riskType.mediumRiskDefinition.trim()) {
      return `“${riskType.name.trim()}”的中风险定义不能为空`;
    }
    if (!riskType.lowRiskDefinition.trim()) {
      return `“${riskType.name.trim()}”的低风险定义不能为空`;
    }
  }

  return undefined;
}

export default function ComplaintRiskConfigPage() {
  const { styles } = useComplaintRiskConfigStyles();
  const [config, setConfig] = useState<ComplaintRiskConfig | null>(null);
  const [riskTypes, setRiskTypes] = useState<ComplaintRiskTypeConfig[]>([]);
  const [summaryPromptDraft, setSummaryPromptDraft] = useState("");
  const [savingSummaryPrompt, setSavingSummaryPrompt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRiskType, setEditingRiskType] =
    useState<ComplaintRiskTypeConfig | null>(null);

  async function loadConfig() {
    setLoading(true);
    setLoadError(false);
    try {
      const nextConfig = await aiConfigApi.getComplaintRiskConfig();
      setConfig(nextConfig);
      setRiskTypes(nextConfig.riskTypes);
      setSummaryPromptDraft(nextConfig.summaryPrompt);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  function buildConfig(nextRiskTypes: ComplaintRiskTypeConfig[]) {
    if (!config) return null;
    const nextConfig: ComplaintRiskConfig = {
      ...config,
      riskTypes: normalizeRiskTypes(nextRiskTypes),
    };
    const error = validateConfiguration(nextConfig);
    if (error) {
      message.error(error);
      return null;
    }
    return nextConfig;
  }

  function applyServerConfig(nextConfig: ComplaintRiskConfig) {
    setConfig(nextConfig);
    setRiskTypes(nextConfig.riskTypes);
  }

  async function persistRiskTypes(nextRiskTypes: ComplaintRiskTypeConfig[]) {
    const nextConfig = buildConfig(nextRiskTypes);
    if (!nextConfig) throw new Error("invalid configuration");
    try {
      applyServerConfig(
        await aiConfigApi.updateComplaintRiskConfig(nextConfig),
      );
      message.success("配置已更新并即时生效");
    } catch (error) {
      message.error("配置更新失败，请重试");
      throw error;
    }
  }

  async function saveRiskType(riskType: ComplaintRiskTypeConfig) {
    await persistRiskTypes(upsertRiskType(riskTypes, riskType));
  }

  async function saveSummaryPrompt() {
    if (!config) return;

    const summaryPrompt = normalizeSummaryPrompt(summaryPromptDraft);
    if (!summaryPrompt) {
      message.error("AI 总结提示词不能为空");
      return;
    }

    const nextConfig: ComplaintRiskConfig = {
      ...config,
      summaryPrompt,
      riskTypes: normalizeRiskTypes(riskTypes),
    };
    const error = validateConfiguration(nextConfig);
    if (error) {
      message.error(error);
      return;
    }

    setSavingSummaryPrompt(true);
    try {
      const savedConfig =
        await aiConfigApi.updateComplaintRiskConfig(nextConfig);
      applyServerConfig(savedConfig);
      setSummaryPromptDraft(savedConfig.summaryPrompt);
      message.success("AI 总结提示词已更新并即时生效");
    } catch {
      message.error("AI 总结提示词更新失败，请重试");
    } finally {
      setSavingSummaryPrompt(false);
    }
  }

  function deleteRiskType(riskType: ComplaintRiskTypeConfig) {
    Modal.confirm({
      title: `删除“${riskType.name}”？`,
      content: "删除后，该风险类型及其所有关键词、参考案例和风险等级定义将立即移除并生效。",
      okText: "确认删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () =>
        persistRiskTypes(removeRiskTypeById(riskTypes, riskType.id)),
    });
  }

  const totalKeywords = useMemo(
    () =>
      riskTypes.reduce(
        (total, riskType) => total + riskType.keywords.length,
        0,
      ),
    [riskTypes],
  );

  const columns: ProColumns<ComplaintRiskTypeConfig>[] = [
    {
      title: "风险类型",
      dataIndex: "name",
      width: 180,
      render: (_, record) => (
        <Typography.Text strong>{record.name}</Typography.Text>
      ),
    },
    {
      title: "关键词",
      dataIndex: "keywords",
      width: 280,
      render: (_, record) =>
        record.keywords.length ? (
          <Space size={[4, 4]} wrap>
            {record.keywords.map((keyword) => (
              <Tag key={keyword} data-testid="risk-keyword">
                {keyword}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">未配置</Typography.Text>
        ),
    },
    {
      title: "参考案例",
      dataIndex: "positiveExamples",
      width: 300,
      render: (_, record) => (
        <ol className={styles.referenceList}>
          {record.positiveExamples.map((example, index) => (
            <li key={`${record.id}-positive-${index}`}>
              <Typography.Text data-testid="positive-example">
                {example}
              </Typography.Text>
            </li>
          ))}
        </ol>
      ),
    },
    {
      title: "高风险定义",
      dataIndex: "highRiskDefinition",
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text data-testid="high-risk-definition">
          {record.highRiskDefinition}
        </Typography.Text>
      ),
    },
    {
      title: "中风险定义",
      dataIndex: "mediumRiskDefinition",
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text data-testid="medium-risk-definition">
          {record.mediumRiskDefinition}
        </Typography.Text>
      ),
    },
    {
      title: "低风险定义",
      dataIndex: "lowRiskDefinition",
      width: 280,
      ellipsis: true,
      render: (_, record) => (
        <Typography.Text data-testid="low-risk-definition">
          {record.lowRiskDefinition}
        </Typography.Text>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 180,
      fixed: "right",
      align: "center",
      render: (_, record) => (
        <Space size={4} wrap={false} className={styles.actionGroup}>
          <Button
            type="link"
            icon={<EditOutlined />}
            aria-label={`编辑${record.name}`}
            onClick={() => {
              setEditingRiskType(record);
              setEditorOpen(true);
            }}
          >
            编辑
          </Button>
          <Button
            type="link"
            danger
            disabled={riskTypes.length === 1}
            icon={<DeleteOutlined />}
            aria-label={`删除${record.name}`}
            onClick={() => deleteRiskType(record)}
          >
            删除
          </Button>
        </Space>
      ),
    },
  ];

  if (loading) {
    return (
      <PageContainer title={false}>
        <Flex align="center" justify="center" className={styles.loadingState}>
          <Spin size="large" description="正在加载配置" />
        </Flex>
      </PageContainer>
    );
  }

  if (loadError || !config) {
    return (
      <PageContainer title={false}>
        <Card>
          <Empty description="配置加载失败">
            <Button type="primary" onClick={() => void loadConfig()}>
              重新加载
            </Button>
          </Empty>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer className={styles.page}>
      <div className={styles.content}>
        <Tabs
          defaultActiveKey="risk-types"
          destroyOnHidden={false}
          items={[
            {
              key: "risk-types",
              label: "风险类型配置",
              children: (
                <div className={styles.tabContent}>
                  <Alert
                    showIcon
                    type="info"
                    description="关键词命中不会直接生成风险事件；AI 会结合参考案例和上下文排除否定、转述，且同一段聊天可以命中多个风险类型。"
                  />

                  <ProTable<ComplaintRiskTypeConfig>
                    rowKey="id"
                    headerTitle={`风险类型配置（${riskTypes.length}）`}
                    columns={columns}
                    dataSource={riskTypes}
                    search={false}
                    options={false}
                    pagination={false}
                    cardBordered
                    scroll={{ x: 1650 }}
                    toolBarRender={() => [
                      <Typography.Text key="total" type="secondary">
                        共 {totalKeywords} 个关键词
                      </Typography.Text>,
                      <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => {
                          setEditingRiskType(null);
                          setEditorOpen(true);
                        }}
                      >
                        新增风险类型
                      </Button>,
                    ]}
                  />
                </div>
              ),
            },
            {
              key: "summary-prompt",
              label: "AI 总结提示词",
              children: (
                <Card
                  title="系统提示词"
                  className={styles.promptCard}
                  extra={
                    <Button
                      type="primary"
                      icon={<SaveOutlined />}
                      aria-label="保存提示词"
                      loading={savingSummaryPrompt}
                      disabled={
                        savingSummaryPrompt ||
                        normalizeSummaryPrompt(summaryPromptDraft) ===
                          config.summaryPrompt
                      }
                      onClick={() => void saveSummaryPrompt()}
                    >
                      保存提示词
                    </Button>
                  }
                >
                  <Typography.Paragraph type="secondary">
                    用于控制客诉预警详情中“风险总结”的生成方式，保存后即时生效。
                  </Typography.Paragraph>
                  <Input.TextArea
                    aria-label="AI 总结提示词"
                    value={summaryPromptDraft}
                    autoSize={{ minRows: 6, maxRows: 12 }}
                    placeholder="请输入 AI 生成客诉风险总结时使用的系统提示词"
                    onChange={(event) =>
                      setSummaryPromptDraft(event.target.value)
                    }
                  />
                </Card>
              ),
            },
          ]}
        />
      </div>

      <RiskTypeEditorDrawer
        open={editorOpen}
        riskType={editingRiskType}
        existingRiskTypes={riskTypes}
        onClose={() => setEditorOpen(false)}
        onSave={saveRiskType}
      />
    </PageContainer>
  );
}
