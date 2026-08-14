import {
  BarChartOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
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
  RiskEvidence,
  RiskStudentDetail,
  RiskTextSegment,
} from "./riskData";
import { evidenceSourceMeta } from "./riskData";
import { useStudentRiskDetailStyles } from "./StudentRiskDetailDrawer.styles";

const { Paragraph, Text } = Typography;

type SecondaryView = {
  date: string;
  riskType: string;
  evidence: RiskEvidence;
};

export type StudentRiskDetailProps = {
  detail: RiskStudentDetail | null;
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
  if (sourceType === "wechat_direct") return <WechatOutlined />;
  if (sourceType === "wechat_group") return <TeamOutlined />;
  if (sourceType === "phone_outbound") return <PhoneOutlined />;
  return <BarChartOutlined />;
}

function secondaryViewTitle(view: SecondaryView) {
  const detailLabel =
    view.evidence.sourceType === "phone_outbound"
      ? "完整转写"
      : view.evidence.sourceType === "learning_info"
        ? "学情详情"
        : "完整聊天";

  return `${view.date} · ${view.riskType} · ${detailLabel}`;
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

type EvidenceBlockProps = {
  evidence: RiskEvidence;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
  onOpenSecondary: (evidence: RiskEvidence) => void;
};

function EvidenceBlock({
  evidence,
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: EvidenceBlockProps) {
  const { styles } = useStudentRiskDetailStyles();
  const meta = evidenceSourceMeta[evidence.sourceType];
  const playing = playingEvidenceId === evidence.id;

  return (
    <Card
      size="small"
      className={styles.evidenceBlock}
      data-evidence-source={evidence.sourceType}
    >
      <div className={styles.evidenceSummary}>
        <Text strong>{meta.summaryLabel}</Text>
        <Paragraph className={styles.evidenceSummaryText}>
          <SegmentedText segments={evidence.contentSummary} />
        </Paragraph>
      </div>

      <Flex className={styles.evidenceMeta} align="center" gap={8} wrap>
        <Text type="secondary">
          {sourceIcon(evidence.sourceType)} {meta.label}
        </Text>
        {evidence.employees.length ? (
          <>
            <Divider orientation="vertical" />
            <Text type="secondary">
              沟通员工：{formatEmployees(evidence.employees)}
            </Text>
          </>
        ) : null}
        <Divider orientation="vertical" />
        <Text type="secondary">
          {evidence.sourceType === "learning_info" ? "数据时间" : "沟通时间"}：
          {evidence.occurredAt}
        </Text>
        {evidence.sourceType === "phone_outbound" ? (
          <>
            <Divider orientation="vertical" />
            <Text type="secondary">通话时长：{evidence.duration}</Text>
          </>
        ) : null}
      </Flex>

      <div className={styles.actionRow}>
        {evidence.sourceType === "phone_outbound" ? (
          <Button
            type="link"
            size="small"
            icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            aria-pressed={playing}
            onClick={() => onTogglePlay(evidence.id)}
          >
            {playing ? "暂停通话录音" : "播放通话录音"}
          </Button>
        ) : null}
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
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: {
  event: RiskEvent;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
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

  if (!event.evidence.length) {
    return (
      <div className={styles.emptyEvidence}>
        <Text type="secondary">暂无来源证据</Text>
      </div>
    );
  }

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
                  playingEvidenceId={playingEvidenceId}
                  onTogglePlay={onTogglePlay}
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
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: {
  event: RiskEvent;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
  onOpenSecondary: (evidence: RiskEvidence) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <Card size="small" className={styles.riskTypeCard}>
      <div className={styles.riskTypeHeader}>
        <Text type="secondary">风险类型</Text>
        <Text className={styles.riskTypeValue} strong>
          {event.riskType}
        </Text>
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

      <EvidenceSection
        event={event}
        playingEvidenceId={playingEvidenceId}
        onTogglePlay={onTogglePlay}
        onOpenSecondary={onOpenSecondary}
      />
    </Card>
  );
}

function EventsSection({
  detail,
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: {
  detail: RiskStudentDetail;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
  onOpenSecondary: (view: SecondaryView) => void;
}) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <section aria-label="风险详情">
      <Card size="small" title="风险详情">
        <div className={styles.eventsBody}>
          {detail.eventGroups.length ? (
            <Timeline
              className={styles.eventsTimeline}
              mode="start"
              items={detail.eventGroups.map((group) => ({
                color: "blue",
                title: <Text strong>{group.date}</Text>,
                content: (
                  <div className={styles.timelineEventList}>
                    {group.events.map((event) => (
                      <TimelineEvent
                        key={event.id}
                        event={event}
                        playingEvidenceId={playingEvidenceId}
                        onTogglePlay={onTogglePlay}
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
            <Empty description="暂无风险详情" />
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
      title={view ? secondaryViewTitle(view) : undefined}
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
              <Tag icon={sourceIcon(view.evidence.sourceType)}>
                {evidenceSourceMeta[view.evidence.sourceType].label}
              </Tag>
            </Flex>

            {view.evidence.sourceType === "wechat_direct" ||
            view.evidence.sourceType === "wechat_group" ? (
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
            ) : view.evidence.sourceType === "phone_outbound" ? (
              <div>
                <Descriptions
                  size="small"
                  column={1}
                  items={[
                    {
                      key: "employee",
                      label: "外呼员工",
                      children: formatEmployees(view.evidence.employees),
                    },
                    {
                      key: "calledAt",
                      label: "呼叫时间",
                      children: view.evidence.occurredAt,
                    },
                    {
                      key: "duration",
                      label: "通话时长",
                      children: view.evidence.duration,
                    },
                  ]}
                />
                <Paragraph className={styles.transcript}>
                  <SegmentedText segments={view.evidence.fullTranscript} />
                </Paragraph>
              </div>
            ) : view.evidence.sourceType === "learning_info" ? (
              <Descriptions
                className={styles.learningDetails}
                size="small"
                bordered
                column={1}
                items={[
                  {
                    key: "occurredAt",
                    label: "数据时间",
                    children: view.evidence.occurredAt,
                  },
                  ...view.evidence.detailItems.map((item, index) => ({
                    key: `${item.label}-${index}`,
                    label: item.label,
                    children: item.value,
                  })),
                ]}
              />
            ) : null}
          </Flex>
        </div>
      ) : null}
    </Drawer>
  );
}

export function StudentRiskDetail({ detail }: StudentRiskDetailProps) {
  const { styles } = useStudentRiskDetailStyles();
  const [secondaryView, setSecondaryView] = useState<SecondaryView | null>(null);
  const [playingEvidenceId, setPlayingEvidenceId] = useState<string | null>(
    null,
  );
  const studentId = detail?.student.id;

  useEffect(() => {
    setSecondaryView(null);
    setPlayingEvidenceId(null);
  }, [studentId]);

  const handleTogglePlay = (evidenceId: string) => {
    setPlayingEvidenceId((current) =>
      current === evidenceId ? null : evidenceId,
    );
  };

  return (
    <>
      {detail ? (
        <div
          key={detail.student.id}
          className={`${styles.drawerBody} student-risk-detail-content`}
        >
          <div className={styles.content}>
            <ProfileSection detail={detail} />
            <EventsSection
              detail={detail}
              playingEvidenceId={playingEvidenceId}
              onTogglePlay={handleTogglePlay}
              onOpenSecondary={setSecondaryView}
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
    </>
  );
}
