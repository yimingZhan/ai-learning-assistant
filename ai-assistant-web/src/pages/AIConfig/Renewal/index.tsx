import {
  EditOutlined,
  ExperimentOutlined,
  HistoryOutlined,
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
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Spin,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { aiConfigApi, renewalApi } from "../../../api/client";
import type {
  RenewalConditionDiagnosis,
  RenewalConditionRule,
  RenewalConfig,
  RenewalConfigVersion,
  RenewalEvidence,
  RenewalProductMapping,
  RenewalStudentSummary,
  RenewalTrialResult,
} from "../../../api/contracts";
import {
  gradeOptions,
  renewalCategoryMeta,
  renewalCategoryOptions,
  renewalConditionTypeMeta,
  renewalEvidenceSourceMeta,
  renewalRecommendationTypeMeta,
  renewalRuleScopeMeta,
  renewalStatusMeta,
} from "../../../features/renewal/meta";
import { useScrollablePageStyles } from "../../../features/layout/page.styles";

const evidenceOptions = Object.entries(renewalEvidenceSourceMeta).map(
  ([value, label]) => ({ value, label }),
);

const curriculumOptions = ["IGCSE", "A-Level"].map((value) => ({ value, label: value }));
const countryOptions = ["英国", "美国", "中国香港", "新加坡"].map((value) => ({ value, label: value }));
const schoolTierOptions = ["TOP10", "TOP30", "TOP50"].map((value) => ({ value, label: value }));
const majorOptions = ["数学", "物理", "计算机", "经济", "商科"].map((value) => ({ value, label: value }));
const applicationYearOptions = [2027, 2028, 2029, 2030].map((value) => ({ value, label: String(value) }));
const recommendationTypeOptions = Object.entries(renewalRecommendationTypeMeta).map(
  ([value, label]) => ({ value, label }),
);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function RuleEditor({
  open,
  rule,
  onClose,
  onSave,
}: {
  open: boolean;
  rule: RenewalConditionRule | null;
  onClose: () => void;
  onSave: (rule: RenewalConditionRule) => void;
}) {
  const [form] = Form.useForm<RenewalConditionRule>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      rule ?? {
        id: createId("renewal-rule"),
        requirementCode: "",
        scope: "baseline",
        grade: "9年级",
        curricula: [],
        countries: [],
        schoolTiers: [],
        majors: [],
        applicationYears: [],
        category: "language",
        name: "",
        type: "common",
        requirement: "",
        target: "",
        deadline: "",
        evidenceSources: [],
        enabled: true,
      },
    );
  }, [form, open, rule]);

  return (
    <Modal
      title={rule ? "编辑学习要求" : "新增学习要求"}
      open={open}
      width={820}
      okText="保存到当前草稿"
      onCancel={onClose}
      onOk={() =>
        void form.validateFields().then((value) => {
          onSave(value);
          onClose();
        })
      }
    >
      <Alert
        showIcon
        type="info"
        title="基础要求按年级与课程体系生效；目标要求命中后覆盖相同事项编码的基础要求。"
        style={{ marginBottom: 20 }}
      />
      <Form form={form} layout="vertical">
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="scope" label="要求来源" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select options={Object.entries(renewalRuleScopeMeta).map(([value, meta]) => ({ value, label: meta.label }))} />
          </Form.Item>
          <Form.Item name="requirementCode" label="事项编码" rules={[{ required: true, whitespace: true }]} style={{ flex: 1, minWidth: 220 }}>
            <Input placeholder="例如：language-stage" />
          </Form.Item>
          <Form.Item name="grade" label="适用年级" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select options={gradeOptions} />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="category" label="条件大类" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select options={renewalCategoryOptions} />
          </Form.Item>
          <Form.Item name="type" label="条件类型" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select
              options={Object.entries(renewalConditionTypeMeta).map(([value, meta]) => ({ value, label: meta.label }))}
            />
          </Form.Item>
          <Form.Item name="curricula" label="适用课程体系" style={{ flex: 1, minWidth: 220 }}>
            <Select mode="multiple" allowClear options={curriculumOptions} placeholder="为空表示不限" />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="countries" label="目标国家" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={countryOptions} placeholder="目标要求可配置" />
          </Form.Item>
          <Form.Item name="schoolTiers" label="院校梯队" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={schoolTierOptions} placeholder="目标要求可配置" />
          </Form.Item>
          <Form.Item name="majors" label="目标专业" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={majorOptions} placeholder="目标要求可配置" />
          </Form.Item>
          <Form.Item name="applicationYears" label="申请年份" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={applicationYearOptions} placeholder="为空表示不限" />
          </Form.Item>
        </Flex>
        <Form.Item name="name" label="条件事项" rules={[{ required: true, whitespace: true }]}>
          <Input placeholder="例如：阶段语言能力达标" />
        </Form.Item>
        <Form.Item name="requirement" label="判断标准" rules={[{ required: true, whitespace: true }]}>
          <Input.TextArea rows={3} />
        </Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="target" label="目标要求" style={{ flex: 1, minWidth: 260 }}>
            <Input />
          </Form.Item>
          <Form.Item name="deadline" label="建议完成时间" rules={[{ required: true }]} style={{ flex: 1, minWidth: 260 }}>
            <Input />
          </Form.Item>
        </Flex>
        <Form.Item name="evidenceSources" label="证据来源" rules={[{ required: true, type: "array", min: 1 }]}>
          <Select mode="multiple" options={evidenceOptions} />
        </Form.Item>
        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="已启用" unCheckedChildren="已停用" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

function MappingEditor({
  open,
  mapping,
  rules,
  onClose,
  onSave,
}: {
  open: boolean;
  mapping: RenewalProductMapping | null;
  rules: RenewalConditionRule[];
  onClose: () => void;
  onSave: (mapping: RenewalProductMapping) => void;
}) {
  const [form] = Form.useForm<RenewalProductMapping>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      mapping ?? {
        id: createId("renewal-mapping"),
        conditionRuleIds: [],
        productId: createId("product"),
        productName: "",
        productLine: "",
        grades: [],
        curricula: [],
        countries: [],
        schoolTiers: [],
        majors: [],
        prerequisite: "",
        mode: "班课",
        recommendationType: "new",
        suggestedPackage: "",
        enrollmentDeadline: "",
        startDate: "",
        endDate: "",
        standardPrice: undefined,
        sellable: true,
        enabled: true,
      },
    );
  }, [form, mapping, open]);

  const ruleOptions = rules.map((item) => ({
    value: item.id,
    label: `${renewalRuleScopeMeta[item.scope].label} · ${item.grade} · ${renewalCategoryMeta[item.category].label} · ${item.name}`,
  }));

  return (
    <Modal
      title={mapping ? "编辑条件—产品映射" : "新增条件—产品映射"}
      open={open}
      width={860}
      okText="保存到当前草稿"
      onCancel={onClose}
      onOk={() =>
        void form.validateFields().then((value) => {
          onSave(value);
          onClose();
        })
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Form.Item name="productId" hidden><Input /></Form.Item>
        <Form.Item name="conditionRuleIds" label="对应条件" rules={[{ required: true, type: "array", min: 1 }]}>
          <Select mode="multiple" showSearch options={ruleOptions} optionFilterProp="label" />
        </Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true, whitespace: true }]} style={{ flex: 2, minWidth: 280 }}>
            <Input />
          </Form.Item>
          <Form.Item name="productLine" label="产品线" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Input />
          </Form.Item>
          <Form.Item name="mode" label="产品阶段/形态" rules={[{ required: true }]} style={{ flex: 1, minWidth: 160 }}>
            <Select options={["班课", "1V1", "服务产品"].map((value) => ({ value, label: value }))} />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="recommendationType" label="推荐类型" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select options={recommendationTypeOptions} />
          </Form.Item>
          <Form.Item name="suggestedPackage" label="建议规格" rules={[{ required: true, whitespace: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Input placeholder="例如：20课时" />
          </Form.Item>
          <Form.Item name="standardPrice" label="标准价格" style={{ flex: 1, minWidth: 180 }}>
            <InputNumber min={0} precision={0} style={{ width: "100%" }} prefix="¥" placeholder="留空显示价格待补" />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="grades" label="适用年级" rules={[{ required: true, type: "array", min: 1 }]} style={{ flex: 1, minWidth: 240 }}>
            <Select mode="multiple" options={gradeOptions} />
          </Form.Item>
          <Form.Item name="curricula" label="适用课程体系" style={{ flex: 1, minWidth: 240 }}>
            <Select mode="multiple" allowClear options={curriculumOptions} placeholder="为空表示不限" />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="countries" label="目标国家" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={countryOptions} placeholder="为空表示不限" />
          </Form.Item>
          <Form.Item name="schoolTiers" label="院校梯队" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={schoolTierOptions} placeholder="为空表示不限" />
          </Form.Item>
          <Form.Item name="majors" label="目标专业" style={{ flex: 1, minWidth: 180 }}>
            <Select mode="multiple" allowClear options={majorOptions} placeholder="为空表示不限" />
          </Form.Item>
        </Flex>
        <Form.Item name="prerequisite" label="前置要求" rules={[{ required: true, whitespace: true }]}>
          <Input />
        </Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="startDate" label="开班/服务开始日期" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="endDate" label="结课/服务结束日期" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
          <Form.Item name="enrollmentDeadline" label="报名截止日期" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Input placeholder="YYYY-MM-DD" />
          </Form.Item>
        </Flex>
        <Flex gap="large">
          <Form.Item name="sellable" label="可售状态" valuePropName="checked">
            <Switch checkedChildren="可售" unCheckedChildren="不可售" />
          </Form.Item>
          <Form.Item name="enabled" label="映射状态" valuePropName="checked">
            <Switch checkedChildren="已启用" unCheckedChildren="已停用" />
          </Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
}

function TrialDrawer({
  open,
  config,
  onClose,
}: {
  open: boolean;
  config: RenewalConfig | null;
  onClose: () => void;
}) {
  const [students, setStudents] = useState<RenewalStudentSummary[]>([]);
  const [studentId, setStudentId] = useState<string>();
  const [result, setResult] = useState<RenewalTrialResult | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!open) return;
    setResult(null);
    renewalApi.listStudents().then(setStudents).catch(() => message.error("学生列表加载失败"));
  }, [open]);

  const columns: ProColumns<RenewalConditionDiagnosis>[] = [
    { title: "条件", dataIndex: "conditionName", width: 180 },
    {
      title: "状态",
      dataIndex: "status",
      width: 160,
      render: (_, item) => <Tag color={renewalStatusMeta[item.status].color}>{renewalStatusMeta[item.status].label}</Tag>,
    },
    { title: "判断依据", dataIndex: "statusReason", width: 280 },
    {
      title: "推荐产品",
      key: "products",
      width: 220,
      render: (_, item) => item.recommendations.map((product) => product.productName).join("、") || "-",
    },
  ];

  return (
    <Drawer title="选择学生试算" open={open} size="min(920px, 100vw)" onClose={onClose}>
      <Flex vertical gap="middle">
        <Alert showIcon type="info" title="试算直接使用当前页面草稿，不会影响续费机会和学生诊断页。" />
        <Space.Compact block>
          <Select
            style={{ width: "100%" }}
            showSearch
            placeholder="选择学生"
            optionFilterProp="label"
            options={students.map((student) => ({ value: student.id, label: `${student.name}（${student.grade}）` }))}
            onChange={setStudentId}
          />
          <Button
            type="primary"
            loading={running}
            disabled={!config || !studentId}
            onClick={async () => {
              if (!config || !studentId) return;
              setRunning(true);
              try {
                setResult(await aiConfigApi.trialRenewal(config, studentId));
              } catch {
                message.error("试算失败");
              } finally {
                setRunning(false);
              }
            }}
          >
            开始试算
          </Button>
        </Space.Compact>
        {result ? (
          <ProTable<RenewalConditionDiagnosis>
            headerTitle={`${result.student.name}的草稿试算结果`}
            columns={columns}
            dataSource={result.conditions}
            rowKey="conditionId"
            search={false}
            pagination={false}
            scroll={{ x: 840 }}
          />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择学生后开始试算" />
        )}
      </Flex>
    </Drawer>
  );
}

