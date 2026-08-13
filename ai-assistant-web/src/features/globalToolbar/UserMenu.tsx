import { DownOutlined, LogoutOutlined, SettingOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Modal, Skeleton, message } from "antd";
import type { ItemType } from "antd/es/menu/interface";
import { useGlobalToolbar } from "./GlobalToolbarProvider";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";

export function UserMenu({ includeHelp = false }: { includeHelp?: boolean }) {
  const { styles } = useGlobalToolbarStyles();
  const { currentUser, currentUserLoading } = useGlobalToolbar();

  if (currentUserLoading) {
    return <Skeleton.Avatar active size={28} />;
  }

  const items: ItemType[] = [
    {
      key: "organization",
      label: currentUser?.organization ?? "组织信息不可用",
      disabled: true,
    },
    {
      key: "role",
      label: `当前角色：${currentUser?.role.label ?? "未知"}`,
      disabled: true,
    },
    { type: "divider" },
    {
      key: "settings",
      label: "个人设置",
      icon: <SettingOutlined />,
      onClick: () => message.info("个人设置由统一身份平台管理"),
    },
    ...(includeHelp
      ? [
          {
            key: "help",
            label: "帮助与反馈",
            children: [
              {
                key: "mobile-guide",
                label: "使用指南",
                onClick: () =>
                  Modal.info({
                    title: "使用指南",
                    content:
                      "通过左侧导航切换业务模块；页面内筛选只影响当前列表；问 AI 会自动携带当前页面和已选学生信息。",
                  }),
              },
              {
                key: "mobile-metrics",
                label: "指标口径",
                onClick: () =>
                  Modal.info({
                    title: "指标口径",
                    content:
                      "客诉风险与续费机会均为辅助判断，请结合原始证据和更新时间核实。",
                  }),
              },
              {
                key: "mobile-ai",
                label: "AI 判断说明",
                onClick: () =>
                  Modal.info({
                    title: "AI 判断说明",
                    content:
                      "AI 不替代业务判断，对外沟通、客诉定性和产品推荐都需要负责人确认。",
                  }),
              },
              {
                key: "mobile-feedback",
                label: "问题反馈",
                onClick: () =>
                  Modal.info({
                    title: "问题反馈",
                    content:
                      "请记录当前页面、操作步骤、预期结果和实际结果，并发送到内部产品反馈渠道。",
                  }),
              },
            ],
          } satisfies ItemType,
        ]
      : []),
    {
      key: "logout",
      label: "退出登录",
      icon: <LogoutOutlined />,
      danger: true,
      onClick: () => message.info("演示环境暂不支持退出登录"),
    },
  ];

  const name = currentUser?.name ?? "用户";

  return (
    <Dropdown trigger={["click"]} menu={{ items }} placement="bottomRight">
      <div
        className={styles.userTrigger}
        role="button"
        tabIndex={0}
        aria-label="用户菜单"
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.currentTarget.click();
          }
        }}
      >
        <Avatar size={28} src={currentUser?.avatarUrl}>
          {name.slice(0, 1)}
        </Avatar>
        <span className={styles.userText}>
          <span className={styles.userName}>{name}</span>
          <span className={styles.userRole}>{currentUser?.role.label}</span>
        </span>
        <DownOutlined style={{ fontSize: 10 }} />
      </div>
    </Dropdown>
  );
}
