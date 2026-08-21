import { expect, test } from "@playwright/test";

test("平台助手配置支持能力治理、试跑发布与运行时生效", async ({ page }) => {
  await page.goto("/#/ai-config/platform-assistant");

  await expect(
    page.getByText("平台助手配置", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByRole("tab", { name: "基础设置" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /能力管理/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "功能授权" })).toBeVisible();

  const assistantName = page.getByRole("textbox", { name: "助手名称" });
  await assistantName.fill("唯寻 AI 学情助手");
  await expect(page.getByText("有未保存修改", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "发布配置" })).toBeDisabled();
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByText("待验证", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "配置试跑" }).click();
  const trial = page.getByRole("dialog", { name: "平台助手配置试跑" });
  await expect(trial.getByText("李明", { exact: true })).toBeVisible();
  await trial.getByRole("button", { name: "开始试跑" }).click();
  await expect(trial.getByText("试运行结果", { exact: true })).toBeVisible();
  await expect(trial.getByText("通过", { exact: true })).toHaveCount(2);
  await trial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "发布配置" }).click();
  const publish = page.getByRole("dialog", { name: "发布平台助手配置" });
  await publish.getByRole("textbox", { name: "变更说明" }).fill("更新助手品牌名称。");
  await publish.getByRole("button", { name: "确认发布" }).click();
  await expect(page.getByText("v1.1", { exact: true })).toBeVisible();

  const sider = page.getByTestId("pro-layout-sider");
  await sider.getByText("AI 助手", { exact: true }).click();
  await expect(page.getByText("✨ 唯寻 AI 学情助手", { exact: true })).toBeVisible();
});

test("客诉预警配置支持维护风险类型并即时生效", async ({ page }) => {
  await page.goto("/#/ai-config/complaint-risk");

  await expect(
    page.getByText("AI 客诉预警配置", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("风险类型配置（3）", { exact: true })).toBeVisible();
  await expect(page.getByText("生效方式", { exact: true })).toHaveCount(0);
  await expect(page.getByText("最近更新", { exact: true })).toHaveCount(0);
  await expect(page.getByText("即时生效", { exact: true })).toHaveCount(0);
  await expect(page.getByText("共 16 个关键词", { exact: true })).toBeVisible();
  await expect(page.getByText("案例数量", { exact: true })).toHaveCount(0);
  await expect(page.getByText("退费", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("我还是决定退掉，不继续上了。", { exact: true })).toBeVisible();
  await expect(page.getByText("这几天一直联系不上老师。", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "配置试跑" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "版本记录" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "保存草稿" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "发布配置" })).toHaveCount(0);

  await page.getByRole("button", { name: "新增风险类型" }).click();
  const editor = page.getByRole("dialog", { name: "新增风险类型" });
  await editor.getByLabel("风险类型名称").fill("价格异议");
  const keywordInput = editor.getByRole("combobox", { name: "关键词" });
  await keywordInput.fill("价格贵");
  await keywordInput.press("Enter");
  await keywordInput.fill("不合理");
  await keywordInput.press("Enter");
  await editor
    .getByRole("textbox", { name: "参考案例 1", exact: true })
    .fill("价格太贵了");
  await editor.getByRole("button", { name: "新增参考案例" }).click();
  await editor
    .getByRole("textbox", { name: "参考案例 2", exact: true })
    .fill("这个价格不合理");
  await editor.getByRole("button", { name: "上移参考案例 2" }).click();
  await editor
    .getByRole("textbox", { name: "高风险定义" })
    .fill("已明确因价格原因要求退费。");
  await editor
    .getByRole("textbox", { name: "中风险定义" })
    .fill("明确表达价格异议。");
  await editor
    .getByRole("textbox", { name: "低风险定义" })
    .fill("咨询价格或优惠信息。");
  await editor.getByRole("button", { name: "保存风险类型" }).click();
  await expect(page.getByText("配置已更新并即时生效", { exact: true })).toBeVisible();

  const newTypeRow = page.getByRole("row", { name: /价格异议/ });
  await expect(newTypeRow.getByText("价格贵", { exact: true })).toBeVisible();
  await expect(newTypeRow.getByText("不合理", { exact: true })).toBeVisible();
  await expect(newTypeRow.getByText("这个价格不合理", { exact: true })).toBeVisible();
  await expect(newTypeRow.getByText("价格太贵了", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "编辑价格异议" }).click();
  const editDrawer = page.getByRole("dialog", { name: "编辑风险类型" });
  await editDrawer.getByLabel("风险类型名称").fill("费用异议");
  await editDrawer.getByRole("button", { name: "保存风险类型" }).click();
  await expect(page.getByText("费用异议", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "删除客诉" }).click();
  const deleteConfirm = page.getByRole("dialog", { name: "删除“客诉”？" });
  await deleteConfirm.getByRole("button", { name: "确认删除" }).click();
  await expect(page.getByText("客诉", { exact: true })).toHaveCount(0);

  const savedRiskTypeNames = await page.evaluate(async () => {
    const response = await fetch("/api/v1/ai-config/complaint-risk");
    const config = (await response.json()) as {
      riskTypes: Array<{ name: string }>;
    };
    return config.riskTypes.map((riskType) => riskType.name);
  });
  expect(savedRiskTypeNames).toContain("费用异议");
  expect(savedRiskTypeNames).not.toContain("客诉");
});

test("侧边菜单可进入客诉预警配置", async ({ page }) => {
  await page.goto("/");
  const sider = page.getByTestId("pro-layout-sider");

  await sider.getByText("AI 配置", { exact: true }).click();
  await sider.getByText("客诉预警配置", { exact: true }).click();
  await expect(page).toHaveURL(/\/ai-config\/complaint-risk/);
  await expect(page.getByText("风险类型配置（3）", { exact: true })).toBeVisible();
});

test("客诉预警配置在窄屏无版本管理且无页面级横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/#/ai-config/complaint-risk");
  await expect(page.getByText("风险类型配置（3）", { exact: true })).toBeVisible();
  await expect(page.getByText("生效方式", { exact: true })).toHaveCount(0);
  await expect(page.getByText("最近更新", { exact: true })).toHaveCount(0);
  await expect(page.getByText("即时生效", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "版本记录" })).toHaveCount(0);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("风险类型配置内容超出视口时可纵向滚动到底部案例", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/ai-config/complaint-risk");

  const container = page.getByTestId("pro-page-container");
  const lastExample = page.getByText("这个服务跟之前承诺的完全不一样。", { exact: true });
  await expect(lastExample).not.toBeInViewport();

  await lastExample.scrollIntoViewIfNeeded();
  await expect(lastExample).toBeInViewport();

  const scrollState = await container.evaluate((element) => ({
    scrollTop: element.scrollTop,
    scrollHeight: element.scrollHeight,
    clientHeight: element.clientHeight,
    overflowY: getComputedStyle(element).overflowY,
  }));
  expect(scrollState.overflowY).toBe("auto");
  expect(scrollState.scrollHeight).toBeGreaterThan(scrollState.clientHeight);
  expect(scrollState.scrollTop).toBeGreaterThan(0);
});

