import {
  EditOutlined,
  ExperimentOutlined,
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
  Col,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useState } from "react";
import { aiConfigApi } from "../../../api/client";
import type {
  ComplaintRiskConfig,
  ComplaintRiskPromptConfig,
  ComplaintRiskRule,
  ComplaintRiskVersion,
} from "../../../api/contracts";
import { RuleEditorDrawer } from "./RuleEditorDrawer";
import { TrialRunDrawer } from "./TrialRunDrawer";
import { VersionHistoryDrawer } from "./VersionHistoryDrawer";
import { useComplaintRiskConfigStyles } from "./index.styles";
import {
  dataSourceMeta,
  dataSourceOptions,
  notificationTargetOptions,
  riskLevelMeta,
  runFrequencyOptions,
} from "./meta";

type PromptField = keyof Pick<
  ComplaintRiskPromptConfig,
  "systemPrompt" | "analysisPrompt" | "suggestionPrompt"
>;

export function validateConfiguration(
  config: ComplaintRiskConfig,
): string | undefined {
  const { high, medium, low } = config.strategy.thresholds;
  if (!(high > medium && medium > low && low >= 0 && high <= 100)) {
    return "风险阈值需满足：100 ≥ 高风险 > 中风险 > 低风险 ≥ 0";
  }
  if (!config.strategy.dataSources.length) {
    return "至少启用一个数据来源";
  }
  if (!config.rules.some((rule) => rule.enabled)) {
    return "至少启用一条判断规则";
  }
  if (
    config.rules.some(
      (rule) =>
        rule.score <= 0 ||
        rule.windowDays <= 0 ||
        rule.minOccurrences <= 0 ||
        rule.priority <= 0,
    )
  ) {
    return "规则分值、命中周期、最少次数和优先级必须为正数";
  }
  return undefined;
}

