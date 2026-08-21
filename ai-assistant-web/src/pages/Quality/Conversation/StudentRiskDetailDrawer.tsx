import {
  FileTextOutlined,
  TeamOutlined,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Collapse,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Flex,
  List,
  Modal,
  Select,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
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
type RiskStatusFilter = "all" | RiskEventStatus;

type SecondaryView = {
  date: string;
  riskType: string;
  evidence: RiskEvidence;
};

type PendingStatusAction = {
  event: RiskEvent;
  status: Exclude<RiskEventStatus, "pending">;
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

function ProfileSection({ detail }: { detail: RiskStudentDetail }) {
  return (
    <section aria-label="学生与服务信息">
      <Card size="small" title="学生与服务信息">
        <Descriptions
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: "studentName",
              label: "学生姓名",
              children: detail.student.studentName,
            },
            {
              key: "studentNumber",
              label: "客户编号",
              children: detail.student.studentNumber,
            },
            {
              key: "grade",
              label: "年级",
              children: detail.serviceProfile.grade,
            },
            {
              key: "planner",
              label: "规划师",
              children: detail.serviceProfile.planner,
            },
            {
              key: "followUpAdvisor",
              label: "跟进顾问",
              children: detail.serviceProfile.followUpAdvisor,
            },
            {
              key: "followUpManager",
              label: "跟进学管",
              children: detail.serviceProfile.followUpManager,
            },
          ]}
        />
      </Card>
    </section>
  );
}

function OverviewSection({ detail }: { detail: RiskStudentDetail }) {
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
    <section aria-label="风险事件概览">
      <Card size="small" title="风险事件概览">
        <div className={styles.overviewBody}>
          <div className={styles.overviewRow}>
            <Text type="secondary">风险等级</Text>
            <Space size={[4, 4]} wrap>
              {(["high", "medium", "low"] as RiskLevel[]).map((level) => (
                <Tag key={level} color={riskLevelMeta[level].color}>
                  {riskLevelMeta[level].fullLabel} × {levelCounts[level]}
                </Tag>
              ))}
            </Space>
          </div>
          <div className={styles.overviewRow}>
            <Text type="secondary">风险类型</Text>
            <Space size={[4, 4]} wrap>
              {typeCounts.map(([type, count]) => (
                <Tag key={type}>
                  {type} × {count}
                </Tag>
              ))}
            </Space>
          </div>
        </div>
      </Card>
    </section>
  );
}

function EvidenceBlock({
  evidence,
  onOpenSecondary,
}: {
  evidence: RiskEvidence;
  onOpenSecondary: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const meta = evidenceSourceMeta[evidence.sourceType];

  return (
    <Card
      size="small"
      className={styles.evidenceBlock}
      data-evidence-source={evidence.sourceType}
    >
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

      <Flex className={styles.evidenceMeta} align="center" gap={8} wrap>
        <Text type="secondary">
          {sourceIcon(evidence.sourceType)} {meta.label}
        </Text>
        {evidence.sourceType === "wechat_group" ? (
          <>
            <Divider orientation="vertical" />
            <Text type="secondary">群聊名称：{evidence.groupName}</Text>
          </>
        ) : null}
        <Divider orientation="vertical" />
        <Text type="secondary">
          沟通员工：{formatEmployees(evidence.employees)}
        </Text>
        <Divider orientation="vertical" />
        <Text type="secondary">
          沟通时间：{getEvidenceCommunicationAt(evidence)}
        </Text>
      </Flex>

      <div className={styles.actionRow}>
        <Button
          type="link"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() => onOpenSecondary(evidence)}
        >
          {meta.actionLabel}
        </Button>
      </div>
    </Card>
  );
}

