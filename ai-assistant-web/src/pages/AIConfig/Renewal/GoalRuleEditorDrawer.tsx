import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Divider,
  Drawer,
  Flex,
  Form,
  Input,
  Select,
  Space,
  Switch,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import type {
  RenewalConditionCategory,
  RenewalConditionRule,
  RenewalGoalDimension,
  RenewalRuleLevel,
} from "../../../api/contracts";
import {
  gradeOptions,
  renewalConditionTypeMeta,
  renewalEvidenceSourceMeta,
  renewalGoalDimensionOptions,
  renewalRuleLevelOptions,
} from "../../../features/renewal/meta";
import { useRenewalConfigStyles } from "./index.styles";

export type GoalEditorMode = "create" | "override" | "edit";

export type GoalEditorContext = {
  grade: string;
  curriculum: string;
  level: RenewalRuleLevel;
  dimension?: RenewalGoalDimension;
  countries: string[];
  schoolTiers: string[];
  schools: string[];
  majors: string[];
  applicationYears: number[];
};

const curriculumOptions = ["IGCSE", "A-Level", "IB", "AP"].map((value) => ({
  value,
  label: value,
}));
const countryOptions = ["英国", "美国", "加拿大", "澳大利亚", "中国香港", "新加坡"].map(
  (value) => ({ value, label: value }),
);
const schoolTierOptions = ["G5", "TOP10", "TOP30", "TOP50"].map((value) => ({
  value,
  label: value,
}));
const schoolOptionsByCountry: Record<string, string[]> = {
  英国: ["牛津大学", "剑桥大学", "伦敦政治经济学院", "伦敦大学学院", "帝国理工学院", "爱丁堡大学"],
  美国: ["麻省理工学院", "斯坦福大学", "哈佛大学", "加州大学伯克利分校"],
  加拿大: ["多伦多大学", "英属哥伦比亚大学", "麦吉尔大学"],
  澳大利亚: ["墨尔本大学", "悉尼大学", "新南威尔士大学"],
  中国香港: ["香港大学", "香港中文大学", "香港科技大学"],
  新加坡: ["新加坡国立大学", "南洋理工大学"],
};
const majorOptions = [
  "数学",
  "物理",
  "化学",
  "生物",
  "计算机",
  "经济",
  "商科",
  "管理",
  "工程",
  "法律",
  "人文社科",
].map((value) => ({ value, label: value }));
const applicationYearOptions = [2027, 2028, 2029, 2030, 2031].map((value) => ({
  value,
  label: String(value),
}));
const evidenceOptions = Object.entries(renewalEvidenceSourceMeta).map(([value, label]) => ({
  value,
  label,
}));
const typeOptions = Object.entries(renewalConditionTypeMeta).map(([value, meta]) => ({
  value,
  label: meta.label,
}));
const categoryOptions: Record<RenewalGoalDimension, RenewalConditionCategory[]> = {
  subject: ["subject"],
  language: ["language"],
  admissions: ["planning", "competition", "background", "assessment"],
};
const categoryLabels: Record<RenewalConditionCategory, string> = {
  subject: "课程与学科成绩",
  language: "语言能力与成绩",
  planning: "升学规划",
  competition: "竞赛",
  background: "背景提升",
  assessment: "申请考核",
};
const metricOptions = [
  { value: "score", label: "分数" },
  { value: "grade", label: "等级" },
  { value: "count", label: "数量" },
  { value: "completion", label: "完成状态" },
  { value: "text", label: "文字标准" },
];
const operatorOptions = [
  { value: "gte", label: "≥" },
  { value: "lte", label: "≤" },
  { value: "eq", label: "=" },
  { value: "contains", label: "包含" },
];

function defaultRule(context: GoalEditorContext): RenewalConditionRule {
  const id = `renewal-rule-${Date.now()}`;
  const dimension = context.dimension ?? "subject";
  return {
    id,
    requirementCode: `goal-item-${Date.now()}`,
    scope: context.level === "grade" ? "baseline" : "goal",
    level: context.level,
    grade: context.grade,
    curricula: context.curriculum ? [context.curriculum] : [],
    countries: context.countries,
    schoolTiers: context.schoolTiers,
    schools: context.schools,
    majors: context.majors,
    applicationYears: context.applicationYears,
    dimension,
    category: categoryOptions[dimension][0],
    name: "",
    type: "common",
    requirement: "",
    target: "",
    criteriaLogic: "all",
    criteria: [
      {
        id: `criterion-${Date.now()}`,
        label: "",
        metric: "text",
        operator: "eq",
        value: "",
        unit: "",
      },
    ],
    deadline: "",
    evidenceSources: ["planning"],
    enabled: true,
  };
}

