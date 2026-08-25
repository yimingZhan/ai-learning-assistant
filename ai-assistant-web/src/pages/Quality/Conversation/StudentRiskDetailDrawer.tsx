import { EllipsisOutlined, UserOutlined } from "@ant-design/icons";
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

type EventDetailView = {
  date: string;
  eventId: string;
};

type EvidenceOriginalView = {
  date: string;
  riskType: string;
  evidence: RiskEvidence;
};

type PendingStatusAction = {
  events: RiskEvent[];
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
  updatingEventIds?: string[];
  onUpdateEventStatus?: (
    eventIds: string[],
    status: Exclude<RiskEventStatus, "pending">,
  ) => Promise<void> | void;
};

function formatEmployees(employees: EvidenceEmployee[]) {
  return employees
    .map((employee) => `${employee.name}（${employee.role}）`)
    .join("、");
}

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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightedKeywords({
  content,
  keywords,
}: {
  content: string;
  keywords: string[];
}) {
  const normalizedKeywords = [...new Set(keywords.filter(Boolean))].sort(
    (first, second) => second.length - first.length,
  );
  if (!normalizedKeywords.length) return content;

  const keywordSet = new Set(normalizedKeywords);
  const parts = content.split(
    new RegExp(`(${normalizedKeywords.map(escapeRegExp).join("|")})`, "g"),
  );

  return parts.map((part, index) =>
    keywordSet.has(part) ? (
      <strong key={`${part}-${index}`}>{part}</strong>
    ) : (
      part
    ),
  );
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
        column={{ xs: 1, sm: 2, lg: 3 }}
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
    <div role="group" aria-label="风险统计" className={styles.riskStats}>
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
  onViewOriginal,
}: {
  event: RiskEvent;
  onViewOriginal: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <List<RiskEvidence>
      className={styles.evidenceList}
      dataSource={event.evidence}
      renderItem={(evidence) => (
        <List.Item key={evidence.id} className={styles.evidenceItem}>
          <article
            className={styles.evidenceItemBody}
            aria-label={`${evidenceSourceMeta[evidence.sourceType].label}来源证据`}
          >
            <div className={styles.keyQuotes}>
              <Flex
                className={styles.keyQuoteHeader}
                justify="space-between"
                align="center"
                gap={8}
              >
                <Text className={styles.evidenceFieldLabel} type="secondary">
                  关键风险原文
                </Text>
                <Button
                  type="link"
                  size="small"
                  onClick={() => onViewOriginal(evidence)}
                >
                  查看原文
                </Button>
              </Flex>
              <ul className={styles.keyQuoteList}>
                {evidence.keyQuotes.map((quote, index) => (
                  <li
                    key={`${quote.occurredAt}-${index}`}
                    className={styles.keyQuoteItem}
                  >
                    <Text className={styles.keyQuoteMeta} type="secondary">
                      {quote.occurredAt}｜
                      {quote.wechatNickname ?? quote.speaker}：
                    </Text>
                    <span className={styles.keyQuoteContent}>
                      <HighlightedKeywords
                        content={quote.content}
                        keywords={event.keywords}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <Descriptions
              className={styles.evidenceDescriptions}
              size="small"
              column={{
                xs: 1,
                sm: evidence.sourceType === "wechat_group" ? 2 : 3,
              }}
              items={[
                {
                  key: "source",
                  label: "原文渠道",
                  children: (
                    <Tag>{evidenceSourceMeta[evidence.sourceType].label}</Tag>
                  ),
                },
                ...(evidence.sourceType === "wechat_group"
                  ? [
                      {
                        key: "groupName",
                        label: "群聊名称",
                        children: evidence.groupName,
                      },
                    ]
                  : []),
                {
                  key: "employees",
                  label: "沟通员工",
                  children: formatEmployees(evidence.employees),
                },
                {
                  key: "time",
                  label: "沟通时间",
                  children: getEvidenceCommunicationAt(evidence),
                },
              ]}
            />
          </article>
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
  onViewOriginal,
}: {
  date: string;
  event: RiskEvent;
  onViewOriginal: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const levelMeta = riskLevelMeta[event.riskLevel];
  const statusMeta = riskEventStatusMeta[event.status];
  const auditMeta =
    event.status === "resolved" && event.resolvedBy && event.resolvedAt
      ? {
          actor: event.resolvedBy,
          time: event.resolvedAt,
        }
      : event.status === "excluded" && event.excludedBy && event.excludedAt
        ? {
            actor: event.excludedBy,
            time: event.excludedAt,
          }
        : undefined;

  return (
    <div className={styles.eventDetails}>
      <section className={styles.eventDetailSection} aria-label="风险基本信息">
        <Text className={styles.eventSectionTitle} strong>
          风险基本信息
        </Text>
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
              children: (
                <Tag color={levelMeta.color}>{levelMeta.fullLabel}</Tag>
              ),
            },
            {
              key: "status",
              label: "处理状态",
              children: <Tag color={statusMeta.color}>{statusMeta.label}</Tag>,
            },
            {
              key: "keywords",
              label: "命中关键词",
              span: 2,
              children: event.keywords.length ? (
                <Space size={[4, 4]} wrap>
                  {event.keywords.map((keyword) => (
                    <Tag key={keyword}>{keyword}</Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">暂无</Text>
              ),
            },
            {
              key: "similarSentences",
              label: "命中相似句",
              span: 2,
              children: event.similarSentences.length ? (
                <ul className={styles.similarSentenceList}>
                  {event.similarSentences.map((sentence) => (
                    <li key={sentence}>{sentence}</li>
                  ))}
                </ul>
              ) : (
                <Text type="secondary">暂无</Text>
              ),
            },
            ...(auditMeta
              ? [
                  {
                    key: "actor",
                    label: "处理人",
                    children: auditMeta.actor,
                  },
                  {
                    key: "time",
                    label: "处理时间",
                    children: auditMeta.time.slice(0, 16),
                  },
                ]
              : []),
          ]}
        />
      </section>

      <section className={styles.eventDetailSection} aria-label="AI风险总结">
        <Text className={styles.eventSectionTitle} strong>
          AI风险总结
        </Text>
        <div className={styles.summaryFields}>
          <div className={styles.detailField}>
            <Text className={styles.detailLabel} type="secondary">
              风险总结
            </Text>
            <Paragraph className={styles.detailParagraph}>
              {event.riskSummary}
            </Paragraph>
          </div>
          <div className={styles.detailField}>
            <Text className={styles.detailLabel} type="secondary">
              处理建议
            </Text>
            <Paragraph className={styles.detailParagraph}>
              {event.handlingSuggestion}
            </Paragraph>
          </div>
        </div>
      </section>

      <section
        className={`${styles.eventDetailSection} ${styles.evidenceSection}`}
        aria-label="来源证据"
      >
        <Text className={styles.eventSectionTitle} strong>
          来源证据
        </Text>
        <EvidenceList event={event} onViewOriginal={onViewOriginal} />
      </section>
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
  selectedEventIds,
  onSelectedEventIdsChange,
  onRequestStatusUpdate,
  updatingEventIds,
  actionsAvailable,
}: {
  detail: RiskStudentDetail;
  statusFilter: RiskStatusFilter;
  currentPage: number;
  onStatusFilterChange: (status: RiskStatusFilter) => void;
  onPageChange: (page: number) => void;
  onOpenDetail: (view: EventDetailView) => void;
  selectedEventIds: string[];
  onSelectedEventIdsChange: (eventIds: string[]) => void;
  onRequestStatusUpdate: (
    events: RiskEvent[],
    status: Exclude<RiskEventStatus, "pending">,
  ) => void;
  updatingEventIds: string[];
  actionsAvailable: boolean;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const allRows = useMemo(() => flattenRiskEvents(detail), [detail]);
  const selectedEvents = useMemo(
    () =>
      allRows
        .filter(
          (row) =>
            selectedEventIds.includes(row.event.id) &&
            row.event.status === "pending",
        )
        .map((row) => row.event),
    [allRows, selectedEventIds],
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
        title: "命中相似句",
        key: "similarSentences",
        width: 240,
        render: (_, row) => {
          const similarSentenceText = row.event.similarSentences.join("；");
          return similarSentenceText ? (
            <Paragraph
              className={styles.tableSimilarSentences}
              ellipsis={{ rows: 2, tooltip: similarSentenceText }}
            >
              {similarSentenceText}
            </Paragraph>
          ) : (
            <Text type="secondary">暂无</Text>
          );
        },
      },
      {
        title: "处理状态",
        key: "status",
        width: 88,
        filters: [
          { text: "待处理", value: "pending" },
          { text: "已处理", value: "resolved" },
          { text: "已排除", value: "excluded" },
        ],
        filteredValue: statusFilter === "all" ? null : [statusFilter],
        filterMultiple: false,
        onFilter: (value, row) => row.event.status === value,
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
                updating={updatingEventIds.includes(row.event.id)}
                onRequestStatusUpdate={(event, status) =>
                  onRequestStatusUpdate([event], status)
                }
              />
            ) : null}
          </Space>
        ),
      },
    ],
    [
      onOpenDetail,
      onRequestStatusUpdate,
      statusFilter,
      styles.tableDate,
      styles.tableKeywords,
      styles.tableOperations,
      styles.tableSimilarSentences,
      styles.tableSummary,
      updatingEventIds,
    ],
  );

  return (
    <section aria-label="风险详情" className={styles.eventsSection}>
      <RiskStats detail={detail} />

      <div
        className={styles.batchToolbar}
        role="toolbar"
        aria-label="批量处理风险"
      >
        <Text type="secondary">已选择 {selectedEvents.length} 项</Text>
        <Space size={8} wrap>
          <Button
            size="small"
            disabled={!selectedEvents.length || !actionsAvailable}
            onClick={() => onRequestStatusUpdate(selectedEvents, "resolved")}
          >
            批量标记已处理
          </Button>
          <Button
            danger
            size="small"
            disabled={!selectedEvents.length || !actionsAvailable}
            onClick={() => onRequestStatusUpdate(selectedEvents, "excluded")}
          >
            批量排除风险
          </Button>
        </Space>
      </div>

      <Table<RiskEventRow>
        className={styles.riskTable}
        aria-label="风险事件表格"
        size="small"
        tableLayout="fixed"
        columns={columns}
        dataSource={allRows}
        rowKey="key"
        onChange={(_, filters, __, extra) => {
          if (extra.action !== "filter") return;
          const nextStatus = filters.status?.[0];
          onStatusFilterChange(
            nextStatus === "pending" ||
              nextStatus === "resolved" ||
              nextStatus === "excluded"
              ? nextStatus
              : "all",
          );
        }}
        rowSelection={{
          selectedRowKeys: selectedEventIds,
          onChange: (keys) =>
            onSelectedEventIdsChange(keys.map((key) => String(key))),
          getCheckboxProps: (row) => ({
            disabled:
              row.event.status !== "pending" || updatingEventIds.length > 0,
            "aria-label": `选择风险 ${row.date} ${row.event.riskType}`,
          }),
          columnWidth: 48,
        }}
        scroll={{ x: 1300 }}
        locale={{ emptyText: <Empty description="当前状态下暂无风险事件" /> }}
        pagination={{
          current: currentPage,
          pageSize: RISK_TABLE_PAGE_SIZE,
          hideOnSinglePage: false,
          size: "large",
          position: ["bottomRight"],
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
  onViewOriginal,
}: {
  view: EventDetailView | null;
  event: RiskEvent | null;
  onClose: () => void;
  onViewOriginal: (view: EvidenceOriginalView) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  return (
    <Drawer
      title={
        view && event ? `${view.date} · ${event.riskType}风险详情` : undefined
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
            onViewOriginal={(evidence) =>
              onViewOriginal({
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

function EvidenceOriginalDrawer({
  view,
  onClose,
}: {
  view: EvidenceOriginalView | null;
  onClose: () => void;
}) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <Drawer
      title={view ? `${view.date} · ${view.riskType} · 原文` : undefined}
      size="min(560px, 100vw)"
      open={Boolean(view)}
      onClose={onClose}
      destroyOnHidden
      styles={{ body: { padding: 0 } }}
    >
      {view ? (
        <div className={styles.originalDrawerBody}>
          <Flex vertical gap={16}>
            <Flex justify="space-between" align="center" gap={8} wrap>
              <Text strong>完整聊天记录</Text>
              <Space size={8} wrap>
                <Tag>{evidenceSourceMeta[view.evidence.sourceType].label}</Tag>
                {view.evidence.sourceType === "wechat_group" ? (
                  <Text type="secondary">{view.evidence.groupName}</Text>
                ) : null}
              </Space>
            </Flex>
            <List
              className={styles.originalChatList}
              itemLayout="horizontal"
              dataSource={view.evidence.fullChat}
              renderItem={(message) => (
                <List.Item key={message.id}>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div className={styles.originalChatTitle}>
                        <Space size={8} wrap>
                          <Text strong>{message.sender}</Text>
                          <Tag>{message.role}</Tag>
                        </Space>
                        <Text type="secondary">{message.occurredAt}</Text>
                      </div>
                    }
                    description={<SegmentedText segments={message.content} />}
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
  updatingEventIds = [],
  onUpdateEventStatus,
}: StudentRiskDetailProps) {
  const { styles } = useStudentRiskDetailStyles();
  const [eventDetailView, setEventDetailView] =
    useState<EventDetailView | null>(null);
  const [evidenceOriginalView, setEvidenceOriginalView] =
    useState<EvidenceOriginalView | null>(null);
  const [statusFilter, setStatusFilter] = useState<RiskStatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [pendingAction, setPendingAction] =
    useState<PendingStatusAction | null>(null);
  const studentId = detail?.student.id;

  const selectedEvent = useMemo(() => {
    if (!detail || !eventDetailView) return null;
    const group = detail.eventGroups.find(
      (candidate) => candidate.date === eventDetailView.date,
    );
    return (
      group?.events.find((event) => event.id === eventDetailView.eventId) ??
      null
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
    setEventDetailView(null);
    setEvidenceOriginalView(null);
    setStatusFilter("all");
    setCurrentPage(1);
    setSelectedEventIds([]);
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
      setEvidenceOriginalView(null);
    }
  }, [eventDetailView, selectedEvent]);

  const actionIsExcluded = pendingAction?.status === "excluded";
  const actionCount = pendingAction?.events.length ?? 0;
  const actionIsBatch = actionCount > 1;
  const actionTitle = actionIsBatch
    ? actionIsExcluded
      ? `确认排除选中的 ${actionCount} 条风险？`
      : `确认将 ${actionCount} 条风险标记为已处理？`
    : actionIsExcluded
      ? "确认排除该风险？"
      : "确认标记该风险为已处理？";
  const actionDescription = actionIsBatch
    ? actionIsExcluded
      ? `排除后，选中的 ${actionCount} 条风险将变为“已排除”，且不再计入该学生的待处理风险数量。`
      : `确认后，选中的 ${actionCount} 条风险将变为“已处理”，且不再计入该学生的待处理风险数量。`
    : actionIsExcluded
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
                setSelectedEventIds([]);
                setEvidenceOriginalView(null);
                setEventDetailView(null);
              }}
              onPageChange={setCurrentPage}
              onOpenDetail={(view) => {
                setEvidenceOriginalView(null);
                setEventDetailView(view);
              }}
              selectedEventIds={selectedEventIds}
              onSelectedEventIdsChange={setSelectedEventIds}
              onRequestStatusUpdate={(events, status) =>
                setPendingAction({ events, status })
              }
              updatingEventIds={updatingEventIds}
              actionsAvailable={Boolean(onUpdateEventStatus)}
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
          setEvidenceOriginalView(null);
          setEventDetailView(null);
        }}
        onViewOriginal={setEvidenceOriginalView}
      />

      <EvidenceOriginalDrawer
        view={evidenceOriginalView}
        onClose={() => setEvidenceOriginalView(null)}
      />

      <Modal
        title={actionTitle}
        open={Boolean(pendingAction)}
        okText={actionIsExcluded ? "确认排除" : "确认已处理"}
        cancelText="取消"
        confirmLoading={Boolean(
          pendingAction?.events.some((event) =>
            updatingEventIds.includes(event.id),
          ),
        )}
        okButtonProps={{ danger: actionIsExcluded }}
        onCancel={() => setPendingAction(null)}
        onOk={async () => {
          if (!pendingAction || !onUpdateEventStatus) return;
          try {
            const completedEventIds = pendingAction.events.map(
              (event) => event.id,
            );
            await onUpdateEventStatus(completedEventIds, pendingAction.status);
            const completedEventIdSet = new Set(completedEventIds);
            setSelectedEventIds((current) =>
              current.filter((eventId) => !completedEventIdSet.has(eventId)),
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
        {actionIsBatch ? (
          <Text type="secondary">已选择 {actionCount} 条待处理风险。</Text>
        ) : pendingAction ? (
          <Text type="secondary">
            风险类型：{pendingAction.events[0]?.riskType}
          </Text>
        ) : null}
      </Modal>
    </>
  );
}
