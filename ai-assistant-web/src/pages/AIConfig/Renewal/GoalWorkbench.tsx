import { EditOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
} from "antd";
import { useMemo, useState } from "react";
import type {
  RenewalConditionRule,
  RenewalGoalDimension,
} from "../../../api/contracts";
import {
  describeRuleScope,
  formatCriteria,
  renewalGoalDimensionMeta,
  renewalRuleLevelMeta,
} from "../../../features/renewal/goalRules";
import {
  renewalCategoryMeta,
  renewalConditionTypeMeta,
} from "../../../features/renewal/meta";
import {
  GoalRuleEditorDrawer,
  type GoalEditorContext,
  type GoalEditorMode,
} from "./GoalRuleEditorDrawer";
import { useRenewalConfigStyles } from "./index.styles";

const gradeOptions = ["9年级", "10年级", "11年级", "12年级"];
const curriculumOptions = ["全部课程体系", "IGCSE", "A-Level", "IB", "AP"];
const dimensions: RenewalGoalDimension[] = ["subject", "language", "admissions"];

function matchesCurriculum(rule: RenewalConditionRule, curriculum: string) {
  return curriculum === "全部课程体系" || rule.curricula.length === 0 || rule.curricula.includes(curriculum);
}

function scopeTags(rule: RenewalConditionRule) {
  return Array.from(new Set([
    ...rule.curricula,
    ...rule.countries,
    ...rule.schoolTiers,
    ...rule.schools,
    ...rule.majors,
    ...rule.applicationYears.map(String),
  ]));
}

function matchesKeyword(rule: RenewalConditionRule, keyword: string) {
  const query = keyword.trim().toLocaleLowerCase();
  if (!query) return true;
  return [
    rule.name,
    rule.requirement,
    rule.target,
    rule.deadline,
    describeRuleScope(rule),
    ...scopeTags(rule),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase().includes(query));
}

function createEditorContext(
  grade: string,
  curriculum: string,
  dimension: RenewalGoalDimension,
): GoalEditorContext {
  return {
    grade,
    curriculum: curriculum === "全部课程体系" ? "" : curriculum,
    level: "grade",
    countries: [],
    schoolTiers: [],
    schools: [],
    majors: [],
    applicationYears: [],
    dimension,
  };
}

