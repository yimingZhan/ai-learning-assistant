import { Button, Drawer, Modal, Tag, Typography } from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import type { ComplaintRiskVersion } from "../../../api/contracts";

type VersionHistoryDrawerProps = {
  open: boolean;
  loading: boolean;
  rollbackLoading: string | null;
  versions: ComplaintRiskVersion[];
  onClose: () => void;
  onRollback: (version: string) => Promise<void>;
};

export function VersionHistoryDrawer({
  open,
  loading,
  rollbackLoading,
  versions,
  onClose,
  onRollback,
}: VersionHistoryDrawerProps) {
  const columns: ProColumns<ComplaintRiskVersion>[] = [
    {
      title: "版本",
      dataIndex: "version",
      width: 100,
      render: (_, record) => (
        <Typography.Text strong>{record.version}</Typography.Text>
      ),
    },
    {
      title: "状态",
      dataIndex: "status",
      width: 90,
      render: (_, record) =>
        record.status === "current" ? (
          <Tag color="success">当前生效</Tag>
        ) : (
          <Tag>历史版本</Tag>
        ),
    },
    {
      title: "变更说明",
      dataIndex: "changeNote",
      ellipsis: true,
    },
    {
      title: "发布人",
      dataIndex: "publishedBy",
      width: 100,
    },
    {
      title: "发布时间",
      dataIndex: "publishedAt",
      width: 160,
    },
    {
      title: "操作",
      valueType: "option",
      width: 80,
      render: (_, record) =>
        record.status === "current"
          ? []
          : [
              <Button
                key="rollback"
                type="link"
                loading={rollbackLoading === record.version}
                onClick={() =>
                  Modal.confirm({
                    title: `回滚至 ${record.version}？`,
                    content:
                      "回滚会以该版本配置创建一个新的生效版本，原有版本记录不会被删除。",
                    okText: "确认回滚",
                    cancelText: "取消",
                    onOk: () => onRollback(record.version),
                  })
                }
              >
                回滚
              </Button>,
            ],
    },
  ];

  return (
    <Drawer
      title="版本记录"
      open={open}
      onClose={onClose}
      size="large"
      destroyOnHidden
    >
      <ProTable<ComplaintRiskVersion>
        rowKey="version"
        columns={columns}
        dataSource={versions}
        loading={loading}
        search={false}
        options={false}
        pagination={false}
        cardBordered
        scroll={{ x: 760 }}
      />
    </Drawer>
  );
}
