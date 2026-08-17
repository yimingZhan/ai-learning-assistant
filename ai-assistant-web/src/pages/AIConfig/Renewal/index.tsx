import {
  ExperimentOutlined,
  FilterOutlined,
  HistoryOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
  SearchOutlined,
  SendOutlined,
} from "@ant-design/icons";
import { PageContainer, ProTable, type ProColumns } from "@ant-design/pro-components";
import {
  Alert,
  Button,
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
  RenewalProductMapping,
  RenewalStudentSummary,
  RenewalTrialResult,
} from "../../../api/contracts";
import { useScrollablePageStyles } from "../../../features/layout/page.styles";
import {
  formatCriteria,
  renewalGoalDimensionMeta,
  renewalRuleLevelMeta,
  validateRenewalRules,
} from "../../../features/renewal/goalRules";
import {
  gradeOptions,
  renewalRecommendationTypeMeta,
  renewalStatusMeta,
} from "../../../features/renewal/meta";
import { GoalWorkbench } from "./GoalWorkbench";
import { useRenewalConfigStyles } from "./index.styles";

const curriculumOptions = ["IGCSE", "A-Level", "IB", "AP"].map((value) => ({ value, label: value }));
const countryOptions = ["英国", "美国", "加拿大", "澳大利亚", "中国香港", "新加坡"].map((value) => ({ value, label: value }));
const schoolTierOptions = ["G5", "TOP10", "TOP30", "TOP50"].map((value) => ({ value, label: value }));
const majorOptions = ["数学", "物理", "化学", "生物", "计算机", "经济", "商科", "管理", "工程", "法律", "人文社科"].map((value) => ({ value, label: value }));
const recommendationTypeOptions = Object.entries(renewalRecommendationTypeMeta).map(
  ([value, label]) => ({ value, label }),
);

function createId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function describeMappingRule(rule: RenewalConditionRule) {
  return `${renewalGoalDimensionMeta[rule.dimension].label} ${renewalRuleLevelMeta[rule.level].label} ${rule.name}`;
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
    label: `${item.grade} · ${renewalGoalDimensionMeta[item.dimension].label} · ${renewalRuleLevelMeta[item.level].label} · ${item.name}`,
  }));

  return (
    <Modal
      title={mapping ? "编辑条件—产品映射" : "新增条件—产品映射"}
      open={open}
      width={860}
      okText="保存到当前草稿"
      onCancel={onClose}
      onOk={() => void form.validateFields().then((value) => { onSave(value); onClose(); })}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Form.Item name="productId" hidden><Input /></Form.Item>
        <Form.Item name="conditionRuleIds" label="对应条件" rules={[{ required: true, type: "array", min: 1 }]}>
          <Select mode="multiple" showSearch options={ruleOptions} optionFilterProp="label" />
        </Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="productName" label="产品名称" rules={[{ required: true, whitespace: true }]} style={{ flex: 2, minWidth: 280 }}><Input /></Form.Item>
          <Form.Item name="productLine" label="产品线" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}><Input /></Form.Item>
          <Form.Item name="mode" label="产品阶段/形态" rules={[{ required: true }]} style={{ flex: 1, minWidth: 160 }}>
            <Select options={["班课", "1V1", "服务产品"].map((value) => ({ value, label: value }))} />
          </Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="recommendationType" label="推荐类型" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}><Select options={recommendationTypeOptions} /></Form.Item>
          <Form.Item name="suggestedPackage" label="建议规格" rules={[{ required: true, whitespace: true }]} style={{ flex: 1, minWidth: 180 }}><Input placeholder="例如：20课时" /></Form.Item>
          <Form.Item name="standardPrice" label="标准价格" style={{ flex: 1, minWidth: 180 }}><InputNumber min={0} precision={0} style={{ width: "100%" }} prefix="¥" placeholder="留空显示价格待补" /></Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="grades" label="适用年级" rules={[{ required: true, type: "array", min: 1 }]} style={{ flex: 1, minWidth: 240 }}><Select mode="multiple" options={gradeOptions} /></Form.Item>
          <Form.Item name="curricula" label="适用课程体系" style={{ flex: 1, minWidth: 240 }}><Select mode="multiple" allowClear options={curriculumOptions} placeholder="为空表示不限" /></Form.Item>
        </Flex>
        <Flex gap="middle" wrap>
          <Form.Item name="countries" label="留学方向" style={{ flex: 1, minWidth: 180 }}><Select mode="multiple" allowClear options={countryOptions} placeholder="为空表示不限" /></Form.Item>
          <Form.Item name="schoolTiers" label="院校梯队" style={{ flex: 1, minWidth: 180 }}><Select mode="multiple" allowClear options={schoolTierOptions} placeholder="为空表示不限" /></Form.Item>
          <Form.Item name="majors" label="目标专业" style={{ flex: 1, minWidth: 180 }}><Select mode="multiple" allowClear options={majorOptions} placeholder="为空表示不限" /></Form.Item>
        </Flex>
        <Form.Item name="prerequisite" label="前置要求" rules={[{ required: true, whitespace: true }]}><Input /></Form.Item>
        <Flex gap="middle" wrap>
          <Form.Item name="startDate" label="开班/服务开始日期" rules={[{ required: true }]} style={{ flex: 1 }}><Input placeholder="YYYY-MM-DD" /></Form.Item>
          <Form.Item name="endDate" label="结课/服务结束日期" rules={[{ required: true }]} style={{ flex: 1 }}><Input placeholder="YYYY-MM-DD" /></Form.Item>
          <Form.Item name="enrollmentDeadline" label="报名截止日期" rules={[{ required: true }]} style={{ flex: 1 }}><Input placeholder="YYYY-MM-DD" /></Form.Item>
        </Flex>
        <Flex gap="large">
          <Form.Item name="sellable" label="可售状态" valuePropName="checked"><Switch checkedChildren="可售" unCheckedChildren="不可售" /></Form.Item>
          <Form.Item name="enabled" label="映射状态" valuePropName="checked"><Switch checkedChildren="已启用" unCheckedChildren="已停用" /></Form.Item>
        </Flex>
      </Form>
    </Modal>
  );
}

