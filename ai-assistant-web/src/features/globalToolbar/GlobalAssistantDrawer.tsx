import { Drawer, Grid } from "antd";
import { GlobalAssistantPanel } from "./GlobalAssistantPanel";
import { useGlobalToolbar } from "./GlobalToolbarProvider";

export function GlobalAssistantDrawer({ disabled = false }: { disabled?: boolean }) {
  const screens = Grid.useBreakpoint();
  const {
    assistantSurface,
    assistantOpen,
    setAssistantOpen,
  } = useGlobalToolbar();

  if (disabled || assistantSurface !== "sidebar" || screens.xl) return null;

  return (
    <Drawer
      aria-label="AI 助手"
      size="min(400px, 100vw)"
      open={assistantOpen}
      onClose={() => setAssistantOpen(false)}
      closable={false}
      mask={!screens.md}
      styles={{ body: { padding: 0 } }}
      destroyOnHidden
    >
      <GlobalAssistantPanel />
    </Drawer>
  );
}