export function GoalWorkbench({
  rules,
  onSaveRule,
  onToggleRule,
}: {
  rules: RenewalConditionRule[];
  onSaveRule: (rule: RenewalConditionRule) => string | undefined;
  onToggleRule: (ruleId: string, enabled: boolean) => void;
}) {
  const { styles, cx } = useRenewalConfigStyles();
  const [grade, setGrade] = useState("9年级");
  const [curriculum, setCurriculum] = useState("全部课程体系");
  const [dimension, setDimension] = useState<RenewalGoalDimension>("subject");
  const [keyword, setKeyword] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<GoalEditorMode>("create");
  const [editingRule, setEditingRule] = useState<RenewalConditionRule | null>(null);

  const gradeRules = useMemo(
    () => rules.filter((rule) => rule.grade === grade && matchesCurriculum(rule, curriculum)),
    [curriculum, grade, rules],
  );
  const visibleRules = useMemo(
    () => gradeRules
      .filter((rule) => rule.dimension === dimension)
      .filter((rule) => matchesKeyword(rule, keyword)),
    [dimension, gradeRules, keyword],
  );
  const editorContext = useMemo(
    () => createEditorContext(grade, curriculum, dimension),
    [curriculum, dimension, grade],
  );

  function openEditor(mode: GoalEditorMode, rule: RenewalConditionRule | null = null) {
    setEditorMode(mode);
    setEditingRule(rule);
    setEditorOpen(true);
  }

  function renderDimensionContent(value: RenewalGoalDimension) {
    const isActiveDimension = dimension === value;
    const dimensionRules = isActiveDimension
      ? visibleRules
      : gradeRules.filter((rule) => rule.dimension === value);
    const meta = renewalGoalDimensionMeta[value];

    return (
      <div>
        <div className={styles.requirementToolbar}>
          <Space wrap>
            <Input
              allowClear
              value={isActiveDimension ? keyword : ""}
              placeholder="搜索要求名称、适用范围"
              onChange={(event) => {
                if (isActiveDimension) setKeyword(event.target.value);
              }}
              style={{ width: 230 }}
            />
            <Typography.Text type="secondary">共 {dimensionRules.length} 条要求</Typography.Text>
          </Space>
          <Button type="primary" icon={<PlusOutlined />} aria-label="新增要求" onClick={() => openEditor("create")}>
            新增要求
          </Button>
        </div>

        {dimensionRules.length ? (
          <div className={styles.requirementTable} role="region" aria-label={`${meta.label}要求列表`} tabIndex={0}>
            <table className={styles.requirementTableInner}>
              <thead>
                <tr>
                  <th>要求名称</th>
                  <th>适用范围</th>
                  <th>达标标准</th>
                  <th>完成节点</th>
                  <th>要求类型</th>
                  <th>启用状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {dimensionRules.map((rule) => {
                  const tags = scopeTags(rule);
                  return (
                    <tr key={rule.id}>
                      <td>
                        <Space orientation="vertical" size={4}>
                          <Typography.Text strong>{rule.name}</Typography.Text>
                          <Typography.Text type="secondary" ellipsis={{ tooltip: rule.requirement }}>
                            {rule.requirement}
                          </Typography.Text>
                        </Space>
                      </td>
                      <td>
                        <Space orientation="vertical" size={4}>
                          <Tag color={renewalRuleLevelMeta[rule.level].color}>{renewalRuleLevelMeta[rule.level].label}</Tag>
                          <Space size={[4, 4]} wrap>
                            {tags.length ? tags.map((tag) => <Tag key={tag}>{tag}</Tag>) : <Typography.Text type="secondary">全年级</Typography.Text>}
                          </Space>
                        </Space>
                      </td>
                      <td>
                        <Space orientation="vertical" size={3}>
                          <Typography.Text>{formatCriteria(rule)}</Typography.Text>
                          {rule.target ? <Typography.Text type="secondary">{rule.target}</Typography.Text> : null}
                        </Space>
                      </td>
                      <td><Typography.Text>{rule.deadline}</Typography.Text></td>
                      <td>
                        <Space size={[4, 4]} wrap>
                          <Tag color={renewalConditionTypeMeta[rule.type].color}>{renewalConditionTypeMeta[rule.type].label}</Tag>
                          <Tag>{renewalCategoryMeta[rule.category].label}</Tag>
                        </Space>
                      </td>
                      <td>
                        <Space orientation="vertical" size={5}>
                          <Switch
                            size="small"
                            checked={rule.enabled}
                            checkedChildren="启用"
                            unCheckedChildren="停用"
                            onChange={(enabled) => onToggleRule(rule.id, enabled)}
                          />
                          <Typography.Text type="secondary">{rule.enabled ? "已启用" : "已停用"}</Typography.Text>
                        </Space>
                      </td>
                      <td>
                        <Button
                          type="link"
                          icon={<EditOutlined />}
                          aria-label={`编辑${rule.name}`}
                          onClick={() => openEditor("edit", rule)}
                        >
                          编辑
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className={styles.requirementEmpty}>
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={keyword ? "没有匹配的要求" : `暂无${meta.label}要求`}>
              <Button type="primary" icon={<PlusOutlined />} aria-label="新增要求" onClick={() => openEditor("create")}>新增要求</Button>
            </Empty>
          </div>
        )}
      </div>
    );
  }

  return (
    <section className={styles.goalLayout} aria-label="年级目标配置">
      <aside className={styles.gradeSidebar} aria-label="年级导航">
        <div className={styles.sidebarHeading}>
          <Typography.Text strong>目标年级</Typography.Text>
          <Typography.Text type="secondary">选择年级查看要求</Typography.Text>
        </div>
        <div className={styles.gradeList}>
          {gradeOptions.map((option) => {
            const optionRules = rules.filter((rule) => rule.grade === option && matchesCurriculum(rule, curriculum));
            const enabledCount = optionRules.filter((rule) => rule.enabled).length;
            const active = option === grade;
            return (
              <button
                key={option}
                type="button"
                className={cx(styles.gradeCard, active && styles.gradeCardActive)}
                aria-pressed={active}
                aria-label={`选择${option}`}
                onClick={() => setGrade(option)}
              >
                <Flex justify="space-between" align="center">
                  <Typography.Text strong>{option}</Typography.Text>
                  <Tag color={active ? "blue" : undefined}>{optionRules.length} 项</Tag>
                </Flex>
                <Typography.Text type="secondary">已启用 {enabledCount} 项</Typography.Text>
                <Typography.Text type="secondary" className={styles.gradeCardHint}>
                  {active ? "正在查看" : "点击查看详情"}
                </Typography.Text>
              </button>
            );
          })}
        </div>
      </aside>

      <Card
        className={styles.detailCard}
        title={
          <Space orientation="vertical" size={2}>
            <Typography.Title level={4} style={{ margin: 0 }}>{grade}目标详情</Typography.Title>
            <Typography.Text type="secondary">维护该年级学生的续费目标要求</Typography.Text>
          </Space>
        }
        extra={
          <Space>
            <Typography.Text type="secondary">课程体系</Typography.Text>
            <Select
              aria-label="课程体系"
              value={curriculum}
              options={curriculumOptions.map((value) => ({ value, label: value }))}
              onChange={setCurriculum}
              style={{ width: 150 }}
            />
          </Space>
        }
      >
        <Tabs
          activeKey={dimension}
          onChange={(value) => {
            setDimension(value as RenewalGoalDimension);
            setKeyword("");
          }}
          items={dimensions.map((value) => {
            const meta = renewalGoalDimensionMeta[value];
            const count = gradeRules.filter((rule) => rule.dimension === value).length;
            return {
              key: value,
              label: <Space size={6}><span>{meta.label}</span><Tag>{count}</Tag></Space>,
            };
          })}
        />
        {renderDimensionContent(dimension)}
      </Card>

      <GoalRuleEditorDrawer
        open={editorOpen}
        mode={editorMode}
        rule={editingRule}
        baseRule={null}
        context={editorContext}
        onClose={() => setEditorOpen(false)}
        onSave={onSaveRule}
      />
    </section>
  );
}