function TrialDrawer({ open, config, onClose }: { open: boolean; config: RenewalConfig | null; onClose: () => void }) {
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
    {
      title: "目标",
      dataIndex: "conditionName",
      width: 210,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{item.conditionName}</Typography.Text>
          <Typography.Text type="secondary">{renewalGoalDimensionMeta[item.dimension].label} · {formatCriteria(item)}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "命中链路",
      key: "sourceChain",
      width: 250,
      render: (_, item) => (
        <Space size={[4, 4]} wrap>
          {item.sourceChain.map((source) => <Tag key={source.ruleId} color={source.effective ? renewalRuleLevelMeta[source.level].color : undefined}>{renewalRuleLevelMeta[source.level].shortLabel}{source.effective ? "·生效" : ""}</Tag>)}
        </Space>
      ),
    },
    { title: "状态", dataIndex: "status", width: 150, render: (_, item) => <Tag color={renewalStatusMeta[item.status].color}>{renewalStatusMeta[item.status].label}</Tag> },
    { title: "判断依据", dataIndex: "statusReason", width: 260 },
    { title: "推荐产品", key: "products", width: 220, render: (_, item) => item.recommendations.map((product) => product.productName).join("、") || "-" },
  ];

  return (
    <Drawer title="选择学生试算" open={open} size="min(1080px, 100vw)" onClose={onClose}>
      <Flex vertical gap="middle">
        <Alert showIcon type="info" title="试算使用当前页面草稿，并展示逐层命中的目标来源；不会影响业务页。" />
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
              try { setResult(await aiConfigApi.trialRenewal(config, studentId)); }
              catch { message.error("试算失败，请检查规则冲突"); }
              finally { setRunning(false); }
            }}
          >开始试算</Button>
        </Space.Compact>
        {result ? (
          <ProTable<RenewalConditionDiagnosis>
            headerTitle={`${result.student.name}的草稿试算结果`}
            columns={columns}
            dataSource={result.conditions}
            rowKey="conditionId"
            search={false}
            pagination={false}
            scroll={{ x: 1090 }}
          />
        ) : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="选择学生后开始试算" />}
      </Flex>
    </Drawer>
  );
}