export function GoalRuleEditorDrawer({
  open,
  mode,
  rule,
  baseRule,
  context,
  onClose,
  onSave,
}: {
  open: boolean;
  mode: GoalEditorMode;
  rule: RenewalConditionRule | null;
  baseRule: RenewalConditionRule | null;
  context: GoalEditorContext;
  onClose: () => void;
  onSave: (rule: RenewalConditionRule) => string | undefined;
}) {
  const { styles } = useRenewalConfigStyles();
  const [form] = Form.useForm<RenewalConditionRule>();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();
  const level = Form.useWatch("level", form) ?? context.level;
  const dimension = Form.useWatch("dimension", form) ?? "subject";
  const countries = Form.useWatch("countries", form) ?? [];
  const schoolOptions = useMemo(
    () => countries.flatMap((country) => schoolOptionsByCountry[country] ?? []).map((value) => ({ value, label: value })),
    [countries],
  );

  useEffect(() => {
    if (!open) return;
    const initial: RenewalConditionRule = rule
      ? structuredClone(rule)
      : baseRule
        ? {
            ...structuredClone(baseRule),
            id: `renewal-rule-${Date.now()}`,
            scope: context.level === "grade" ? ("baseline" as const) : ("goal" as const),
            level: context.level,
            grade: context.grade,
            curricula: context.curriculum ? [context.curriculum] : [],
            countries: context.countries,
            schoolTiers: context.schoolTiers,
            schools: context.schools,
            majors: context.majors,
            applicationYears: context.applicationYears,
          }
        : defaultRule(context);
    form.setFieldsValue(initial);
    setError(undefined);
  }, [baseRule, context, form, open, rule]);

  const title = mode === "edit" ? "编辑升学目标" : mode === "override" ? "调整已有目标" : "新增独立目标";

  async function handleSave() {
    try {
      setSaving(true);
      setError(undefined);
      const values = await form.validateFields();
      const invalidSchool = values.schools.find(
        (school) => !values.countries.some((country) => schoolOptionsByCountry[country]?.includes(school)),
      );
      if (invalidSchool) {
        setError(`学校“${invalidSchool}”不属于所选留学方向`);
        return;
      }
      const normalized: RenewalConditionRule = {
        ...values,
        scope: values.level === "grade" ? "baseline" : "goal",
        countries: values.level === "grade" ? [] : values.countries,
        schoolTiers: values.level === "grade" ? [] : values.schoolTiers,
        schools: ["grade", "destination"].includes(values.level) ? [] : values.schools,
        majors: values.level === "major" ? values.majors : [],
        criteriaLogic: "all",
        criteria: values.criteria.map((item, index) => ({
          ...item,
          id: item.id || `criterion-${Date.now()}-${index}`,
        })),
      };
      const saveError = onSave(normalized);
      if (saveError) {
        setError(saveError);
        return;
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Drawer
      title={title}
      open={open}
      size={760}
      onClose={onClose}
      destroyOnHidden
      footer={
        <Flex justify="end" gap="small">
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={saving} onClick={() => void handleSave()}>
            保存到当前草稿
          </Button>
        </Flex>
      }
    >
      {mode === "override" && baseRule ? (
        <Alert
          showIcon
          type="info"
          title={`正在调整“${baseRule.name}”`}
          description="系统会沿用同一目标标识，在当前层覆盖更宽范围的要求。"
          style={{ marginBottom: 16 }}
        />
      ) : null}
      {error ? <Alert showIcon type="error" title={error} style={{ marginBottom: 16 }} /> : null}

      <Form form={form} layout="vertical" requiredMark="optional">
        <Form.Item name="id" hidden><Input /></Form.Item>
        <Form.Item name="requirementCode" hidden><Input /></Form.Item>
        <Form.Item name="scope" hidden><Input /></Form.Item>
        <Form.Item name="criteriaLogic" hidden><Input /></Form.Item>

        <Typography.Title level={5} className={styles.sectionTitle}>1. 适用范围</Typography.Title>
        <Flex gap="middle" wrap>
          <Form.Item name="grade" label="年级" rules={[{ required: true }]} style={{ flex: 1, minWidth: 160 }}>
            <Select options={gradeOptions} />
          </Form.Item>
          <Form.Item name="curricula" label="课程体系" style={{ flex: 1.4, minWidth: 190 }}>
            <Select mode="multiple" allowClear options={curriculumOptions} placeholder="为空表示不限" />
          </Form.Item>
          <Form.Item name="level" label="规则层级" rules={[{ required: true }]} style={{ flex: 1, minWidth: 160 }}>
            <Select options={renewalRuleLevelOptions} disabled={mode === "override" && context.level === "grade"} />
          </Form.Item>
        </Flex>
        {level !== "grade" ? (
          <Flex gap="middle" wrap>
            <Form.Item
              name="countries"
              label="留学方向"
              rules={[{ required: level === "destination", type: "array", min: level === "destination" ? 1 : undefined }]}
              style={{ flex: 1, minWidth: 200 }}
            >
              <Select mode="multiple" allowClear options={countryOptions} placeholder="请选择国家或地区" />
            </Form.Item>
            <Form.Item name="schoolTiers" label="院校梯队" style={{ flex: 1, minWidth: 180 }}>
              <Select mode="multiple" allowClear options={schoolTierOptions} placeholder="可选" />
            </Form.Item>
            {["school", "major"].includes(level) ? (
              <Form.Item
                name="schools"
                label="学校"
                rules={[{ required: level === "school", type: "array", min: level === "school" ? 1 : undefined }]}
                style={{ flex: 1.4, minWidth: 240 }}
              >
                <Select mode="multiple" allowClear showSearch optionFilterProp="label" options={schoolOptions} placeholder="请先选择留学方向" />
              </Form.Item>
            ) : null}
          </Flex>
        ) : null}
        {level === "major" ? (
          <Flex gap="middle" wrap>
            <Form.Item name="majors" label="专业" rules={[{ required: true, type: "array", min: 1 }]} style={{ flex: 1 }}>
              <Select mode="multiple" showSearch optionFilterProp="label" options={majorOptions} />
            </Form.Item>
            <Form.Item name="applicationYears" label="申请年份" style={{ flex: 1 }}>
              <Select mode="multiple" allowClear options={applicationYearOptions} placeholder="为空表示不限" />
            </Form.Item>
          </Flex>
        ) : null}

        <Divider />
        <Typography.Title level={5} className={styles.sectionTitle}>2. 目标定义</Typography.Title>
        <Flex gap="middle" wrap>
          <Form.Item name="dimension" label="一级维度" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select
              options={renewalGoalDimensionOptions}
              onChange={(value: RenewalGoalDimension) => {
                const nextCategory = categoryOptions[value][0];
                form.setFieldValue("category", nextCategory);
              }}
            />
          </Form.Item>
          <Form.Item name="category" label="目标类型" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select
              options={categoryOptions[dimension].map((value) => ({ value, label: categoryLabels[value] }))}
            />
          </Form.Item>
          <Form.Item name="type" label="必备类型" rules={[{ required: true }]} style={{ flex: 1, minWidth: 180 }}>
            <Select options={typeOptions} />
          </Form.Item>
        </Flex>
        <Form.Item name="name" label="目标名称" rules={[{ required: true, whitespace: true, message: "请输入目标名称" }]}>
          <Input maxLength={40} showCount placeholder="例如：牛剑语言成绩要求" />
        </Form.Item>
        <Form.Item name="requirement" label="目标说明" rules={[{ required: true, whitespace: true, message: "请输入目标说明" }]}>
          <Input.TextArea rows={3} maxLength={300} showCount placeholder="说明学生为什么需要达到该目标，以及需要完成的准备动作" />
        </Form.Item>

        <Divider />
        <Typography.Title level={5} className={styles.sectionTitle}>3. 达标标准</Typography.Title>
        <Form.Item name="target" label="达标标准说明" rules={[{ required: true, whitespace: true, message: "请输入达标标准" }]}>
          <Input.TextArea rows={2} maxLength={200} showCount placeholder="例如：雅思总分7.5，单项不低于7.0" />
        </Form.Item>
        <Form.List name="criteria">
          {(fields, { add, remove }) => (
            <Space orientation="vertical" size="small" style={{ width: "100%" }}>
              {fields.map((field) => (
                <div className={styles.criterionRow} key={field.key}>
                  <Form.Item name={[field.name, "id"]} hidden><Input /></Form.Item>
                  <Form.Item name={[field.name, "label"]} rules={[{ required: true, message: "填写指标" }]}>
                    <Input placeholder="指标，如雅思总分" />
                  </Form.Item>
                  <Form.Item name={[field.name, "metric"]} rules={[{ required: true }]}>
                    <Select options={metricOptions} />
                  </Form.Item>
                  <Form.Item name={[field.name, "operator"]} rules={[{ required: true }]}>
                    <Select options={operatorOptions} />
                  </Form.Item>
                  <Form.Item name={[field.name, "value"]} rules={[{ required: true, message: "填写目标值" }]}>
                    <Input placeholder="目标值" />
                  </Form.Item>
                  <Form.Item name={[field.name, "unit"]}>
                    <Input placeholder="单位" />
                  </Form.Item>
                  <Button type="text" danger icon={<DeleteOutlined />} aria-label={`删除达标条件${field.name + 1}`} onClick={() => remove(field.name)} disabled={fields.length === 1} />
                </div>
              ))}
              <Button
                type="dashed"
                block
                icon={<PlusOutlined />}
                onClick={() => add({ id: `criterion-${Date.now()}`, label: "", metric: "text", operator: "eq", value: "", unit: "" })}
              >
                增加达标条件（条件之间按全部满足判断）
              </Button>
            </Space>
          )}
        </Form.List>

        <Divider />
        <Typography.Title level={5} className={styles.sectionTitle}>4. 完成节点与证据</Typography.Title>
        <Flex gap="middle" wrap>
          <Form.Item name="deadline" label="建议完成时间" rules={[{ required: true, whitespace: true }]} style={{ flex: 1, minWidth: 240 }}>
            <Input placeholder="例如：12年级申请季前" />
          </Form.Item>
          <Form.Item name="evidenceSources" label="证据来源" rules={[{ required: true, type: "array", min: 1 }]} style={{ flex: 1.4, minWidth: 280 }}>
            <Select mode="multiple" options={evidenceOptions} />
          </Form.Item>
        </Flex>
        <Form.Item name="enabled" label="启用状态" valuePropName="checked">
          <Switch checkedChildren="已启用" unCheckedChildren="已停用" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
