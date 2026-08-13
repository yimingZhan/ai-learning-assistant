import { useMemo } from "react";
import type { ReactNode } from "react";
import type { ConversationScope, QueryContext } from "../../api/contracts";
import {
  CompactAssistantPanel,
  type CompactAssistantPrompt,
} from "../assistant/CompactAssistantPanel";
import { useAssistantRuntime } from "../assistant/useAssistantRuntime";
import { useGlobalToolbar } from "./GlobalToolbarProvider";

const generalPrompts: CompactAssistantPrompt[] = [
  { key: "study", description: "查询李明近 30 天的学习情况" },
  { key: "orders", description: "查看李明的订单与续费建议" },
  { key: "feedback", description: "汇总老师反馈并生成家长回复建议" },
];

const complaintPrompts: CompactAssistantPrompt[] = [
  { key: "summary", description: "总结该生当前客诉风险" },
  { key: "actions", description: "给出优先跟进动作" },
  { key: "reply", description: "生成家长沟通话术" },
];

const renewalPrompts: CompactAssistantPrompt[] = [
  { key: "reason", description: "为什么判断为续费机会" },
  { key: "product", description: "比较推荐产品" },
  { key: "pending", description: "列出待补信息" },
  { key: "reply", description: "生成家长沟通话术" },
  { key: "followup", description: "生成分步骤跟进清单" },
];

type GlobalAssistantPanelProps = {
  emptyIntro?: ReactNode;
  prompts?: CompactAssistantPrompt[];
  placeholder?: string;
};

export function GlobalAssistantPanel({
  emptyIntro,
  prompts: promptsOverride,
  placeholder,
}: GlobalAssistantPanelProps = {}) {
  const {
    assistantContext,
    assistantFocusRequest,
    setAssistantOpen,
  } = useGlobalToolbar();
  const { runtime } = useAssistantRuntime();

  const configuration = useMemo(() => {
    if (!assistantContext) {
      return {
        key: "general",
        ariaLabel: "全局 AI 助手",
        prompts:
          runtime?.capabilities
            .flatMap((capability) => capability.recommendedPrompts)
            .slice(0, 3) ?? generalPrompts,
      };
    }

    const scope: ConversationScope = {
      kind: assistantContext.kind,
      studentId: assistantContext.studentId,
    };
    const defaultContext: QueryContext = {
      kind: assistantContext.kind,
      studentId: assistantContext.studentId,
      ...(assistantContext.kind === "renewal" && assistantContext.focus
        ? { focus: assistantContext.focus }
        : {}),
    };

    const focusLabel =
      assistantContext.kind === "renewal" && assistantContext.focus
        ? ` · 当前关注：${assistantContext.focus.label}`
        : "";

    return {
      key: `${assistantContext.kind}:${assistantContext.studentId}`,
      ariaLabel:
        assistantContext.kind === "complaintRisk"
          ? "客诉 AI 助手"
          : "续费 AI 助手",
      contextLabel:
        assistantContext.kind === "complaintRisk"
          ? `基于 ${assistantContext.studentName}的客诉预警`
          : `基于 ${assistantContext.studentName}的续费条件诊断${focusLabel}`,
      prompts:
        promptsOverride ?? runtime?.capabilities.find((capability) =>
          capability.id ===
          (assistantContext.kind === "complaintRisk"
            ? "complaintRisk"
            : "renewalDiagnosis"),
        )?.recommendedPrompts ??
        (assistantContext.kind === "complaintRisk"
          ? complaintPrompts
          : renewalPrompts),
      scope,
      defaultContext,
    };
  }, [assistantContext, promptsOverride, runtime]);

  return (
    <CompactAssistantPanel
      key={configuration.key}
      ariaLabel={configuration.ariaLabel}
      title={runtime?.basic.name ?? "AI 助手"}
      historyEnabled={runtime?.basic.historyEnabled ?? true}
      contextLabel={configuration.contextLabel}
      prompts={configuration.prompts}
      scope={configuration.scope}
      defaultContext={configuration.defaultContext}
      focusRequest={assistantFocusRequest}
      emptyIntro={emptyIntro}
      placeholder={placeholder}
      restoreLatest
      onClose={() => setAssistantOpen(false)}
    />
  );
}
