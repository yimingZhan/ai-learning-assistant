import { describe, expect, it } from "vitest";
import {
  createInitialComplaintRiskConfig,
  createInitialComplaintRiskVersions,
} from "./complaintRiskConfig";

describe("complaint risk type configuration", () => {
  it("初始化 5 个风险类型、21 个关键词、16 条正向案例和 15 条反向案例", () => {
    const config = createInitialComplaintRiskConfig();

    expect(config.riskTypes.map((riskType) => riskType.name)).toEqual([
      "跟进及时性",
      "退费倾向",
      "服务不满",
      "学习效果质疑",
      "沟通问题",
    ]);
    expect(
      config.riskTypes.reduce(
        (total, riskType) => total + riskType.keywords.length,
        0,
      ),
    ).toBe(21);
    expect(config.riskTypes[0].keywords).toEqual([
      "联系不上",
      "没回复",
      "没有反馈",
    ]);
    expect(config.riskTypes[1].keywords).toContain("退费");
    expect(
      config.riskTypes.reduce(
        (total, riskType) => total + riskType.positiveExamples.length,
        0,
      ),
    ).toBe(16);
    expect(
      config.riskTypes.reduce(
        (total, riskType) => total + riskType.negativeExamples.length,
        0,
      ),
    ).toBe(15);
    expect(config.riskTypes[0].positiveExamples).toEqual([
      "一直联系不上你",
      "老师很久没回复消息",
      "咨询的问题一直没有反馈",
    ]);
    expect(config.riskTypes[1].positiveExamples).toContain(
      "我要退费，剩下的钱什么时候退",
    );
    expect(config.riskTypes[4].positiveExamples).toEqual([
      "沟通了半天还是没说清楚",
      "指导不到位，反复沟通没解决",
      "算了，不沟通了",
    ]);
  });

  it("每个风险类型都使用稳定且唯一的 ID", () => {
    const config = createInitialComplaintRiskConfig();
    const ids = config.riskTypes.map((riskType) => riskType.id);

    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    expect(createInitialComplaintRiskConfig().riskTypes.map(({ id }) => id)).toEqual(
      ids,
    );
  });

  it("版本记录保留对应版本的风险类型配置快照", () => {
    const current = createInitialComplaintRiskConfig();
    const legacy = structuredClone(current);
    legacy.riskTypes = legacy.riskTypes.slice(0, 2);

    const versions = createInitialComplaintRiskVersions(current, legacy);

    expect(versions[0].riskTypes).toHaveLength(5);
    expect(versions[0].riskTypes[1].positiveExamples).toContain(
      "我要退费，剩下的钱什么时候退",
    );
    expect(versions[1].riskTypes).toHaveLength(2);
    expect(versions[1].riskTypes.map((riskType) => riskType.name)).toEqual([
      "跟进及时性",
      "退费倾向",
    ]);
  });
});
