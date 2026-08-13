import {
  DatabaseOutlined,
  EyeOutlined,
  RobotOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Collapse,
  Empty,
  Flex,
  Skeleton,
  Space,
  Tag,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import type {
  RenewalAssistantFocus,
  RenewalConditionDiagnosis,
  RenewalStudentDiagnosis,
} from "../../../api/contracts";
import {
  renewalCategoryMeta,
  renewalEvidenceSourceMeta,
  renewalRecommendationTypeMeta,
  renewalRuleScopeMeta,
  renewalStatusMeta,
} from "../../../features/renewal/meta";
import { useRenewalWorkbenchStyles } from "./index.styles";

function formatAmount(amount?: number) {
  return amount === undefined ? "价格待补" : `¥${amount.toLocaleString("zh-CN")}`;
}

function targetText(diagnosis: RenewalStudentDiagnosis) {
  const target = diagnosis.student.targetProfile;
  if (target.status === "missing") return "升学目标待补充";
  return [...target.countries, ...target.schoolTiers, ...target.majors].join(" · ");
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  const { styles } = useRenewalWorkbenchStyles();
  return (
    <div className={styles.fact}>
      <span className={styles.factLabel}>{label}</span>
      <span className={styles.factValue}>{children}</span>
    </div>
  );
}

function ConditionItem({
  condition,
  onOpenEvidence,
  onFocus,
}: {
  condition: RenewalConditionDiagnosis;
  onOpenEvidence: (condition: RenewalConditionDiagnosis) => void;
  onFocus: (focus: RenewalAssistantFocus) => void;
}) {
  const { styles } = useRenewalWorkbenchStyles();
  const status = renewalStatusMeta[condition.status];

  return (
    <article
      className={styles.condition}
      data-testid={`renewal-condition-${condition.conditionId}`}
      id={`renewal-condition-${condition.conditionId}`}
    >
      <div className={styles.conditionHeader}>
        <div>
          <Space size={[4, 4]} wrap>
            <Typography.Text strong>{condition.conditionName}</Typography.Text>
            <Tag color={status.color}>{status.label}</Tag>
            <Tag color={renewalRuleScopeMeta[condition.requirementSource].color}>
              {renewalRuleScopeMeta[condition.requirementSource].label}
            </Tag>
          </Space>
          <Typography.Text type="secondary" style={{ display: "block", marginTop: 4 }}>
            {renewalCategoryMeta[condition.category].label} · 截止 {condition.deadline}
          </Typography.Text>
        </div>
        <Button
          type="text"
          size="small"
          icon={<RobotOutlined />}
          aria-label={`让 AI 解释${condition.conditionName}`}
          onClick={() =>
            onFocus({
              type: "condition",
              id: condition.conditionId,
              label: condition.conditionName,
            })
          }
        />
      </div>

      <Typography.Paragraph className={styles.conditionReason}>
        {condition.statusReason}
      </Typography.Paragraph>

      {condition.evidence.length ? (
        <div className={styles.evidencePreview}>
          {condition.evidence.slice(0, 3).map((evidence) => (
            <span className={styles.evidenceChip} key={evidence.id}>
              {renewalEvidenceSourceMeta[evidence.source]}：{evidence.label} {evidence.value}
            </span>
          ))}
        </div>
      ) : null}

      <div className={styles.conditionFooter}>
        <Typography.Text type="secondary">
          {condition.recommendations.length
            ? `匹配 ${condition.recommendations.length} 个产品`
            : "暂无可用产品"}
        </Typography.Text>
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => onOpenEvidence(condition)}
        >
          查看证据
        </Button>
      </div>
    </article>
  );
}

