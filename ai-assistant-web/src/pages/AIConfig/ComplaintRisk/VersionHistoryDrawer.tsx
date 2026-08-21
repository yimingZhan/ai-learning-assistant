import {
  EyeOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import {
  Button,
  Drawer,
  Empty,
  Flex,
  Modal,
  Space,
  Tag,
  Typography,
} from "antd";
import { ProTable, type ProColumns } from "@ant-design/pro-components";
import { useState } from "react";
import type { ComplaintRiskVersion } from "../../../api/contracts";
import { useComplaintRiskConfigStyles } from "./index.styles";

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
  const { styles } = useComplaintRiskConfigStyles();
  const [detailVersion, setDetailVersion] =
    useState<ComplaintRiskVersion | null>(null);

  function getVersionStats(version: ComplaintRiskVersion) {
    return version.riskTypes.reduce(
      (stats, riskType) => ({
        riskTypes: stats.riskTypes + 1,
        keywords: stats.keywords + riskType.keywords.length,
        examples: stats.examples + riskType.positiveExamples.length,
      }),
      { riskTypes: 0, keywords: 0, examples: 0 },
    );
  }

  function renderVersionSnapshot(version: ComplaintRiskVersion) {
    const stats = getVersionStats(version);

    return (
      <div className={styles.versionSnapshot}>
        <Flex justify="space-between" align="center" gap={16} wrap>
          <Space size={[4, 4]} wrap>
            <Tag color="blue">{stats.riskTypes} 个风险类型</Tag>
            <Tag>{stats.keywords} 个关键词</Tag>
            <Tag>{stats.examples} 条参考案例</Tag>
          </Space>
          <Typography.Text type="secondary">
            {version.publishedAt} · {version.publishedBy}
          </Typography.Text>
        </Flex>

        {version.riskTypes.length ? (
          <div className={styles.versionSnapshotList}>
            {version.riskTypes.map((riskType) => (
              <div className={styles.versionSnapshotItem} key={riskType.id}>
                <Typography.Text className={styles.versionSnapshotType}>
                  {riskType.name}
                </Typography.Text>
                <div className={styles.versionSnapshotGroup}>
                  <Typography.Text className={styles.versionSnapshotLabel}>
                    关键词
                  </Typography.Text>
                  <Space size={[4, 4]} wrap>
                    {riskType.keywords.map((keyword) => (
                      <Tag key={keyword}>{keyword}</Tag>
                    ))}
                  </Space>
                </div>
                <div className={styles.versionSnapshotGroup}>
                  <Typography.Text className={styles.versionSnapshotLabel}>
                    参考案例
                  </Typography.Text>
                  <ol className={styles.versionSnapshotExamples}>
                    {riskType.positiveExamples.map((example, index) => (
                      <li key={`${riskType.id}-positive-${index}`}>
                        {example}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className={styles.versionSnapshotGroup}>
                  <Typography.Text className={styles.versionSnapshotLabel}>
                    风险等级定义
                  </Typography.Text>
                  <ol className={styles.versionSnapshotExamples}>
                    <li>
                      <Typography.Text strong>高：</Typography.Text>
                      {riskType.highRiskDefinition}
                    </li>
                    <li>
                      <Typography.Text strong>中：</Typography.Text>
                      {riskType.mediumRiskDefinition}
                    </li>
                    <li>
                      <Typography.Text strong>低：</Typography.Text>
                      {riskType.lowRiskDefinition}
                    </li>
                  </ol>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无配置内容" />
        )}
      </div>
    );
  }

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
      title: "配置内容",
      dataIndex: "riskTypes",
      width: 260,
      render: (_, record) => {
        const stats = getVersionStats(record);
        return (
          <Space size={[4, 4]} wrap>
            <Tag color="blue">{stats.riskTypes} 类风险类型</Tag>
            <Typography.Text type="secondary">
              {stats.keywords} 个关键词 · {stats.examples} 条案例
            </Typography.Text>
          </Space>
        );
      },
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
      width: 190,
      fixed: "right",
      align: "center",
      render: (_, record) =>
        (
          <Space size={0} wrap={false} className={styles.actionGroup}>
            <Button
              type="link"
              icon={<EyeOutlined />}
              aria-label={`查看${record.version}配置`}
              onClick={() => setDetailVersion(record)}
            >
              查看配置
            </Button>
            {record.status === "history" ? (
              <Button
                type="link"
                icon={<RollbackOutlined />}
                aria-label={`恢复${record.version}`}
                loading={rollbackLoading === record.version}
                onClick={() =>
                  Modal.confirm({
                    title: `恢复 ${record.version}？`,
                    content:
                      "恢复会以该版本配置创建一个新的生效版本，原有版本记录不会被删除。",
                    okText: "确认恢复",
                    cancelText: "取消",
                    onOk: () => onRollback(record.version),
                  })
                }
              >
                恢复版本
              </Button>
            ) : null}
          </Space>
        ),
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
        scroll={{ x: 980 }}
      />
      <Modal
        title={detailVersion ? `${detailVersion.version} 配置详情` : undefined}
        open={Boolean(detailVersion)}
        footer={null}
        width={760}
        destroyOnHidden
        onCancel={() => setDetailVersion(null)}
      >
        {detailVersion ? renderVersionSnapshot(detailVersion) : null}
      </Modal>
    </Drawer>
  );
}
