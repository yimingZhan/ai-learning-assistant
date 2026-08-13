import type { RenewalOpportunity } from "../../../api/contracts";

export type OpportunityView = "opportunity" | "pending";

export type OpportunityFilters = {
  keyword?: string;
  grade?: string;
  owner?: string;
  category?: string;
  priority?: string;
  status?: string;
  triggerType?: string;
};

export function filterRenewalOpportunities(
  items: RenewalOpportunity[],
  view: OpportunityView,
  filters: OpportunityFilters,
) {
  return items.filter((item) => {
    const inView =
      view === "opportunity"
        ? item.actionableConditions.length > 0
        : item.pendingConditions.length > 0 || item.missingFields.length > 0;
    const keyword = filters.keyword?.trim();
    const visibleConditions =
      view === "opportunity" ? item.actionableConditions : item.pendingConditions;
    return (
      inView &&
      (!keyword ||
        item.student.name.includes(keyword) ||
        item.student.customerNumber.includes(keyword)) &&
      (!filters.grade || item.student.grade === filters.grade) &&
      (!filters.owner || item.student.owner === filters.owner) &&
      (!filters.category ||
        visibleConditions.some((condition) => condition.category === filters.category)) &&
      (!filters.priority || item.highestPriority === filters.priority) &&
      (!filters.status ||
        visibleConditions.some((condition) => condition.status === filters.status)) &&
      (!filters.triggerType ||
        item.triggerReasons.some((reason) => reason.type === filters.triggerType))
    );
  });
}
