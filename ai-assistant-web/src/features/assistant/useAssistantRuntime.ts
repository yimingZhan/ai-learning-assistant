import { useEffect, useState } from "react";
import { assistantApi } from "../../api/client";
import type { PlatformAssistantRuntime } from "../../api/contracts";

export function useAssistantRuntime() {
  const [runtime, setRuntime] = useState<PlatformAssistantRuntime>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    let active = true;
    assistantApi
      .getRuntimeConfig()
      .then((nextRuntime) => {
        if (active) setRuntime(nextRuntime);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "AI 助手配置加载失败",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { runtime, loading, error };
}
