import { TeamOutlined } from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { useLocation } from "@umijs/max";
import {
  Alert,
  Button,
  Card,
  Drawer,
  Grid,
  Space,
  Splitter,
  Spin,
  Typography,
  message,
} from "antd";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { complaintRiskApi } from "../../../api/client";
import { useGlobalToolbar } from "../../../features/globalToolbar/GlobalToolbarProvider";
import { StudentRiskDetail } from "./StudentRiskDetailDrawer";
import {
  getLinkedRiskStudentFilters,
  StudentQueryBar,
  StudentSelector,
  useRiskStudentSelection,
} from "./StudentSelector";
import { useConversationStyles } from "./index.styles";
import type {
  RiskEventStatus,
  RiskStudent,
  RiskStudentDetail,
} from "./riskData";

export {
  filterRiskStudents,
  getEvidenceCommunicationAt,
  getRiskEventRelatedPeople,
  riskStudentDetails,
  riskStudents,
  sortRiskStudents,
} from "./riskData";
export { getDefaultEventTime } from "./StudentSelector";
export type {
  EvidenceEmployee,
  EvidenceSourceType,
  FullChatMessage,
  RelatedPerson,
  RiskEvent,
  RiskEventGroup,
  RiskEventStatus,
  RiskEvidence,
  RiskKeyQuote,
  RiskLevel,
  RiskStudent,
  RiskStudentDetail,
  RiskStudentFilters,
  RiskStudentSort,
  RiskTextSegment,
  RiskType,
  UpdateRiskEventStatusResponse,
  WechatDirectEvidence,
  WechatEvidence,
  WechatGroupEvidence,
} from "./riskData";

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
  const { currentUser } = useGlobalToolbar();
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const desktop = Boolean(screens.lg);
  const pageSearchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
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
  const [detail, setDetail] = useState<RiskStudentDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string>();
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [updatingEventIds, setUpdatingEventIds] = useState<string[]>([]);

  const selection = useRiskStudentSelection(
    records,
    selectedStudentId,
    setSelectedStudentId,
    linkedFilters,
  );

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
        if (active) setListError(error.message);
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
    if (
      requestedStudentId &&
      records.some((student) => student.id === requestedStudentId)
    ) {
      setSelectedStudentId(requestedStudentId);
    }
  }, [records, requestedStudentId]);

  const updateEventStatus = async (
    eventIds: string[],
    status: Exclude<RiskEventStatus, "pending">,
  ) => {
    if (!selectedStudentId || !eventIds.length) return;
    setUpdatingEventIds(eventIds);
    try {
      for (const eventId of eventIds) {
        const response = await complaintRiskApi.updateEventStatus(
          selectedStudentId,
          eventId,
          status,
        );
        setDetail(response.detail);
        setRecords((current) =>
          current.map((student) =>
            student.id === response.student.id ? response.student : student,
          ),
        );
      }
      message.success(
        eventIds.length > 1
          ? `已批量${status === "excluded" ? "排除" : "标记已处理"} ${eventIds.length} 条风险`
          : status === "excluded"
            ? "风险已排除"
            : "风险已标记为已处理",
      );
    } catch (error) {
      message.error(
        error instanceof Error
          ? error.message
          : eventIds.length > 1
            ? "批量处理未全部完成，请刷新后重试"
            : "风险状态更新失败，请稍后重试",
      );
      throw error;
    } finally {
      setUpdatingEventIds([]);
    }
  };

  const studentContent = (
    <div className={styles.panel}>
      {listError ? (
        <Alert
          type="error"
          showIcon
          message="客诉风险列表加载失败"
          description={listError}
        />
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

  const detailActions = (
    <Space size={0}>
      {!desktop ? (
        <Button
          type="text"
          aria-label="选择学生"
          icon={<TeamOutlined />}
          onClick={() => setStudentDrawerOpen(true)}
        />
      ) : null}
    </Space>
  );

  const detailCard = (
    <Card className={styles.panelCard} styles={{ body: { padding: 0 } }}>
      <section className={styles.panel} aria-label="学生客诉风险详情">
        <PanelHeader title="学生客诉风险详情" extra={detailActions} />
        <div className={styles.panelScroll}>
          {detailError ? (
            <Alert
              type="error"
              showIcon
              message="学生风险详情加载失败"
              description={detailError}
            />
          ) : (
            <Spin spinning={detailLoading}>
              <StudentRiskDetail
                detail={detail}
                operatorName={currentUser?.name ?? "当前用户"}
                updatingEventIds={updatingEventIds}
                onUpdateEventStatus={updateEventStatus}
              />
            </Spin>
          )}
        </div>
      </section>
    </Card>
  );

  return (
    <PageContainer
      className={styles.pageContainer}
      ghost
      title={false}
      pageHeaderRender={false}
      breadcrumbRender={false}
      childrenContentStyle={{ height: "100%", padding: 0, overflow: "hidden" }}
    >
      <main className={styles.page}>
        <div className={styles.top}>
          <div className={styles.topCard}>
            <StudentQueryBar selection={selection} />
          </div>
        </div>

        <div className={styles.workspace}>
          {desktop ? (
            <Splitter className={styles.splitter}>
              <Splitter.Panel defaultSize={360} min={340} max={420}>
                {studentCard}
              </Splitter.Panel>
              <Splitter.Panel min={520}>{detailCard}</Splitter.Panel>
            </Splitter>
          ) : (
            detailCard
          )}
        </div>
      </main>

      <Drawer
        title="选择学生"
        placement="left"
        size="min(360px, 100vw)"
        open={!desktop && studentDrawerOpen}
        onClose={() => setStudentDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
        destroyOnHidden
      >
        {studentContent}
      </Drawer>
    </PageContainer>
  );
}
