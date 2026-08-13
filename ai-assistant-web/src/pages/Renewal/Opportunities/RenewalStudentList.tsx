import { CheckOutlined } from "@ant-design/icons";
import { Alert, Empty, Skeleton, Space, Tabs, Tag, Typography } from "antd";
import type {
  RenewalOpportunity,
  RenewalOpportunitySummary,
} from "../../../api/contracts";
import {
  renewalCategoryMeta,
  renewalPriorityMeta,
  renewalStatusMeta,
} from "../../../features/renewal/meta";
import type { OpportunityView } from "./filter";
import { useRenewalWorkbenchStyles } from "./index.styles";

type RenewalStudentListProps = {
  items: RenewalOpportunity[];
  summary?: RenewalOpportunitySummary;
  view: OpportunityView;
  selectedStudentId: string | null;
  loading?: boolean;
  error?: string;
  onViewChange: (view: OpportunityView) => void;
  onSelect: (studentId: string) => void;
};

export function RenewalStudentList({
  items,
  summary,
  view,
  selectedStudentId,
  loading = false,
  error,
  onViewChange,
  onSelect,
}: RenewalStudentListProps) {
  const { styles, cx } = useRenewalWorkbenchStyles();

  return (
    <section className={styles.panel} aria-label="续费学生列表">
      <header className={styles.panelHeader}>
        <Typography.Title level={5} className={styles.panelHeading}>
          续费学生
        </Typography.Title>
        <Typography.Text type="secondary">{items.length} 人</Typography.Text>
      </header>

      <Tabs
        className={styles.listTabs}
        activeKey={view}
        onChange={(key) => onViewChange(key as OpportunityView)}
        items={[
          {
            key: "opportunity",
            label: `可推荐（${summary?.opportunityStudents ?? 0}）`,
          },
          {
            key: "pending",
            label: `待补信息（${summary?.pendingStudents ?? 0}）`,
          },
        ]}
      />

      <div className={styles.panelScroll}>
        {loading ? (
          <div className={styles.studentList}>
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} active title paragraph={{ rows: 2 }} />
            ))}
          </div>
        ) : error ? (
          <div className={styles.empty}>
            <Alert type="error" showIcon title="续费学生加载失败" description={error} />
          </div>
        ) : items.length ? (
          <div className={styles.studentList}>
            {items.map((item) => {
              const selected = item.student.id === selectedStudentId;
              const conditions =
                view === "opportunity"
                  ? item.actionableConditions
                  : item.pendingConditions;
              const primaryCondition = conditions[0];
              const trigger = item.triggerReasons[0];
              const priority = item.highestPriority
                ? renewalPriorityMeta[item.highestPriority]
                : undefined;

              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={cx(
                    styles.studentItem,
                    selected && styles.studentItemSelected,
                  )}
                  onClick={() => onSelect(item.student.id)}
                >
                  <span className={styles.studentPrimary}>
                    <span className={styles.studentName}>{item.student.name}</span>
                    {selected ? <CheckOutlined aria-label="已选择" /> : null}
                    {priority ? <Tag color={priority.color}>{item.highestPriority}</Tag> : null}
                  </span>
                  <span className={styles.studentMeta}>
                    <span>{item.student.grade}</span>
                    <span>·</span>
                    <span>{item.student.owner}</span>
                  </span>
                  <span className={styles.studentReason}>
                    {primaryCondition ? (
                      <Space size={4} wrap>
                        <Tag color={renewalStatusMeta[primaryCondition.status].color}>
                          {renewalCategoryMeta[primaryCondition.category].label}
                        </Tag>
                        <span>{primaryCondition.conditionName}</span>
                      </Space>
                    ) : (
                      trigger?.label ?? "等待诊断"
                    )}
                  </span>
                  {trigger ? (
                    <span className={styles.studentTrigger}>{trigger.label}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <Empty
            className={styles.empty}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="没有符合当前筛选的学生"
          />
        )}
      </div>
    </section>
  );
}
