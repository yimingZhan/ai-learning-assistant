import { MenuOutlined, RobotOutlined } from "@ant-design/icons";
import { useLocation } from "@umijs/max";
import { Button, Tooltip } from "antd";
import { HelpMenu } from "./HelpMenu";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";
import { useGlobalToolbar } from "./GlobalToolbarProvider";
import { UserMenu } from "./UserMenu";
import { WorkReminderPopover } from "./WorkReminderPopover";

export function GlobalToolbar({
  mobile = false,
  onMenuToggle,
}: {
  mobile?: boolean;
  onMenuToggle?: () => void;
}) {
  const location = useLocation();
  const { styles, cx } = useGlobalToolbarStyles();
  const {
    assistantActive,
    openAssistant,
    triggerAssistant,
  } = useGlobalToolbar();
  const standaloneAssistant = location.pathname === "/assistant";
  const assistantButtonActive = standaloneAssistant || assistantActive;

  return (
    <header
      className={cx(styles.toolbar, mobile && styles.mobileToolbar)}
      aria-label="全局工具栏"
    >
      {mobile ? (
        <Button
          type="text"
          aria-label="打开主导航"
          className={styles.mobileMenuButton}
          icon={<MenuOutlined />}
          onClick={onMenuToggle}
        />
      ) : null}
      <div className={styles.actions}>
        <Tooltip
          title={standaloneAssistant ? "聚焦 AI 输入框" : "打开当前页面 AI 助手"}
        >
          <Button
            type="text"
            aria-label="问 AI"
            aria-pressed={assistantButtonActive}
            className={cx(
              styles.actionButton,
              assistantButtonActive && styles.activeAction,
            )}
            icon={<RobotOutlined />}
            onClick={standaloneAssistant ? openAssistant : triggerAssistant}
          >
            <span className={styles.actionLabel}>问 AI</span>
          </Button>
        </Tooltip>
        <WorkReminderPopover />
        <HelpMenu className={styles.helpAction} />
        <UserMenu includeHelp={mobile} />
      </div>
    </header>
  );
}
