import { MenuOutlined } from "@ant-design/icons";
import { Button } from "antd";
import { HelpMenu } from "./HelpMenu";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";
import { UserMenu } from "./UserMenu";

export function GlobalToolbar({
  mobile = false,
  onMenuToggle,
}: {
  mobile?: boolean;
  onMenuToggle?: () => void;
}) {
  const { styles, cx } = useGlobalToolbarStyles();

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
        <HelpMenu className={styles.helpAction} />
        <UserMenu includeHelp={mobile} />
      </div>
    </header>
  );
}