function EvidenceSection({
  event,
  onOpenSecondary,
}: {
  event: RiskEvent;
  onOpenSecondary: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const sourceCounts = useMemo(() => {
    const counts = new Map<EvidenceSourceType, number>();
    for (const evidence of event.evidence) {
      counts.set(evidence.sourceType, (counts.get(evidence.sourceType) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [event.evidence]);

  return (
    <Collapse
      className={styles.evidenceCollapse}
      size="small"
      expandIconPlacement="end"
      items={[
        {
          key: "source-evidence",
          label: (
            <Flex className={styles.evidenceCollapseLabel} align="center" gap={8} wrap>
              <Text strong>来源证据 {event.evidence.length}条</Text>
              <Space size={[4, 4]} wrap>
                {sourceCounts.map(([sourceType, count]) => (
                  <Tag key={sourceType} icon={sourceIcon(sourceType)}>
                    {evidenceSourceMeta[sourceType].label} × {count}
                  </Tag>
                ))}
              </Space>
            </Flex>
          ),
          children: (
            <div className={styles.evidenceList}>
              {event.evidence.map((evidence) => (
                <EvidenceBlock
                  key={evidence.id}
                  evidence={evidence}
                  onOpenSecondary={onOpenSecondary}
                />
              ))}
            </div>
          ),
        },
      ]}
    />
  );
}

function TimelineEvent({
  event,
  onOpenSecondary,
  onRequestStatusUpdate,
  updating,
}: {
  event: RiskEvent;
  onOpenSecondary: (evidence: RiskEvidence) => void;
  onRequestStatusUpdate: (
    event: RiskEvent,
    status: Exclude<RiskEventStatus, "pending">,
  ) => void;
  updating: boolean;
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
    <Card size="small" className={styles.riskTypeCard}>
      <div className={styles.riskTypeHeader}>
        <Text className={styles.riskTypeValue} strong>
          {event.riskType}
        </Text>
      </div>

      <div className={styles.riskMetaRow}>
        <div className={styles.riskMetaItem}>
          <Text type="secondary">风险等级</Text>
          <Tag color={levelMeta.color} style={{ marginInlineEnd: 0 }}>
            {levelMeta.fullLabel}
          </Tag>
        </div>
        <div className={styles.riskMetaItem}>
          <Text type="secondary">风险状态</Text>
          <Tag color={statusMeta.color} style={{ marginInlineEnd: 0 }}>
            {statusMeta.label}
          </Tag>
        </div>
        {auditMeta ? (
          <>
            <div className={styles.riskMetaItem}>
              <Text type="secondary">{auditMeta.actorLabel}</Text>
              <Text className={styles.riskMetaValue}>{auditMeta.actor}</Text>
            </div>
            <div className={styles.riskMetaItem}>
              <Text type="secondary">{auditMeta.timeLabel}</Text>
              <Text className={styles.riskMetaValue}>
                {auditMeta.time.slice(0, 16)}
              </Text>
            </div>
          </>
        ) : null}
      </div>

      <div className={styles.riskKeywordRow}>
        <Text type="secondary">命中关键词</Text>
        <Space size={[4, 4]} wrap>
          {event.keywords.map((keyword) => (
            <Tag key={keyword} style={{ marginInlineEnd: 0 }}>
              {keyword}
            </Tag>
          ))}
        </Space>
      </div>

      <div className={styles.riskSummary}>
        <Text type="secondary">风险总结</Text>
        <Paragraph className={styles.riskSummaryText}>
          {event.riskSummary}
        </Paragraph>
      </div>
      <div className={styles.riskSummary}>
        <Text type="secondary">处理建议</Text>
        <Paragraph className={styles.riskSummaryText}>
          {event.handlingSuggestion}
        </Paragraph>
      </div>

      <EvidenceSection event={event} onOpenSecondary={onOpenSecondary} />

      {event.status === "pending" ? (
        <div className={styles.eventActions}>
          <Button
            size="small"
            disabled={updating}
            onClick={() => onRequestStatusUpdate(event, "excluded")}
          >
            排除风险
          </Button>
          <Button
            size="small"
            type="primary"
            loading={updating}
            onClick={() => onRequestStatusUpdate(event, "resolved")}
          >
            已处理风险
          </Button>
        </div>
      ) : null}
    </Card>
  );
}

function EventsSection({
  detail,
  statusFilter,
  onStatusFilterChange,
  onOpenSecondary,
  onRequestStatusUpdate,
  updatingEventId,
}: {
  detail: RiskStudentDetail;
  statusFilter: RiskStatusFilter;
  onStatusFilterChange: (status: RiskStatusFilter) => void;
  onOpenSecondary: (view: SecondaryView) => void;
  onRequestStatusUpdate: (
    event: RiskEvent,
    status: Exclude<RiskEventStatus, "pending">,
  ) => void;
  updatingEventId?: string | null;
}) {
  const { styles } = useStudentRiskDetailStyles();
  const visibleGroups = useMemo(
    () =>
      detail.eventGroups
        .map((group) => ({
          ...group,
          events:
            statusFilter === "all"
              ? group.events
              : group.events.filter((event) => event.status === statusFilter),
        }))
        .filter((group) => group.events.length),
    [detail.eventGroups, statusFilter],
  );

  return (
    <section aria-label="风险详情">
      <Card
        size="small"
        title="风险详情"
        extra={
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
        }
      >
        <div className={styles.eventsBody}>
          {visibleGroups.length ? (
            <Timeline
              className={styles.eventsTimeline}
              mode="start"
              titleSpan="112px"
              items={visibleGroups.map((group) => ({
                color: "blue",
                title: (
                  <time
                    aria-label={`风险日期 ${group.date}`}
                    className={styles.timelineDate}
                    dateTime={group.date}
                  >
                    {group.date}
                  </time>
                ),
                content: (
                  <div className={styles.timelineEventList}>
                    {group.events.map((event) => (
                      <TimelineEvent
                        key={event.id}
                        event={event}
                        updating={updatingEventId === event.id}
                        onRequestStatusUpdate={onRequestStatusUpdate}
                        onOpenSecondary={(evidence) =>
                          onOpenSecondary({
                            date: group.date,
                            riskType: event.riskType,
                            evidence,
                          })
                        }
                      />
                    ))}
                  </div>
                ),
              }))}
            />
          ) : (
            <Empty description="当前状态下暂无风险事件" />
          )}
        </div>
      </Card>
    </section>
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
  const [statusFilter, setStatusFilter] = useState<RiskStatusFilter>("all");
  const [pendingAction, setPendingAction] =
    useState<PendingStatusAction | null>(null);
  const studentId = detail?.student.id;

  useEffect(() => {
    setSecondaryView(null);
    setStatusFilter("all");
    setPendingAction(null);
  }, [studentId]);

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
            <ProfileSection detail={detail} />
            <OverviewSection detail={detail} />
            <EventsSection
              detail={detail}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              onOpenSecondary={setSecondaryView}
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
