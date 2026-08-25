import {
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormText,
  ProFormTreeSelect,
  QueryFilter,
} from "@ant-design/pro-components";
import {
  Card,
  Empty,
  Flex,
  Form,
  List,
  Pagination,
  Space,
  Tag,
  Tabs,
  TreeSelect,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useStudentSelectorStyles } from "./StudentSelector.styles";
import {
  employeeDepartmentTree,
  filterRiskStudents,
  relatedPersonOptions,
  riskEventStatusMeta,
  riskLevelMeta,
  riskTypeOptions,
  sortRiskStudents,
  type RiskEventStatus,
  type RiskStudent,
  type RiskStudentFilters,
} from "./riskData";

export type AdvancedFilters = RiskStudentFilters;
export type StudentProgressFilter = RiskEventStatus;
export const STUDENT_PAGE_SIZE = 5;

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getEventTimeForPeriod(
  period: 7 | 30,
  now = new Date(),
): [string, string] {
  const endDate = new Date(now);
  const startDate = new Date(now);
  startDate.setDate(endDate.getDate() - period + 1);
  return [formatDate(startDate), formatDate(endDate)];
}

export function getDefaultEventTime(now = new Date()): [string, string] {
  return getEventTimeForPeriod(30, now);
}

export function getLinkedRiskStudentFilters(
  searchParams: URLSearchParams,
  now = new Date(),
): AdvancedFilters {
  const requestedLevel = searchParams.get("riskLevel");
  const riskLevel = ["high", "medium", "low"].includes(requestedLevel ?? "")
    ? (requestedLevel as RiskStudentFilters["riskLevel"])
    : undefined;
  const requestedOwner = searchParams.get("owner")?.trim();
  const period = searchParams.get("period") === "7" ? 7 : 30;

  return {
    riskLevel,
    relatedPerson: requestedOwner || undefined,
    eventTime: getEventTimeForPeriod(period, now),
  };
}

export function useRiskStudentSelection(
  records: RiskStudent[],
  selectedStudentId: string | null,
  onSelect: (studentId: string | null) => void,
  initialFilters?: AdvancedFilters,
) {
  const [filters, setFiltersState] = useState<AdvancedFilters>(() => ({
    eventTime: getDefaultEventTime(),
    ...initialFilters,
  }));
  const [progress, setProgressState] =
    useState<StudentProgressFilter>("pending");
  const [currentPage, setCurrentPage] = useState(1);

  const filteredStudents = useMemo(
    () => filterRiskStudents(records, filters),
    [filters, records],
  );
  const progressCounts = useMemo(
    () => ({
      pending: filteredStudents.filter(
        (student) => student.status === "pending",
      ).length,
      resolved: filteredStudents.filter(
        (student) => student.status === "resolved",
      ).length,
      excluded: filteredStudents.filter(
        (student) => student.status === "excluded",
      ).length,
    }),
    [filteredStudents],
  );
  const visibleStudents = useMemo(
    () =>
      sortRiskStudents(
        filteredStudents.filter((student) => student.status === progress),
        "risk",
      ),
    [filteredStudents, progress],
  );
  const maxPage = Math.max(
    1,
    Math.ceil(visibleStudents.length / STUDENT_PAGE_SIZE),
  );
  const normalizedPage = Math.min(currentPage, maxPage);
  const pageStudents = useMemo(() => {
    const start = (normalizedPage - 1) * STUDENT_PAGE_SIZE;
    return visibleStudents.slice(start, start + STUDENT_PAGE_SIZE);
  }, [normalizedPage, visibleStudents]);

  useEffect(() => {
    if (currentPage !== normalizedPage) setCurrentPage(normalizedPage);
  }, [currentPage, normalizedPage]);

  useEffect(() => {
    if (
      selectedStudentId &&
      pageStudents.some((student) => student.id === selectedStudentId)
    ) {
      return;
    }
    onSelect(pageStudents[0]?.id ?? null);
  }, [onSelect, pageStudents, selectedStudentId]);

  const applyFilters = (nextFilters: AdvancedFilters) => {
    setFiltersState(nextFilters);
    setCurrentPage(1);
  };

  const applyProgress = (nextProgress: StudentProgressFilter) => {
    setProgressState(nextProgress);
    setCurrentPage(1);
  };

  return {
    filters,
    applyFilters,
    progress,
    progressCounts,
    applyProgress,
    visibleStudents,
    pageStudents,
    currentPage: normalizedPage,
    setCurrentPage,
    pageSize: STUDENT_PAGE_SIZE,
  };
}

export type RiskStudentSelection = ReturnType<typeof useRiskStudentSelection>;

type StudentQueryBarProps = {
  selection: RiskStudentSelection;
};

