import { describe, expect, it } from "vitest";
import { getRouteLocation } from "./routeLocation";

describe("getRouteLocation", () => {
  it("returns concise business locations for known routes", () => {
    expect(getRouteLocation("/quality/conversation")).toEqual([
      "AI 质检",
      "AI 客诉预警",
    ]);
    expect(getRouteLocation("/renewal/opportunities")).toEqual([
      "AI 续费",
      "续费机会",
    ]);
    expect(getRouteLocation("/renewal/diagnosis")).toEqual([
      "AI 续费",
      "学生条件诊断",
    ]);
    expect(getRouteLocation("/work-reminders")).toEqual(["工作提醒"]);
  });

  it("falls back to the product name for unknown routes", () => {
    expect(getRouteLocation("/unknown")).toEqual(["唯寻 AI"]);
  });
});
