import { RobotOutlined, TeamOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Grid,
  Space,
  Splitter,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useOptionalGlobalToolbar } from "../../../features/globalToolbar/GlobalToolbarProvider";
import { complaintRiskApi } from "../../../api/client";
import { GlobalAssistantPanel } from "../../../features/globalToolbar/GlobalAssistantPanel";
import { StudentRiskDetail } from "./StudentRiskDetailDrawer";
import {
  getLinkedRiskStudentFilters,
  StudentSelector,
  useRiskStudentSelection,
} from "./StudentSelector";
import { useConversationStyles } from "./index.styles";
import {
  formatRiskSources,
  getRiskEventRelatedPeople,
  riskStudentDetails,
  type RelatedPerson,
  type RiskSource,
  type RiskStudent,
} from "./riskData";

type CoreRiskSummaryItem = {
  id: string;
  date: string;
  summary: string;
};

export {
  filterRiskStudents,
  getRiskEventRelatedPeople,
  riskStudentDetails,
  riskStudents,
  sortRiskStudents,
} from "./riskData";
export { getDefaultEventTime } from "./StudentSelector";
export type {
  RelatedPerson,
  RiskEvent,
  RiskEventGroup,
  RiskEvidence,
  RiskLevel,
  RiskSource,
  RiskStudent,
  RiskStudentDetail,
  RiskStudentFilters,
  RiskStudentSort,
  RiskTextSegment,
} from "./riskData";

export function RiskSourceTags({ values }: { values: RiskSource[] }) {
  return (
    <Space size={[4, 4]} wrap>
      {values.map((value) => (
        <Tag key={value} style={{ marginInlineEnd: 0 }}>
          {formatRiskSources([value])}
        </Tag>
      ))}
    </Space>
  );
}

function formatRelatedPerson(person: RelatedPerson) {
  return `${person.name}（${person.roles.join("、")}）`;
}

export function RelatedPeopleText({ people }: { people: RelatedPerson[] }) {
  const { styles } = useConversationStyles();

  if (!people.length) return "-";

  const visiblePeople = people.slice(0, 2);
  const hasMore = people.length > visiblePeople.length;
  const fullContent = (
    <div className={styles.relatedPeopleTooltip}>
      {people.map((person) => (
        <div key={person.name}>{formatRelatedPerson(person)}</div>
      ))}
    </div>
  );

  return (
    <Tooltip title={fullContent} placement="topLeft">
      <div className={styles.relatedPeopleList} tabIndex={0}>
        {visiblePeople.map((person, index) => (
          <div className={styles.relatedPersonItem} key={person.name}>
            {formatRelatedPerson(person)}
            {hasMore && index === visiblePeople.length - 1 ? "…" : null}
          </div>
        ))}
      </div>
    </Tooltip>
  );
}

export function getCoreRiskSummaries(studentId: string): CoreRiskSummaryItem[] {
  const detail = riskStudentDetails[studentId];

  return (
    detail?.eventGroups.flatMap((group) =>
      group.events.map((event) => ({
        id: event.id,
        date: group.date,
        summary: event.aiSummary,
      })),
    ) ?? []
  );
}