export function StudentQueryBar({ selection }: StudentQueryBarProps) {
  const { styles } = useStudentSelectorStyles();
  const [form] = Form.useForm<AdvancedFilters>();

  useEffect(() => {
    form.setFieldsValue({
      student: selection.filters.student,
      riskLevel: selection.filters.riskLevel,
      riskTypes: selection.filters.riskTypes ?? [],
      eventTime: selection.filters.eventTime,
      employeeDepartments: selection.filters.employeeDepartments ?? [],
      relatedPerson: selection.filters.relatedPerson,
    });
  }, [form, selection.filters]);

  return (
    <section className={styles.queryBar} aria-label="客诉风险学生筛选">
      <QueryFilter<AdvancedFilters>
        form={form}
        className={styles.queryFilter}
        layout="vertical"
        defaultCollapsed
        showHiddenNum
        labelWidth="auto"
        span={{ xs: 24, sm: 12, md: 8, lg: 6, xl: 6, xxl: 4 }}
        searchGutter={[16, 8]}
        dateFormatter="string"
        initialValues={{ eventTime: getDefaultEventTime() }}
        searchText="查询"
        resetText="重置"
        onFinish={async (values) => {
          selection.applyFilters({
            ...values,
            employeeDepartments: values.employeeDepartments ?? [],
          });
          return true;
        }}
        onReset={() => {
          selection.applyFilters({ eventTime: getDefaultEventTime() });
        }}
      >
        <ProFormText
          name="student"
          label="学生信息"
          fieldProps={{
            allowClear: true,
            "aria-label": "搜索学生姓名或客户编号",
          }}
          placeholder="请输入姓名或编号"
        />
        <ProFormSelect
          name="riskLevel"
          label="风险等级"
          options={Object.entries(riskLevelMeta).map(([value, meta]) => ({
            label: meta.fullLabel,
            value,
          }))}
          fieldProps={{ allowClear: true }}
        />
        <ProFormSelect
          name="riskTypes"
          label="风险类型"
          options={riskTypeOptions}
          fieldProps={{
            allowClear: true,
            maxTagCount: "responsive",
            mode: "multiple",
            placeholder: "请选择",
          }}
        />
        <ProFormDateRangePicker
          name="eventTime"
          label="风险事件时间"
          fieldProps={{ allowClear: true }}
        />
        <ProFormTreeSelect
          name="employeeDepartments"
          label="员工部门"
          fieldProps={{
            allowClear: true,
            maxTagCount: "responsive",
            placeholder: "请选择",
            showCheckedStrategy: TreeSelect.SHOW_PARENT,
            showSearch: true,
            treeCheckable: true,
            treeData: employeeDepartmentTree,
            treeDefaultExpandAll: true,
            treeNodeFilterProp: "title",
          }}
        />
        <ProFormSelect
          name="relatedPerson"
          label="员工姓名"
          options={relatedPersonOptions}
          fieldProps={{ allowClear: true, showSearch: true }}
        />
      </QueryFilter>
    </section>
  );
}

type StudentSelectorProps = {
  selection: RiskStudentSelection;
  selectedStudentId: string | null;
  onSelect: (studentId: string) => void;
};

export function StudentSelector({
  selection,
  selectedStudentId,
  onSelect,
}: StudentSelectorProps) {
  const { styles, cx } = useStudentSelectorStyles();

  return (
    <section className={styles.root} aria-label="选择学生">
      <Tabs
        className={styles.progressTabs}
        size="small"
        activeKey={selection.progress}
        onChange={(key) =>
          selection.applyProgress(key as StudentProgressFilter)
        }
        items={[
          {
            key: "pending",
            label: `待处理（${selection.progressCounts.pending}）`,
          },
          {
            key: "resolved",
            label: `已处理（${selection.progressCounts.resolved}）`,
          },
          {
            key: "excluded",
            label: `已排除（${selection.progressCounts.excluded}）`,
          },
        ]}
      />
      <List
        className={styles.list}
        dataSource={selection.pageStudents}
        locale={{ emptyText: <Empty description="暂无学生" /> }}
        renderItem={(student) => {
          const selected = student.id === selectedStudentId;
          const riskMeta = riskLevelMeta[student.riskLevel];
          const statusMeta = riskEventStatusMeta[student.status];
          const progressLabel =
            student.status === "pending"
              ? `有待处理风险 · ${student.pendingRiskCount}`
              : statusMeta.label;

          return (
            <List.Item>
              <Card
                size="small"
                className={cx(
                  styles.studentCard,
                  selected && styles.selectedCard,
                )}
                role="option"
                aria-label={`${student.studentName} ${student.studentNumber} ${progressLabel}`}
                aria-selected={selected}
                tabIndex={0}
                onClick={() => onSelect(student.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(student.id);
                  }
                }}
              >
                <Flex align="start" justify="space-between" gap={8}>
                  <Space orientation="vertical" size={0}>
                    <Typography.Text strong>
                      {student.studentName}
                    </Typography.Text>
                    <Typography.Text type="secondary">
                      {student.studentNumber}
                    </Typography.Text>
                  </Space>
                  <Space size={[4, 4]} wrap>
                    <Tag
                      color={statusMeta.color}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {progressLabel}
                    </Tag>
                    <Tag color={riskMeta.color} style={{ marginInlineEnd: 0 }}>
                      {riskMeta.label}
                    </Tag>
                  </Space>
                </Flex>
              </Card>
            </List.Item>
          );
        }}
      />

      <div className={styles.pagination} aria-label="学生列表分页">
        <Pagination
          size="small"
          simple
          showSizeChanger={false}
          current={selection.currentPage}
          pageSize={selection.pageSize}
          total={selection.visibleStudents.length}
          onChange={selection.setCurrentPage}
        />
      </div>
    </section>
  );
}
