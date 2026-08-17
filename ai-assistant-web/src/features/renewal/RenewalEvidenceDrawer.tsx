import { ShoppingOutlined } from "@ant-design/icons";
import {
  Alert,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  List,
  Space,
  Tag,
  Typography,
} from "antd";
import type { RenewalConditionDiagnosis } from "../../api/contracts";
import {
  renewalCategoryMeta,
  renewalConditionTypeMeta,
  renewalEvidenceSourceMeta,
  renewalRecommendationTypeMeta,
  renewalRuleLevelMeta,
  renewalStatusMeta,
} from "./meta";

function formatAmount(amount?: number) {
  return amount === undefined ? "价格待补" : `¥${amount.toLocaleString("zh-CN")}`;
}

export function RenewalEvidenceDrawer({
  condition,
  onClose,
}: {
  condition: RenewalConditionDiagnosis | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      title="条件证据与产品匹配"
      open={Boolean(condition)}
      size="min(720px, 100vw)"
      onClose={onClose}
      destroyOnHidden
    >
      {condition ? (
        <Flex vertical gap="middle">
          <Descriptions
            bordered
            size="small"
            column={1}
            items={[
              {
                key: "condition",
                label: "命中条件",
                children: (
                  <Space wrap>
                    <Typography.Text strong>{condition.conditionName}</Typography.Text>
                    <Tag>{renewalCategoryMeta[condition.category].label}</Tag>
                    <Tag color={renewalConditionTypeMeta[condition.conditionType].color}>
                      {renewalConditionTypeMeta[condition.conditionType].label}
                    </Tag>
                    <Tag color={renewalRuleLevelMeta[condition.sourceLevel].color}>
                      {renewalRuleLevelMeta[condition.sourceLevel].label}
                    </Tag>
                  </Space>
                ),
              },
              ...(condition.goalReference
                ? [
                    {
                      key: "goal",
                      label: "关联目标",
                      children: condition.goalReference,
                    },
                  ]
                : []),
              {
                key: "sourceChain",
                label: "目标来源链",
                children: (
                  <Space size={[4, 4]} wrap>
                    {condition.sourceChain.map((source) => (
                      <Tag
                        key={source.ruleId}
                        color={source.effective ? renewalRuleLevelMeta[source.level].color : undefined}
                      >
                        {renewalRuleLevelMeta[source.level].shortLabel}
                        {source.effective ? "·最终生效" : ""}
                      </Tag>
                    ))}
                  </Space>
                ),
              },
              {
                key: "requirement",
                label: "阶段要求",
                children: condition.requirement,
              },
              {
                key: "target",
                label: "目标 / 期限",
                children: `${condition.target ?? "-"} / ${condition.deadline}`,
              },
              {
                key: "status",
                label: "规则结果",
                children: (
                  <Tag color={renewalStatusMeta[condition.status].color}>
                    {renewalStatusMeta[condition.status].label}
                  </Tag>
                ),
              },
            ]}
          />

          <Alert
            showIcon
            type={
              condition.status === "missing"
                ? "error"
                : condition.status === "in_progress_at_risk"
                  ? "warning"
                  : "info"
            }
            title={condition.statusReason}
          />

          <section aria-labelledby="renewal-evidence-title">
            <Typography.Title id="renewal-evidence-title" level={5}>
              学生原始证据
            </Typography.Title>
            {condition.evidence.length ? (
              <List
                size="small"
                dataSource={condition.evidence}
                renderItem={(item) => (
                  <List.Item
                    extra={
                      <Typography.Text type="secondary">
                        {item.updatedAt}
                      </Typography.Text>
                    }
                  >
                    <List.Item.Meta
                      avatar={<Tag>{renewalEvidenceSourceMeta[item.source]}</Tag>}
                      title={item.label}
                      description={item.value}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="暂无可用证据"
              />
            )}
          </section>

          <Divider style={{ margin: 0 }} />

          <section aria-labelledby="renewal-coverage-title">
            <Typography.Title id="renewal-coverage-title" level={5}>
              已覆盖产品
            </Typography.Title>
            {condition.coveringProducts.length ? (
              <Space wrap>
                {condition.coveringProducts.map((product) => (
                  <Tag color="processing" key={product}>
                    {product}
                  </Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">无有效产品覆盖</Typography.Text>
            )}
          </section>

          <Divider style={{ margin: 0 }} />

          <section aria-labelledby="renewal-recommendation-title">
            <Typography.Title id="renewal-recommendation-title" level={5}>
              产品推荐结果
            </Typography.Title>
            {condition.recommendations.length ? (
              <List
                size="small"
                dataSource={condition.recommendations}
                renderItem={(product) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={<ShoppingOutlined />}
                      title={
                        <Space wrap>
                          <Typography.Text strong>{product.productName}</Typography.Text>
                          <Tag>{product.mode}</Tag>
                          <Tag>{renewalRecommendationTypeMeta[product.recommendationType]}</Tag>
                        </Space>
                      }
                      description={
                        <Flex vertical gap={4}>
                          <Typography.Text>{product.reason}</Typography.Text>
                          <Typography.Text>
                            {product.suggestedPackage} · {formatAmount(product.referenceAmount)}
                          </Typography.Text>
                          <Typography.Text type="secondary">
                            {product.startDate} 至 {product.endDate}，报名截止 {product.enrollmentDeadline}
                          </Typography.Text>
                          <Space size={[4, 4]} wrap>
                            {product.matchReasons.map((reason) => (
                              <Tag key={reason}>{reason}</Tag>
                            ))}
                          </Space>
                        </Flex>
                      }
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  ["missing", "in_progress_at_risk"].includes(condition.status)
                    ? "暂无满足可售、年级和时间条件的产品"
                    : "当前状态不生成产品推荐"
                }
              />
            )}

            {condition.filteredProductReasons.length ? (
              <>
                <Divider />
                <Typography.Text strong>未入选产品</Typography.Text>
                <List
                  size="small"
                  dataSource={condition.filteredProductReasons}
                  renderItem={(reason) => <List.Item>{reason}</List.Item>}
                />
              </>
            ) : null}
          </section>
        </Flex>
      ) : null}
    </Drawer>
  );
}
