import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/quality/conversation");
  await expect(page).toHaveURL(/\/quality\/conversation/);
  await expect(
    page.getByRole("region", { name: "学生客诉风险详情" }),
  ).toBeVisible();
});

test("详情标题栏入口明确携带当前学生并打开统一 AI 助手", async ({ page }) => {
  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
  const contextEntry = page.getByRole("button", {
    name: "向 AI 咨询林家宁的客诉风险",
  });

  await expect(toolbar).toHaveCount(1);
  await expect(toolbar.getByText("AI 客诉预警", { exact: true })).toBeVisible();
  await expect(toolbar.getByRole("searchbox")).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "工作提醒" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
  await expect(contextEntry).toHaveText("问 AI · 林家宁");
  await expect(contextEntry).toHaveClass(/ant-btn-primary/);
  await expect(
    page.getByRole("region", { name: "客诉 AI 助手" }),
  ).toBeVisible();
  await expect(page.getByText("基于 林家宁的客诉预警", { exact: true })).toBeVisible();

  await contextEntry.click();
  await expect(page.getByPlaceholder("输入问题")).toBeFocused();

  await page.getByRole("button", { name: "关闭 AI 助手" }).click();
  await contextEntry.click();
  await expect(page.getByPlaceholder("输入问题")).toBeFocused();

  await toolbar.getByRole("button", { name: "帮助" }).click();
  await expect(page.getByText("指标口径", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await toolbar.getByRole("button", { name: "用户菜单" }).click();
  await expect(page.getByText("上海中心 · 学管组", { exact: true })).toBeVisible();
  await expect(page.getByText("当前角色：学管", { exact: true })).toBeVisible();
});

test("左侧 AI 助手菜单进入完整助手页面", async ({ page }) => {
  const assistantMenu = page.getByRole("link", { name: "AI 助手" });

  await assistantMenu.click();
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(
    page.getByRole("region", { name: "AI 助手对话" }),
  ).toBeVisible();
  await expect(page.getByText("👋 你好，我是 AI 学情助手")).toBeVisible();
  await expect(page.getByRole("button", { name: "打开历史会话" })).toBeVisible();
  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
  await expect(toolbar).toBeVisible();
  await expect(
    toolbar.getByRole("button", { name: "问 AI" }),
  ).toHaveCount(0);

  const layout = await page.evaluate(() => {
    const assistant = document.querySelector<HTMLElement>(
      '[aria-label="AI 助手对话"]',
    );
    const sender = document.querySelector<HTMLElement>(
      '[placeholder="输入你想了解的问题"]',
    );
    return {
      documentOverflow:
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight,
      assistantBottom: assistant?.getBoundingClientRect().bottom ?? Infinity,
      senderBottom: sender?.getBoundingClientRect().bottom ?? Infinity,
      viewportHeight: window.innerHeight,
    };
  });
  expect(layout.documentOverflow).toBeLessThanOrEqual(1);
  expect(layout.assistantBottom).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.senderBottom).toBeLessThanOrEqual(layout.viewportHeight);
});

test("关闭状态在当前标签页会话内保持", async ({ page }) => {
  await page.getByRole("button", { name: "关闭 AI 助手" }).click();
  await page.reload();

  await expect(
    page.getByRole("region", { name: "客诉 AI 助手" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "向 AI 咨询林家宁的客诉风险",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("weixun-ai-assistant-open"),
    ),
  ).toBe("false");
});

test("独立助手地址展示完整页面且首页进入客诉预警", async ({ page }) => {
  await page.goto("/#/assistant");
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(
    page.getByRole("region", { name: "AI 助手对话" }),
  ).toBeVisible();
  await page.goto("/#/quality/conversation");
  await expect(page).toHaveURL(/\/quality\/conversation/);
});

test("工作提醒下拉可以进入完整提醒列表", async ({ page }) => {
  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');

  await toolbar.getByRole("button", { name: "工作提醒" }).click();
  await expect(
    page.getByText("林家宁客诉风险升至高风险", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "查看全部" }).click();

  await expect(page).toHaveURL(/\/work-reminders$/);
  await expect(page.getByRole("heading", { name: "工作提醒" })).toBeVisible();
  await expect(
    page.locator(".ant-card").getByText("王若曦有2项续费条件需关注", {
      exact: true,
    }),
  ).toBeVisible();
});

test("移动端将帮助入口收进用户菜单", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/quality/conversation");

  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
  await expect(toolbar).toHaveCount(1);
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "帮助" })).toHaveCount(0);
  await toolbar.getByRole("button", { name: "用户菜单" }).click();
  await expect(page.getByText("帮助与反馈", { exact: true })).toBeVisible();
});

