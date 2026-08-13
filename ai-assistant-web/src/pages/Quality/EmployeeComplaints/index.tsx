import {
  PageContainer,
  ProCard,
  ProTable,
  StatisticCard,
  type ProColumns,
} from "@ant-design/pro-components";
import { history } from "@umijs/max";
import { Button, Flex, Typography } from "antd";
import { useMemo, useState } from "react";
import { useScrollablePageStyles } from "../../../features/layout/page.styles";
import {
  riskLevelMeta,
  riskStudents,
  type RiskLevel,
} from "../Conversation/riskData";
import {
  buildComplaintWarningPath,
  buildEmployeeRiskRows,
  employeeProfiles,
  filterEmployeeRiskRows,
  formatRiskRate,
  getEmployeeRiskSummary,
  type EmployeeRiskFilters,
  type EmployeeRiskRow,
  type RiskPeriod,
} from "./employeeRiskData";

const groupOptions = [
  ...new Set(employeeProfiles.map((profile) => profile.groupName)),
].map((groupName) => ({ label: groupName, value: groupName }));

const employeeOptions = employeeProfiles.map((profile) => ({
  label: profile.employeeName,
  value: profile.id,
}));

function normalizePeriod(period: EmployeeRiskFilters["period"]): RiskPeriod {
  return Number(period) === 30 ? 30 : 7;
}

function normalizeFilters(
  filters: EmployeeRiskFilters,
): EmployeeRiskFilters {
  return {
    period: normalizePeriod(filters.period),
    groupName: filters.groupName,
    employeeId: filters.employeeId,
    riskLevel: filters.riskLevel,
  };
}

function RiskMetricLink({
  row,
  count,
  rate,
  period,
  riskLevel,
}: {
  row: EmployeeRiskRow;
  count: number;
  rate: number;
  period: RiskPeriod;
  riskLevel?: RiskLevel;
}) {
  return (
    <Button
      type="link"
      size="small"
      disabled={count === 0}
      onClick={() =>
        history.push(
          buildComplaintWarningPath({
            employeeName: row.employeeName,
            period,
            riskLevel,
          }),
        )
      }
    >
      {count}人（{formatRiskRate(rate)}）
    </Button>
  );
}

