export type AnalyticsEventName =
  | "renewal_list_view"
  | "renewal_run_manual"
  | "renewal_diagnosis_view"
  | "renewal_evidence_view"
  | "renewal_product_view"
  | "renewal_missing_data_view";

export type AnalyticsProperties = Record<
  string,
  string | number | boolean | undefined
>;

export function trackAnalytics(
  eventName: AnalyticsEventName,
  properties: AnalyticsProperties = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("ai-assistant:analytics", {
      detail: { eventName, properties },
    }),
  );
}