test("学生GPA管理支持草稿试算与发布", async ({ page }) => {
  await page.goto("/#/ai-config/renewal");
  await expect(page.getByText("学生GPA管理", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("region", { name: "年级目标配置" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择9年级" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /学科/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /语言/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /升学/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /条件—产品映射/ })).toHaveCount(0);
  await expect(page.getByText("国际课程衔接与 IG 基础夯实", { exact: true })).toBeVisible();

  const firstSwitch = page.getByRole("switch").first();
  await firstSwitch.click();
  await expect(page.getByText("有未保存修改", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(page.getByText("草稿已保存", { exact: true }).first()).toBeVisible();

  const sider = page.getByTestId("pro-layout-sider");
  await sider.getByText("AI 续费", { exact: true }).click();
  await sider.getByText("续费机会", { exact: true }).click();
  await expect(page.getByText("许博文", { exact: true }).first()).toBeVisible();
  await sider.getByText("AI 配置", { exact: true }).click();
  await sider.getByText("学生GPA管理", { exact: true }).click();
  await expect(page.getByText("草稿已保存", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "选择学生试算" }).click();
  const trial = page.getByRole("dialog", { name: "选择学生试算" });
  await trial.getByRole("combobox").click();
  await page.getByText("许博文（9年级）", { exact: true }).click();
  await trial.getByRole("button", { name: "开始试算" }).click();
  await expect(trial.getByText("许博文的草稿试算结果", { exact: true })).toBeVisible();
  await expect(trial.getByRole("columnheader", { name: "命中链路" })).toBeVisible();
  await trial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "发布版本" }).click();
  const publish = page.getByRole("dialog", { name: "发布续费规则版本" });
  await publish.getByRole("textbox", { name: "版本说明" }).fill("验证草稿发布链路。");
  await publish.getByRole("button", { name: "确认发布" }).click();
  await expect(page.getByText("v1.1", { exact: true })).toBeVisible();
  await expect(page.getByText("已发布", { exact: true }).first()).toBeVisible();

  await sider.getByText("AI 续费", { exact: true }).click();
  await sider.getByText("续费机会", { exact: true }).click();
  await expect(page.getByText("续费机会", { exact: true }).first()).toBeVisible();
  await sider.getByText("AI 配置", { exact: true }).click();
  await sider.getByText("学生GPA管理", { exact: true }).click();
  await page.getByRole("button", { name: "版本记录" }).click();
  const history = page.getByRole("dialog", { name: "续费规则版本记录" });
  await history.getByRole("row", { name: /v1\.0/ }).getByRole("button", { name: "回滚" }).click();
  await page.getByRole("button", { name: "确认回滚" }).click();
  await expect(page.getByText("v1.2", { exact: true })).toBeVisible();
  await history.getByRole("button", { name: "关闭" }).click();
  await sider.getByText("AI 续费", { exact: true }).click();
  await sider.getByText("续费机会", { exact: true }).click();
  await expect(page.getByText("许博文", { exact: true }).first()).toBeVisible();
});

test("续费目标工作台在窄屏使用层级抽屉且无页面级横向溢出", async ({ page }) => {
  for (const width of [1680, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/#/ai-config/renewal");
    await expect(page.getByRole("region", { name: "年级目标配置" })).toBeVisible();
    const desktopOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(desktopOverflow).toBeLessThanOrEqual(1);
  }

  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/#/ai-config/renewal");

  await expect(page.getByRole("region", { name: "年级目标配置" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择9年级" })).toBeVisible();
  await expect(page.getByRole("button", { name: "选择12年级" })).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});
