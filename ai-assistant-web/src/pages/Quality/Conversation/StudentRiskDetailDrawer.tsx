import {
  EllipsisOutlined,
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  List,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { TableColumnsType } from "antd";
import { useEffect, useMemo, useState } from "react";
import type {
  EvidenceEmployee,
  EvidenceSourceType,
  RiskEvent,
  RiskEventStatus,
  RiskEvidence,
  RiskLevel,
  RiskStudentDetail,
  RiskTextSegment,
} from "./riskData";
import {
  evidenceSourceMeta,
  getEvidenceCommunicationAt,
  riskEventStatusMeta,
  riskLevelMeta,
} from "./riskData";
import { useStudentRiskDetailStyles } from "./StudentRiskDetailDrawer.styles";

const { Paragraph, Text } = Typography;
const RISK_TABLE_PAGE_SIZE = 10;

type RiskStatusFilter = "all" | RiskEventStatus;

type SecondaryView = {
  date: string;
  riskType: string;
  evidence: RiskEvidence;
};

type EventDetailView = {
  date: string;
  eventId: string;
};

type PendingStatusAction = {
  event: RiskEvent;
  status: Exclude<RiskEventStatus, "pending">;
};

type RiskEventRow = {
  key: string;
  date: string;
  event: RiskEvent;
  sourceOrder: number;
};

export type StudentRiskDetailProps = {
  detail: RiskStudentDetail | null;
  operatorName?: string;
  updatingEventId?: string | null;
  onUpdateEventStatus?: (
    eventId: string,
    status: Exclude<RiskEventStatus, "pending">,
  ) => Promise<void> | void;
};

function SegmentedText({ segments }: { segments: RiskTextSegment[] }) {
  return (
    <>
      {segments.map((segment, index) => (
        <Text key={`${segment.text}-${index}`} strong={segment.highlighted}>
          {segment.text}
        </Text>
      ))}
    </>
  );
}

function formatEmployees(employees: EvidenceEmployee[]) {
  return employees
    .map((employee) => `${employee.name}（${employee.role}）`)
    .join("、");
}

function sourceIcon(sourceType: EvidenceSourceType) {
  return sourceType === "wechat_group" ? <TeamOutlined /> : <WechatOutlined />;
}

function flattenRiskEvents(detail: RiskStudentDetail) {
  let sourceOrder = 0;
  return detail.eventGroups
    .flatMap((group) =>
      group.events.map((event) => ({
        key: event.id,
        date: group.date,
        event,
        sourceOrder: sourceOrder++,
      })),
    )
    .sort(
      (first, second) =>
        second.date.localeCompare(first.date) ||
        first.sourceOrder - second.sourceOrder,
    );
}

function SummarySection({ detail }: { detail: RiskStudentDetail }) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <section aria-label="学生风险摘要" className={styles.summarySection}>
      <Flex
        className={styles.summaryHeader}
        justify="space-between"
        align="center"
        gap={12}
        wrap
      >
        <div className={styles.studentIdentity}>
          <Text className={styles.studentName} strong>
            {detail.student.studentName}
          </Text>
          <Text className={styles.studentNumber} type="secondary">
            {detail.student.studentNumber}
          </Text>
        </div>
      </Flex>

      <Descriptions
        className={styles.summaryDescriptions}
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          {
            key: "grade",
            label: "年级",
            children: detail.serviceProfile.grade,
          },
          {
            key: "owner",
            label: "负责人",
            children: detail.student.owner,
          },
          {
            key: "planner",
            label: "规划师",
            children: detail.serviceProfile.planner,
          },
          {
            key: "currentFollowUpAdvisor",
            label: "当前跟进顾问",
            children: detail.serviceProfile.currentFollowUpAdvisor,
          },
          {
            key: "followUpManager",
            label: "跟进学管",
            children: detail.serviceProfile.followUpManager,
          },
          {
            key: "sharedAdvisor",
            label: "共享顾问",
            children: detail.serviceProfile.sharedAdvisor,
          },
        ]}
      />
    </section>
  );
}

