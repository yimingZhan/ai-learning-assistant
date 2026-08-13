const routeLocations: Record<string, string[]> = {
  "/assistant": ["AI 助手"],
  "/quality/conversation": ["AI 质检", "AI 客诉预警"],
  "/renewal/opportunities": ["AI 续费", "续费机会"],
  "/renewal/diagnosis": ["AI 续费", "学生条件诊断"],
  "/renewal/prediction": ["AI 续费", "续费机会"],
  "/ai-config/complaint-risk": ["AI 配置", "客诉预警配置"],
  "/ai-config/platform-assistant": ["AI 配置", "平台助手配置"],
  "/ai-config/renewal": ["AI 配置", "续费规则配置"],
  "/work-reminders": ["工作提醒"],
};

export function getRouteLocation(pathname: string) {
  return routeLocations[pathname] ?? ["唯寻 AI"];
}
