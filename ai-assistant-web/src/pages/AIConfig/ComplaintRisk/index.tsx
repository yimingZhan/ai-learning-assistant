import {
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  PlusOutlined,
  SaveOutlined,
  SendOutlined,
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
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { aiConfigApi } from "../../../api/client";
import type {
  ComplaintRiskConfig,
  ComplaintRiskTypeConfig,
  ComplaintRiskVersion,
} from "../../../api/contracts";
import { RiskTypeEditorDrawer } from "./RiskTypeEditorDrawer";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { useComplaintRiskConfigStyles } from "./index.styles";

function normalizedKey(value: string) {
  return value.trim().toLocaleLowerCase();
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
    negativeExamples: riskType.negativeExamples.map((example) =>
      example.trim(),
    ),
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
      return `“${riskType.name.trim()}”至少添加一条正向参考案例`;
    }
    const positiveExamples = riskType.positiveExamples.map(normalizedKey);
    const negativeExamples = riskType.negativeExamples.map(normalizedKey);
    if (positiveExamples.some((example) => !example)) {
      return `“${riskType.name.trim()}”的正向参考案例不能为空`;
    }
    if (negativeExamples.some((example) => !example)) {
      return `“${riskType.name.trim()}”的反向参考案例不能为空`;
    }
    if (new Set(positiveExamples).size !== positiveExamples.length) {
      return `“${riskType.name.trim()}”的正向参考案例不能重复`;
    }
    if (new Set(negativeExamples).size !== negativeExamples.length) {
      return `“${riskType.name.trim()}”的反向参考案例不能重复`;
    }
    if (
      new Set([...positiveExamples, ...negativeExamples]).size !==
      positiveExamples.length + negativeExamples.length
    ) {
      return `“${riskType.name.trim()}”的正向和反向参考案例不能重复`;
    }
  }

  return undefined;
}