function RiskStats({ detail }: { detail: RiskStudentDetail }) {
  const { styles } = useStudentRiskDetailStyles();
  const { levelCounts, typeCounts } = useMemo(() => {
    const events = detail.eventGroups.flatMap((group) => group.events);
    const levels: Record<RiskLevel, number> = { high: 0, medium: 0, low: 0 };
    const types = new Map<string, number>();
    for (const event of events) {
      levels[event.riskLevel] += 1;
      types.set(event.riskType, (types.get(event.riskType) ?? 0) + 1);
    }
    return { levelCounts: levels, typeCounts: [...types.entries()] };
  }, [detail.eventGroups]);

  return (
    <div
      role="group"
      aria-label="风险统计"
      className={styles.riskStats}
    >
      <div className={styles.riskStatRow}>
        <Text className={styles.riskStatLabel} type="secondary">
          风险等级
        </Text>
        <Space size={[4, 4]} wrap>
          {(["high", "medium", "low"] as RiskLevel[]).map((level) => (
            <Tag key={level} color={riskLevelMeta[level].color}>
              {riskLevelMeta[level].fullLabel} × {levelCounts[level]}
            </Tag>
          ))}
        </Space>
      </div>
      <div className={styles.riskStatRow}>
        <Text className={styles.riskStatLabel} type="secondary">
          风险类型
        </Text>
        <Space size={[4, 4]} wrap>
          {typeCounts.map(([type, count]) => (
            <Tag key={type}>
              {type} × {count}
            </Tag>
          ))}
        </Space>
      </div>
    </div>
  );
}

