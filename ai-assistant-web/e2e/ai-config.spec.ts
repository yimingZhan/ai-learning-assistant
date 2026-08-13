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

test("客诉预警配置支持编辑、试跑和发布", async ({ page }) => {
  await page.goto("/#/ai-config/complaint-risk");

  await expect(
    page.getByText("AI 客诉预警配置", { exact: true }).first(),
  ).toBeVisible();
  await expect(page.getByText("v1.0", { exact: true })).toBeVisible();
  await expect(page.getByText("判断规则（6）", { exact: true })).toBeVisible();

  const systemPrompt = page.getByLabel("系统角色与安全边界 Prompt");
  await systemPrompt.fill(`${await systemPrompt.inputValue()}\n必须检查证据完整度。`);
  await expect(page.getByText("有未保存修改", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "保存草稿" }).click();
  await expect(
    page.getByText("草稿已保存", { exact: true }).first(),
  ).toBeVisible();

  await page.getByRole("button", { name: "配置试跑" }).click();
  const trial = page.getByRole("dialog", { name: "配置试跑" });
  await trial
    .getByPlaceholder(/课程一直没有改善/)
    .fill("再不处理，我就正式投诉你们并要求退费。");
  await trial.getByRole("button", { name: "开始试跑" }).click();
  await expect(trial.getByText("高风险", { exact: true })).toBeVisible();
  await expect(trial.getByText("正式投诉或外部升级", { exact: true })).toBeVisible();
  await trial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "发布配置" }).click();
  const publish = page.getByRole("dialog", {
    name: "发布 AI 客诉预警配置",
  });
  await publish.getByPlaceholder(/说明本次调整/).fill("增加证据完整度要求。");
  await publish.getByRole("button", { name: "确认发布" }).click();

  await expect(page.getByText("v1.1", { exact: true })).toBeVisible();
  await expect(page.getByText("已发布", { exact: true })).toBeVisible();
});

test("侧边菜单可进入客诉预警配置", async ({ page }) => {
  await page.goto("/");
  const sider = page.getByTestId("pro-layout-sider");

  await sider.getByText("AI 配置", { exact: true }).click();
  await sider.getByText("客诉预警配置", { exact: true }).click();
  await expect(page).toHaveURL(/\/ai-config\/complaint-risk/);
  await expect(page.getByText("Prompt 配置", { exact: true })).toBeVisible();
});

test("历史版本可回滚且窄屏无页面级横向溢出", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await page.goto("/#/ai-config/complaint-risk");
  await expect(page.getByText("v1.0", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "版本记录" }).click();
  const history = page.getByRole("dialog", { name: "版本记录" });
  const legacyRow = history.getByRole("row", { name: /v0\.9/ });
  await legacyRow.getByRole("button", { name: "回滚" }).click();
  await page.getByRole("button", { name: "确认回滚" }).click();
  await expect(page.getByText("v1.1", { exact: true })).toBeVisible();

  await history.getByRole("button", { name: "关闭" }).click();
  await page.getByRole("tab", { name: /判断规则/ }).click();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test("配置页内容超出视口时可纵向滚动到底部输入框", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/#/ai-config/complaint-risk");

  const container = page.getByTestId("pro-page-container");
  const suggestionPrompt = page.getByLabel("风险总结与跟进建议 Prompt");
  await expect(suggestionPrompt).not.toBeInViewport();

  await suggestionPrompt.scrollIntoViewIfNeeded();
  await expect(suggestionPrompt).toBeInViewport();
  await expect(suggestionPrompt).toBeEditable();

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

test("续费规则配置支持草稿试算与发布", async ({ page }) => {
  await page.goto("/#/ai-config/renewal");
  await expect(page.getByText("续费规则配置", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("tab", { name: /学习要求/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: /条件—产品映射/ })).toBeVisible();

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
  await sider.getByText("续费规则配置", { exact: true }).click();
  await expect(page.getByText("草稿已保存", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: "选择学生试算" }).click();
  const trial = page.getByRole("dialog", { name: "选择学生试算" });
  await trial.getByRole("combobox").click();
  await page.getByText("许博文（9年级）", { exact: true }).click();
  await trial.getByRole("button", { name: "开始试算" }).click();
  await expect(trial.getByText("许博文的草稿试算结果", { exact: true })).toBeVisible();
  await trial.getByRole("button", { name: "关闭" }).click();

  await page.getByRole("button", { name: "发布版本" }).click();
  const publish = page.getByRole("dialog", { name: "发布续费规则版本" });
  await publish.getByRole("textbox", { name: "版本说明" }).fill("验证草稿发布链路。");
  await publish.getByRole("button", { name: "确认发布" }).click();
  await expect(page.getByText("v1.1", { exact: true })).toBeVisible();
  await expect(page.getByText("已发布", { exact: true }).first()).toBeVisible();

  await sider.getByText("AI 续费", { exact: true }).click();
  await sider.getByText("续费机会", { exact: true }).click();
  await expect(page.getByText("许博文", { exact: true })).toHaveCount(0);
  await sider.getByText("AI 配置", { exact: true }).click();
  await sider.getByText("续费规则配置", { exact: true }).click();
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
