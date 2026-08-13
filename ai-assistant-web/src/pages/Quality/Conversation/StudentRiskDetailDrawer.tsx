import {
  BulbOutlined,
  FileTextOutlined,
  PauseCircleOutlined,
  PhoneOutlined,
  PlayCircleOutlined,
  UserOutlined,
  WechatOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Button,
  Card,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  List,
  Space,
  Tag,
  Timeline,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import type {
  PhoneEvidence,
  RiskEvent,
  RiskEvidence,
  RiskStudentDetail,
  RiskTextSegment,
  WechatEvidence,
} from "./riskData";
import { riskSourceMeta } from "./riskData";
import { useStudentRiskDetailStyles } from "./StudentRiskDetailDrawer.styles";

const { Paragraph, Text } = Typography;

type SecondaryView =
  | {
      kind: "wechat";
      date: string;
      theme: string;
      evidence: WechatEvidence;
    }
  | {
      kind: "phone";
      date: string;
      theme: string;
      evidence: PhoneEvidence;
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

function AnalysisSection({ detail }: { detail: RiskStudentDetail }) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <section aria-label="AI 风险分析">
      <Card size="small" title="AI 风险分析">
        <Descriptions
          className={styles.analysisDescriptions}
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: "summary",
              label: "AI 综合风险总结",
              span: 2,
              children: detail.aiSummary,
            },
            {
              key: "themes",
              label: "主要风险主题",
              span: 2,
              children: detail.themes
                .map((theme) => `${theme.label} × ${theme.count}`)
                .join("、"),
            },
            {
              key: "handlingSuggestion",
              label: "处理建议",
              span: 2,
              children: detail.handlingSuggestion,
            },
          ]}
          data-testid="risk-overview"
        />
      </Card>
    </section>
  );
}

type EvidenceBlockProps = {
  date: string;
  theme: string;
  evidence: RiskEvidence;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
  onOpenSecondary: (view: SecondaryView) => void;
};

