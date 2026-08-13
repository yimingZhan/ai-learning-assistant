import { history } from "@umijs/max";
import { Button, Result } from "antd";

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，你访问的页面不存在。"
      extra={
        <Button
          type="primary"
          onClick={() => history.push("/quality/conversation")}
        >
          返回 AI 客诉预警
        </Button>
      }
    />
  );
}