function EvidenceList({
  event,
  onOpenSecondary,
}: {
  event: RiskEvent;
  onOpenSecondary: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <List<RiskEvidence>
      className={styles.evidenceList}
      dataSource={event.evidence}
      renderItem={(evidence) => (
        <List.Item key={evidence.id} className={styles.evidenceItem}>
          <div className={styles.evidenceItemBody}>
            <Flex
              className={styles.evidenceItemHeader}
              justify="space-between"
              align="center"
              gap={8}
              wrap
            >
              <Space className={styles.evidenceItemTitle} size={[8, 4]} wrap>
                <Tag icon={sourceIcon(evidence.sourceType)}>
                  {evidenceSourceMeta[evidence.sourceType].label}
                </Tag>
                {evidence.sourceType === "wechat_group" ? (
                  <Text type="secondary">
                    群聊名称：{evidence.groupName}
                  </Text>
                ) : null}
              </Space>
              <Button
                type="link"
                size="small"
                icon={<FileTextOutlined />}
                onClick={() => onOpenSecondary(evidence)}
              >
                {evidenceSourceMeta[evidence.sourceType].actionLabel}
              </Button>
            </Flex>

            <div className={styles.keyQuotes}>
              <Text strong>关键风险原文</Text>
              <ul className={styles.keyQuoteList}>
                {evidence.keyQuotes.map((quote, index) => (
                  <li
                    key={`${quote.occurredAt}-${index}`}
                    className={styles.keyQuoteItem}
                  >
                    <Text type="secondary" className={styles.keyQuoteTime}>
                      {quote.occurredAt.slice(11)}
                    </Text>
                    <span className={styles.keyQuoteContent}>
                      {quote.speaker}：“{quote.content}”
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Flex className={styles.evidenceMeta} align="center" gap={16} wrap>
              <Text type="secondary">
                沟通员工：{formatEmployees(evidence.employees)}
              </Text>
              <Text type="secondary">
                沟通时间：{getEvidenceCommunicationAt(evidence)}
              </Text>
            </Flex>
          </div>
        </List.Item>
      )}
    />
  );
}

function RiskActions({
  event,
  updating,
  onRequestStatusUpdate,
}: {
  event: RiskEvent;
  updating: boolean;
  onRequestStatusUpdate: (
    event: RiskEvent,
    status: Exclude<RiskEventStatus, "pending">,
  ) => void;
}) {
  return (
    <Dropdown
      trigger={["click"]}
      placement="bottomRight"
      menu={{
        items: [
          {
            key: "resolved",
            label: "标记为已处理",
            disabled: updating,
          },
          {
            key: "excluded",
            label: "排除风险",
            danger: true,
            disabled: updating,
          },
        ],
        onClick: ({ key, domEvent }) => {
          domEvent.stopPropagation();
          if (key === "resolved" || key === "excluded") {
            onRequestStatusUpdate(event, key);
          }
        },
      }}
    >
      <Button
        type="text"
        size="small"
        aria-label={`更多操作 ${event.riskType}`}
        icon={<EllipsisOutlined />}
        loading={updating}
        onClick={(clickEvent) => clickEvent.stopPropagation()}
      />
    </Dropdown>
  );
}

function RiskEventDetails({
  date,
  event,
  onOpenSecondary,
}: {
  date: string;
  event: RiskEvent;
  onOpenSecondary: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const levelMeta = riskLevelMeta[event.riskLevel];
  const statusMeta = riskEventStatusMeta[event.status];
  const auditMeta =
    event.status === "resolved" && event.resolvedBy && event.resolvedAt
      ? {
          actorLabel: "处理人",
          actor: event.resolvedBy,
          timeLabel: "处理时间",
          time: event.resolvedAt,
        }
      : event.status === "excluded" && event.excludedBy && event.excludedAt
        ? {
            actorLabel: "排除人",
            actor: event.excludedBy,
            timeLabel: "排除时间",
            time: event.excludedAt,
          }
        : undefined;

  return (
    <div className={styles.eventDetails}>
      <Descriptions
        className={styles.eventDescriptions}
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          { key: "date", label: "风险日期", children: date },
          { key: "type", label: "风险类型", children: event.riskType },
          {
            key: "level",
            label: "风险等级",
            children: <Tag color={levelMeta.color}>{levelMeta.fullLabel}</Tag>,
          },
          {
            key: "status",
            label: "处理状态",
            children: <Tag color={statusMeta.color}>{statusMeta.label}</Tag>,
          },
          {
            key: "evidenceCount",
            label: "证据数",
            children: `${event.evidence.length} 条`,
          },
        ]}
      />

      <section className={styles.detailSection} aria-label="完整风险总结">
        <Text className={styles.detailLabel} type="secondary">
          风险总结
        </Text>
        <Paragraph className={styles.detailParagraph}>
          {event.riskSummary}
        </Paragraph>
      </section>

      <div className={styles.detailRow}>
        <Text className={styles.detailLabel} type="secondary">
          命中关键词
        </Text>
        <Space className={styles.detailContent} size={[4, 4]} wrap>
          {event.keywords.length ? (
            event.keywords.map((keyword) => <Tag key={keyword}>{keyword}</Tag>)
          ) : (
            <Text type="secondary">暂无</Text>
          )}
        </Space>
      </div>

      <section className={styles.detailSection} aria-label="处理建议">
        <Text className={styles.detailLabel} type="secondary">
          处理建议
        </Text>
        <Paragraph className={styles.detailParagraph}>
          {event.handlingSuggestion}
        </Paragraph>
      </section>

      {auditMeta ? (
        <Descriptions
          className={styles.auditDescriptions}
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: "actor",
              label: auditMeta.actorLabel,
              children: auditMeta.actor,
            },
            {
              key: "time",
              label: auditMeta.timeLabel,
              children: auditMeta.time.slice(0, 16),
            },
          ]}
        />
      ) : null}

      <div className={styles.evidenceHeading}>
        <Text strong>来源证据</Text>
        <Text type="secondary">{event.evidence.length} 条</Text>
      </div>
      <EvidenceList event={event} onOpenSecondary={onOpenSecondary} />
    </div>
  );
}

