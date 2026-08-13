import { Button, Col, Drawer, Form, Input, InputNumber, Row, Select, Space, Switch } from "antd";
import { useEffect } from "react";
import type { ComplaintRiskRule } from "../../../api/contracts";
import {
  dataSourceOptions,
  riskLevelOptions,
  themeOptions,
} from "./meta";

type RuleEditorDrawerProps = {
  open: boolean;
  rule: ComplaintRiskRule | null;
  onClose: () => void;
  onSave: (rule: ComplaintRiskRule) => void;
};

const defaultRule: ComplaintRiskRule = {
  id: "",
  name: "",
  theme: "服务响应不满",
  description: "",
  dataSources: ["wechat"],
  keywords: [],
  windowDays: 7,
  minOccurrences: 1,
  score: 20,
  priority: 50,
  enabled: true,
};

function createRuleId() {
  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function RuleEditorDrawer({
  open,
  rule,
  onClose,
  onSave,
}: RuleEditorDrawerProps) {
  const [form] = Form.useForm<ComplaintRiskRule>();

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(rule ? structuredClone(rule) : defaultRule);
  }, [form, open, rule]);

  return (
    <Drawer
      title={rule ? "编辑判断规则" : "新增判断规则"}
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
      footer={
        <div style={{ textAlign: "right" }}>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={() => form.submit()}>
              保存规则
            </Button>
          </Space>
        </div>
      }
    >
      <Form<ComplaintRiskRule>
        form={form}
        layout="vertical"
        onFinish={(values) => {
          onSave({ ...values, id: rule?.id || createRuleId() });
          onClose();
        }}
      >
        <Row gutter={16}>
          <Col xs={24} md={14}>
            <Form.Item
              name="name"
              label="规则名称"
              rules={[{ required: true, whitespace: true, message: "请输入规则名称" }]}
            >
              <Input placeholder="例如：明确退费倾向" />
            </Form.Item>
          </Col>
          <Col xs={24} md={10}>
            <Form.Item
              name="theme"
              label="风险主题"
              rules={[{ required: true, message: "请选择风险主题" }]}
            >
              <Select options={themeOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="判断说明"
          rules={[{ required: true, whitespace: true, message: "请输入判断说明" }]}
        >
          <Input.TextArea
            autoSize={{ minRows: 2, maxRows: 4 }}
            placeholder="说明该规则需要识别的业务含义"
          />
        </Form.Item>

        <Form.Item
          name="dataSources"
          label="数据来源"
          rules={[{ required: true, type: "array", min: 1, message: "至少选择一个数据来源" }]}
        >
          <Select mode="multiple" options={dataSourceOptions} />
        </Form.Item>

        <Form.Item
          name="keywords"
          label="参考词与短语"
          extra="输入后按回车添加，试跑会用这些短语模拟语义命中。"
          rules={[{ required: true, type: "array", min: 1, message: "至少添加一个参考词" }]}
        >
          <Select mode="tags" tokenSeparators={[",", "，"]} open={false} />
        </Form.Item>

        <Row gutter={16}>
          <Col xs={12} md={6}>
            <Form.Item
              name="windowDays"
              label="命中周期（天）"
              rules={[{ required: true, message: "请输入周期" }]}
            >
              <InputNumber min={1} max={365} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="minOccurrences"
              label="最少次数"
              rules={[{ required: true, message: "请输入次数" }]}
            >
              <InputNumber min={1} max={99} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="score"
              label="风险分值"
              rules={[{ required: true, message: "请输入分值" }]}
            >
              <InputNumber min={1} max={100} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col xs={12} md={6}>
            <Form.Item
              name="priority"
              label="优先级"
              rules={[{ required: true, message: "请输入优先级" }]}
            >
              <InputNumber min={1} max={999} style={{ width: "100%" }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item name="forceLevel" label="强制风险等级">
              <Select
                allowClear
                placeholder="不强制，按分数映射"
                options={riskLevelOptions}
              />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="enabled" label="规则状态" valuePropName="checked">
              <Switch checkedChildren="已启用" unCheckedChildren="已停用" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Drawer>
  );
}