test("两组二级菜单由 Ant Design Pro 路由生成", async ({ page }) => {
  const sider = page.getByTestId("pro-layout-sider");
  await sider.getByText("AI 客诉预警", { exact: true }).click();
  await expect(page).toHaveURL(/\/quality\/conversation/);

  const studentSelector = page.getByRole("region", { name: "选择学生" });
  await expect(
    studentSelector.getByRole("searchbox", {
      name: "搜索学生姓名或客户编号",
    }),
  ).toBeVisible();
  await expect(studentSelector.getByRole("button", { name: "排序" })).toBeVisible();
  await expect(studentSelector.getByRole("button", { name: "筛选" })).toBeVisible();
  await expect(studentSelector.getByRole("option", { name: /林家宁/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );

  await studentSelector.getByRole("button", { name: "筛选" }).click();
  for (const label of ["风险等级", "风险来源", "风险事件时间", "相关人"]) {
    await expect(page.getByText(label, { exact: true })).toBeVisible();
  }
  await page.getByRole("button", { name: /取\s*消/ }).click();

  await studentSelector
    .getByRole("searchbox", { name: "搜索学生姓名或客户编号" })
    .fill("S2026002");
  await expect(studentSelector.getByRole("option", { name: /陈子轩/ })).toBeVisible();
  await expect(studentSelector.getByRole("option", { name: /林家宁/ })).toHaveCount(0);

  await sider.getByText("AI 续费", { exact: true }).click();
  await sider.getByText("续费机会", { exact: true }).click();
  await expect(page).toHaveURL(/\/renewal\/opportunities/);
  await expect(page.getByText("可推荐学生", { exact: true })).toBeVisible();
  await expect(page.getByLabel("学生")).toBeVisible();
  await expect(page.getByText("林家宁", { exact: true }).first()).toBeVisible();

  await sider.getByText("学生条件诊断", { exact: true }).click();
  await expect(page).toHaveURL(/\/renewal\/diagnosis/);
  await expect(page.getByText("六类学习要求矩阵", { exact: true })).toBeVisible();
});

test("员工客诉列表使用官方查询表格并下钻到风险学生", async ({ page }) => {
  const sider = page.getByTestId("pro-layout-sider");

  await sider.getByText("员工客诉列表", { exact: true }).click();
  await expect(page).toHaveURL(/\/quality\/employee-complaints/);
  await expect(page.getByText("团队风险概览", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("pro-table").getByText("员工客诉列表", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".ant-pro-table .ant-pro-card-border")).toHaveCount(2);

  for (const label of ["时间范围", "组织/小组", "员工", "风险等级"]) {
    await expect(page.getByText(label, { exact: true }).first()).toBeVisible();
  }
  for (const heading of [
    "员工姓名",
    "所属小组",
    "在管学生数",
    "风险学生总数",
    "高风险学生",
    "中风险学生",
    "低风险学生",
  ]) {
    await expect(page.getByRole("columnheader", { name: heading })).toBeVisible();
  }

  const zhouXinRow = page.getByRole("row", { name: /\u5468\u6b23/ });
  await expect(zhouXinRow).toBeVisible();
  await zhouXinRow.getByRole("button", { name: "1人（0.7%）" }).nth(1).click();

  await expect(page).toHaveURL(
    /\/quality\/conversation\?owner=%E5%91%A8%E6%AC%A3&period=7&riskLevel=high/,
  );
  const studentSelector = page.getByRole("region", { name: "选择学生" });
  await expect(studentSelector.getByRole("option", { name: /林家宁/ })).toBeVisible();
  await expect(studentSelector.getByRole("option", { name: /陈子轩/ })).toHaveCount(0);
});

test("风险学生详情直接展示业务分区和完整证据交互", async ({ page }) => {
  const detailPanel = page.getByRole("region", {
    name: "学生客诉风险详情",
  });
  await expect(page.getByRole("dialog", { name: "学生客诉风险详情" })).toHaveCount(0);
  await expect(detailPanel.getByText("学生与服务信息")).toBeVisible();
  await expect(detailPanel.getByText("AI 风险分析")).toBeVisible();
  await expect(detailPanel.getByText("客户编号", { exact: true })).toBeVisible();
  await expect(detailPanel.getByText("跟进顾问", { exact: true })).toBeVisible();
  await expect(detailPanel.getByText("周欣", { exact: true }).first()).toBeVisible();
  await expect(detailPanel.getByText("跟进学管", { exact: true })).toBeVisible();

  for (const theme of ["学习效果质疑", "退费倾向", "服务响应不满"]) {
    await expect(detailPanel.getByText(theme, { exact: true }).first()).toBeVisible();
  }
  for (const field of ["风险主题", "沟通角色", "沟通时间", "聊天内容总结"]) {
    await expect(detailPanel.getByText(field, { exact: true }).first()).toBeVisible();
  }
  await expect(
    detailPanel.getByText("我们没有看到明显效果。", { exact: true }),
  ).toBeVisible();

  await detailPanel.getByRole("button", { name: "查看当天完整聊天" }).first().click();
  const chatDrawer = page.getByRole("dialog", {
    name: "2026-08-09 完整聊天",
  });
  await expect(chatDrawer.getByText("家长", { exact: true }).first()).toBeVisible();
  await chatDrawer.getByRole("button", { name: "关闭" }).click();

  const playButton = detailPanel.getByRole("button", {
    name: "播放通话录音",
  }).first();
  await playButton.click();
  await expect(
    detailPanel.getByRole("button", { name: "暂停通话录音" }),
  ).toHaveAttribute("aria-pressed", "true");

  await detailPanel.getByRole("button", { name: "查看完整转写" }).first().click();
  const transcriptDrawer = page.getByRole("dialog", {
    name: "2026-08-09 完整转写",
  });
  await expect(
    transcriptDrawer.getByText(
      "继续上课是否还有意义，需要学校给出明确答复。",
      { exact: true },
    ),
  ).toBeVisible();
});

test("三档宽度下按规则收纳三张卡片且没有横向溢出", async ({ page }) => {
  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#/quality/conversation");
    const detailPanel = page.getByRole("region", {
      name: "学生客诉风险详情",
    });
    const toolbar = page.getByLabel("全局工具栏");
    await expect(detailPanel).toBeVisible();
    await expect(toolbar).toHaveCount(1);

    const toolbarHasHorizontalOverflow = await toolbar.evaluate(
      (element) => element.scrollWidth > element.clientWidth + 1,
    );
    expect(toolbarHasHorizontalOverflow).toBe(false);

    const hasHorizontalOverflow = await page
      .locator(".student-risk-detail-content")
      .evaluate((element) => element.scrollWidth > element.clientWidth + 1);
    expect(hasHorizontalOverflow).toBe(false);

    if (width === 1440) {
      await expect(page.locator(".ant-splitter-panel > .ant-card")).toHaveCount(3);
      await expect(page.getByRole("region", { name: "选择学生" })).toBeVisible();
      await expect(page.getByRole("region", { name: "客诉 AI 助手" })).toBeVisible();
      await expect(
        page.getByRole("button", {
          name: "向 AI 咨询林家宁的客诉风险",
        }),
      ).toBeVisible();
    } else if (width === 1024) {
      await expect(page.getByRole("region", { name: "选择学生" })).toBeVisible();
      await expect(page.getByRole("region", { name: "客诉 AI 助手" })).toHaveCount(0);
      await page.getByRole("button", {
        name: "向 AI 咨询林家宁的客诉风险",
      }).click();
      const assistantDrawer = page.getByRole("dialog", { name: "AI 助手" });
      await expect(assistantDrawer).toBeVisible();
      await assistantDrawer.getByRole("button", { name: "关闭 AI 助手" }).click();
    } else {
      await expect(page.getByRole("region", { name: "选择学生" })).toHaveCount(0);
      await page.getByRole("button", { name: "选择学生" }).click();
      await expect(page.getByRole("dialog", { name: "选择学生" })).toBeVisible();
      await page
        .getByRole("dialog", { name: "选择学生" })
        .getByRole("button", { name: "关闭" })
        .click();
    }
  }
});

test("客诉 AI 助手按学生隔离并恢复会话", async ({ page }) => {
  await page.getByText("总结该生当前客诉风险", { exact: true }).click();
  await expect(page.getByText(/林家宁当前为高风险/)).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("option", { name: /陈子轩/ }).click();
  await expect(
    page.getByRole("button", {
      name: "向 AI 咨询陈子轩的客诉风险",
    }),
  ).toHaveText("问 AI · 陈子轩");
  await expect(page.getByText("基于 陈子轩的客诉预警", { exact: true })).toBeVisible();
  await page.getByText("总结该生当前客诉风险", { exact: true }).click();
  await expect(page.getByText(/陈子轩当前为高风险/)).toBeVisible({
    timeout: 10_000,
  });

  await page.getByRole("option", { name: /林家宁/ }).click();
  await expect(
    page.getByRole("button", {
      name: "向 AI 咨询林家宁的客诉风险",
    }),
  ).toHaveText("问 AI · 林家宁");
  await expect(page.getByText(/林家宁当前为高风险/)).toBeVisible({
    timeout: 10_000,
  });
  await expect(page.getByText(/陈子轩当前为高风险/)).toHaveCount(0);
});