export default function RenewalConfigPage() {
  const { styles } = useScrollablePageStyles();
  const [config, setConfig] = useState<RenewalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RenewalConditionRule | null>(null);
  const [mappingEditorOpen, setMappingEditorOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<RenewalProductMapping | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<RenewalConfigVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [publishForm] = Form.useForm<{ changeNote: string }>();

  async function loadConfig() {
    setLoading(true);
    setLoadError(false);
    try {
      setConfig(await aiConfigApi.getRenewalConfig());
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

  function updateConfig(patch: Partial<RenewalConfig>) {
    setConfig((current) => (current ? { ...current, ...patch } : current));
    setDirty(true);
  }

  const ruleOptionsById = useMemo(
    () => new Map(config?.conditionRules.map((rule) => [rule.id, rule]) ?? []),
    [config],
  );

  const ruleColumns: ProColumns<RenewalConditionRule>[] = [
    {
      title: "要求来源",
      dataIndex: "scope",
      width: 110,
      render: (_, item) => <Tag color={renewalRuleScopeMeta[item.scope].color}>{renewalRuleScopeMeta[item.scope].label}</Tag>,
    },
    { title: "年级", dataIndex: "grade", width: 90 },
    {
      title: "条件大类",
      dataIndex: "category",
      width: 110,
      render: (_, item) => <Tag>{renewalCategoryMeta[item.category].label}</Tag>,
    },
    {
      title: "条件事项",
      dataIndex: "name",
      width: 220,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{item.name}</Typography.Text>
          <Typography.Text code type="secondary">{item.requirementCode}</Typography.Text>
          <Typography.Text type="secondary" ellipsis={{ tooltip: item.requirement }} style={{ maxWidth: 260 }}>
            {item.requirement}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "适用画像",
      key: "audience",
      width: 260,
      render: (_, item) => {
        const values = [
          ...item.curricula,
          ...item.countries,
          ...item.schoolTiers,
          ...item.majors,
          ...item.applicationYears.map(String),
        ];
        return values.length ? <Space size={[4, 4]} wrap>{values.map((value) => <Tag key={value}>{value}</Tag>)}</Space> : "不限";
      },
    },
    {
      title: "条件类型",
      dataIndex: "type",
      width: 140,
      render: (_, item) => <Tag color={renewalConditionTypeMeta[item.type].color}>{renewalConditionTypeMeta[item.type].label}</Tag>,
    },
    { title: "目标要求", dataIndex: "target", width: 210 },
    { title: "建议完成时间", dataIndex: "deadline", width: 170 },
    {
      title: "证据来源",
      dataIndex: "evidenceSources",
      width: 220,
      render: (_, item) => <Space size={[4, 4]} wrap>{item.evidenceSources.map((source) => <Tag key={source}>{renewalEvidenceSourceMeta[source]}</Tag>)}</Space>,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (_, item) => (
        <Switch
          size="small"
          checked={item.enabled}
          onChange={(enabled) =>
            updateConfig({
              conditionRules: config?.conditionRules.map((rule) => rule.id === item.id ? { ...rule, enabled } : rule),
            })
          }
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 90,
      fixed: "right",
      render: (_, item) => [
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingRule(item); setRuleEditorOpen(true); }}>编辑</Button>,
      ],
    },
  ];

  const mappingColumns: ProColumns<RenewalProductMapping>[] = [
    {
      title: "对应条件",
      key: "rules",
      width: 300,
      render: (_, item) => (
        <Space size={[4, 4]} wrap>
          {item.conditionRuleIds.slice(0, 3).map((id) => {
            const rule = ruleOptionsById.get(id);
            return <Tag key={id}>{rule ? `${renewalRuleScopeMeta[rule.scope].label}·${rule.grade}·${renewalCategoryMeta[rule.category].label}` : id}</Tag>;
          })}
          {item.conditionRuleIds.length > 3 ? <Tag>+{item.conditionRuleIds.length - 3}</Tag> : null}
        </Space>
      ),
    },
    {
      title: "产品",
      dataIndex: "productName",
      width: 240,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{item.productName}</Typography.Text>
          <Typography.Text type="secondary">
            {item.productLine} · {item.mode} · {renewalRecommendationTypeMeta[item.recommendationType]}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "建议规格 / 价格",
      key: "pricing",
      width: 180,
      render: (_, item) => (
        <Space orientation="vertical" size={0}>
          <Typography.Text>{item.suggestedPackage}</Typography.Text>
          <Typography.Text type="secondary">{item.standardPrice === undefined ? "价格待补" : `¥${item.standardPrice.toLocaleString("zh-CN")}`}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "适用画像",
      key: "audience",
      width: 260,
      render: (_, item) => (
        <Space size={[4, 4]} wrap>
          {[...item.grades, ...item.curricula, ...item.countries, ...item.schoolTiers, ...item.majors].map((value) => <Tag key={value}>{value}</Tag>)}
        </Space>
      ),
    },
    { title: "前置要求", dataIndex: "prerequisite", width: 220 },
    { title: "课程周期", key: "period", width: 210, render: (_, item) => `${item.startDate}—${item.endDate}` },
    { title: "报名截止", dataIndex: "enrollmentDeadline", width: 120 },
    {
      title: "可售",
      dataIndex: "sellable",
      width: 80,
      render: (_, item) => <Tag color={item.sellable ? "success" : "default"}>{item.sellable ? "可售" : "不可售"}</Tag>,
    },
    {
      title: "状态",
      dataIndex: "enabled",
      width: 90,
      render: (_, item) => (
        <Switch
          size="small"
          checked={item.enabled}
          onChange={(enabled) => updateConfig({ productMappings: config?.productMappings.map((mapping) => mapping.id === item.id ? { ...mapping, enabled } : mapping) })}
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 90,
      fixed: "right",
      render: (_, item) => [
        <Button key="edit" type="link" icon={<EditOutlined />} onClick={() => { setEditingMapping(item); setMappingEditorOpen(true); }}>编辑</Button>,
      ],
    },
  ];

  if (loading) {
    return <PageContainer className={styles.scrollPage} title="续费规则配置"><Flex align="center" justify="center" style={{ minHeight: 360 }}><Spin size="large" description="正在加载配置" /></Flex></PageContainer>;
  }

  if (loadError || !config) {
    return <PageContainer className={styles.scrollPage} title="续费规则配置"><Empty description="配置加载失败"><Button type="primary" onClick={() => void loadConfig()}>重新加载</Button></Empty></PageContainer>;
  }

  const statusTag = dirty ? <Tag color="warning">有未保存修改</Tag> : config.draftStatus === "saved" ? <Tag color="processing">草稿已保存</Tag> : <Tag color="success">已发布</Tag>;

  return (
    <PageContainer
      className={styles.scrollPage}
      title="续费规则配置"
      content="维护基础要求、目标要求与产品适用画像。规则引擎产生诊断结论，AI只解释合规候选。"
      tags={<Space>{statusTag}<Tag>{config.publishedVersion}</Tag><Tag>{config.draftVersion}</Tag></Space>}
      extra={
        <Space wrap>
          <Button icon={<HistoryOutlined />} onClick={async () => { setHistoryOpen(true); setHistoryLoading(true); try { setVersions(await aiConfigApi.listRenewalVersions()); } finally { setHistoryLoading(false); } }}>版本记录</Button>
          <Button icon={<ExperimentOutlined />} onClick={() => setTrialOpen(true)}>选择学生试算</Button>
          <Button icon={<SaveOutlined />} loading={saving} onClick={async () => { setSaving(true); try { const saved = await aiConfigApi.saveRenewalDraft(config); setConfig(saved); setDirty(false); message.success("草稿已保存"); } catch { message.error("保存失败，页面修改已保留"); } finally { setSaving(false); } }}>保存草稿</Button>
          <Button type="primary" icon={<SendOutlined />} onClick={() => { publishForm.resetFields(); setPublishOpen(true); }}>发布版本</Button>
        </Space>
      }
    >
      <Flex vertical gap="middle">
        <Alert
          showIcon
          type="info"
          title="草稿与业务计算隔离：保存草稿不影响续费机会，只有发布后才更新业务页诊断结果。"
        />
        <Tabs
          items={[
            {
              key: "rules",
              label: `学习要求（${config.conditionRules.length}）`,
              children: (
                <ProTable<RenewalConditionRule>
                  headerTitle="基础要求与目标要求"
                  toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRule(null); setRuleEditorOpen(true); }}>新增学习要求</Button>]}
                  columns={ruleColumns}
                  dataSource={config.conditionRules}
                  rowKey="id"
                  search={false}
                  pagination={{ defaultPageSize: 8, showSizeChanger: true }}
                  scroll={{ x: 1760 }}
                />
              ),
            },
            {
              key: "mappings",
              label: `条件—产品映射（${config.productMappings.length}）`,
              children: (
                <Flex vertical gap="middle">
                  <Alert showIcon type="warning" title="一个条件可对应多个备选产品；已购、不可售、过期、年级不适用或无法覆盖考试节点的产品会被过滤。" />
                  <ProTable<RenewalProductMapping>
                    headerTitle="条件—产品映射"
                    toolBarRender={() => [<Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => { setEditingMapping(null); setMappingEditorOpen(true); }}>新增映射</Button>]}
                    columns={mappingColumns}
                    dataSource={config.productMappings}
                    rowKey="id"
                    search={false}
                    pagination={false}
                    scroll={{ x: 1840 }}
                  />
                </Flex>
              ),
            },
          ]}
        />
      </Flex>

      <RuleEditor
        open={ruleEditorOpen}
        rule={editingRule}
        onClose={() => setRuleEditorOpen(false)}
        onSave={(rule) => updateConfig({ conditionRules: config.conditionRules.some((item) => item.id === rule.id) ? config.conditionRules.map((item) => item.id === rule.id ? rule : item) : [...config.conditionRules, rule] })}
      />
      <MappingEditor
        open={mappingEditorOpen}
        mapping={editingMapping}
        rules={config.conditionRules}
        onClose={() => setMappingEditorOpen(false)}
        onSave={(mapping) => updateConfig({ productMappings: config.productMappings.some((item) => item.id === mapping.id) ? config.productMappings.map((item) => item.id === mapping.id ? mapping : item) : [...config.productMappings, mapping] })}
      />
      <TrialDrawer open={trialOpen} config={config} onClose={() => setTrialOpen(false)} />

      <Modal
        title="发布续费规则版本"
        open={publishOpen}
        okText="确认发布"
        okButtonProps={{ loading: publishing }}
        onCancel={() => setPublishOpen(false)}
        onOk={async () => {
          const { changeNote } = await publishForm.validateFields();
          setPublishing(true);
          try {
            const published = await aiConfigApi.publishRenewal(config, changeNote.trim());
            setConfig(published);
            setDirty(false);
            setPublishOpen(false);
            message.success(`${published.publishedVersion} 已发布，业务页已生效`);
          } catch {
            message.error("发布失败");
          } finally {
            setPublishing(false);
          }
        }}
      >
        <Alert showIcon type="warning" title="发布后将立即影响续费机会和学生条件诊断页的规则计算。" style={{ marginBottom: 20 }} />
        <Form form={publishForm} layout="vertical">
          <Form.Item name="changeNote" label="版本说明" rules={[{ required: true, whitespace: true, message: "请输入版本说明" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer title="续费规则版本记录" open={historyOpen} size="min(760px, 100vw)" onClose={() => setHistoryOpen(false)}>
        <Spin spinning={historyLoading}>
          <ProTable<RenewalConfigVersion>
            columns={[
              { title: "版本", dataIndex: "version", width: 90, render: (_, item) => <Tag color={item.status === "current" ? "success" : undefined}>{item.version}</Tag> },
              { title: "变更说明", dataIndex: "changeNote" },
              { title: "发布人", dataIndex: "publishedBy", width: 100 },
              { title: "发布时间", dataIndex: "publishedAt", width: 160 },
              {
                title: "操作",
                valueType: "option",
                width: 90,
                render: (_, item) => item.status === "history" ? [
                  <Button
                    key="rollback"
                    type="link"
                    icon={<RollbackOutlined />}
                    onClick={() => Modal.confirm({
                      title: `回滚至 ${item.version}？`,
                      content: "回滚会以该版本配置创建一个新的已发布版本。",
                      okText: "确认回滚",
                      onOk: async () => {
                        const rolledBack = await aiConfigApi.rollbackRenewal(item.version);
                        setConfig(rolledBack);
                        setDirty(false);
                        setVersions(await aiConfigApi.listRenewalVersions());
                        message.success(`已回滚并发布 ${rolledBack.publishedVersion}`);
                      },
                    })}
                  >回滚</Button>,
                ] : [],
              },
            ]}
            dataSource={versions}
            rowKey="version"
            search={false}
            pagination={false}
          />
        </Spin>
      </Drawer>
    </PageContainer>
  );
}