export function RenewalDiagnosisPanel({
  diagnosis,
  loading,
  error,
  headerActions,
  onOpenEvidence,
  onFocus,
}: {
  diagnosis: RenewalStudentDiagnosis | null;
  loading: boolean;
  error?: string;
  headerActions?: ReactNode;
  onOpenEvidence: (condition: RenewalConditionDiagnosis) => void;
  onFocus: (focus: RenewalAssistantFocus) => void;
}) {
  const { styles } = useRenewalWorkbenchStyles();

  const attentionConditions =
    diagnosis?.conditions.filter((condition) =>
      [
        "missing",
        "in_progress_at_risk",
        "data_pending",
        "applicability_pending",
      ].includes(condition.status),
    ) ?? [];
  const coveredConditions =
    diagnosis?.conditions.filter((condition) =>
      ["completed", "in_progress_on_track"].includes(condition.status),
    ) ?? [];

  return (
    <section className={styles.panel} aria-label="学生续费诊断">
      <header className={styles.panelHeader}>
        <Typography.Title level={5} className={styles.panelHeading}>
          续费诊断
        </Typography.Title>
        {headerActions}
      </header>

      <div className={styles.panelScroll}>
        {loading ? (
          <div className={styles.diagnosisBody}>
            <Skeleton active title paragraph={{ rows: 5 }} />
            <Skeleton active title paragraph={{ rows: 8 }} />
          </div>
        ) : error ? (
          <div className={styles.empty}>
            <Alert type="error" showIcon title="学生条件诊断加载失败" description={error} />
          </div>
        ) : diagnosis ? (
          <div className={styles.diagnosisBody}>
            <section className={styles.studentSummary} aria-labelledby="renewal-student-title">
              <div className={styles.studentTitleRow}>
                <Space wrap>
                  <DatabaseOutlined />
                  <Typography.Title
                    id="renewal-student-title"
                    level={4}
                    style={{ margin: 0 }}
                  >
                    {diagnosis.student.name}
                  </Typography.Title>
                  <Tag>{diagnosis.student.grade}</Tag>
                </Space>
                <Typography.Text type="secondary">
                  更新于 {diagnosis.student.diagnosedAt}
                </Typography.Text>
              </div>

              <div className={styles.factGrid}>
                <Fact label="客户编号">{diagnosis.student.customerNumber}</Fact>
                <Fact label="负责人">{diagnosis.student.owner}</Fact>
                <Fact label="升学目标">{targetText(diagnosis)}</Fact>
                <Fact label="课程体系">{diagnosis.student.curriculum}</Fact>
                <Fact label="当前产品">
                  {diagnosis.student.currentProducts.join("、") || "无"}
                </Fact>
                <Fact label="剩余课时">{diagnosis.student.remainingHours} 课时</Fact>
                <Fact label="最近成绩">{diagnosis.student.latestScore ?? "待补充"}</Fact>
                <Fact label="下一节点">{diagnosis.student.nextExam ?? "待补充"}</Fact>
                <Fact label="诊断触发">
                  {diagnosis.student.triggerReasons[0]?.label ?? "系统计算"}
                </Fact>
              </div>

              <Space size={[4, 4]} wrap>
                <Tag color="success">已完成 {diagnosis.counts.completed}</Tag>
                <Tag color="processing">
                  正常进行 {diagnosis.counts.in_progress_on_track}
                </Tag>
                <Tag color="warning">
                  需关注 {diagnosis.counts.missing + diagnosis.counts.in_progress_at_risk}
                </Tag>
                <Tag>
                  待确认 {diagnosis.counts.data_pending + diagnosis.counts.applicability_pending}
                </Tag>
              </Space>
            </section>

            {diagnosis.missingFields.length ? (
              <Alert
                showIcon
                type="warning"
                title={`待补充：${diagnosis.missingFields.join("、")}`}
                description="补齐资料并重新诊断后，系统才会生成对应的产品建议。"
              />
            ) : null}

            <section className={styles.section} aria-labelledby="renewal-action-title">
              <div className={styles.sectionHeader}>
                <Typography.Title
                  id="renewal-action-title"
                  level={5}
                  className={styles.sectionTitle}
                >
                  需要处理
                </Typography.Title>
                <Typography.Text type="secondary">
                  {attentionConditions.length} 项
                </Typography.Text>
              </div>
              {attentionConditions.length ? (
                <div className={styles.conditionList}>
                  {attentionConditions.map((condition) => (
                    <ConditionItem
                      key={condition.conditionId}
                      condition={condition}
                      onOpenEvidence={onOpenEvidence}
                      onFocus={onFocus}
                    />
                  ))}
                </div>
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="当前没有需要优先处理的条件"
                />
              )}
            </section>

            <section className={styles.section} aria-labelledby="renewal-product-title">
              <div className={styles.sectionHeader}>
                <Typography.Title
                  id="renewal-product-title"
                  level={5}
                  className={styles.sectionTitle}
                >
                  产品建议
                </Typography.Title>
                <Typography.Text type="secondary">最多展示 3 项</Typography.Text>
              </div>

              {diagnosis.topRecommendations.length ? (
                <div className={styles.productList}>
                  {diagnosis.topRecommendations.slice(0, 3).map((product) => (
                    <article
                      className={styles.product}
                      key={product.productId}
                      id={`renewal-product-${product.productId}`}
                      data-testid={`renewal-product-${product.productId}`}
                    >
                      <div className={styles.productMain}>
                        <Space size={[4, 4]} wrap>
                          <Typography.Text strong>{product.productName}</Typography.Text>
                          <Tag>{renewalRecommendationTypeMeta[product.recommendationType]}</Tag>
                          <Tag>{product.mode}</Tag>
                        </Space>
                        <Typography.Text className={styles.productMeta}>
                          {product.suggestedPackage} · {formatAmount(product.referenceAmount)}
                        </Typography.Text>
                        <Typography.Text type="secondary" className={styles.productMeta}>
                          {product.reason}
                        </Typography.Text>
                        <Typography.Text type="secondary" className={styles.productMeta}>
                          {product.startDate} 至 {product.endDate}，报名截止 {product.enrollmentDeadline}
                        </Typography.Text>
                      </div>
                      <Button
                        type="text"
                        size="small"
                        icon={<RobotOutlined />}
                        aria-label={`让 AI 比较${product.productName}`}
                        onClick={() =>
                          onFocus({
                            type: "product",
                            id: product.productId,
                            label: product.productName,
                          })
                        }
                      />
                    </article>
                  ))}
                </div>
              ) : (
                <Alert
                  showIcon
                  type="info"
                  title={
                    diagnosis.missingFields.length
                      ? "补充信息后再生成产品建议"
                      : "暂无符合可售、年级和时间条件的产品"
                  }
                />
              )}
            </section>

            {coveredConditions.length ? (
              <section className={styles.section} aria-label="已覆盖条件">
                <Collapse
                  ghost
                  className={styles.collapse}
                  items={[
                    {
                      key: "covered",
                      label: `已完成与正常进行（${coveredConditions.length}）`,
                      children: (
                        <div>
                          {coveredConditions.map((condition) => (
                            <div className={styles.coveredItem} key={condition.conditionId}>
                              <Space wrap>
                                <Typography.Text>{condition.conditionName}</Typography.Text>
                                <Tag color={renewalStatusMeta[condition.status].color}>
                                  {renewalStatusMeta[condition.status].label}
                                </Tag>
                              </Space>
                              <Button
                                type="link"
                                size="small"
                                onClick={() => onOpenEvidence(condition)}
                              >
                                查看证据
                              </Button>
                            </div>
                          ))}
                        </div>
                      ),
                    },
                  ]}
                />
              </section>
            ) : null}
          </div>
        ) : (
          <Empty className={styles.empty} description="请先选择学生" />
        )}
      </div>
    </section>
  );
}
