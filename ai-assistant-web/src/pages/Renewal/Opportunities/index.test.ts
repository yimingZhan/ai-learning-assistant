import { describe, expect, it } from "vitest";
import {
  createInitialRenewalConfig,
  listRenewalOpportunities,
} from "../../../api/mock/renewal";
import { filterRenewalOpportunities } from "./filter";

describe("renewal opportunity filters", () => {
  const response = listRenewalOpportunities(createInitialRenewalConfig());

  it("keeps only student rows with valid candidates in the opportunity tab", () => {
    const items = filterRenewalOpportunities(response.items, "opportunity", {});
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((item) => item.actionableConditions.length > 0)).toBe(true);
    expect(items.every((item) => item.topRecommendations.length > 0)).toBe(true);
  });

  it("keeps pending information separate and supports student and category filters", () => {
    const pending = filterRenewalOpportunities(response.items, "pending", {
      keyword: "林家宁",
      category: "competition",
    });
    expect(pending).toHaveLength(1);
    expect(pending[0].pendingConditions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "competition",
          status: "applicability_pending",
          recommendations: [],
        }),
      ]),
    );
  });

  it("filters by trigger type and highest priority", () => {
    const eventP0 = filterRenewalOpportunities(response.items, "opportunity", {
      triggerType: "event",
      priority: "P0",
    });
    expect(eventP0.length).toBeGreaterThan(0);
    expect(
      eventP0.every(
        (item) =>
          item.highestPriority === "P0" &&
          item.triggerReasons.some((reason) => reason.type === "event"),
      ),
    ).toBe(true);
  });
});
