import { PageContainer } from "@ant-design/pro-components";
import { history, useSearchParams } from "@umijs/max";
import { Flex, Spin } from "antd";
import { useEffect } from "react";

export default function RenewalDiagnosisCompatibilityPage() {
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");

  useEffect(() => {
    const query = studentId
      ? `?studentId=${encodeURIComponent(studentId)}`
      : "";
    history.replace(`/renewal/opportunities${query}`);
  }, [studentId]);

  return (
    <PageContainer title={false} pageHeaderRender={false}>
      <Flex align="center" justify="center" style={{ minHeight: 320 }}>
        <Spin size="large" description="正在打开 AI 续费工作台" />
      </Flex>
    </PageContainer>
  );
}
