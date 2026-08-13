import {
  FilterOutlined,
  SortAscendingOutlined,
} from "@ant-design/icons";
import {
  ProForm,
  ProFormDateRangePicker,
  ProFormSelect,
  ProFormTreeSelect,
} from "@ant-design/pro-components";
import {
  Badge,
  Button,
  Card,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Popover,
  Space,
  Tag,
  TreeSelect,
  Typography,
} from "antd";
import { useEffect, useMemo, useState } from "react";
import { useStudentSelectorStyles } from "./StudentSelector.styles";
import {
  employeeDepartmentTree,
  filterRiskStudents,
  relatedPersonOptions,
  riskLevelMeta,
  riskSourceMeta,
  sortRiskStudents,
  type RiskStudent,
  type RiskStudentFilters,
  type RiskStudentSort,
} from "./riskData";

export type AdvancedFilters = Omit<RiskStudentFilters, "student">;

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
  const riskLevel = ["high", "medium", "low"].includes(
    requestedLevel ?? "",
  )
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

function countActiveFilters(filters: AdvancedFilters) {
  return [
    filters.riskLevel,
    filters.riskSources?.length ? filters.riskSources : undefined,
    filters.eventTime,
    filters.employeeDepartments?.length
      ? filters.employeeDepartments
      : undefined,
    filters.relatedPerson,
  ].filter(Boolean).length;
}

function toFilterFormValues(filters: AdvancedFilters): AdvancedFilters {
  return {
    riskLevel: filters.riskLevel,
    riskSources: filters.riskSources ?? [],
    eventTime: filters.eventTime,
    employeeDepartments: filters.employeeDepartments ?? [],
    relatedPerson: filters.relatedPerson,
  };
}

export function useRiskStudentSelection(
  records: RiskStudent[],
  selectedStudentId: string | null,
  onSelect: (studentId: string | null) => void,
  initialFilters?: AdvancedFilters,
) {
  const [keyword, setKeyword] = useState("");
  const [sort, setSort] = useState<RiskStudentSort>("risk");
  const [filters, setFilters] = useState<AdvancedFilters>(() => ({
    eventTime: getDefaultEventTime(),
    ...initialFilters,
  }));

  const visibleStudents = useMemo(
    () =>
      sortRiskStudents(
        filterRiskStudents(records, { ...filters, student: keyword }),
        sort,
      ),
    [filters, keyword, records, sort],
  );

  useEffect(() => {
    if (
      selectedStudentId &&
      visibleStudents.some((student) => student.id === selectedStudentId)
    ) {
      return;
    }
    onSelect(visibleStudents[0]?.id ?? null);
  }, [onSelect, selectedStudentId, visibleStudents]);

  return {
    keyword,
    setKeyword,
    sort,
    setSort,
    filters,
    setFilters,
    visibleStudents,
    activeFilterCount: countActiveFilters(filters),
  };
}

export type RiskStudentSelection = ReturnType<
  typeof useRiskStudentSelection
>;

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [form] = Form.useForm<AdvancedFilters>();

  const filterContent = (
    <ProForm<AdvancedFilters>
      form={form}
      className={styles.filterForm}
      layout="vertical"
      submitter={false}
      dateFormatter="string"
      initialValues={selection.filters}
      onFinish={async (values) => {
        selection.setFilters(values);
        setFilterOpen(false);
      }}
    >
      <ProFormSelect
        name="riskLevel"
        label="风险等级"
        options={Object.entries(riskLevelMeta).map(([value, meta]) => ({
          label: meta.label,
          value,
        }))}
        fieldProps={{ allowClear: true }}
      />
      <ProFormSelect
        name="riskSources"
        label="风险来源"
        options={Object.entries(riskSourceMeta).map(([value, label]) => ({
          label,
          value,
        }))}
        fieldProps={{ mode: "multiple", allowClear: true }}
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
        label="相关人"
        options={relatedPersonOptions}
        fieldProps={{ allowClear: true, showSearch: true }}
      />
      <div className={styles.filterActions}>
        <Button
          onClick={() =>
            form.setFieldsValue({
              riskLevel: undefined,
              riskSources: [],
              eventTime: getDefaultEventTime(),
              employeeDepartments: [],
              relatedPerson: undefined,
            })
          }
        >
          重置
        </Button>
        <Button onClick={() => setFilterOpen(false)}>取消</Button>
        <Button type="primary" onClick={() => form.submit()}>
          应用
        </Button>
      </div>
    </ProForm>
  );

  return (
    <section className={styles.root} aria-label="选择学生">
      <div className={styles.toolbar}>
        <Input.Search
          className={styles.search}
          allowClear
          aria-label="搜索学生姓名或客户编号"
          placeholder="学生姓名/客户编号"
          value={selection.keyword}
          onChange={(event) => selection.setKeyword(event.target.value)}
        />
        <Dropdown
          trigger={["click"]}
          menu={{
            selectedKeys: [selection.sort],
            items: [
              { key: "risk", label: "风险优先" },
              { key: "latest", label: "最近风险时间" },
              { key: "eventCount", label: "风险事件数" },
            ],
            onClick: ({ key }) =>
              selection.setSort(key as RiskStudentSort),
          }}
        >
          <Button aria-label="排序" icon={<SortAscendingOutlined />} />
        </Dropdown>
        <Popover
          trigger="click"
          placement="bottomLeft"
          open={filterOpen}
          onOpenChange={(open) => {
            setFilterOpen(open);
            if (open) form.setFieldsValue(toFilterFormValues(selection.filters));
          }}
          content={filterContent}
        >
          <Badge count={selection.activeFilterCount} size="small">
            <Button aria-label="筛选" icon={<FilterOutlined />} />
          </Badge>
        </Popover>
      </div>

      <List
        className={styles.list}
        dataSource={selection.visibleStudents}
        locale={{ emptyText: <Empty description="暂无学生" /> }}
        renderItem={(student) => {
          const selected = student.id === selectedStudentId;
          const riskMeta = riskLevelMeta[student.riskLevel];

          return (
            <List.Item>
              <Card
                size="small"
                className={cx(
                  styles.studentCard,
                  selected && styles.selectedCard,
                )}
                role="option"
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
                  <Space size={4}>
                    <Tag style={{ marginInlineEnd: 0 }}>
                      风险事件 {student.riskEventCount}
                    </Tag>
                    <Tag
                      color={riskMeta.color}
                      style={{ marginInlineEnd: 0 }}
                    >
                      {riskMeta.label}
                    </Tag>
                  </Space>
                </Flex>
              </Card>
            </List.Item>
          );
        }}
      />
    </section>
  );
}
