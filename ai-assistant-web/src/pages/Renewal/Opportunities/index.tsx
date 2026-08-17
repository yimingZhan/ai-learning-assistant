import {
  ReloadOutlined,
  RobotOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { PageContainer } from "@ant-design/pro-components";
import { history, useSearchParams } from "@umijs/max";
import {
  Button,
  Card,
  Drawer,
  Empty,
  Flex,
  Grid,
  Input,
  Select,
  Space,
  Splitter,
  Typography,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { renewalApi } from "../../../api/client";
import type {
  RenewalAssistantFocus,
  RenewalConditionDiagnosis,
  RenewalOpportunitiesResponse,
  RenewalStudentDiagnosis,
} from "../../../api/contracts";
import { trackAnalytics } from "../../../features/analytics/track";
import type { CompactAssistantPrompt } from "../../../features/assistant/CompactAssistantPanel";
import { GlobalAssistantPanel } from "../../../features/globalToolbar/GlobalAssistantPanel";
import { useOptionalGlobalToolbar } from "../../../features/globalToolbar/GlobalToolbarProvider";
import { RenewalEvidenceDrawer } from "../../../features/renewal/RenewalEvidenceDrawer";
import {
  gradeOptions,
  renewalCategoryOptions,
  renewalPriorityMeta,
  renewalTriggerMeta,
} from "../../../features/renewal/meta";
import { filterRenewalOpportunities } from "./filter";
import type { OpportunityFilters, OpportunityView } from "./filter";
import { RenewalAssistantIntro } from "./RenewalAssistantIntro";
import { RenewalDiagnosisPanel } from "./RenewalDiagnosisPanel";
import { RenewalStudentList } from "./RenewalStudentList";
import { useRenewalWorkbenchStyles } from "./index.styles";

const initialFilters: OpportunityFilters = {};

export default function RenewalOpportunitiesPage() {
  const { styles } = useRenewalWorkbenchStyles();
  const screens = Grid.useBreakpoint();
  const [searchParams] = useSearchParams();
  const requestedStudentId = searchParams.get("studentId");
  const [data, setData] = useState<RenewalOpportunitiesResponse | null>(null);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string>();
  const [view, setView] = useState<OpportunityView>("opportunity");
  const [filters, setFilters] = useState<OpportunityFilters>(initialFilters);
  const [filterDraft, setFilterDraft] =
    useState<OpportunityFilters>(initialFilters);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    requestedStudentId,
  );
  const [diagnosis, setDiagnosis] = useState<RenewalStudentDiagnosis | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string>();
  const [selectedCondition, setSelectedCondition] =
    useState<RenewalConditionDiagnosis | null>(null);
  const [assistantFocus, setAssistantFocus] =
    useState<RenewalAssistantFocus>();
  const [runningStudent, setRunningStudent] = useState(false);
  const [studentDrawerOpen, setStudentDrawerOpen] = useState(false);
  const [localAssistantOpen, setLocalAssistantOpen] = useState(false);
  const assistantSurfaceInitialized = useRef(false);
  const toolbar = useOptionalGlobalToolbar();
  const registerAssistantSurface = toolbar?.registerAssistantSurface;
  const unregisterAssistantSurface = toolbar?.unregisterAssistantSurface;
  const setAssistantContext = toolbar?.setAssistantContext;
  const wide = Boolean(screens.xl);
  const medium = !wide && Boolean(screens.lg);
  const assistantOpen = toolbar?.assistantOpen ?? localAssistantOpen;
  const setAssistantOpen = toolbar?.setAssistantOpen ?? setLocalAssistantOpen;
  const openAssistant = toolbar?.openAssistant ?? (() => setLocalAssistantOpen(true));

  const loadData = useCallback(async () => {
    setListLoading(true);
    setListError(undefined);
    try {
      const response = await renewalApi.listOpportunities();
      setData(response);
      return response;
    } catch (error) {
      setListError(error instanceof Error ? error.message : "请稍后重试");
      return null;
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (screens.xl === undefined || assistantSurfaceInitialized.current) return;
    registerAssistantSurface?.("embedded", { defaultOpen: wide });
    if (!toolbar) setLocalAssistantOpen(wide);
    assistantSurfaceInitialized.current = true;
  }, [registerAssistantSurface, screens.xl, toolbar, wide]);

  useEffect(
    () => () => unregisterAssistantSurface?.("embedded"),
    [unregisterAssistantSurface],
  );

  const ownerOptions = useMemo(
    () =>
      Array.from(new Set(data?.items.map((item) => item.student.owner) ?? [])).map(
        (owner) => ({ value: owner, label: owner }),
      ),
    [data],
  );

  const filteredItems = useMemo(
    () => filterRenewalOpportunities(data?.items ?? [], view, filters),
    [data, filters, view],
  );

  useEffect(() => {
    if (!data || listLoading) return;

    const requestedIsVisible = requestedStudentId
      ? filteredItems.some((item) => item.student.id === requestedStudentId)
      : false;
    const selectedIsVisible = selectedStudentId
      ? filteredItems.some((item) => item.student.id === selectedStudentId)
      : false;
    const nextStudentId = requestedIsVisible
      ? requestedStudentId
      : selectedIsVisible
        ? selectedStudentId
        : filteredItems[0]?.student.id ?? null;

    if (nextStudentId !== selectedStudentId) {
      setSelectedStudentId(nextStudentId);
      setAssistantFocus(undefined);
      if (nextStudentId) {
        history.replace(`/renewal/opportunities?studentId=${nextStudentId}`);
      }
    }
  }, [
    data,
    filteredItems,
    listLoading,
    requestedStudentId,
    selectedStudentId,
  ]);

  useEffect(() => {
    if (!selectedStudentId) {
      setDiagnosis(null);
      return;
    }

    let active = true;
    setDiagnosisLoading(true);
    setDiagnosisError(undefined);
    renewalApi
      .getStudentDiagnosis(selectedStudentId)
      .then((response) => {
        if (active) setDiagnosis(response);
      })
      .catch((error: Error) => {
        if (!active) return;
        setDiagnosis(null);
        setDiagnosisError(error.message);
      })
      .finally(() => {
        if (active) setDiagnosisLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedStudentId]);

  useEffect(() => {
    setAssistantContext?.(
      diagnosis
        ? {
            kind: "renewal",
            studentId: diagnosis.student.id,
            studentName: diagnosis.student.name,
            diagnosedAt: diagnosis.student.diagnosedAt,
            focus: assistantFocus,
          }
        : undefined,
    );
  }, [assistantFocus, diagnosis, setAssistantContext]);

  useEffect(() => {
    if (!diagnosis) return;
    trackAnalytics("renewal_diagnosis_view", {
      studentId: diagnosis.student.id,
      grade: diagnosis.student.grade,
      targetComplete: diagnosis.student.targetProfile.status === "confirmed",
      recommendationCount: diagnosis.topRecommendations.length,
    });
  }, [diagnosis]);

  function selectStudent(studentId: string) {
    setSelectedStudentId(studentId);
    setAssistantFocus(undefined);
    setStudentDrawerOpen(false);
    history.replace(`/renewal/opportunities?studentId=${studentId}`);
  }

  function focusAssistant(focus: RenewalAssistantFocus) {
    setAssistantFocus(focus);
    openAssistant();
    const anchorId =
      focus.type === "condition"
        ? `renewal-condition-${focus.id}`
        : `renewal-product-${focus.id}`;
    window.setTimeout(() => {
      document.getElementById(anchorId)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
    }, 0);
  }

  async function runCurrentDiagnosis() {
    if (!selectedStudentId) return;
    setRunningStudent(true);
    try {
      const result = await renewalApi.runDiagnosis({
        scope: "student",
        studentId: selectedStudentId,
        triggerType: "manual",
      });
      const current = result.diagnoses[0];
      if (current) setDiagnosis(current);
      await loadData();
      trackAnalytics("renewal_run_manual", {
        scope: "student",
        studentId: selectedStudentId,
        recommendationCount: current?.topRecommendations.length ?? 0,
      });
      message.success("已按最新数据重新诊断");
    } catch {
      message.error("重新诊断失败");
    } finally {
      setRunningStudent(false);
    }
  }

  const studentContent = (
    <RenewalStudentList
      items={filteredItems}
      summary={data?.summary}
      view={view}
      selectedStudentId={selectedStudentId}
      loading={listLoading}
      error={listError}
      onViewChange={(nextView) => {
        setView(nextView);
        setAssistantFocus(undefined);
      }}
      onSelect={selectStudent}
    />
  );

  const assistantPrompts = useMemo<CompactAssistantPrompt[]>(
    () => [
      { key: "reason", description: "为什么判断为续费机会" },
      {
        key: "product",
        description: "比较推荐产品",
        disabled: !diagnosis?.topRecommendations.length,
      },
      { key: "pending", description: "列出待补信息" },
      { key: "reply", description: "生成家长沟通话术" },
      { key: "followup", description: "生成分步骤跟进清单" },
    ],
    [diagnosis?.topRecommendations.length],
  );

  const assistantContent = diagnosis ? (
    <GlobalAssistantPanel
      prompts={assistantPrompts}
      placeholder="询问当前学生的续费条件、产品或沟通建议"
      emptyIntro={
        <RenewalAssistantIntro
          diagnosis={diagnosis}
          onFocus={focusAssistant}
        />
      }
    />
  ) : (
    <Flex align="center" justify="center" style={{ height: "100%" }}>
      <Empty description="请先选择学生" />
    </Flex>
  );

  const detailActions = (
    <Space size={0}>
      {!wide && !medium ? (
        <Button
          type="text"
          icon={<TeamOutlined />}
          aria-label="选择续费学生"
          onClick={() => setStudentDrawerOpen(true)}
        />
      ) : null}
      <Button
        type="text"
        icon={<ReloadOutlined />}
        loading={runningStudent}
        disabled={!selectedStudentId}
        aria-label="重新诊断当前学生"
        onClick={() => void runCurrentDiagnosis()}
      />
      <Button
        type="primary"
        icon={<RobotOutlined />}
        disabled={!selectedStudentId}
        onClick={openAssistant}
      >
        问 AI
      </Button>
    </Space>
  );

  const detailContent = (
    <RenewalDiagnosisPanel
      diagnosis={diagnosis}
      loading={diagnosisLoading}
      error={diagnosisError}
      headerActions={detailActions}
      onOpenEvidence={setSelectedCondition}
      onFocus={focusAssistant}
    />
  );

  const studentCard = (
    <Card className={styles.panelCard} styles={{ body: { padding: 0 } }}>
      {studentContent}
    </Card>
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
      breadcrumb={{
        items: [{ title: "AI 续费" }, { title: "续费机会" }],
      }}
      childrenContentStyle={{ height: "100%", padding: 0, overflow: "hidden" }}
    >
      <main className={styles.page}>
        <div className={styles.top}>
          <div className={styles.topCard}>
            <div className={styles.filters} aria-label="续费学生筛选">
              <Input
                allowClear
                className={styles.search}
                placeholder="搜索姓名或客户编号"
                value={filterDraft.keyword}
                onChange={(event) =>
                  setFilterDraft((current) => ({
                    ...current,
                    keyword: event.target.value || undefined,
                  }))
                }
              />
              <Select
                allowClear
                aria-label="年级"
                className={styles.filterSelect}
                placeholder="年级"
                value={filterDraft.grade}
                options={gradeOptions}
                onChange={(grade) =>
                  setFilterDraft((current) => ({ ...current, grade }))
                }
              />
              <Select
                allowClear
                showSearch
                aria-label="负责人"
                className={styles.ownerSelect}
                placeholder="负责人"
                optionFilterProp="label"
                value={filterDraft.owner}
                options={ownerOptions}
                onChange={(owner) =>
                  setFilterDraft((current) => ({ ...current, owner }))
                }
              />
              <Select
                allowClear
                aria-label="优先级"
                className={styles.filterSelect}
                placeholder="优先级"
                value={filterDraft.priority}
                options={Object.entries(renewalPriorityMeta).map(([value, meta]) => ({
                  value,
                  label: meta.label,
                }))}
                onChange={(priority) =>
                  setFilterDraft((current) => ({ ...current, priority }))
                }
              />
              <Select
                allowClear
                aria-label="条件大类"
                className={styles.filterSelect}
                placeholder="条件大类"
                value={filterDraft.category}
                options={renewalCategoryOptions}
                onChange={(category) =>
                  setFilterDraft((current) => ({ ...current, category }))
                }
              />
              <Select
                allowClear
                aria-label="触发方式"
                className={styles.filterSelect}
                placeholder="触发方式"
                value={filterDraft.triggerType}
                options={Object.entries(renewalTriggerMeta).map(([value, label]) => ({
                  value,
                  label,
                }))}
                onChange={(triggerType) =>
                  setFilterDraft((current) => ({ ...current, triggerType }))
                }
              />
              <Button
                type="primary"
                aria-label="查询"
                onClick={() => setFilters(filterDraft)}
              >
                查询
              </Button>
              <Button
                aria-label="重置筛选"
                onClick={() => {
                  setFilterDraft(initialFilters);
                  setFilters(initialFilters);
                }}
              >
                重置
              </Button>
            </div>
          </div>
        </div>

        <div className={styles.workspace}>
          {wide && assistantOpen ? (
            <Splitter className={styles.splitter}>
              <Splitter.Panel defaultSize={280} min={260} max={320}>
                {studentCard}
              </Splitter.Panel>
              <Splitter.Panel min={520}>{detailCard}</Splitter.Panel>
              <Splitter.Panel defaultSize={360} min={340} max={420}>
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
            <div className={styles.mobileDetail}>{detailCard}</div>
          )}
        </div>
      </main>

      <Drawer
        title="选择续费学生"
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

      <RenewalEvidenceDrawer
        condition={selectedCondition}
        onClose={() => setSelectedCondition(null)}
      />
    </PageContainer>
  );
}