export default function ComplaintRiskConfigPage() {
  const { styles } = useComplaintRiskConfigStyles();
  const [publishForm] = Form.useForm<{ changeNote: string }>();
  const [config, setConfig] = useState<ComplaintRiskConfig | null>(null);
  const [riskTypes, setRiskTypes] = useState<ComplaintRiskTypeConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [pendingPublishConfig, setPendingPublishConfig] =
    useState<ComplaintRiskConfig | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingRiskType, setEditingRiskType] =
    useState<ComplaintRiskTypeConfig | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);
  const [versions, setVersions] = useState<ComplaintRiskVersion[]>([]);

  async function loadConfig() {
    setLoading(true);
    setLoadError(false);
    try {
      const nextConfig = await aiConfigApi.getComplaintRiskConfig();
      setConfig(nextConfig);
      setRiskTypes(nextConfig.riskTypes);
      setDirty(false);
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadConfig();
  }, []);

  function buildCurrentConfig() {
    if (!config) return null;
    const nextConfig: ComplaintRiskConfig = {
      ...config,
      riskTypes: normalizeRiskTypes(riskTypes),
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
    setDirty(false);
  }

  async function saveDraft() {
    const nextConfig = buildCurrentConfig();
    if (!nextConfig) return;
    setSaving(true);
    try {
      applyServerConfig(await aiConfigApi.saveComplaintRiskDraft(nextConfig));
      message.success("草稿已保存");
    } catch {
      message.error("保存失败，页面中的修改已保留");
    } finally {
      setSaving(false);
    }
  }

  function openPublish() {
    const nextConfig = buildCurrentConfig();
    if (!nextConfig) return;
    setPendingPublishConfig(nextConfig);
    publishForm.resetFields();
    setPublishOpen(true);
  }

  async function publishConfig() {
    if (!pendingPublishConfig) return;
    const { changeNote } = await publishForm.validateFields();
    setPublishing(true);
    try {
      const nextConfig = await aiConfigApi.publishComplaintRisk(
        pendingPublishConfig,
        changeNote.trim(),
      );
      applyServerConfig(nextConfig);
      setPublishOpen(false);
      setPendingPublishConfig(null);
      message.success(`${nextConfig.publishedVersion} 已发布`);
    } catch {
      message.error("发布失败，页面中的修改已保留");
    } finally {
      setPublishing(false);
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setVersions(await aiConfigApi.listComplaintRiskVersions());
    } catch {
      message.error("版本记录加载失败");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function rollback(version: string) {
    setRollbackLoading(version);
    try {
      const nextConfig = await aiConfigApi.rollbackComplaintRisk(version);
      applyServerConfig(nextConfig);
      setVersions(await aiConfigApi.listComplaintRiskVersions());
      message.success(`已以 ${version} 的配置创建 ${nextConfig.publishedVersion}`);
    } catch {
      message.error("回滚失败，请稍后重试");
      throw new Error("rollback failed");
    } finally {
      setRollbackLoading(null);
    }
  }

  function saveRiskType(riskType: ComplaintRiskTypeConfig) {
    setRiskTypes((current) => upsertRiskType(current, riskType));
    setDirty(true);
  }

  function deleteRiskType(riskType: ComplaintRiskTypeConfig) {
    Modal.confirm({
      title: `删除“${riskType.name}”？`,
      content: "删除后，该风险类型及其所有关键词、正向案例和反向案例将从当前草稿中移除。",
      okText: "确认删除",
      cancelText: "取消",
      okButtonProps: { danger: true },
      onOk: () => {
        setRiskTypes((current) => removeRiskTypeById(current, riskType.id));
        setDirty(true);
      },
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
      title: "正向案例",
      dataIndex: "positiveExamples",
      width: 330,
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
      title: "反向案例",
      dataIndex: "negativeExamples",
      width: 330,
      render: (_, record) =>
        record.negativeExamples.length ? (
          <ol className={styles.referenceList}>
            {record.negativeExamples.map((example, index) => (
              <li key={`${record.id}-negative-${index}`}>
                <Typography.Text data-testid="negative-example">
                  {example}
                </Typography.Text>
              </li>
            ))}
          </ol>
        ) : (
          <Typography.Text type="secondary">未配置</Typography.Text>
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

  const statusTag = dirty ? (
    <Tag color="warning">有未保存修改</Tag>
  ) : config.draftStatus === "saved" ? (
    <Tag color="processing">草稿已保存</Tag>
  ) : (
    <Tag color="success">已发布</Tag>
  );

  return (
    <PageContainer
      className={styles.page}
      extra={[
        <Button
          key="history"
          icon={<HistoryOutlined />}
          onClick={() => void openHistory()}
        >
          版本记录
        </Button>,
        <Button
          key="save"
          icon={<SaveOutlined />}
          loading={saving}
          onClick={() => void saveDraft()}
        >
          保存草稿
        </Button>,
        <Button
          key="publish"
          type="primary"
          icon={<SendOutlined />}
          onClick={openPublish}
        >
          发布配置
        </Button>,
      ]}
    >
      <div className={styles.content}>
        <Card className={styles.statusCard}>
          <Descriptions
            size="small"
            column={{ xs: 1, sm: 2, lg: 4 }}
            items={[
              {
                key: "publishedVersion",
                label: "当前生效版本",
                children: <Tag color="blue">{config.publishedVersion}</Tag>,
              },
              {
                key: "draftVersion",
                label: "当前草稿",
                children: config.draftVersion,
              },
              {
                key: "status",
                label: "配置状态",
                children: statusTag,
              },
              {
                key: "updated",
                label: "最近更新",
                children: `${config.updatedAt} · ${config.updatedBy}`,
              },
            ]}
          />
        </Card>

        <Alert
          showIcon
          type="info"
          description="关键词命中不会直接生成风险事件；AI 会结合正反向案例和上下文排除否定、转述，且同一段聊天可以命中多个风险类型。"
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
          scroll={{ x: 1350 }}
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

      <RiskTypeEditorDrawer
        open={editorOpen}
        riskType={editingRiskType}
        existingRiskTypes={riskTypes}
        onClose={() => setEditorOpen(false)}
        onSave={saveRiskType}
      />

      <VersionHistoryDrawer
        open={historyOpen}
        loading={historyLoading}
        rollbackLoading={rollbackLoading}
        versions={versions}
        onClose={() => setHistoryOpen(false)}
        onRollback={rollback}
      />

      <Modal
        title="发布 AI 客诉预警配置"
        open={publishOpen}
        okText="确认发布"
        cancelText="取消"
        confirmLoading={publishing}
        onCancel={() => setPublishOpen(false)}
        onOk={() => void publishConfig()}
        destroyOnHidden
      >
        <Alert
          showIcon
          type="warning"
          title="发布后将创建新版本，供后续 AI 风险类型判断使用；不会重算当前静态演示列表。"
          className={styles.publishAlert}
        />
        <Form form={publishForm} layout="vertical">
          <Form.Item
            name="changeNote"
            label="变更说明"
            rules={[
              {
                required: true,
                whitespace: true,
                message: "请填写本次变更说明",
              },
            ]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="说明本次新增、修改或删除了哪些风险类型、关键词或正反向案例"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
