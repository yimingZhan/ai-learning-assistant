import {
  EditOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  MinusCircleOutlined,
  PlusOutlined,
  RollbackOutlined,
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
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Result,
  Row,
  Select,
  Space,
  Spin,
  Switch,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  message,
  type TableProps,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { aiConfigApi, assistantApi, toolbarApi } from "../../../api/client";
import type {
  AssistantCapability,
  AssistantCapabilityId,
  CurrentUser,
  PlatformAssistantAuditLog,
  PlatformAssistantConfig,
  PlatformAssistantTrialResult,
  PlatformAssistantVersion,
  StudentOption,
  UserRole,
} from "../../../api/contracts";
import { usePlatformAssistantConfigStyles } from "./index.styles";

const roleMeta: Record<UserRole, string> = {
  studentManager: "学管",
  consultant: "顾问",
  planner: "规划",
  qualityInspector: "质检",
  teacher: "教师",
};

const roleOptions = Object.entries(roleMeta).map(([value, label]) => ({
  value,
  label,
}));

const outputTypeOptions = [
  { value: "scoreCard", label: "学情卡片" },
  { value: "orderCard", label: "订单卡片" },
  { value: "feedbackSummary", label: "反馈摘要" },
  { value: "replyDraft", label: "话术草稿" },
  { value: "riskSummary", label: "风险解读" },
  { value: "renewalDiagnosis", label: "续费诊断" },
];

const outputTypeLabels = Object.fromEntries(
  outputTypeOptions.map((item) => [item.value, item.label]),
);

const auditActionMeta: Record<
  PlatformAssistantAuditLog["action"],
  { label: string; color?: string }
> = {
  draftSaved: { label: "保存草稿", color: "processing" },
  trialSucceeded: { label: "试运行通过", color: "success" },
  trialRejected: { label: "试运行拒绝", color: "warning" },
  published: { label: "发布版本", color: "blue" },
  rolledBack: { label: "回滚版本", color: "purple" },
  capabilityUsed: { label: "能力调用", color: "cyan" },
  accessDenied: { label: "访问拒绝", color: "error" },
};

type RoleRow = { key: UserRole; role: UserRole; label: string };

export function validatePlatformAssistantConfiguration(
  config: PlatformAssistantConfig,
): string | undefined {
  if (!config.basic.name.trim() || !config.basic.welcomeMessage.trim()) {
    return "请补全助手名称和欢迎语";
  }
  const enabled = config.capabilities.filter((item) => item.enabled);
  if (!enabled.length) return "至少启用一项 AI 能力";
  if (
    enabled.some(
      (item) =>
        !item.name.trim() ||
        !item.dataSources.length ||
        !item.recommendedPrompts.some((prompt) => prompt.description.trim()),
    )
  ) {
    return "已启用能力必须配置名称、数据源和推荐问题";
  }
  const capabilityIds = new Set(config.capabilities.map((item) => item.id));
  if (
    config.roleGrants.some((grant) =>
      grant.capabilityIds.some((id) => !capabilityIds.has(id)),
    )
  ) {
    return "岗位授权中存在无效能力";
  }
  if (!config.responsePolicy.systemPrompt.trim()) {
    return "请填写系统角色与安全边界";
  }
  return undefined;
}

function CapabilityEditor({
  open,
  capability,
  disabled,
  onClose,
  onSave,
}: {
  open: boolean;
  capability: AssistantCapability | null;
  disabled: boolean;
  onClose: () => void;
  onSave: (capability: AssistantCapability) => void;
}) {
  const [form] = Form.useForm<AssistantCapability>();

  useEffect(() => {
    if (open && capability) form.setFieldsValue(structuredClone(capability));
  }, [capability, form, open]);

  return (
    <Modal
      title={capability ? `编辑能力 · ${capability.name}` : "编辑能力"}
      open={open}
      width={780}
      okText="保存到当前草稿"
      okButtonProps={{ disabled }}
      onCancel={onClose}
      onOk={() =>
        void form.validateFields().then((value) => {
          onSave(value);
          onClose();
        })
      }
      destroyOnHidden
    >
      <Alert
        showIcon
        type="info"
        title="能力 ID 和工具调用由研发注册；这里配置业务展示、数据声明与推荐问题。"
        style={{ marginBottom: 20 }}
      />
      <Form form={form} layout="vertical" disabled={disabled}>
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Row gutter={16}>
          <Col span={16}>
            <Form.Item name="name" label="能力名称" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="order" label="展示顺序" rules={[{ required: true }]}>
              <InputNumber min={1} precision={0} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="description" label="能力说明" rules={[{ required: true, whitespace: true }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="requiredContext" label="所需上下文" rules={[{ required: true }]}>
              <Select options={[
                { value: "student", label: "必须选择学生" },
                { value: "none", label: "无业务上下文" },
              ]} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="outputType" label="输出形式" rules={[{ required: true }]}>
              <Select options={outputTypeOptions} />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="dataSources" label="依赖数据源" rules={[{ required: true, type: "array", min: 1 }]}>
          <Select mode="tags" tokenSeparators={[","]} placeholder="输入数据源后回车" />
        </Form.Item>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item name="enabled" label="能力状态" valuePropName="checked">
              <Switch checkedChildren="已启用" unCheckedChildren="已停用" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="requireSources" label="必须展示来源" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item name="requireDataTimestamp" label="展示数据时间" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name="disclaimer" label="能力专属声明">
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="例如：生成内容为草稿，发送前需人工确认" />
        </Form.Item>
        <Form.List name="recommendedPrompts">
          {(fields, { add, remove }) => (
            <Form.Item label="推荐问题" required>
              <Flex vertical gap="small">
                {fields.map((field) => (
                  <Flex key={field.key} gap="small" align="center">
                    <Form.Item name={[field.name, "key"]} hidden><Input /></Form.Item>
                    <Form.Item
                      name={[field.name, "description"]}
                      rules={[{ required: true, whitespace: true }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <Input placeholder="用户可直接点击的问题" />
                    </Form.Item>
                    <Button
                      type="text"
                      danger
                      aria-label="删除推荐问题"
                      icon={<MinusCircleOutlined />}
                      onClick={() => remove(field.name)}
                    />
                  </Flex>
                ))}
                <Button
                  type="dashed"
                  icon={<PlusOutlined />}
                  onClick={() =>
                    add({ key: `prompt-${Date.now()}`, description: "" })
                  }
                >
                  新增推荐问题
                </Button>
              </Flex>
            </Form.Item>
          )}
        </Form.List>
      </Form>
    </Modal>
  );
}

export default function PlatformAssistantConfigPage() {
  const { styles } = usePlatformAssistantConfigStyles();
  const [form] = Form.useForm<PlatformAssistantConfig>();
  const [publishForm] = Form.useForm<{ changeNote: string }>();
  const [trialForm] = Form.useForm<{
    role: UserRole;
    capabilityId: AssistantCapabilityId;
    studentId: string;
    question: string;
  }>();
  const [config, setConfig] = useState<PlatformAssistantConfig | null>(null);
  const [currentUser, setCurrentUser] = useState<CurrentUser>();
  const [auditLogs, setAuditLogs] = useState<PlatformAssistantAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [trialPassed, setTrialPassed] = useState(false);
  const [editingCapability, setEditingCapability] =
    useState<AssistantCapability | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [trialConfig, setTrialConfig] =
    useState<PlatformAssistantConfig | null>(null);
  const [trialResult, setTrialResult] =
    useState<PlatformAssistantTrialResult>();
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [publishOpen, setPublishOpen] = useState(false);
  const [pendingPublishConfig, setPendingPublishConfig] =
    useState<PlatformAssistantConfig | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<string>();
  const [versions, setVersions] = useState<PlatformAssistantVersion[]>([]);

  const canView = currentUser?.permissions.includes(
    "platformAssistantConfig.view",
  );
  const canEdit = currentUser?.permissions.includes(
    "platformAssistantConfig.edit",
  );
  const canPublish = currentUser?.permissions.includes(
    "platformAssistantConfig.publish",
  );
  const canRollback = currentUser?.permissions.includes(
    "platformAssistantConfig.rollback",
  );

  async function refreshAuditLogs() {
    setAuditLogs(await aiConfigApi.listPlatformAssistantAuditLogs());
  }

  async function loadPage() {
    setLoading(true);
    setLoadError(undefined);
    try {
      const user = await toolbarApi.getCurrentUser();
      setCurrentUser(user);
      if (!user.permissions.includes("platformAssistantConfig.view")) return;
      const [nextConfig, nextAuditLogs] = await Promise.all([
        aiConfigApi.getPlatformAssistantConfig(),
        aiConfigApi.listPlatformAssistantAuditLogs(),
      ]);
      setConfig(nextConfig);
      setAuditLogs(nextAuditLogs);
      form.setFieldsValue(nextConfig);
      setTrialPassed(Boolean(nextConfig.lastSuccessfulTrialAt));
      setDirty(false);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "配置加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, []);

  function markChanged() {
    setDirty(true);
    setTrialPassed(false);
  }

  async function buildCurrentConfig() {
    if (!config) return null;
    try {
      await form.validateFields();
      const values = form.getFieldsValue(true) as PlatformAssistantConfig;
      const nextConfig: PlatformAssistantConfig = {
        ...config,
        basic: {
          ...config.basic,
          ...values.basic,
          fallbackMessages: {
            ...config.basic.fallbackMessages,
            ...values.basic?.fallbackMessages,
          },
        },
        capabilities: structuredClone(config.capabilities),
        roleGrants: structuredClone(config.roleGrants),
        responsePolicy: {
          ...config.responsePolicy,
          ...values.responsePolicy,
          externalDraftRequiresReview: true,
        },
      };
      const error = validatePlatformAssistantConfiguration(nextConfig);
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

  function applyServerConfig(nextConfig: PlatformAssistantConfig) {
    setConfig(nextConfig);
    form.setFieldsValue(nextConfig);
    setDirty(false);
    setTrialPassed(Boolean(nextConfig.lastSuccessfulTrialAt));
  }

  async function saveDraft() {
    const nextConfig = await buildCurrentConfig();
    if (!nextConfig) return;
    setSaving(true);
    try {
      applyServerConfig(
        await aiConfigApi.savePlatformAssistantDraft(nextConfig),
      );
      await refreshAuditLogs();
      message.success("草稿已保存");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSaving(false);
    }
  }

  async function openTrial() {
    const nextConfig = await buildCurrentConfig();
    if (!nextConfig) return;
    setTrialConfig(nextConfig);
    setTrialResult(undefined);
    setTrialOpen(true);
    trialForm.setFieldsValue({
      role: currentUser?.role.id ?? "studentManager",
      capabilityId:
        nextConfig.capabilities.find((item) => item.enabled)?.id ??
        "studentLearning",
      question: "查询李明近 30 天的学习情况",
    });
    try {
      setStudents(await assistantApi.searchStudents());
      trialForm.setFieldValue("studentId", "student-li-ming");
    } catch {
      message.error("试运行学生列表加载失败");
    }
  }

  async function runTrial() {
    if (!trialConfig) return;
    const values = await trialForm.validateFields();
    setTrialLoading(true);
    try {
      const result = await aiConfigApi.trialPlatformAssistant({
        config: trialConfig,
        ...values,
      });
      setTrialResult(result);
      setTrialPassed(result.success);
      await refreshAuditLogs();
      if (result.success) message.success("当前配置试运行通过");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "试运行失败");
    } finally {
      setTrialLoading(false);
    }
  }

  async function openPublish() {
    const nextConfig = await buildCurrentConfig();
    if (!nextConfig) return;
    if (!trialPassed) {
      message.warning("请先使用当前配置完成一次成功试运行");
      return;
    }
    setPendingPublishConfig(nextConfig);
    publishForm.resetFields();
    setPublishOpen(true);
  }

  async function publishConfig() {
    if (!pendingPublishConfig) return;
    const { changeNote } = await publishForm.validateFields();
    setPublishing(true);
    try {
      const published = await aiConfigApi.publishPlatformAssistant(
        pendingPublishConfig,
        changeNote.trim(),
      );
      applyServerConfig(published);
      setPublishOpen(false);
      setPendingPublishConfig(null);
      await refreshAuditLogs();
      message.success(`${published.publishedVersion} 已发布`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "发布失败");
    } finally {
      setPublishing(false);
    }
  }

  async function openHistory() {
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      setVersions(await aiConfigApi.listPlatformAssistantVersions());
    } catch {
      message.error("版本记录加载失败");
    } finally {
      setHistoryLoading(false);
    }
  }

  async function rollback(version: string) {
    setRollbackLoading(version);
    try {
      const rolledBack = await aiConfigApi.rollbackPlatformAssistant(version);
      applyServerConfig(rolledBack);
      setVersions(await aiConfigApi.listPlatformAssistantVersions());
      await refreshAuditLogs();
      message.success(`已回滚并发布 ${rolledBack.publishedVersion}`);
    } catch (error) {
      message.error(error instanceof Error ? error.message : "回滚失败");
    } finally {
      setRollbackLoading(undefined);
    }
  }

  function saveCapability(nextCapability: AssistantCapability) {
    setConfig((current) =>
      current
        ? {
            ...current,
            capabilities: current.capabilities.map((item) =>
              item.id === nextCapability.id ? nextCapability : item,
            ),
          }
        : current,
    );
    markChanged();
  }

  function toggleRoleGrant(
    role: UserRole,
    capabilityId: AssistantCapabilityId,
    granted: boolean,
  ) {
    setConfig((current) => {
      if (!current) return current;
      return {
        ...current,
        roleGrants: current.roleGrants.map((grant) => {
          if (grant.role !== role) return grant;
          const ids = new Set(grant.capabilityIds);
          if (granted) ids.add(capabilityId);
          else ids.delete(capabilityId);
          return { ...grant, capabilityIds: Array.from(ids) };
        }),
      };
    });
    markChanged();
  }

  const capabilityColumns: ProColumns<AssistantCapability>[] = [
    {
      title: "能力",
      dataIndex: "name",
      width: 250,
      render: (_, record) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{record.name}</Typography.Text>
          <Typography.Text
            type="secondary"
            ellipsis={{ tooltip: record.description }}
            className={styles.capabilityDescription}
          >
            {record.description}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "数据源",
      dataIndex: "dataSources",
      width: 300,
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.dataSources.map((source) => <Tag key={source}>{source}</Tag>)}
        </Space>
      ),
    },
    {
      title: "输出形式",
      dataIndex: "outputType",
      width: 130,
      renderText: (value) => outputTypeLabels[value] ?? value,
    },
    {
      title: "引用要求",
      width: 170,
      render: (_, record) => (
        <Space size={[0, 4]} wrap>
          {record.requireSources ? <Tag color="blue">来源</Tag> : null}
          {record.requireDataTimestamp ? <Tag color="cyan">数据时间</Tag> : null}
        </Space>
      ),
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 110,
      render: (_, record) => (
        <Switch
          checked={record.enabled}
          disabled={!canEdit}
          checkedChildren="已启用"
          unCheckedChildren="已停用"
          onChange={(enabled) => saveCapability({ ...record, enabled })}
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 90,
      fixed: "right",
      render: (_, record) => [
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => setEditingCapability(record)}
        >
          编辑
        </Button>,
      ],
    },
  ];

  const auditColumns: ProColumns<PlatformAssistantAuditLog>[] = [
    {
      title: "时间",
      dataIndex: "occurredAt",
      width: 170,
      sorter: (left, right) => left.occurredAt.localeCompare(right.occurredAt),
    },
    {
      title: "事件",
      dataIndex: "action",
      width: 130,
      render: (_, record) => {
        const meta = auditActionMeta[record.action];
        return <Tag color={meta.color}>{meta.label}</Tag>;
      },
    },
    { title: "详情", dataIndex: "summary", ellipsis: true },
    {
      title: "操作人 / 岗位",
      width: 160,
      render: (_, record) => `${record.operator} / ${roleMeta[record.role]}`,
    },
    { title: "版本", dataIndex: "configVersion", width: 110 },
    { title: "请求 ID", dataIndex: "requestId", width: 210, copyable: true },
  ];

  if (loading) {
    return (
      <PageContainer title={false}>
        <Flex align="center" justify="center" style={{ minHeight: 360 }}>
          <Spin size="large" description="正在加载配置" />
        </Flex>
      </PageContainer>
    );
  }

  if (!canView) {
    return (
      <PageContainer title={false}>
        <Result status="403" title="暂无权限" subTitle="请联系 AI 平台管理员开通配置查看权限。" />
      </PageContainer>
    );
  }

  if (loadError || !config) {
    return (
      <PageContainer title={false}>
        <Card>
          <Empty description={loadError ?? "配置加载失败"}>
            <Button type="primary" onClick={() => void loadPage()}>重新加载</Button>
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

  const roleRows: RoleRow[] = Object.entries(roleMeta).map(([role, label]) => ({
    key: role as UserRole,
    role: role as UserRole,
    label,
  }));
  const roleColumns: TableProps<RoleRow>["columns"] = [
    {
      title: "岗位角色",
      dataIndex: "label",
      fixed: "left",
      width: 130,
      render: (label) => <Typography.Text strong>{label}</Typography.Text>,
    },
    ...[...config.capabilities]
      .sort((left, right) => left.order - right.order)
      .map((capability) => ({
        title: (
          <Tooltip title={capability.description}>
            <span>{capability.name}</span>
          </Tooltip>
        ),
        key: capability.id,
        width: 140,
        align: "center" as const,
        render: (_: unknown, row: RoleRow) => {
          const checked = config.roleGrants
            .find((grant) => grant.role === row.role)
            ?.capabilityIds.includes(capability.id);
          return (
            <Switch
              aria-label={`${row.label}-${capability.name}`}
              checked={checked}
              disabled={!canEdit || !capability.enabled}
              onChange={(value) =>
                toggleRoleGrant(row.role, capability.id, value)
              }
            />
          );
        },
      })),
  ];

  const basicContent = (
    <div className={styles.sectionStack}>
      <Alert
        showIcon
        type="info"
        title="基础设置会同步到完整助手页与全局侧边助手。"
      />
      <Card size="small" title="助手展示">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item name={["basic", "name"]} label="助手名称" rules={[{ required: true, whitespace: true }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item name={["basic", "avatarUrl"]} label="头像地址">
              <Input placeholder="可选，使用 HTTPS 图片地址" />
            </Form.Item>
          </Col>
        </Row>
        <Form.Item name={["basic", "welcomeMessage"]} label="欢迎语" rules={[{ required: true, whitespace: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name={["basic", "description"]} label="能力简介" rules={[{ required: true, whitespace: true }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name={["basic", "disclaimer"]} label="统一声明" rules={[{ required: true, whitespace: true }]}>
          <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
        </Form.Item>
        <Form.Item name={["basic", "historyEnabled"]} label="历史会话" valuePropName="checked">
          <Switch checkedChildren="已开启" unCheckedChildren="已关闭" />
        </Form.Item>
      </Card>
      <Card size="small" title="统一异常提示">
        <Row gutter={16}>
          <Col xs={24} lg={8}>
            <Form.Item name={["basic", "fallbackMessages", "noData"]} label="数据不足" rules={[{ required: true, whitespace: true }]}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
            </Form.Item>
          </Col>
          <Col xs={24} lg={8}>
            <Form.Item name={["basic", "fallbackMessages", "forbidden"]} label="无权限" rules={[{ required: true, whitespace: true }]}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
            </Form.Item>
          </Col>
          <Col xs={24} lg={8}>
            <Form.Item name={["basic", "fallbackMessages", "serviceError"]} label="服务异常" rules={[{ required: true, whitespace: true }]}>
              <Input.TextArea autoSize={{ minRows: 3, maxRows: 5 }} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </div>
  );

  const capabilityContent = (
    <div className={styles.sectionStack}>
      <Alert
        showIcon
        type="info"
        title="客诉评分和续费条件规则继续在对应专项页面管理；平台助手只消费已发布结果。"
      />
      <ProTable<AssistantCapability>
        rowKey="id"
        headerTitle={`已注册能力（${config.capabilities.length}）`}
        columns={capabilityColumns}
        dataSource={[...config.capabilities].sort((left, right) => left.order - right.order)}
        search={false}
        options={false}
        pagination={false}
        cardBordered
        scroll={{ x: 1100 }}
      />
    </div>
  );

  const grantContent = (
    <div className={styles.sectionStack}>
      <Alert
        showIcon
        type="warning"
        title="这里只决定岗位能否使用 AI 能力。学生、订单和沟通记录等数据范围仍由原业务接口实时校验。"
        description="AI 功能授权与业务数据权限取交集，本页配置不能扩大数据访问范围。"
      />
      <Card size="small" title="岗位 × AI 能力">
        <Table<RoleRow>
          rowKey="key"
          columns={roleColumns}
          dataSource={roleRows}
          pagination={false}
          scroll={{ x: 980 }}
          size="middle"
        />
      </Card>
    </div>
  );

  const responseContent = (
    <div className={styles.sectionStack}>
      <Card size="small" title="结构化回复策略">
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item name={["responsePolicy", "tone"]} label="回复语气" rules={[{ required: true }]}>
              <Select options={[
                { value: "professional", label: "专业克制" },
                { value: "friendly", label: "友好亲和" },
                { value: "concise", label: "简洁直接" },
              ]} />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item name={["responsePolicy", "detailLevel"]} label="详细程度" rules={[{ required: true }]}>
              <Select options={[
                { value: "brief", label: "简要" },
                { value: "standard", label: "标准" },
                { value: "detailed", label: "详细" },
              ]} />
            </Form.Item>
          </Col>
        </Row>
        <Row gutter={16}>
          <Col xs={24} lg={12}>
            <Form.Item name={["responsePolicy", "requireSources"]} label="强制展示数据来源" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item name={["responsePolicy", "requireDataTimestamp"]} label="强制标明数据时间" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item name={["responsePolicy", "refuseWhenDataMissing"]} label="数据不足时禁止推测" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Col>
          <Col xs={24} lg={12}>
            <Form.Item label="对外草稿必须人工确认">
              <Switch checked disabled />
            </Form.Item>
          </Col>
        </Row>
      </Card>
      <Card size="small" title="高级设置 · 系统角色与安全边界" className={styles.promptCard}>
        <Alert
          showIcon
          type="warning"
          title="底层指令修改后必须重新试运行才能发布。"
          style={{ marginBottom: 16 }}
        />
        <Form.Item
          name={["responsePolicy", "systemPrompt"]}
          rules={[{ required: true, whitespace: true }]}
          extra={!canPublish ? "仅具备发布权限的高级管理员可修改。" : undefined}
        >
          <Input.TextArea
            aria-label="系统角色与安全边界"
            autoSize={{ minRows: 7, maxRows: 14 }}
            disabled={!canEdit || !canPublish}
          />
        </Form.Item>
      </Card>
    </div>
  );

  return (
    <PageContainer
      className={styles.page}
      extra={[
        <Button key="trial" icon={<ExperimentOutlined />} disabled={!canEdit} onClick={() => void openTrial()}>配置试跑</Button>,
        <Button key="history" icon={<HistoryOutlined />} onClick={() => void openHistory()}>版本记录</Button>,
        <Button key="save" icon={<SaveOutlined />} loading={saving} disabled={!canEdit} onClick={() => void saveDraft()}>保存草稿</Button>,
        <Tooltip key="publish" title={!trialPassed ? "当前配置需先通过试运行" : undefined}>
          <Button type="primary" icon={<SendOutlined />} disabled={!canPublish || !trialPassed} onClick={() => void openPublish()}>发布配置</Button>
        </Tooltip>,
      ]}
    >
      <Form<PlatformAssistantConfig>
        form={form}
        layout="vertical"
        disabled={!canEdit}
        onValuesChange={markChanged}
      >
        <div className={styles.content}>
          <Card className={styles.statusCard}>
            <Descriptions
              size="small"
              column={{ xs: 1, sm: 2, lg: 5 }}
              items={[
                { key: "published", label: "当前生效版本", children: <Tag color="blue">{config.publishedVersion}</Tag> },
                { key: "draft", label: "当前草稿", children: config.draftVersion },
                { key: "status", label: "配置状态", children: statusTag },
                {
                  key: "trial",
                  label: "试运行",
                  children: trialPassed ? <Tag color="success">已通过</Tag> : <Tag color="warning">待验证</Tag>,
                },
                { key: "updated", label: "最近更新", children: `${config.updatedAt} · ${config.updatedBy}` },
              ]}
            />
          </Card>
          <Card styles={{ body: { paddingTop: 8 } }}>
            <Tabs
              items={[
                { key: "basic", label: "基础设置", children: basicContent, forceRender: true },
                { key: "capabilities", label: `能力管理（${config.capabilities.length}）`, children: capabilityContent },
                { key: "grants", label: "功能授权", children: grantContent },
                { key: "response", label: "回复与安全策略", children: responseContent, forceRender: true },
                {
                  key: "audit",
                  label: `审计日志（${auditLogs.length}）`,
                  children: (
                    <ProTable<PlatformAssistantAuditLog>
                      rowKey="id"
                      headerTitle="平台助手配置与访问审计"
                      columns={auditColumns}
                      dataSource={auditLogs}
                      search={false}
                      options={false}
                      pagination={{ pageSize: 10 }}
                      scroll={{ x: 1050 }}
                    />
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </Form>

      <CapabilityEditor
        open={Boolean(editingCapability)}
        capability={editingCapability}
        disabled={!canEdit}
        onClose={() => setEditingCapability(null)}
        onSave={saveCapability}
      />

      <Drawer
        title="平台助手配置试跑"
        open={trialOpen}
        size="min(760px, 100vw)"
        onClose={() => setTrialOpen(false)}
        extra={<Button type="primary" loading={trialLoading} onClick={() => void runTrial()}>开始试跑</Button>}
      >
        <Alert
          showIcon
          type="info"
          title="模拟岗位只影响 AI 功能授权；可选学生仍以当前操作人的真实数据权限为上限。"
          style={{ marginBottom: 20 }}
        />
        <Form form={trialForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="role" label="模拟岗位" rules={[{ required: true }]}>
                <Select options={roleOptions} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="capabilityId" label="验证能力" rules={[{ required: true }]}>
                <Select options={trialConfig?.capabilities.filter((item) => item.enabled).map((item) => ({ value: item.id, label: item.name }))} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="studentId" label="真实学生" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={students.map((student) => ({ value: student.id, label: student.name }))} />
          </Form.Item>
          <Form.Item name="question" label="测试问题" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
          </Form.Item>
        </Form>
        {trialResult ? (
          <Card className={styles.trialResult} title="试运行结果" size="small">
            <Descriptions
              size="small"
              column={2}
              items={[
                { key: "capability", label: "命中能力", children: trialResult.capabilityName },
                { key: "role", label: "模拟岗位", children: roleMeta[trialResult.role] },
                { key: "ai", label: "AI 功能授权", children: trialResult.aiAuthorized ? <Tag color="success">通过</Tag> : <Tag color="error">拒绝</Tag> },
                { key: "data", label: "业务数据权限", children: trialResult.businessDataAuthorized ? <Tag color="success">通过</Tag> : <Tag color="error">拒绝</Tag> },
                { key: "sources", label: "调用数据源", span: 2, children: <Space size={[0, 4]} wrap>{trialResult.dataSources.map((source) => <Tag key={source}>{source}</Tag>)}</Space> },
              ]}
            />
            <Alert
              showIcon
              type={trialResult.success ? "success" : "warning"}
              title={trialResult.answer}
              description={trialResult.sources.length ? `结果来源：${trialResult.sources.map((source) => source.label).join("、")}` : undefined}
              style={{ marginTop: 16 }}
            />
          </Card>
        ) : null}
      </Drawer>

      <Modal
        title="发布平台助手配置"
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
          title="发布后，新会话立即使用新版本，已有会话从下一次提问起使用新版本。"
          style={{ marginBottom: 16 }}
        />
        <Form form={publishForm} layout="vertical">
          <Form.Item name="changeNote" label="变更说明" rules={[{ required: true, whitespace: true }]}>
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} placeholder="说明本次调整的能力、授权或回复策略" />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="平台助手版本记录"
        open={historyOpen}
        size="min(820px, 100vw)"
        onClose={() => setHistoryOpen(false)}
      >
        <ProTable<PlatformAssistantVersion>
          rowKey="version"
          loading={historyLoading}
          search={false}
          options={false}
          pagination={false}
          columns={[
            { title: "版本", dataIndex: "version", width: 100, render: (_, item) => <Tag color={item.status === "current" ? "success" : undefined}>{item.version}</Tag> },
            { title: "变更说明", dataIndex: "changeNote" },
            { title: "发布人", dataIndex: "publishedBy", width: 100 },
            { title: "发布时间", dataIndex: "publishedAt", width: 170 },
            {
              title: "操作",
              valueType: "option",
              width: 90,
              render: (_, item) => item.status === "current" ? null : [
                <Popconfirm
                  key="rollback"
                  title={`回滚至 ${item.version}？`}
                  description="回滚会以该版本创建一个新的已发布版本。"
                  onConfirm={() => void rollback(item.version)}
                >
                  <Button type="link" icon={<RollbackOutlined />} disabled={!canRollback} loading={rollbackLoading === item.version}>回滚</Button>
                </Popconfirm>,
              ],
            },
          ]}
          dataSource={versions}
        />
      </Drawer>
    </PageContainer>
  );
}