export default function ComplaintRiskConfigPage() {
  const { styles } = useComplaintRiskConfigStyles();
  const [form] = Form.useForm<ComplaintRiskConfig>();
  const [publishForm] = Form.useForm<{ changeNote: string }>();
  const [config, setConfig] = useState<ComplaintRiskConfig | null>(null);
  const [rules, setRules] = useState<ComplaintRiskRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [pendingPublishConfig, setPendingPublishConfig] =
    useState<ComplaintRiskConfig | null>(null);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ComplaintRiskRule | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialConfig, setTrialConfig] = useState<ComplaintRiskConfig | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string | null>(null);
  const [versions, setVersions] = useState<ComplaintRiskVersion[]>([]);
  const [activePrompt, setActivePrompt] =
    useState<PromptField>("analysisPrompt");

  async function loadConfig() {
    setLoading(true);
    setLoadError(false);
    try {
      const nextConfig = await aiConfigApi.getComplaintRiskConfig();
      setConfig(nextConfig);
      setRules(nextConfig.rules);
      form.setFieldsValue(nextConfig);
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

  async function buildCurrentConfig() {
    if (!config) return null;
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true) as ComplaintRiskConfig;
      const nextConfig: ComplaintRiskConfig = {
        ...config,
        prompts: {
          ...config.prompts,
          ...values.prompts,
          variables: config.prompts.variables,
        },
        rules: structuredClone(rules),
        strategy: {
          ...config.strategy,
          ...values.strategy,
          thresholds: values.strategy.thresholds,
        },
      };
      const error = validateConfiguration(nextConfig);
      if (error) {
        message.error(error);
        return null;
      }
      return nextConfig;
    } catch {
      message.error("请先补全必填配置");
      return null;
    }
  }

  function applyServerConfig(nextConfig: ComplaintRiskConfig) {
    setConfig(nextConfig);
    setRules(nextConfig.rules);
    form.setFieldsValue(nextConfig);
    setDirty(false);
  }

  async function saveDraft() {
    const nextConfig = await buildCurrentConfig();
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

  async function openTrial() {
    const nextConfig = await buildCurrentConfig();
    if (!nextConfig) return;
    setTrialConfig(nextConfig);
    setTrialOpen(true);
  }

  async function openPublish() {
    const nextConfig = await buildCurrentConfig();
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

  function insertVariable(variableKey: string) {
    const current =
      (form.getFieldValue(["prompts", activePrompt]) as string | undefined) ??
      "";
    const prefix = current && !current.endsWith(" ") ? " " : "";
    form.setFieldValue(
      ["prompts", activePrompt],
      `${current}${prefix}{{${variableKey}}}`,
    );
    setDirty(true);
  }

  function saveRule(rule: ComplaintRiskRule) {
    setRules((current) => {
      const exists = current.some((item) => item.id === rule.id);
      return exists
        ? current.map((item) => (item.id === rule.id ? rule : item))
        : [...current, rule];
    });
    setDirty(true);
  }

  const ruleColumns: ProColumns<ComplaintRiskRule>[] = [
    {
      title: "规则",
      dataIndex: "name",
      width: 280,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text
            type="secondary"
            ellipsis={{ tooltip: record.description }}
            className={styles.ruleDescription}
          >
            {record.description}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "风险主题",
      dataIndex: "theme",
      width: 150,
      render: (_, record) => <Tag>{record.theme}</Tag>,
    },
    {
      title: "数据来源",
      dataIndex: "dataSources",
      width: 220,
      render: (_, record) => (
        <Space size={[4, 4]} wrap>
          {record.dataSources.map((source) => (
            <Tag key={source}>{dataSourceMeta[source]}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "命中条件",
      key: "condition",
      width: 150,
      render: (_, record) =>
        `近 ${record.windowDays} 天 ≥ ${record.minOccurrences} 次`,
    },
    {
      title: "分值",
      dataIndex: "score",
      width: 80,
      render: (_, record) => <Tag color="processing">+{record.score}</Tag>,
    },
    {
      title: "优先级",
      dataIndex: "priority",
      width: 90,
    },
    {
      title: "强制等级",
      dataIndex: "forceLevel",
      width: 110,
      render: (_, record) =>
        record.forceLevel ? (
          <Tag color={riskLevelMeta[record.forceLevel].color}>
            {riskLevelMeta[record.forceLevel].label}
          </Tag>
        ) : (
          "-"
        ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (_, record) => (
        <Switch
          size="small"
          checked={record.enabled}
          aria-label={`${record.name}规则状态`}
          onChange={(enabled) => {
            setRules((current) =>
              current.map((item) =>
                item.id === record.id ? { ...item, enabled } : item,
              ),
            );
            setDirty(true);
          }}
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 80,
      fixed: "right",
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => {
            setEditingRule(record);
            setRuleEditorOpen(true);
          }}
        >
          编辑
        </Button>,
      ],
    },
  ];

  if (loading) {
    return (
      <PageContainer title="AI 客诉预警配置">
        <Flex align="center" justify="center" style={{ minHeight: 360 }}>
          <Spin size="large" description="正在加载配置" />
        </Flex>
      </PageContainer>
    );
  }

  if (loadError || !config) {
    return (
      <PageContainer title="AI 客诉预警配置">
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

  const promptContent = (
    <div className={styles.sectionStack}>
      <Alert
        showIcon
        type="info"
        title="Prompt 只负责语义理解、证据归纳和建议生成；风险分数与等级由判断规则决定。"
      />
      <Card size="small" title="可用上下文变量">
        <div className={styles.variableList}>
          {config.prompts.variables.map((variable) => (
            <Button
              key={variable.key}
              size="small"
              onClick={() => insertVariable(variable.key)}
            >
              {variable.label} {`{{${variable.key}}}`}
            </Button>
          ))}
        </div>
        <Typography.Text type="secondary">
          点击变量会插入到最近聚焦的 Prompt 中。
        </Typography.Text>
      </Card>

      <Card size="small" title="系统角色与安全边界" className={styles.promptCard}>
        <Form.Item
          name={["prompts", "systemPrompt"]}
          rules={[{ required: true, whitespace: true, message: "请输入系统 Prompt" }]}
        >
          <Input.TextArea
            aria-label="系统角色与安全边界 Prompt"
            autoSize={{ minRows: 4, maxRows: 10 }}
            onFocus={() => setActivePrompt("systemPrompt")}
          />
        </Form.Item>
      </Card>

      <Card size="small" title="风险识别与证据提取" className={styles.promptCard}>
        <Form.Item
          name={["prompts", "analysisPrompt"]}
          rules={[{ required: true, whitespace: true, message: "请输入风险识别 Prompt" }]}
        >
          <Input.TextArea
            aria-label="风险识别与证据提取 Prompt"
            autoSize={{ minRows: 5, maxRows: 12 }}
            onFocus={() => setActivePrompt("analysisPrompt")}
          />
        </Form.Item>
      </Card>

      <Card size="small" title="风险总结与跟进建议" className={styles.promptCard}>
        <Form.Item
          name={["prompts", "suggestionPrompt"]}
          rules={[{ required: true, whitespace: true, message: "请输入建议生成 Prompt" }]}
        >
          <Input.TextArea
            aria-label="风险总结与跟进建议 Prompt"
            autoSize={{ minRows: 4, maxRows: 10 }}
            onFocus={() => setActivePrompt("suggestionPrompt")}
          />
        </Form.Item>
      </Card>
    </div>
  );

  const rulesContent = (
    <ProTable<ComplaintRiskRule>
      rowKey="id"
      headerTitle="客诉风险判断规则"
      columns={ruleColumns}
      dataSource={[...rules].sort((left, right) => right.priority - left.priority)}
      search={false}
      options={false}
      pagination={false}
      cardBordered
      scroll={{ x: 1450 }}
      toolBarRender={() => [
        <Button
          key="create"
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingRule(null);
            setRuleEditorOpen(true);
          }}
        >
          新增规则
        </Button>,
      ]}
    />
  );

  const runtimeContent = (
    <div className={styles.sectionStack}>
      <Card title="风险分级与评估周期" size="small">
        <Row gutter={16}>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "thresholds", "high"]}
              label="高风险起始分"
              rules={[{ required: true, message: "请输入阈值" }]}
            >
              <InputNumber min={0} max={100} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "thresholds", "medium"]}
              label="中风险起始分"
              rules={[{ required: true, message: "请输入阈值" }]}
            >
              <InputNumber min={0} max={100} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "thresholds", "low"]}
              label="低风险起始分"
              rules={[{ required: true, message: "请输入阈值" }]}
            >
              <InputNumber min={0} max={100} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "crossChannelBonus"]}
              label="跨渠道加分"
              extra="V1 仅使用云客微信文字，跨渠道加分固定为 0。"
              rules={[{ required: true, message: "请输入加分" }]}
            >
              <InputNumber disabled min={0} max={0} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "analysisWindowDays"]}
              label="默认分析周期（天）"
              rules={[{ required: true, message: "请输入周期" }]}
            >
              <InputNumber min={1} max={365} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "dedupeHours"]}
              label="重复预警间隔（小时）"
              rules={[{ required: true, message: "请输入间隔" }]}
            >
              <InputNumber min={1} max={720} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "minimumConfidence"]}
              label="最低置信度（%）"
              rules={[{ required: true, message: "请输入置信度" }]}
            >
              <InputNumber min={0} max={100} className={styles.fullWidth} />
            </Form.Item>
          </Col>
          <Col xs={12} lg={6}>
            <Form.Item
              name={["strategy", "runFrequency"]}
              label="运行频率"
              rules={[{ required: true, message: "请选择运行频率" }]}
            >
              <Select disabled options={runFrequencyOptions} />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="数据与处理策略" size="small">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item
              name={["strategy", "dataSources"]}
              label="启用数据源"
              extra="V1 仅分析云客拉取的一对一微信文字消息。"
              rules={[{ required: true, type: "array", min: 1, message: "至少启用一个数据源" }]}
            >
              <Select mode="multiple" options={dataSourceOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item
              name={["strategy", "notificationTargets"]}
              label="预警通知对象"
              rules={[{ required: true, type: "array", min: 1, message: "至少选择一个通知对象" }]}
            >
              <Select mode="multiple" options={notificationTargetOptions} />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item
              name={["strategy", "highRiskRequiresReview"]}
              label="高风险人工核验"
              valuePropName="checked"
              extra="V1 只生成内部风险事件和工作提醒，不创建审核任务。"
            >
              <Switch disabled checkedChildren="已启用" unCheckedChildren="已关闭" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );

  return (
    <PageContainer
      className={styles.page}
      title="AI 客诉预警配置"
      subTitle="配置客诉风险识别 Prompt、判断规则与运行策略"
      extra={[
        <Button key="trial" icon={<ExperimentOutlined />} onClick={() => void openTrial()}>
          配置试跑
        </Button>,
        <Button key="history" icon={<HistoryOutlined />} onClick={() => void openHistory()}>
          版本记录
        </Button>,
        <Button key="save" icon={<SaveOutlined />} loading={saving} onClick={() => void saveDraft()}>
          保存草稿
        </Button>,
        <Button key="publish" type="primary" icon={<SendOutlined />} onClick={() => void openPublish()}>
          发布配置
        </Button>,
      ]}
    >
      <Form<ComplaintRiskConfig>
        form={form}
        layout="vertical"
        onValuesChange={() => setDirty(true)}
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

          <Card styles={{ body: { paddingTop: 8 } }}>
            <Tabs
              items={[
                {
                  key: "prompt",
                  label: "Prompt 配置",
                  children: promptContent,
                  forceRender: true,
                },
                { key: "rules", label: `判断规则（${rules.length}）`, children: rulesContent },
                {
                  key: "runtime",
                  label: "运行策略",
                  children: runtimeContent,
                  forceRender: true,
                },
              ]}
            />
          </Card>
        </div>
      </Form>

      <RuleEditorDrawer
        open={ruleEditorOpen}
        rule={editingRule}
        onClose={() => setRuleEditorOpen(false)}
        onSave={saveRule}
      />

      <TrialRunDrawer
        open={trialOpen}
        config={trialConfig}
        onClose={() => setTrialOpen(false)}
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
          title="发布后将创建新版本，用于后续识别任务；不会重算当前静态演示列表。"
          style={{ marginBottom: 16 }}
        />
        <Form form={publishForm} layout="vertical">
          <Form.Item
            name="changeNote"
            label="变更说明"
            rules={[{ required: true, whitespace: true, message: "请填写本次变更说明" }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 6 }}
              placeholder="说明本次调整了哪些 Prompt、规则或阈值"
            />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
