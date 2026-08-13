import {
  PageContainer,
  ProTable,
  type ProColumns,
} from "@ant-design/pro-components";
import { useSearchParams } from "@umijs/max";
import {
  Button,
  Descriptions,
  Drawer,
  Space,
  Tag,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useOptionalGlobalToolbar } from "../../../features/globalToolbar/GlobalToolbarProvider";
import {
  currentAdvisorOptions,
  currentProductOptions,
  filterRenewalStudents,
  gradeOptions,
  recommendedProductTypeMeta,
  renewalOpportunityMeta,
  renewalStudents,
  type RecommendedProductType,
  type RenewalOpportunity,
  type RenewalStudent,
  type RenewalStudentFilters,
} from "./renewalData";

function RenewalOpportunityTag({ value }: { value: RenewalOpportunity }) {
  const meta = renewalOpportunityMeta[value];

  return <Tag color={meta.color}>{meta.label}</Tag>;
}

function RecommendedDirectionTag({
  value,
}: {
  value: RecommendedProductType;
}) {
  return <Tag>{recommendedProductTypeMeta[value]}</Tag>;
}

function StudentInformation({ student }: { student: RenewalStudent }) {
  return (
    <Space orientation="vertical" size={0}>
      <Typography.Text strong>
        {student.studentName}（{student.customerNumber}）
      </Typography.Text>
      <Typography.Text type="secondary">{student.grade}</Typography.Text>
    </Space>
  );
}

function BusinessHierarchy({ student }: { student: RenewalStudent }) {
  return (
    <Typography.Text>
      {student.businessUnit} / {student.courseSystem} / {student.courseItem}
    </Typography.Text>
  );
}

function CurrentAdvisor({ student }: { student: RenewalStudent }) {
  return (
    <Typography.Text>
      {student.currentAdvisor.name}（{student.currentAdvisor.employeeNumber}）
    </Typography.Text>
  );
}

function CurrentProducts({ products }: { products: string[] }) {
  return (
    <Space orientation="vertical" size={0}>
      {products.map((product) => (
        <Typography.Text key={product}>{product}</Typography.Text>
      ))}
    </Space>
  );
}

function RenewalDetailDrawer({
  student,
  onClose,
}: {
  student: RenewalStudent | null;
  onClose: () => void;
}) {
  return (
    <Drawer
      title="学生续费详情"
      open={Boolean(student)}
      size="min(720px, 100vw)"
      onClose={onClose}
    >
      {student ? (
        <Descriptions
          bordered
          column={1}
          items={[
            {
              key: "studentInformation",
              label: "学生信息",
              children: <StudentInformation student={student} />,
            },
            {
              key: "businessHierarchy",
              label: "事业部/课程体系/课程项",
              children: <BusinessHierarchy student={student} />,
            },
            {
              key: "currentProducts",
              label: "当前学习产品",
              children: <CurrentProducts products={student.currentProducts} />,
            },
            {
              key: "renewalOpportunity",
              label: "续费机会",
              children: (
                <RenewalOpportunityTag value={student.renewalOpportunity} />
              ),
            },
            {
              key: "aiSuggestion",
              label: "AI 续费建议",
              children: student.aiSuggestion,
            },
            {
              key: "recommendedDirection",
              label: "推荐方向",
              children: (
                <RecommendedDirectionTag
                  value={student.recommendedDirection}
                />
              ),
            },
            {
              key: "recommendedProduct",
              label: "推荐产品",
              children: student.recommendedProduct,
            },
            {
              key: "updatedAt",
              label: "续费信息更新时间",
              children: student.updatedAt,
            },
            {
              key: "currentAdvisor",
              label: "当前跟进顾问",
              children: <CurrentAdvisor student={student} />,
            },
          ]}
        />
      ) : null}
    </Drawer>
  );
}