export default function RenewalConfigPage() {
  const { styles } = useScrollablePageStyles();
  const { styles: renewalStyles } = useRenewalConfigStyles();
  const [config, setConfig] = useState<RenewalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mappingEditorOpen, setMappingEditorOpen] = useState(false);
  const [editingMapping, setEditingMapping] = useState<RenewalProductMapping | null>(null);
  const [trialOpen, setTrialOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [versions, setVersions] = useState<RenewalConfigVersion[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [mappingKeyword, setMappingKeyword] = useState("");
  const [mappingStatus, setMappingStatus] = useState<"all" | "enabled" | "disabled">("all");
  const [publishForm] = Form.useForm<{ changeNote: string }>();

  async function loadConfig() {
    setLoading(true);
    setLoadError(false);
    try { setConfig(await aiConfigApi.getRenewalConfig()); setDirty(false); }
    catch { setLoadError(true); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadConfig(); }, []);

  function updateConfig(patch: Partial<RenewalConfig>) {
    setConfig((current) => current ? { ...current, ...patch } : current);
    setDirty(true);
  }

  const ruleOptionsById = useMemo(
    () => new Map(config?.conditionRules.map((rule) => [rule.id, rule]) ?? []),
    [config],
  );

  if (loading) {
    return <PageContainer className={styles.scrollPage} title={false}><Flex align="center" justify="center" style={{ minHeight: 360 }}><Spin size="large" description="正在加载配置" /></Flex></PageContainer>;
  }
  if (loadError || !config) {
    return <PageContainer className={styles.scrollPage} title={false}><Empty description="配置加载失败"><Button type="primary" onClick={() => void loadConfig()}>重新加载</Button></Empty></PageContainer>;
  }

  const visibleMappings = config.productMappings.filter((item) => {
    const query = mappingKeyword.trim().toLowerCase();
    const ruleText = item.conditionRuleIds
      .map((id) => ruleOptionsById.get(id))
      .filter(Boolean)
      .flatMap((rule) => [rule?.name, rule ? `${rule.grade} ${describeMappingRule(rule)}` : ""])
      .join(" ");
    const searchableText = [
      item.productName,
      item.productLine,
      item.suggestedPackage,
      item.prerequisite,
      ...item.grades,
      ...item.curricula,
      ...item.countries,
      ...item.schoolTiers,
      ...item.majors,
      ruleText,
    ].join(" ").toLowerCase();
    const matchesKeyword = !query || searchableText.includes(query);
    const matchesStatus = mappingStatus === "all" || (mappingStatus === "enabled" ? item.enabled : !item.enabled);
    return matchesKeyword && matchesStatus;
  });

  const mappingColumns: ProColumns<RenewalProductMapping>[] = [
    {
      title: "对应条件",
      key: "rules",
      width: 260,
      render: (_, item) => (
        <Space orientation="vertical" size={3}>
          <Space size={[4, 4]} wrap>
            {item.conditionRuleIds.slice(0, 2).map((id) => {
              const rule = ruleOptionsById.get(id);
              return <Tag key={id}>{rule ? `${rule.grade}·${renewalGoalDimensionMeta[rule.dimension].label}·${renewalRuleLevelMeta[rule.level].shortLabel}` : id}</Tag>;
            })}
            {item.conditionRuleIds.length > 2 ? <Tag>+{item.conditionRuleIds.length - 2}</Tag> : null}
          </Space>
          <Typography.Text type="secondary">关联 {item.conditionRuleIds.length} 条目标</Typography.Text>
        </Space>
      ),
    },
    {
      title: "产品方案",
      dataIndex: "productName",
      width: 240,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text strong>{item.productName}</Typography.Text>
          <Typography.Text type="secondary">{item.productLine} · {item.mode}</Typography.Text>
          <Tag bordered={false} color="blue">{renewalRecommendationTypeMeta[item.recommendationType]}</Tag>
        </Space>
      ),
    },
    {
      title: "规格 / 周期",
      key: "schedule",
      width: 220,
      render: (_, item) => (
        <Space orientation="vertical" size={2}>
          <Typography.Text>{item.suggestedPackage}</Typography.Text>
          <Typography.Text type="secondary">{item.startDate}—{item.endDate}</Typography.Text>
          <Typography.Text type="secondary">报名截止：{item.enrollmentDeadline}</Typography.Text>
        </Space>
      ),
    },
    {
      title: "适用范围",
      key: "audience",
      width: 220,
      render: (_, item) => (
        <Space size={[4, 4]} wrap>
          {[...item.grades, ...item.curricula, ...item.countries, ...item.schoolTiers, ...item.majors].slice(0, 5).map((value) => <Tag key={value}>{value}</Tag>)}
          {[...item.grades, ...item.curricula, ...item.countries, ...item.schoolTiers, ...item.majors].length > 5 ? <Tag>更多…</Tag> : null}
        </Space>
      ),
    },
    {
      title: "状态",
      key: "status",
      width: 130,
      render: (_, item) => (
        <Space orientation="vertical" size={5}>
          <Switch size="small" checked={item.enabled} checkedChildren="已启用" unCheckedChildren="已停用" onChange={(enabled) => updateConfig({ productMappings: config.productMappings.map((mapping) => mapping.id === item.id ? { ...mapping, enabled } : mapping) })} />
          <Tag color={item.sellable ? "success" : "default"}>{item.sellable ? "可售" : "不可售"}</Tag>
        </Space>
      ),
    },
    {
      title: "操作",
      valueType: "option",
      width: 90,
      fixed: "right",
      render: (_, item) => [<Button key="edit" type="link" onClick={() => { setEditingMapping(item); setMappingEditorOpen(true); }}>编辑</Button>],
    },
  ];

  const validationErrors = validateRenewalRules(config.conditionRules);
  const statusTag = dirty ? <Tag color="warning">有未保存修改</Tag> : config.draftStatus === "saved" ? <Tag color="processing">草稿已保存</Tag> : <Tag color="success">已发布</Tag>;

  function guardValid() {
    if (!validationErrors.length) return true;
    message.error(validationErrors[0]);
    return false;
  }

  return (
    <PageContainer
      className={styles.scrollPage}
      tags={<Space>{statusTag}<Tag>{config.publishedVersion}</Tag><Tag>{config.draftVersion}</Tag></Space>}
      extra={<Space wrap>
        <Button icon={<HistoryOutlined />} onClick={async () => { setHistoryOpen(true); setHistoryLoading(true); try { setVersions(await aiConfigApi.listRenewalVersions()); } finally { setHistoryLoading(false); } }}>版本记录</Button>
        <Button icon={<ExperimentOutlined />} onClick={() => { if (guardValid()) setTrialOpen(true); }}>选择学生试算</Button>
        <Button icon={<SaveOutlined />} loading={saving} onClick={async () => {
          if (!guardValid()) return;
          setSaving(true);
          try { const saved = await aiConfigApi.saveRenewalDraft(config); setConfig(saved); setDirty(false); message.success("草稿已保存"); }
          catch { message.error("保存失败，页面修改已保留"); }
          finally { setSaving(false); }
        }}>保存草稿</Button>
        <Button type="primary" icon={<SendOutlined />} onClick={() => { if (!guardValid()) return; publishForm.resetFields(); setPublishOpen(true); }}>发布版本</Button>
      </Space>}
    >
      <Flex vertical gap="middle">
        <Alert showIcon type="info" title="草稿与业务计算隔离：保存草稿不影响续费机会，只有发布后才更新学生诊断结果。" />
        {validationErrors.length ? <Alert showIcon type="error" title={`当前有 ${validationErrors.length} 个规则冲突`} description={validationErrors[0]} /> : null}
        <GoalWorkbench
          rules={config.conditionRules}
          onSaveRule={(rule) => {
            const nextRules = config.conditionRules.some((item) => item.id === rule.id)
              ? config.conditionRules.map((item) => item.id === rule.id ? rule : item)
              : [...config.conditionRules, rule];
            const errors = validateRenewalRules(nextRules);
            if (errors.length) return errors[0];
            updateConfig({ conditionRules: nextRules });
            message.success("要求已保存到当前草稿");
            return undefined;
          }}
          onToggleRule={(ruleId, enabled) => {
            const nextRules = config.conditionRules.map((rule) => rule.id === ruleId ? { ...rule, enabled } : rule);
            const errors = validateRenewalRules(nextRules);
            if (errors.length) { message.error(errors[0]); return; }
            updateConfig({ conditionRules: nextRules });
          }}
        />
      </Flex>

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
          if (!guardValid()) return;
          const { changeNote } = await publishForm.validateFields();
          setPublishing(true);
          try { const published = await aiConfigApi.publishRenewal(config, changeNote.trim()); setConfig(published); setDirty(false); setPublishOpen(false); message.success(`${published.publishedVersion} 已发布，业务页已生效`); }
          catch { message.error("发布失败"); }
          finally { setPublishing(false); }
        }}
      >
        <Alert showIcon type="warning" title="发布后将立即影响续费机会和学生条件诊断页的规则计算。" style={{ marginBottom: 20 }} />
        <Form form={publishForm} layout="vertical">
          <Form.Item name="changeNote" label="版本说明" rules={[{ required: true, whitespace: true, message: "请输入版本说明" }]}><Input.TextArea rows={3} /></Form.Item>
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
                  <Button key="rollback" type="link" icon={<RollbackOutlined />} onClick={() => Modal.confirm({
                    title: `回滚至 ${item.version}？`,
                    content: "回滚会以该版本配置创建一个新的已发布版本。",
                    okText: "确认回滚",
                    onOk: async () => { const rolledBack = await aiConfigApi.rollbackRenewal(item.version); setConfig(rolledBack); setDirty(false); setVersions(await aiConfigApi.listRenewalVersions()); message.success(`已回滚并发布 ${rolledBack.publishedVersion}`); },
                  })}>回滚</Button>,
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