export default function EmployeeComplaintsPage() {
  const { styles } = useScrollablePageStyles();
  const [activeFilters, setActiveFilters] = useState<EmployeeRiskFilters>({
    period: 7,
  });
  const period = normalizePeriod(activeFilters.period);
  const overviewRows = useMemo(
    () =>
      filterEmployeeRiskRows(
        buildEmployeeRiskRows(employeeProfiles, riskStudents, period),
        activeFilters,
      ),
    [activeFilters, period],
  );
  const summary = useMemo(
    () => getEmployeeRiskSummary(overviewRows),
    [overviewRows],
  );

  const columns: ProColumns<EmployeeRiskRow>[] = [
    {
      title: "时间范围",
      dataIndex: "period",
      valueType: "select",
      hideInTable: true,
      initialValue: 7,
      fieldProps: {
        allowClear: false,
        options: [
          { label: "近7天", value: 7 },
          { label: "近30天", value: 30 },
        ],
      },
    },
    {
      title: "组织/小组",
      dataIndex: "groupName",
      valueType: "select",
      hideInTable: true,
      fieldProps: {
        options: groupOptions,
        placeholder: "请选择",
        showSearch: true,
      },
    },
    {
      title: "员工",
      dataIndex: "employeeId",
      valueType: "select",
      hideInTable: true,
      fieldProps: {
        options: employeeOptions,
        placeholder: "请选择",
        showSearch: true,
        optionFilterProp: "label",
      },
    },
    {
      title: "风险等级",
      dataIndex: "riskLevel",
      valueType: "select",
      hideInTable: true,
      valueEnum: Object.fromEntries(
        Object.entries(riskLevelMeta).map(([value, meta]) => [
          value,
          { text: meta.fullLabel },
        ]),
      ),
      fieldProps: {
        placeholder: "请选择",
      },
    },
    {
      title: "员工姓名",
      dataIndex: "employeeName",
      search: false,
      width: 120,
      fixed: "left",
      render: (_, row) => (
        <Typography.Text strong>{row.employeeName}</Typography.Text>
      ),
    },
    {
      title: "所属小组",
      dataIndex: "groupName",
      search: false,
      width: 160,
    },
    {
      title: "在管学生数",
      dataIndex: "activeStudentCount",
      search: false,
      width: 120,
      sorter: (first, second) =>
        first.activeStudentCount - second.activeStudentCount,
    },
    {
      title: "风险学生总数",
      dataIndex: "totalRiskCount",
      search: false,
      width: 160,
      sorter: (first, second) => first.totalRiskRate - second.totalRiskRate,
      render: (_, row) => (
        <RiskMetricLink
          row={row}
          count={row.totalRiskCount}
          rate={row.totalRiskRate}
          period={period}
        />
      ),
    },
    {
      title: "高风险学生",
      dataIndex: "highRiskCount",
      search: false,
      width: 150,
      defaultSortOrder: "descend",
      sorter: (first, second) => first.highRiskCount - second.highRiskCount,
      render: (_, row) => (
        <RiskMetricLink
          row={row}
          count={row.highRiskCount}
          rate={row.highRiskRate}
          period={period}
          riskLevel="high"
        />
      ),
    },
    {
      title: "中风险学生",
      dataIndex: "mediumRiskCount",
      search: false,
      width: 150,
      sorter: (first, second) => first.mediumRiskCount - second.mediumRiskCount,
      render: (_, row) => (
        <RiskMetricLink
          row={row}
          count={row.mediumRiskCount}
          rate={row.mediumRiskRate}
          period={period}
          riskLevel="medium"
        />
      ),
    },
    {
      title: "低风险学生",
      dataIndex: "lowRiskCount",
      search: false,
      width: 150,
      sorter: (first, second) => first.lowRiskCount - second.lowRiskCount,
      render: (_, row) => (
        <RiskMetricLink
          row={row}
          count={row.lowRiskCount}
          rate={row.lowRiskRate}
          period={period}
          riskLevel="low"
        />
      ),
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      width: 120,
      fixed: "right",
      render: (_, row) => [
        <Button
          key="students"
          type="link"
          disabled={row.totalRiskCount === 0}
          onClick={() =>
            history.push(
              buildComplaintWarningPath({
                employeeName: row.employeeName,
                period,
              }),
            )
          }
        >
          查看风险学生
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer className={styles.scrollPage} title={false}>
      <Flex vertical gap="middle">
        <ProCard title="团队风险概览" gutter={[16, 16]} wrap>
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "在管学生总数",
              value: summary.activeStudentCount,
              suffix: "人",
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "客诉风险学生总数",
              value: summary.totalRiskCount,
              suffix: "人",
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "客诉风险学生占比",
              value: Number((summary.totalRiskRate * 100).toFixed(1)),
              suffix: "%",
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "高风险学生数",
              value: summary.highRiskCount,
              suffix: "人",
              status: "error",
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "中风险学生数",
              value: summary.mediumRiskCount,
              suffix: "人",
              status: "warning",
            }}
          />
          <StatisticCard
            colSpan={{ xs: 24, sm: 12, lg: 8, xl: 8, xxl: 4 }}
            statistic={{
              title: "低风险学生数",
              value: summary.lowRiskCount,
              suffix: "人",
              status: "success",
            }}
          />
        </ProCard>

        <ProTable<EmployeeRiskRow, EmployeeRiskFilters>
          headerTitle="员工客诉列表"
          cardBordered
          columns={columns}
          rowKey="id"
          dateFormatter="string"
          search={{
            labelWidth: "auto",
            span: 6,
            defaultCollapsed: false,
          }}
          onSubmit={(values) => setActiveFilters(normalizeFilters(values))}
          onReset={() => setActiveFilters({ period: 7 })}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
          }}
          scroll={{ x: 1310 }}
          request={async (params) => {
            const normalizedFilters = normalizeFilters(params);
            const rows = filterEmployeeRiskRows(
              buildEmployeeRiskRows(
                employeeProfiles,
                riskStudents,
                normalizePeriod(normalizedFilters.period),
              ),
              normalizedFilters,
            );
            const current = params.current ?? 1;
            const pageSize = params.pageSize ?? 10;
            const start = (current - 1) * pageSize;

            return {
              data: rows.slice(start, start + pageSize),
              success: true,
              total: rows.length,
            };
          }}
        />
      </Flex>
    </PageContainer>
  );
}