function EventsSection({
  detail,
  statusFilter,
  currentPage,
  onStatusFilterChange,
  onPageChange,
  onOpenDetail,
  onRequestStatusUpdate,
  updatingEventId,
}: {
  detail: RiskStudentDetail;
  statusFilter: RiskStatusFilter;
  currentPage: number;
  onStatusFilterChange: (status: RiskStatusFilter) => void;
  onPageChange: (page: number) => void;
  onOpenDetail: (view: EventDetailView) => void;
  onRequestStatusUpdate: (
    event: RiskEvent,
    status: Exclude<RiskEventStatus, "pending">,
  ) => void;
  updatingEventId?: string | null;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const allRows = useMemo(() => flattenRiskEvents(detail), [detail]);
  const visibleRows = useMemo(
    () =>
      statusFilter === "all"
        ? allRows
        : allRows.filter((row) => row.event.status === statusFilter),
    [allRows, statusFilter],
  );
  const columns = useMemo<TableColumnsType<RiskEventRow>>(
    () => [
      {
        title: "风险日期",
        dataIndex: "date",
        key: "date",
        width: 108,
        render: (date: string) => (
          <Text className={styles.tableDate}>{date}</Text>
        ),
      },
      {
        title: "风险类型",
        key: "riskType",
        width: 104,
        render: (_, row) => <Text strong>{row.event.riskType}</Text>,
      },
      {
        title: "风险等级",
        key: "riskLevel",
        width: 88,
        render: (_, row) => {
          const meta = riskLevelMeta[row.event.riskLevel];
          return <Tag color={meta.color}>{meta.fullLabel}</Tag>;
        },
      },
      {
        title: "风险总结",
        key: "riskSummary",
        width: 280,
        render: (_, row) => (
          <Paragraph
            className={styles.tableSummary}
            ellipsis={{ rows: 2, tooltip: row.event.riskSummary }}
          >
            {row.event.riskSummary}
          </Paragraph>
        ),
      },
      {
        title: "命中关键词",
        key: "keywords",
        width: 220,
        render: (_, row) => {
          const keywordText = row.event.keywords.join("、");
          return row.event.keywords.length ? (
            <Tooltip title={keywordText} placement="topLeft">
              <div
                className={styles.tableKeywords}
                aria-label={`命中关键词 ${keywordText}`}
              >
                {row.event.keywords.map((keyword) => (
                  <Tag key={keyword}>{keyword}</Tag>
                ))}
              </div>
            </Tooltip>
          ) : (
            <Text type="secondary">暂无</Text>
          );
        },
      },
      {
        title: "处理状态",
        key: "status",
        width: 88,
        render: (_, row) => {
          const meta = riskEventStatusMeta[row.event.status];
          return <Tag color={meta.color}>{meta.label}</Tag>;
        },
      },
      {
        title: "操作",
        key: "operation",
        width: 124,
        fixed: "right",
        render: (_, row) => (
          <Space className={styles.tableOperations} size={0}>
            <Button
              type="link"
              size="small"
              onClick={() =>
                onOpenDetail({ date: row.date, eventId: row.event.id })
              }
            >
              详情
            </Button>
            {row.event.status === "pending" ? (
              <RiskActions
                event={row.event}
                updating={updatingEventId === row.event.id}
                onRequestStatusUpdate={onRequestStatusUpdate}
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [
      onOpenDetail,
      onRequestStatusUpdate,
      styles.tableDate,
      styles.tableKeywords,
      styles.tableOperations,
      styles.tableSummary,
      updatingEventId,
    ],
  );

  return (
    <section aria-label="风险详情" className={styles.eventsSection}>
      <header className={styles.eventsHeader}>
        <Text strong>风险详情</Text>
        <Select<RiskStatusFilter>
          aria-label="风险状态筛选"
          className={styles.statusFilter}
          value={statusFilter}
          onChange={onStatusFilterChange}
          options={[
            { label: "全部状态", value: "all" },
            { label: "待处理", value: "pending" },
            { label: "已处理", value: "resolved" },
            { label: "已排除", value: "excluded" },
          ]}
        />
      </header>

      <RiskStats detail={detail} />

      <Table<RiskEventRow>
        className={styles.riskTable}
        aria-label="风险事件表格"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={visibleRows}
        rowKey="key"
        scroll={{ x: 1012 }}
        locale={{ emptyText: <Empty description="当前状态下暂无风险事件" /> }}
        pagination={{
          current: currentPage,
          pageSize: RISK_TABLE_PAGE_SIZE,
          hideOnSinglePage: true,
          showSizeChanger: false,
          onChange: onPageChange,
        }}
      />
    </section>
  );
}

function RiskEventDetailDrawer({
  view,
  event,
  onClose,
  onOpenSecondary,
}: {
  view: EventDetailView | null;
  event: RiskEvent | null;
  onClose: () => void;
  onOpenSecondary: (view: SecondaryView) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  return (
    <Drawer
      title={
        view && event
          ? `${view.date} · ${event.riskType}风险详情`
          : undefined
      }
      size="min(720px, 100vw)"
      open={Boolean(view && event)}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {view && event ? (
        <div className={styles.eventDrawerBody}>
          <RiskEventDetails
            date={view.date}
            event={event}
            onOpenSecondary={(evidence) =>
              onOpenSecondary({
                date: view.date,
                riskType: event.riskType,
                evidence,
              })
            }
          />
        </div>
      ) : null}
    </Drawer>
  );
}

function SecondaryEvidenceDrawer({
  view,
  onClose,
}: {
  view: SecondaryView | null;
  onClose: () => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  return (
    <Drawer
      title={view ? `${view.date} · ${view.riskType} · 完整聊天` : undefined}
      size="min(560px, 100vw)"
      open={Boolean(view)}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {view ? (
        <div className={styles.nestedDrawerBody}>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={8} wrap>
              <Text strong>{view.riskType}</Text>
              <Space size={8} wrap>
                <Tag icon={sourceIcon(view.evidence.sourceType)}>
                  {evidenceSourceMeta[view.evidence.sourceType].label}
                </Tag>
                {view.evidence.sourceType === "wechat_group" ? (
                  <Text type="secondary">{view.evidence.groupName}</Text>
                ) : null}
              </Space>
            </Flex>
            <List
              className={styles.chatList}
              itemLayout="horizontal"
              dataSource={view.evidence.fullChat}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div className={styles.chatTitle}>
                        <Space size={8}>
                          <Text strong>{item.sender}</Text>
                          <Tag>{item.role}</Tag>
                        </Space>
                        <Text type="secondary">{item.occurredAt}</Text>
                      </div>
                    }
                    description={<SegmentedText segments={item.content} />}
                  />
                </List.Item>
              )}
            />
          </Flex>
        </div>
      ) : null}
    </Drawer>
  );
}

export function StudentRiskDetail({
  detail,
  operatorName = "当前用户",
  updatingEventId,
  onUpdateEventStatus,
}: StudentRiskDetailProps) {
  const { styles } = useStudentRiskDetailStyles();
  const [secondaryView, setSecondaryView] = useState<SecondaryView | null>(null);
  const [eventDetailView, setEventDetailView] =
    useState<EventDetailView | null>(null);
  const [statusFilter, setStatusFilter] = useState<RiskStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pendingAction, setPendingAction] =
    useState<PendingStatusAction | null>(null);
  const studentId = detail?.student.id;

  const selectedEvent = useMemo(() => {
    if (!detail || !eventDetailView) return null;
    const group = detail.eventGroups.find(
      (candidate) => candidate.date === eventDetailView.date,
    );
    return (
      group?.events.find((event) => event.id === eventDetailView.eventId) ?? null
    );
  }, [detail, eventDetailView]);

  const visibleEventCount = useMemo(() => {
    if (!detail) return 0;
    const events = detail.eventGroups.flatMap((group) => group.events);
    return statusFilter === "all"
      ? events.length
      : events.filter((event) => event.status === statusFilter).length;
  }, [detail, statusFilter]);

  useEffect(() => {
    setSecondaryView(null);
    setEventDetailView(null);
    setStatusFilter("all");
    setCurrentPage(1);
    setPendingAction(null);
  }, [studentId]);

  useEffect(() => {
    const lastPage = Math.max(
      1,
      Math.ceil(visibleEventCount / RISK_TABLE_PAGE_SIZE),
    );
    if (currentPage > lastPage) setCurrentPage(lastPage);
  }, [currentPage, visibleEventCount]);

  useEffect(() => {
    if (eventDetailView && !selectedEvent) {
      setEventDetailView(null);
      setSecondaryView(null);
    }
  }, [eventDetailView, selectedEvent]);

  const actionIsExcluded = pendingAction?.status === "excluded";
  const actionTitle = actionIsExcluded
    ? "确认排除该风险？"
    : "确认标记该风险为已处理？";
  const actionDescription = actionIsExcluded
    ? "排除后风险状态将变为“已排除”，且不再计入该学生的待处理风险数量。"
    : "确认后风险状态将变为“已处理”，且不再计入该学生的待处理风险数量。";

  return (
    <>
      {detail ? (
        <div
          key={detail.student.id}
          className={`${styles.drawerBody} student-risk-detail-content`}
        >
          <div className={styles.content}>
            <SummarySection detail={detail} />
            <EventsSection
              detail={detail}
              statusFilter={statusFilter}
              currentPage={currentPage}
              onStatusFilterChange={(status) => {
                setStatusFilter(status);
                setCurrentPage(1);
                setEventDetailView(null);
                setSecondaryView(null);
              }}
              onPageChange={setCurrentPage}
              onOpenDetail={(view) => {
                setEventDetailView(view);
                setSecondaryView(null);
              }}
              onRequestStatusUpdate={(event, status) =>
                setPendingAction({ event, status })
              }
              updatingEventId={updatingEventId}
            />
          </div>
        </div>
      ) : (
        <Empty description="暂无学生风险详情" />
      )}

      <RiskEventDetailDrawer
        view={eventDetailView}
        event={selectedEvent}
        onClose={() => {
          setEventDetailView(null);
          setSecondaryView(null);
        }}
        onOpenSecondary={setSecondaryView}
      />

      <SecondaryEvidenceDrawer
        view={secondaryView}
        onClose={() => setSecondaryView(null)}
      />

      <Modal
        title={actionTitle}
        open={Boolean(pendingAction)}
        okText={actionIsExcluded ? "确认排除" : "确认已处理"}
        cancelText="取消"
        confirmLoading={
          Boolean(pendingAction) && updatingEventId === pendingAction?.event.id
        }
        okButtonProps={{ danger: actionIsExcluded }}
        onCancel={() => setPendingAction(null)}
        onOk={async () => {
          if (!pendingAction || !onUpdateEventStatus) return;
          try {
            await onUpdateEventStatus(
              pendingAction.event.id,
              pendingAction.status,
            );
            setPendingAction(null);
          } catch {
            // The page owns the error toast; keep the modal open for retry.
          }
        }}
      >
        <Paragraph>{actionDescription}</Paragraph>
        <Paragraph type="secondary">
          系统将以当前账号“{operatorName}”记录本次操作。
        </Paragraph>
        {pendingAction ? (
          <Text type="secondary">
            风险类型：{pendingAction.event.riskType}
          </Text>
        ) : null}
      </Modal>
    </>
  );
}
