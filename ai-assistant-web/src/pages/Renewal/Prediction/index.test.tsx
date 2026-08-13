import { describe, expect, it } from "vitest";
import { filterRenewalStudents, renewalStudents } from "./renewalData";

describe("filterRenewalStudents", () => {
  it("按学生姓名或手机号模糊搜索", () => {
    expect(
      filterRenewalStudents(renewalStudents, { studentSearch: "林家" }),
    ).toHaveLength(1);
    expect(
      filterRenewalStudents(renewalStudents, { studentSearch: "2036" }),
    ).toHaveLength(1);
  });

  it("组合筛选续费机会、产品类型、年级、当前产品和当前跟进顾问", () => {
    expect(
      filterRenewalStudents(renewalStudents, {
        renewalOpportunity: "high",
        recommendedProductType: "subject",
        grade: "12年级",
        currentProduct: "A-Level 数学进阶",
        currentAdvisor: "A1024",
      }),
    ).toHaveLength(1);
  });

  it("为客户信息、业务归属和当前顾问提供指定字段", () => {
    expect(renewalStudents[0]).toMatchObject({
      studentName: "林家宁",
      customerNumber: "VA100213",
      grade: "12年级",
      businessUnit: "高端",
      courseSystem: "高端竞赛",
      courseItem: "高阶竞赛",
      currentAdvisor: {
        name: "周欣",
        employeeNumber: "A1024",
      },
    });
  });
});