export default function RenewalPredictionPage() {
  const [searchParams] = useSearchParams();
  const requestedStudentId = searchParams.get("studentId");
  const [selectedStudent, setSelectedStudent] = useState<RenewalStudent | null>(
    () =>
      renewalStudents.find((student) => student.id === requestedStudentId) ??
      null,
  );
  const [detailOpen, setDetailOpen] = useState(() => selectedStudent !== null);
  const toolbar = useOptionalGlobalToolbar();
  const setAssistantContext = toolbar?.setAssistantContext;

  useEffect(() => {
    if (!requestedStudentId) return;
    const student = renewalStudents.find(
      (item) => item.id === requestedStudentId,
    );
    if (student) {
      setSelectedStudent(student);
      setDetailOpen(true);
    }
  }, [requestedStudentId]);

  useEffect(() => {
    setAssistantContext?.(
      selectedStudent
        ? {
            kind: "renewal",
            studentId: selectedStudent.id,
            studentName: selectedStudent.studentName,
          }
        : undefined,
    );
    return () => setAssistantContext?.(undefined);
  }, [selectedStudent, setAssistantContext]);

  const columns: ProColumns<RenewalStudent>[] = [
    {
      title: "学生搜索",
      dataIndex: "studentSearch",
      hideInTable: true,
      fieldProps: {
        placeholder: "请输入学生姓名或手机号",
      },
    },
    {
      title: "续费机会",
      dataIndex: "renewalOpportunity",
      valueType: "select",
      hideInTable: true,
      valueEnum: Object.fromEntries(
        Object.entries(renewalOpportunityMeta).map(([value, meta]) => [
          value,
          { text: meta.label },
        ]),
      ),
      fieldProps: {
        placeholder: "请选择",
      },
    },
    {
      title: "推荐产品类型",
      dataIndex: "recommendedProductType",
      valueType: "select",
      hideInTable: true,
      valueEnum: Object.fromEntries(
        Object.entries(recommendedProductTypeMeta).map(([value, label]) => [
          value,
          { text: label },
        ]),
      ),
      fieldProps: {
        placeholder: "请选择",
      },
    },
    {
      title: "学生年级",
      dataIndex: "grade",
      valueType: "select",
      hideInTable: true,
      fieldProps: {
        options: gradeOptions,
        placeholder: "请选择",
      },
    },
    {
      title: "当前学习产品",
      dataIndex: "currentProduct",
      valueType: "select",
      hideInTable: true,
      fieldProps: {
        options: currentProductOptions,
        placeholder: "请选择",
        showSearch: true,
      },
    },
    {
      title: "当前跟进顾问",
      dataIndex: "currentAdvisor",
      valueType: "select",
      hideInTable: true,
      fieldProps: {
        options: currentAdvisorOptions,
        placeholder: "请选择",
      },
    },
    {
      title: "学生信息",
      key: "studentInformation",
      search: false,
      width: 190,
      render: (_, record) => <StudentInformation student={record} />,
    },
    {
      title: "事业部/课程体系/课程项",
      key: "businessHierarchy",
      search: false,
      width: 230,
      render: (_, record) => <BusinessHierarchy student={record} />,
    },
    {
      title: "当前学习产品",
      dataIndex: "currentProducts",
      search: false,
      width: 190,
      render: (_, record) => (
        <CurrentProducts products={record.currentProducts} />
      ),
    },
    {
      title: "续费机会",
      dataIndex: "renewalOpportunity",
      key: "renewalOpportunityColumn",
      search: false,
      width: 100,
      render: (_, record) => (
        <RenewalOpportunityTag value={record.renewalOpportunity} />
      ),
    },
    {
      title: "AI 续费建议",
      dataIndex: "aiSuggestion",
      search: false,
      width: 320,
      render: (_, record) => (
        <Typography.Paragraph
          ellipsis={{ rows: 2, tooltip: record.aiSuggestion }}
          style={{ marginBottom: 0 }}
        >
          {record.aiSuggestion}
        </Typography.Paragraph>
      ),
    },
    {
      title: "推荐方向",
      dataIndex: "recommendedDirection",
      search: false,
      width: 120,
      render: (_, record) => (
        <RecommendedDirectionTag value={record.recommendedDirection} />
      ),
    },
    {
      title: "推荐产品",
      dataIndex: "recommendedProduct",
      search: false,
      width: 200,
    },
    {
      title: "续费信息更新时间",
      dataIndex: "updatedAt",
      search: false,
      width: 180,
    },
    {
      title: "当前跟进顾问",
      key: "currentAdvisorColumn",
      search: false,
      width: 160,
      render: (_, record) => <CurrentAdvisor student={record} />,
    },
    {
      title: "操作",
      valueType: "option",
      key: "option",
      width: 100,
      fixed: "right",
      render: (_, record) => [
        <Button
          key="detail"
          type="link"
          onClick={() => {
            setSelectedStudent(record);
            setDetailOpen(true);
          }}
        >
          查看详情
        </Button>,
      ],
    },
  ];

  return (
    <PageContainer title={false}>
      <ProTable<RenewalStudent, RenewalStudentFilters>
        headerTitle="学生续费列表"
        cardBordered
        columns={columns}
        rowKey="id"
        dateFormatter="string"
        search={{
          labelWidth: "auto",
          span: 6,
          defaultCollapsed: false,
        }}
        pagination={{
          defaultPageSize: 5,
          showSizeChanger: true,
        }}
        scroll={{ x: 1780 }}
        request={async (params) => {
          const filtered = filterRenewalStudents(renewalStudents, params);
          const current = params.current ?? 1;
          const pageSize = params.pageSize ?? 5;
          const start = (current - 1) * pageSize;

          return {
            data: filtered.slice(start, start + pageSize),
            success: true,
            total: filtered.length,
          };
        }}
      />

      <RenewalDetailDrawer
        student={detailOpen ? selectedStudent : null}
        onClose={() => setDetailOpen(false)}
      />
    </PageContainer>
  );
}
