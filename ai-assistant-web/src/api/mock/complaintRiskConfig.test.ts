import { describe, expect, it } from "vitest";
import { aiConfigApi } from "../client";
import {
  createInitialComplaintRiskConfig,
  createInitialComplaintRiskVersions,
} from "./complaintRiskConfig";

describe("complaint risk type configuration", () => {
  it("初始化 3 个风险类型并覆盖指定关键词、案例和风险等级定义", () => {
    const config = createInitialComplaintRiskConfig();

    expect(config.riskTypes.map((riskType) => riskType.name)).toEqual([
      "跟进及时性",
      "退费",
      "客诉",
    ]);
    expect(
      config.riskTypes.reduce(
        (total, riskType) => total + riskType.keywords.length,
        0,
      ),
    ).toBe(16);
    expect(config.riskTypes[0].keywords).toEqual([
      "找不到人",
      "联系不上",
      "未反馈",
      "没回复",
      "没人回",
    ]);
    expect(config.riskTypes[1].keywords).toEqual([
      "退费",
      "退了",
      "还剩多少钱",
      "还有多少课时",
      "什么时候到账",
    ]);
    expect(config.riskTypes[2].keywords).toEqual([
      "不满意",
      "不喜欢",
      "不合适",
      "换老师",
      "风格不合适",
      "全拒",
    ]);
    expect(
      config.riskTypes.reduce(
        (total, riskType) => total + riskType.positiveExamples.length,
        0,
      ),
    ).toBe(17);
    expect(config.riskTypes[0].positiveExamples).toEqual([
      "我昨天问的问题到现在都没有人回复。",
      "这几天一直联系不上老师。",
      "说好了给我反馈，到现在还没有消息。",
      "我已经问了好几次了，一直没人处理。",
      "每次有事情都找不到人。",
    ]);
    expect(config.riskTypes[1].positiveExamples).toContain(
      "这个课我不想继续上了，剩下的钱能退吗？",
    );
    for (const riskType of config.riskTypes) {
      expect(riskType.highRiskDefinition.trim()).toBeTruthy();
      expect(riskType.mediumRiskDefinition.trim()).toBeTruthy();
      expect(riskType.lowRiskDefinition.trim()).toBeTruthy();
    }
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

    expect(versions[0].riskTypes).toHaveLength(3);
    expect(versions[0].riskTypes[1].positiveExamples).toContain(
      "这个课我不想继续上了，剩下的钱能退吗？",
    );
    expect(versions[0].riskTypes[1].highRiskDefinition).toBeTruthy();
    expect(versions[1].riskTypes).toHaveLength(2);
    expect(versions[1].riskTypes.map((riskType) => riskType.name)).toEqual([
      "跟进及时性",
      "退费",
    ]);
  });
});

describe("complaint risk type configuration api", () => {
  it("更新当前配置后直接生效", async () => {
    const config = await aiConfigApi.getComplaintRiskConfig();
    config.riskTypes[0].name = "跟进响应时效";

    const saved = await aiConfigApi.updateComplaintRiskConfig(config);

    expect(saved.riskTypes[0].name).toBe("跟进响应时效");
    expect(saved.draftStatus).toBe("published");
    const activeConfig = await aiConfigApi.getComplaintRiskConfig();
    expect(activeConfig.riskTypes[0].name).toBe("跟进响应时效");
  });
});
