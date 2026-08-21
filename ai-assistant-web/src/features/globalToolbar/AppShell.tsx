import { Grid } from "antd";
import { useLocation } from "@umijs/max";
import type { ReactNode } from "react";
import { GlobalAssistantDrawer } from "./GlobalAssistantDrawer";
import { GlobalAssistantPanel } from "./GlobalAssistantPanel";
import { GlobalToolbar } from "./GlobalToolbar";
import { useGlobalToolbarStyles } from "./GlobalToolbar.styles";
import { useGlobalToolbar } from "./GlobalToolbarProvider";

export function AppShell({ children }: { children: ReactNode }) {
  const { styles } = useGlobalToolbarStyles();
  const screens = Grid.useBreakpoint();
  const location = useLocation();
  const { assistantOpen, assistantSurface } = useGlobalToolbar();
  const assistantDisabled = location.pathname === "/quality/conversation";
  const showDockedAssistant =
    !assistantDisabled &&
    Boolean(screens.xl) &&
    assistantOpen &&
    assistantSurface === "sidebar";

  return (
    <div className={styles.shell}>
      <div className={styles.desktopToolbar}>
        <GlobalToolbar />
      </div>
      <div className={styles.body}>
        <div className={styles.content}>{children}</div>
        {showDockedAssistant ? (
          <aside className={styles.assistantSidebar} aria-label="AI 助手侧栏">
            <GlobalAssistantPanel />
          </aside>
        ) : null}
      </div>
      <GlobalAssistantDrawer disabled={assistantDisabled} />
    </div>
  );
}