function EvidenceBlock({
  date,
  theme,
  evidence,
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: EvidenceBlockProps) {
  const { styles } = useStudentRiskDetailStyles();

  if (evidence.type === "wechat") {
    return (
      <Card
        size="small"
        className={styles.evidenceBlock}
        data-evidence-type="wechat"
      >
        <Descriptions
          className={styles.evidenceDescription}
          size="small"
          column={{ xs: 1, sm: 2 }}
          items={[
            {
              key: "source",
              label: "证据来源",
              children: riskSourceMeta.wechat,
            },
            {
              key: "role",
              label: "沟通角色",
              children: evidence.communicationRole,
            },
            {
              key: "employee",
              label: "沟通员工",
              children: evidence.employee,
            },
            {
              key: "time",
              label: "沟通时间",
              children: evidence.occurredAt,
            },
          ]}
        />
        <div className={styles.evidenceField}>
          <Text type="secondary">聊天内容总结</Text>
          <div className={styles.evidenceExcerpt}>
            <SegmentedText segments={evidence.excerpt} />
          </div>
        </div>
        <div className={styles.actionRow}>
          <Button
            type="link"
            size="small"
            icon={<FileTextOutlined />}
            onClick={() =>
              onOpenSecondary({
                kind: "wechat",
                date,
                theme,
                evidence,
              })
            }
          >
            查看当天完整聊天
          </Button>
        </div>
      </Card>
    );
  }

  const playing = playingEvidenceId === evidence.id;

  return (
    <Card
      size="small"
      className={styles.evidenceBlock}
      data-evidence-type="phone"
    >
      <Descriptions
        className={styles.evidenceDescription}
        size="small"
        column={{ xs: 1, sm: 2 }}
        items={[
          {
            key: "source",
            label: "证据来源",
            children: riskSourceMeta.phone,
          },
          {
            key: "role",
            label: "沟通角色",
            children: evidence.outboundRole,
          },
          {
            key: "employee",
            label: "沟通员工",
            children: evidence.employee,
          },
          {
            key: "time",
            label: "沟通时间",
            children: evidence.calledAt,
          },
          {
            key: "duration",
            label: "通话时长",
            children: evidence.duration,
          },
        ]}
      />
      <div className={styles.evidenceField}>
        <Text type="secondary">聊天内容总结</Text>
        <div className={styles.evidenceExcerpt}>
          <SegmentedText segments={evidence.transcriptExcerpt} />
        </div>
      </div>
      <div className={styles.actionRow}>
        <Button
          type="link"
          size="small"
          icon={playing ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          aria-pressed={playing}
          onClick={() => onTogglePlay(evidence.id)}
        >
          {playing ? "暂停通话录音" : "播放通话录音"}
        </Button>
        <Button
          type="link"
          size="small"
          icon={<FileTextOutlined />}
          onClick={() =>
            onOpenSecondary({
              kind: "phone",
              date,
              theme,
              evidence,
            })
          }
        >
          查看完整转写
        </Button>
      </div>
    </Card>
  );
}

type TimelineEventProps = {
  date: string;
  event: RiskEvent;
  playingEvidenceId: string | null;
  onTogglePlay: (evidenceId: string) => void;
  onOpenSecondary: (view: SecondaryView) => void;
};

function TimelineEvent({
  date,
  event,
  playingEvidenceId,
  onTogglePlay,
  onOpenSecondary,
}: TimelineEventProps) {
  const { styles } = useStudentRiskDetailStyles();

  return (
    <Card size="small" className={styles.timelineEvent}>
      <div className={styles.themeHeader}>
        <Descriptions
          className={styles.eventDescriptions}
          size="small"
          column={1}
          items={[
            {
              key: "theme",
              label: "风险主题",
              children: <Text strong>{event.theme}</Text>,
            },
          ]}
        />
      </div>
      <div className={styles.evidenceField}>
        <div className={styles.evidenceList}>
          {event.evidence.map((evidence) => (
            <EvidenceBlock
              key={evidence.id}
              date={date}
              theme={event.theme}
              evidence={evidence}
              playingEvidenceId={playingEvidenceId}
              onTogglePlay={onTogglePlay}
              onOpenSecondary={onOpenSecondary}
            />
          ))}
        </div>
      </div>
      <div
        className={styles.summaryField}
        data-testid="risk-event-ai-suggestion"
      >
        <Text type="secondary">
          <BulbOutlined
            aria-hidden="true"
            style={{ marginInlineEnd: 4 }}
          />
          AI建议
        </Text>
        <div className={styles.summaryValue}>{event.aiSuggestion}</div>
      </div>
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
    <section aria-label="风险事件与原始证据">
      <Card size="small" title="风险事件与原始证据">
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
                      date={group.date}
                      event={event}
                      playingEvidenceId={playingEvidenceId}
                      onTogglePlay={onTogglePlay}
                      onOpenSecondary={onOpenSecondary}
                    />
                  ))}
                </div>
              ),
            }))}
          />
        ) : (
          <Empty description="暂无风险事件证据" />
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
      title={
        view
          ? `${view.date} ${view.kind === "wechat" ? "完整聊天" : "完整转写"}`
          : undefined
      }
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
              <Text strong>{view.theme}</Text>
              <Tag
                icon={
                  view.kind === "wechat" ? (
                    <WechatOutlined />
                  ) : (
                    <PhoneOutlined />
                  )
                }
              >
                {view.kind === "wechat" ? "微信（云客）" : "电话外呼"}
              </Tag>
            </Flex>

            {view.kind === "wechat" ? (
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
            ) : (
              <div>
                <Descriptions
                  size="small"
                  column={1}
                  items={[
                    {
                      key: "employee",
                      label: "外呼员工",
                      children: `${view.evidence.employee} / ${view.evidence.outboundRole}`,
                    },
                    {
                      key: "calledAt",
                      label: "呼叫时间",
                      children: view.evidence.calledAt,
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
            )}
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
            <AnalysisSection detail={detail} />
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
