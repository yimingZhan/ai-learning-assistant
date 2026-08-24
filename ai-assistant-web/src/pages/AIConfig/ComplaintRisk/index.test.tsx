import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@ant-design/pro-components", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@ant-design/pro-components")>();
  return {
    ...actual,
    ProTable: ({
      columns,
      dataSource,
      headerTitle,
      toolBarRender,
    }: {
      columns: Array<{
        dataIndex?: string;
        render?: (
          value: unknown,
          record: Record<string, unknown>,
        ) => ReactNode;
      }>;
      dataSource: Array<Record<string, unknown>>;
      headerTitle: ReactNode;
      toolBarRender?: () => ReactNode[];
    }) => (
      <section>
        <h2>{headerTitle}</h2>
        <div>{toolBarRender?.()}</div>
        <table>
          <tbody>
            {dataSource.map((record) => (
              <tr key={String(record.id)}>
                {columns.map((column, index) => (
                  <td key={column.dataIndex ?? index}>
                    {column.render
                      ? column.render(
                          column.dataIndex
                            ? record[column.dataIndex]
                            : undefined,
                          record,
                        )
                      : String(
                          column.dataIndex
                            ? (record[column.dataIndex] ?? "")
                            : "",
                        )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    ),
  };
});

vi.mock("antd", async (importOriginal) => {
  const actual = await importOriginal<typeof import("antd")>();
  const { useState } = await import("react");
  return {
    ...actual,
    Tabs: ({
      defaultActiveKey,
      items,
    }: {
      defaultActiveKey?: string;
      items: Array<{ key: string; label: ReactNode; children: ReactNode }>;
    }) => {
      const [activeKey, setActiveKey] = useState(
        defaultActiveKey ?? items[0]?.key,
      );
      return (
        <div>
          <div role="tablist">
            {items.map((item) => (
              <button
                key={item.key}
                type="button"
                role="tab"
                aria-selected={activeKey === item.key}
                className="ant-tabs-tab-btn"
                onClick={() => setActiveKey(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          {items.find((item) => item.key === activeKey)?.children}
        </div>
      );
    },
  };
});
import ComplaintRiskConfigPage, {
  normalizeSummaryPrompt,
  normalizeRiskTypes,
  removeRiskTypeById,
  upsertRiskType,
  validateConfiguration,
} from ".";
import { createInitialComplaintRiskConfig } from "../../../api/mock/complaintRiskConfig";
import { aiConfigApi } from "../../../api/client";
import { server } from "../../../test/server";

describe("complaint risk type configuration validation", () => {
  it("拒绝空白总结提示词并在保存前清理首尾空格", () => {
    const blankPrompt = createInitialComplaintRiskConfig();
    blankPrompt.summaryPrompt = "   ";

    expect(validateConfiguration(blankPrompt)).toBe("AI 总结提示词不能为空");
    expect(normalizeSummaryPrompt("  只总结待处理风险。  ")).toBe(
      "只总结待处理风险。",
    );
  });

  it("拒绝空配置、重复类型、非法关键词和非法案例", () => {
    const noTypes = createInitialComplaintRiskConfig();
    noTypes.riskTypes = [];
    expect(validateConfiguration(noTypes)).toContain("至少保留一个风险类型");

    const duplicateTypes = createInitialComplaintRiskConfig();
    duplicateTypes.riskTypes[1].name = ` ${duplicateTypes.riskTypes[0].name} `;
    expect(validateConfiguration(duplicateTypes)).toContain("风险类型名称不能重复");

    const blankKeyword = createInitialComplaintRiskConfig();
    blankKeyword.riskTypes[0].keywords.push("   ");
    expect(validateConfiguration(blankKeyword)).toContain("关键词不能为空");

    const duplicateKeywords = createInitialComplaintRiskConfig();
    duplicateKeywords.riskTypes[0].keywords.push(
      ` ${duplicateKeywords.riskTypes[0].keywords[0]} `,
    );
    expect(validateConfiguration(duplicateKeywords)).toContain("关键词不能重复");

    const noExamples = createInitialComplaintRiskConfig();
    noExamples.riskTypes[0].positiveExamples = [];
    expect(validateConfiguration(noExamples)).toContain("至少添加一条参考案例");

    const blankExample = createInitialComplaintRiskConfig();
    blankExample.riskTypes[0].positiveExamples[0] = "   ";
    expect(validateConfiguration(blankExample)).toContain("参考案例不能为空");

    const duplicateExamples = createInitialComplaintRiskConfig();
    duplicateExamples.riskTypes[0].positiveExamples.push(
      ` ${duplicateExamples.riskTypes[0].positiveExamples[0]} `,
    );
    expect(validateConfiguration(duplicateExamples)).toContain("参考案例不能重复");
  });

  it("拒绝缺失高、中、低风险定义", () => {
    const missingHigh = createInitialComplaintRiskConfig();
    missingHigh.riskTypes[0].highRiskDefinition = "   ";
    expect(validateConfiguration(missingHigh)).toContain("高风险定义不能为空");

    const missingMedium = createInitialComplaintRiskConfig();
    missingMedium.riskTypes[0].mediumRiskDefinition = "";
    expect(validateConfiguration(missingMedium)).toContain("中风险定义不能为空");

    const missingLow = createInitialComplaintRiskConfig();
    missingLow.riskTypes[0].lowRiskDefinition = "  ";
    expect(validateConfiguration(missingLow)).toContain("低风险定义不能为空");
  });

  it("保存前清理类型名称、关键词、案例和等级定义的首尾空格", () => {
    const config = createInitialComplaintRiskConfig();
    config.riskTypes[0].name = "  跟进及时性  ";
    config.riskTypes[0].keywords[0] = "  找不到人  ";
    config.riskTypes[0].positiveExamples[0] = "  我昨天问的问题到现在都没有人回复。  ";
    config.riskTypes[0].highRiskDefinition = "  多次、持续出现联系不上。  ";

    expect(normalizeRiskTypes(config.riskTypes)[0]).toMatchObject({
      name: "跟进及时性",
      keywords: ["找不到人", "联系不上", "未反馈", "没回复", "没人回"],
      positiveExamples: [
        "我昨天问的问题到现在都没有人回复。",
        "这几天一直联系不上老师。",
        "说好了给我反馈，到现在还没有消息。",
        "我已经问了好几次了，一直没人处理。",
        "每次有事情都找不到人。",
      ],
      highRiskDefinition: "多次、持续出现联系不上。",
    });
  });

  it("按稳定 ID 新增、编辑和删除风险类型并保留案例顺序", () => {
    const initial = createInitialComplaintRiskConfig().riskTypes;
    const added = upsertRiskType(initial, {
      id: "price-objection",
      name: " 价格异议 ",
      keywords: [" 价格贵 ", " 不合理 "],
      positiveExamples: [" 这个价格不合理 ", " 价格太贵了 "],
      highRiskDefinition: " 已明确决定退费 ",
      mediumRiskDefinition: " 产生退费倾向 ",
      lowRiskDefinition: " 咨询退费金额 ",
    });
    expect(added.at(-1)).toEqual({
      id: "price-objection",
      name: "价格异议",
      keywords: ["价格贵", "不合理"],
      positiveExamples: ["这个价格不合理", "价格太贵了"],
      highRiskDefinition: "已明确决定退费",
      mediumRiskDefinition: "产生退费倾向",
      lowRiskDefinition: "咨询退费金额",
    });

    const edited = upsertRiskType(added, {
      ...added.at(-1)!,
      name: "费用异议",
    });
    expect(edited).toHaveLength(4);
    expect(edited.at(-1)?.name).toBe("费用异议");

    expect(removeRiskTypeById(edited, "price-objection")).toEqual(initial);
  });
});

describe("ComplaintRiskConfigPage", () => {
  it("展示 3 个指定风险类型、16 个关键词及高/中/低风险定义列", async () => {
    render(<ComplaintRiskConfigPage />);

    expect(await screen.findByText("风险类型配置（3）")).toBeTruthy();
    expect(
      screen
        .getByText("风险类型配置", { selector: ".ant-tabs-tab-btn" })
        .closest('[role="tab"]')
        ?.getAttribute("aria-selected"),
    ).toBe("true");
    expect(
      screen.getByText("AI 总结提示词", {
        selector: ".ant-tabs-tab-btn",
      }),
    ).toBeTruthy();
    expect(screen.queryByLabelText("AI 总结提示词")).toBeNull();
    expect(screen.queryByText("生效方式")).toBeNull();
    expect(screen.queryByText("最近更新")).toBeNull();
    expect(screen.queryByText("即时生效")).toBeNull();
    expect(screen.getByText("跟进及时性")).toBeTruthy();
    expect(screen.getAllByText("退费").length).toBeGreaterThan(0);
    expect(screen.getByText("客诉")).toBeTruthy();
    expect(screen.getByText("共 16 个关键词")).toBeTruthy();
    expect(screen.queryByText("案例数量")).toBeNull();
    expect(screen.getByText("我昨天问的问题到现在都没有人回复。")).toBeTruthy();
    expect(
      screen.getByText(
        "多次、持续出现联系不上、无人反馈、长期未回复等情况，并明显表达强烈不满或认为问题长期无人处理。",
      ),
    ).toBeTruthy();
    expect(screen.getAllByTestId("high-risk-definition")).toHaveLength(3);
    expect(screen.getAllByTestId("medium-risk-definition")).toHaveLength(3);
    expect(screen.getAllByTestId("low-risk-definition")).toHaveLength(3);
    expect(screen.queryByText("反向案例")).toBeNull();
    expect(screen.queryByText("Prompt 配置")).toBeNull();
    expect(screen.queryByText("运行策略")).toBeNull();
    expect(screen.queryByRole("button", { name: "配置试跑" })).toBeNull();
    expect(screen.queryByRole("button", { name: "版本记录" })).toBeNull();
    expect(screen.queryByRole("button", { name: "保存草稿" })).toBeNull();
    expect(screen.queryByRole("button", { name: "发布配置" })).toBeNull();
    expect(screen.queryByText("当前生效版本")).toBeNull();
    expect(screen.queryByText("当前草稿")).toBeNull();
  }, 15_000);

  it("校验、清理并即时保存 AI 总结提示词", async () => {
    const user = userEvent.setup();
    render(<ComplaintRiskConfigPage />);

    await user.click(
      await screen.findByText("AI 总结提示词", {
        selector: ".ant-tabs-tab-btn",
      }),
    );

    const initialPrompt = createInitialComplaintRiskConfig().summaryPrompt;
    expect(await screen.findByText(initialPrompt)).toBeTruthy();
    expect(screen.queryByRole("textbox", { name: "AI 总结提示词" })).toBeNull();

    await user.click(
      screen.getByRole("button", { name: "编辑 AI 总结提示词" }),
    );

    const editor = screen.getByRole("dialog", {
      name: "编辑 AI 总结提示词",
    });
    expect(editor.className).toContain("ant-drawer-section");
    const promptInput = within(editor).getByRole("textbox", {
      name: "AI 总结提示词",
    }) as HTMLTextAreaElement;
    const saveButton = within(editor).getByRole("button", {
      name: /保\s*存/,
    });
    expect(promptInput.value).toBe(initialPrompt);
    expect(saveButton.hasAttribute("disabled")).toBe(true);

    await user.clear(promptInput);
    await user.click(saveButton);
    expect(await screen.findByText("AI 总结提示词不能为空")).toBeTruthy();

    await user.type(promptInput, "  只总结当前仍待处理的风险。  ");
    await user.click(saveButton);
    expect(
      await screen.findByText("AI 总结提示词已更新并即时生效"),
    ).toBeTruthy();
    expect(
      screen.getByText("只总结当前仍待处理的风险。", {
        selector: ".ant-typography",
      }),
    ).toBeTruthy();

    const activeConfig = await aiConfigApi.getComplaintRiskConfig();
    expect(activeConfig.summaryPrompt).toBe("只总结当前仍待处理的风险。");
    expect(activeConfig.riskTypes).toHaveLength(3);
  });

  it("保存失败时保留尚未提交的提示词", async () => {
    server.use(
      http.patch("*/api/v1/ai-config/complaint-risk", () =>
        HttpResponse.json({}, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    render(<ComplaintRiskConfigPage />);

    await user.click(
      await screen.findByText("AI 总结提示词", {
        selector: ".ant-tabs-tab-btn",
      }),
    );
    await user.click(
      screen.getByRole("button", { name: "编辑 AI 总结提示词" }),
    );

    const editor = screen.getByRole("dialog", {
      name: "编辑 AI 总结提示词",
    });
    const promptInput = within(editor).getByRole("textbox", {
      name: "AI 总结提示词",
    }) as HTMLTextAreaElement;
    await user.clear(promptInput);
    await user.type(promptInput, "保存失败后仍保留的提示词");
    await user.click(
      within(editor).getByRole("button", { name: /保\s*存/ }),
    );

    expect(
      await screen.findByText("AI 总结提示词更新失败，请重试"),
    ).toBeTruthy();
    expect(promptInput.value).toBe("保存失败后仍保留的提示词");
    expect(
      screen.getByRole("dialog", { name: "编辑 AI 总结提示词" }),
    ).toBeTruthy();
  });
});