export function CoreRiskSummaries({ record }: { record: RiskStudent }) {
  const { styles } = useConversationStyles();
  const summaries = getCoreRiskSummaries(record.id);

  if (!summaries.length) return record.coreRisk;

  const visibleSummaries = summaries.slice(0, 2);
  const hasMore = summaries.length > visibleSummaries.length;
  const fullContent = (
    <div className={styles.coreRiskTooltip}>
      {summaries.map((item) => (
        <div className={styles.coreRiskTooltipItem} key={item.id}>
          <span className={styles.coreRiskTooltipDate}>{item.date}</span>
          <span>{item.summary}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Tooltip title={fullContent} placement="topLeft">
      <div className={styles.coreRiskList} tabIndex={0}>
        {visibleSummaries.map((item, index) => (
          <div className={styles.coreRiskItem} key={item.id}>
            <span className={styles.coreRiskDate}>{item.date}</span>
            <span className={styles.coreRiskSummary}>
              {item.summary}
              {hasMore && index === visibleSummaries.length - 1 ? "…" : null}
            </span>
          </div>
        ))}
      </div>
    </Tooltip>
  );
}

function PanelHeader({
  title,
  extra,
}: {
  title: string;
  extra?: ReactNode;
}) {
  const { styles } = useConversationStyles();

  return (
    <header className={styles.panelHeader}>
      <Typography.Text strong>{title}</Typography.Text>
      {extra}
    </header>
  );
}

export default function ComplaintWarningPage() {
  const { styles } = useConversationStyles();
  const screens = Grid.useBreakpoint();
  const pageSearchParams = useMemo(
    () => new URLSearchParams(window.location.search),
    [],
  );
  const requestedStudentId = pageSearchParams.get("studentId");
  const linkedFilters = useMemo(
    () => getLinkedRiskStudentFilters(pageSearchParams),
    [pageSearchParams],
  );
  const [records, setRecords] = useState<RiskStudent[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string>();
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    () => requestedStudentId,
  );
  const [detail, setDetail] = useState<
    import("./riskData").RiskStudentDetail | null
  >(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>();
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const assistantSurfaceInitialized = useRef(false);
  const toolbar = useOptionalGlobalToolbar();
  const registerAssistantSurface = toolbar?.registerAssistantSurface;
  const unregisterAssistantSurface = toolbar?.unregisterAssistantSurface;
  const setAssistantContext = toolbar?.setAssistantContext;
  const selection = useRiskStudentSelection(
    records,
    selectedStudentId,
    setSelectedStudentId,
    linkedFilters,
  );
  const selectedStudent = useMemo(
    () =>
      records.find((student) => student.id === selectedStudentId) ?? null,
    [records, selectedStudentId],
  );
  const wide = Boolean(screens.xl);
  const medium = !wide && Boolean(screens.lg);
  const assistantOpen = toolbar?.assistantOpen ?? localAssistantOpen;
  const setAssistantOpen = toolbar?.setAssistantOpen ?? setLocalAssistantOpen;
  const openAssistant = toolbar?.openAssistant ?? (() => setLocalAssistantOpen(true));

  useEffect(() => {
    let active = true;
    setListLoading(true);
    complaintRiskApi
      .listStudents()
      .then((response) => {
        if (!active) return;
        setRecords(response.items);
        setListError(undefined);
      })
      .catch((error: Error) => {
        if (!active) return;
        setListError(error.message);
      })
      .finally(() => {
        if (active) setListLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!selectedStudentId) {
      setDetail(null);
      return;
    }
    let active = true;
    setDetailLoading(true);
    setDetailError(undefined);
    complaintRiskApi
      .getStudentDetail(selectedStudentId)
      .then((response) => {
        if (active) setDetail(response);
      })
      .catch((error: Error) => {
        if (!active) return;
        setDetail(null);
        setDetailError(error.message);
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });
    return () => {
      active = false;
    };
  }, [selectedStudentId]);

  useEffect(() => {
    if (screens.xl === undefined || assistantSurfaceInitialized.current) return;
    registerAssistantSurface?.("embedded", { defaultOpen: wide });
    if (!toolbar) setLocalAssistantOpen(wide);
    assistantSurfaceInitialized.current = true;
  }, [registerAssistantSurface, screens.xl, toolbar, wide]);

  useEffect(() => {
    return () => unregisterAssistantSurface?.("embedded");
  }, [unregisterAssistantSurface]);

  useEffect(() => {
    if (
      requestedStudentId &&
      records.some((student) => student.id === requestedStudentId)
    ) {
      setSelectedStudentId(requestedStudentId);
    }
  }, [records, requestedStudentId]);

  useEffect(() => {
    setAssistantContext?.(
      selectedStudent
        ? {
            kind: "complaintRisk",
            studentId: selectedStudent.id,
            studentName: selectedStudent.studentName,
          }
        : undefined,
    );
  }, [selectedStudent, setAssistantContext]);

  const studentContent = (
    <div className={styles.panel}>
      {listError ? (
        <Alert type="error" showIcon message="客诉风险列表加载失败" description={listError} />
      ) : (
        <Spin spinning={listLoading}>
          <StudentSelector
            selection={selection}
            selectedStudentId={selectedStudentId}
            onSelect={(studentId) => {
              setSelectedStudentId(studentId);
              setStudentDrawerOpen(false);
            }}
          />
        </Spin>
      )}
    </div>
  );

  const studentCard = (
    <Card className={styles.panelCard} styles={{ body: { padding: 0 } }}>
      {studentContent}
    </Card>
  );

  const assistantContent = selectedStudent ? (
    <GlobalAssistantPanel />
  ) : (
    <Flex className={styles.emptyPanel} align="center" justify="center">
      <Empty description="请先选择学生" />
    </Flex>
  );

  const detailActions = (
    <Space size={0}>
      {!wide && !medium ? (
        <Button
          type="text"
          aria-label="选择学生"
          icon={<TeamOutlined />}
          onClick={() => setStudentDrawerOpen(true)}
        />
      ) : null}
      <Button
        type="primary"
        icon={<RobotOutlined />}
        disabled={!selectedStudent}
        aria-label={
          selectedStudent
            ? `向 AI 咨询${selectedStudent.studentName}的客诉风险`
            : "向 AI 咨询当前学生的客诉风险"
        }
        onClick={openAssistant}
      >
        {selectedStudent
          ? `问 AI · ${selectedStudent.studentName}`
          : "问 AI"}
      </Button>
    </Space>
  );

  const detailContent = (
    <section className={styles.panel} aria-label="学生客诉风险详情">
      <PanelHeader title="学生客诉风险详情" extra={detailActions} />
      <div className={styles.panelScroll}>
        {detailError ? (
          <Alert type="error" showIcon message="学生风险详情加载失败" description={detailError} />
        ) : (
          <Spin spinning={detailLoading}>
            <StudentRiskDetail detail={detail} />
          </Spin>
        )}
      </div>
    </section>
  );

  const detailCard = (
    <Card className={styles.panelCard} styles={{ body: { padding: 0 } }}>
      {detailContent}
    </Card>
  );

  const assistantCard = (
    <Card className={styles.panelCard} styles={{ body: { padding: 0 } }}>
      {assistantContent}
    </Card>
  );

  return (
    <PageContainer
      className={styles.pageContainer}
      ghost
      title={false}
      pageHeaderRender={false}
      breadcrumbRender={false}
      childrenContentStyle={{
        height: "100%",
        padding: 0,
        overflow: "hidden",
      }}
    >
      <main className={styles.workspace}>
        {wide && assistantOpen ? (
          <Splitter className={styles.splitter}>
            <Splitter.Panel defaultSize={280} min={260} max={320}>
              {studentCard}
            </Splitter.Panel>
            <Splitter.Panel min={520}>{detailCard}</Splitter.Panel>
            <Splitter.Panel
              defaultSize={360}
              min={320}
              max={420}
            >
              {assistantCard}
            </Splitter.Panel>
          </Splitter>
        ) : wide || medium ? (
          <Splitter className={styles.splitter}>
            <Splitter.Panel defaultSize={280} min={260} max={320}>
              {studentCard}
            </Splitter.Panel>
            <Splitter.Panel min={520}>{detailCard}</Splitter.Panel>
          </Splitter>
        ) : (
          detailCard
        )}
      </main>

      <Drawer
        title="选择学生"
        placement="left"
        size="min(360px, 100vw)"
        open={!medium && !wide && studentDrawerOpen}
        onClose={() => setStudentDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        {studentContent}
      </Drawer>

      <Drawer
        aria-label="AI 助手"
        size="min(400px, 100vw)"
        open={!wide && assistantOpen}
        onClose={() => setAssistantOpen(false)}
        closable={false}
        mask={!screens.md}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        {assistantContent}
      </Drawer>
    </PageContainer>
  );
}
