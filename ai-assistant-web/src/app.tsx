import { Link, type RunTimeLayoutConfig } from "@umijs/max";
import type { ReactNode } from "react";
import defaultSettings from "../config/defaultSettings";
import { AppShell } from "./features/globalToolbar/AppShell";
import { GlobalToolbar } from "./features/globalToolbar/GlobalToolbar";
import { GlobalToolbarProvider } from "./features/globalToolbar/GlobalToolbarProvider";
import { getMockServiceWorkerUrl } from "./api/mock/serviceWorkerUrl";

export const layout: RunTimeLayoutConfig = () => ({
  ...defaultSettings,
  menuItemRender: (item, dom) =>
    item.path ? (
      <Link to={item.path}>{dom}</Link>
    ) : (
      dom
    ),
  childrenRender: (dom) => <AppShell>{dom}</AppShell>,
  headerRender: (props) =>
    props.isMobile ? (
      <GlobalToolbar
        mobile
        onMenuToggle={() => props.onCollapse?.(!props.collapsed)}
      />
    ) : null,
});

export function rootContainer(container: ReactNode) {
  return <GlobalToolbarProvider>{container}</GlobalToolbarProvider>;
}

export async function render(oldRender: () => void) {
  if (process.env.DATA_MODE !== "api") {
    const { worker } = await import("./api/mock/browser");
    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: getMockServiceWorkerUrl(window.location.href),
      },
    });
  }

  oldRender();
}
