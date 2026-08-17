import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/renewal/opportunities");
  await expect(page.getByRole("heading", { name: "续费学生" })).toBeVisible();
  await expect(page.locator(".ant-breadcrumb")).toContainText("续费机会");
});

test("三栏工作台按学生联动续费诊断", async ({ page }) => {
  await expect(page.getByRole("heading", { name: "续费学生" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "续费诊断" })).toBeVisible();
  await expect(page.getByRole("region", { name: "续费 AI 助手" })).toBeVisible();

  await page.getByRole("button", { name: /王若曦/ }).click();
  await expect(page.getByRole("heading", { name: "王若曦" })).toBeVisible();
  await expect(page.getByText("英国 · TOP10 · 物理", { exact: true })).toBeVisible();
  await expect(page.getByText("国际竞赛进阶训练营", { exact: true }).first()).toBeVisible();
  await expect(page.getByText(/16课时 · ¥23,800/).first()).toBeVisible();
  await expect(page).toHaveURL(/studentId=renewal-student-003/);

  const condition = page
    .getByRole("article")
    .filter({ hasText: "物理方向竞赛能力证明" });
  await condition.getByRole("button", { name: /查看证据/ }).click();
  const drawer = page.getByRole("dialog", { name: "条件证据与产品匹配" });
  await expect(drawer.getByText("BPhO前测", { exact: true })).toBeVisible();

  await drawer.getByRole("button", { name: "关闭" }).click();
  await page.getByRole("tab", { name: /待补信息/ }).click();
  await page.getByRole("button", { name: /陈子轩/ }).click();
  await expect(page.getByText(/待补充/).first()).toBeVisible();
  await expect(page.getByText("补充信息后再生成产品建议", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "比较推荐产品" })).toBeDisabled();
});

test("筛选学生并保持可跟进与待补信息分离", async ({ page }) => {
  await page.getByRole("tab", { name: /可推荐/ }).click();
  await page.getByPlaceholder("搜索姓名或客户编号").fill("王若曦");
  await page.getByRole("button", { name: "查询" }).click();
  await expect(page.getByRole("button", { name: /王若曦/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /陈子轩/ })).toHaveCount(0);
  await page.getByRole("button", { name: "重置筛选" }).click();
  await expect(page.getByRole("button", { name: /林家宁/ })).toBeVisible();
});

test("旧诊断地址保留学生并进入合并工作台", async ({ page }) => {
  await page.goto("/#/renewal/diagnosis?studentId=renewal-student-003");
  await expect(page).toHaveURL(
    /\/renewal\/opportunities\?studentId=renewal-student-003/,
  );
  await expect(page.getByRole("heading", { name: "王若曦" })).toBeVisible();
  await page.getByRole("button", { name: "重新诊断当前学生" }).click();
  await expect(page.getByText("已按最新数据重新诊断", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "王若曦" })
      .getByText("顾问手动重新诊断", { exact: true }),
  ).toBeVisible();
});

test("嵌入式 AI 助手提供行动摘要与结构化建议", async ({ page }) => {
  await page.getByRole("button", { name: /王若曦/ }).click();
  await page
    .getByRole("button", { name: "让 AI 解释物理方向竞赛能力证明" })
    .click();
  const assistant = page.getByRole("region", { name: "续费 AI 助手" });
  await expect(assistant.getByText("本次建议", { exact: true })).toBeVisible();
  await expect(assistant).toContainText("当前关注：物理方向竞赛能力证明");
  await assistant.getByRole("button", { name: "为什么判断为续费机会" }).click();
  await expect(assistant).toContainText("结论");
  await expect(assistant).toContainText("依据");
  await expect(assistant).toContainText("建议动作");
  await expect(assistant).toContainText("需人工确认");
  await expect(assistant).toContainText("不代表续费概率");
});

test("旧预测地址重定向机会页，三档宽度无页面级溢出", async ({ page }) => {
  await page.goto("/#/renewal/prediction");
  await expect(page).toHaveURL(/\/renewal\/opportunities/);

  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();
    await expect(page.getByRole("heading", { name: "续费学生" })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
