import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/#/quality/conversation");
  await expect(page).toHaveURL(/\/quality\/conversation/);
  await expect(
    page.getByRole("region", { name: "学生客诉风险详情" }),
  ).toBeVisible();
  await expect(
    page.getByRole("option", { name: /林家宁 S2026001 有待处理风险 · 4/ }),
  ).toBeVisible();
});

test("全局工具栏不展示问 AI 和工作提醒", async ({ page }) => {
  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');

  await expect(toolbar).toHaveCount(1);
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "工作提醒" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "帮助" })).toBeVisible();
  await expect(toolbar.getByRole("button", { name: "用户菜单" })).toBeVisible();
  await expect(page.getByRole("region", { name: /客诉 AI 助手/ })).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "AI 助手" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /向 AI 咨询/ })).toHaveCount(0);

  await page.goto("/#/quality/employee-complaints");
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "工作提醒" })).toHaveCount(0);
  await expect(page.getByLabel("AI 助手侧栏")).toHaveCount(0);
  await expect(page.getByRole("dialog", { name: "AI 助手" })).toHaveCount(0);
});

test("AI 助手页面保持可用且全局工具栏只保留基础入口", async ({ page }) => {
  await page.getByRole("link", { name: "AI 助手" }).click();
  await expect(page).toHaveURL(/\/assistant$/);
  await expect(page.getByRole("region", { name: "AI 助手对话" })).toBeVisible();
  await expect(page.getByText("👋 你好，我是 AI 学情助手")).toBeVisible();
  await expect(page.getByRole("button", { name: "打开历史会话" })).toBeVisible();

  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "工作提醒" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "帮助" })).toBeVisible();

  const layout = await page.evaluate(() => {
    const assistant = document.querySelector<HTMLElement>(
      '[aria-label="AI 助手对话"]',
    );
    const sender = document.querySelector<HTMLElement>(
      '[placeholder="输入你想了解的问题"]',
    );
    return {
      documentOverflow:
        document.documentElement.scrollHeight - document.documentElement.clientHeight,
      assistantBottom: assistant?.getBoundingClientRect().bottom ?? Infinity,
      senderBottom: sender?.getBoundingClientRect().bottom ?? Infinity,
      viewportHeight: window.innerHeight,
    };
  });
  expect(layout.documentOverflow).toBeLessThanOrEqual(1);
  expect(layout.assistantBottom).toBeLessThanOrEqual(layout.viewportHeight);
  expect(layout.senderBottom).toBeLessThanOrEqual(layout.viewportHeight);
});

test("帮助和用户入口保持可用", async ({ page }) => {
  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');

  await toolbar.getByRole("button", { name: "帮助" }).click();
  await expect(page.getByText("指标口径", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");

  await toolbar.getByRole("button", { name: "用户菜单" }).click();
  await expect(page.getByText("上海中心 · 学管组", { exact: true })).toBeVisible();
  await expect(page.getByText("当前角色：学管", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
});

test("移动端依然对客诉预警隐藏 AI，并将帮助收入用户菜单", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/quality/conversation");

  const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
  await expect(toolbar).toHaveCount(1);
  await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
  await expect(toolbar.getByRole("button", { name: "帮助" })).toHaveCount(0);
  await toolbar.getByRole("button", { name: "用户菜单" }).click();
  await expect(page.getByText("帮助与反馈", { exact: true })).toBeVisible();
});

test("标准查询栏、重置与紧凑分页按预期联动", async ({ page }) => {
  const query = page.getByRole("region", { name: "客诉风险学生筛选" });
  const selector = page.getByRole("region", { name: "选择学生" });

  for (const label of [
    "学生信息",
    "风险等级",
    "风险事件时间",
    "员工部门",
    "员工姓名",
  ]) {
    await expect(query.getByText(label, { exact: true })).toBeVisible();
  }
  await expect(query.getByRole("button", { name: /查\s*询/ })).toBeVisible();
  await expect(query.getByRole("button", { name: /重\s*置/ })).toBeVisible();
  await expect(query.getByText("风险来源", { exact: true })).toHaveCount(0);

  const studentSearch = query.getByRole("textbox", {
    name: "搜索学生姓名或客户编号",
  });
  await studentSearch.fill("S2026002");
  await expect(selector.getByRole("option", { name: /林家宁/ })).toBeVisible();
  await query.getByRole("button", { name: /查\s*询/ }).click();
  await expect(selector.getByRole("option", { name: /陈子轩/ })).toBeVisible();
  await expect(selector.getByRole("option", { name: /林家宁/ })).toHaveCount(0);

  await query.getByRole("button", { name: /重\s*置/ }).click();
  await expect(selector.getByRole("option", { name: /林家宁/ })).toBeVisible();

  await selector.getByRole("tab", { name: "全部（6）" }).click();
  await expect(selector.getByRole("option").first()).toHaveAccessibleName(/林家宁/);

  const pagination = selector.getByLabel("学生列表分页");
  await expect(pagination.locator(".ant-pagination-simple")).toBeVisible();
  const widths = await Promise.all([
    selector.evaluate((element) => element.getBoundingClientRect().width),
    pagination.evaluate((element) => element.getBoundingClientRect().width),
  ]);
  expect(widths[1]).toBeLessThanOrEqual(widths[0]);
  await pagination.locator(".ant-pagination-next button").click();
  await expect(selector.getByRole("option", { name: /沈雨桐/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
});

test("员工客诉列表保留官方查询表格和 URL 下钻", async ({ page }) => {
  const sider = page.getByTestId("pro-layout-sider");
  await sider.getByText("员工客诉列表", { exact: true }).click();
  await expect(page).toHaveURL(/\/quality\/employee-complaints/);
  await expect(page.getByText("团队风险概览", { exact: true })).toBeVisible();
  await expect(
    page.getByTestId("pro-table").getByText("员工客诉列表", { exact: true }),
  ).toBeVisible();

  const zhouXinRow = page.getByRole("row", { name: /周欣/ });
  await zhouXinRow.getByRole("button", { name: "1人（0.7%）" }).nth(1).click();
  await expect(page).toHaveURL(
    /\/quality\/conversation\?owner=%E5%91%A8%E6%AC%A3&period=7&riskLevel=high/,
  );
  const query = page.getByRole("region", { name: "客诉风险学生筛选" });
  await expect(query.getByText("高风险", { exact: true })).toBeVisible();
  await expect(query.getByText("周欣（学管）", { exact: true })).toBeVisible();
  const selector = page.getByRole("region", { name: "选择学生" });
  await expect(selector.getByText("暂无学生", { exact: true })).toBeVisible();
});

test("风险详情展示纯企微证据，并完成两种风险状态流转", async ({ page }) => {
  test.slow();
  const detail = page.getByRole("region", { name: "学生客诉风险详情" });
  const selector = page.getByRole("region", { name: "选择学生" });
  const riskTable = detail.getByRole("table", { name: "风险事件表格" });

  for (const riskType of ["跟进及时性", "退费", "客诉"]) {
    await expect(detail.getByText(riskType, { exact: true }).first()).toBeVisible();
  }
  const studentSummary = detail.getByRole("region", { name: "学生风险摘要" });
  const riskStats = detail.getByRole("group", { name: "风险统计" });
  await expect(studentSummary).toBeVisible();
  await expect(riskStats).toBeVisible();
  await expect(studentSummary.getByText("高风险 × 2")).toHaveCount(0);
  await expect(riskStats.getByText("高风险 × 2")).toBeVisible();
  await expect(riskStats.getByText("跟进及时性 × 2")).toBeVisible();
  await expect(detail.getByRole("combobox", { name: "风险状态筛选" })).toBeVisible();
  await expect(detail.getByText("通话内容总结", { exact: true })).toHaveCount(0);
  await expect(detail.getByText("学情信息总结", { exact: true })).toHaveCount(0);
  for (const column of [
    "风险日期",
    "风险类型",
    "风险等级",
    "风险总结",
    "命中关键词",
    "处理状态",
    "操作",
  ]) {
    await expect(riskTable.getByRole("columnheader", { name: column })).toBeVisible();
  }
  await expect(riskTable.getByRole("button", { name: "详情" })).toHaveCount(5);
  await expect(
    riskTable.getByRole("columnheader", { name: "证据数" }),
  ).toHaveCount(0);
  expect(
    await riskStats.evaluate(
      (element, table) =>
        element.getBoundingClientRect().bottom <=
        (table as HTMLElement).getBoundingClientRect().top,
      await riskTable.elementHandle(),
    ),
  ).toBe(true);
  await expect(detail.locator(".ant-collapse")).toHaveCount(0);

  const firstRiskRow = riskTable
    .getByRole("row")
    .filter({ hasText: "家长连续反馈找不到负责人" });
  await expect(
    firstRiskRow.getByLabel("命中关键词 找不到人、联系不上、未反馈"),
  ).toBeVisible();
  await firstRiskRow.getByRole("button", { name: "详情" }).click();
  const eventDrawer = page.getByRole("dialog", {
    name: "2026-08-09 · 跟进及时性风险详情",
  });
  await expect(eventDrawer.getByText("企微单聊", { exact: true })).toBeVisible();
  await expect(eventDrawer.getByText("企微群聊", { exact: true })).toBeVisible();
  await expect(eventDrawer.getByText("群聊名称：林家宁服务沟通群")).toBeVisible();
  await expect(eventDrawer.getByText("沟通时间：2026-08-09 09:12")).toBeVisible();

  const chatButtons = eventDrawer.getByRole("button", { name: /查看完整聊天/ });
  await chatButtons.nth(1).click();
  const chatDrawer = page.getByRole("dialog", {
    name: "2026-08-09 · 跟进及时性 · 完整聊天",
  });
  await expect(chatDrawer.getByText("林家宁服务沟通群", { exact: true })).toBeVisible();
  await chatDrawer.getByRole("button", { name: "关闭" }).click();
  await expect(chatDrawer).toBeHidden();
  await eventDrawer.getByRole("button", { name: "关闭" }).click();
  await expect(eventDrawer).toBeHidden();

  const statusSelect = detail.getByRole("combobox", { name: "风险状态筛选" });
  await statusSelect.click();
  await statusSelect.press("ArrowDown");
  await statusSelect.press("Enter");
  await expect(
    detail.getByRole("button", { name: /^更多操作 / }),
  ).toHaveCount(4);

  await detail.getByRole("button", { name: /^更多操作 / }).first().click();
  await page.getByRole("menuitem", { name: "标记为已处理" }).click();
  const resolvedModal = page.getByRole("dialog", {
    name: "确认标记该风险为已处理？",
  });
  await expect(resolvedModal.getByText(/不再计入该学生的待处理风险数量/)).toBeVisible();
  await resolvedModal.getByRole("button", { name: "确认已处理" }).click();
  await expect(
    selector.getByRole("option", {
      name: /林家宁 S2026001 有待处理风险 · 3/,
    }),
  ).toBeVisible();
  await expect(
    detail.getByRole("button", { name: /^更多操作 / }),
  ).toHaveCount(3);

  await detail.getByRole("button", { name: /^更多操作 / }).first().click();
  await page.getByRole("menuitem", { name: "排除风险" }).click();
  const excludedModal = page.getByRole("dialog", { name: "确认排除该风险？" });
  await expect(excludedModal.getByText(/风险状态将变为“已排除”/)).toBeVisible();
  await excludedModal.getByRole("button", { name: "确认排除" }).click();
  await expect(
    selector.getByRole("option", {
      name: /林家宁 S2026001 有待处理风险 · 2/,
    }),
  ).toBeVisible();
  await expect(
    detail.getByRole("button", { name: /^更多操作 / }),
  ).toHaveCount(2);
});

test("各响应式宽度只展示两个业务面板且无横向溢出", async ({ page }) => {
  for (const width of [1440, 1200, 1024, 768]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/#/quality/conversation");
    const detail = page.getByRole("region", { name: "学生客诉风险详情" });
    const toolbar = page.locator('[aria-label="全局工具栏"]:visible');
    await expect(detail).toBeVisible();
    await expect(toolbar.getByRole("button", { name: "问 AI" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: /客诉 AI 助手/ })).toHaveCount(0);
    await expect(page.getByLabel("AI 助手侧栏")).toHaveCount(0);

    const overflowState = await page
      .locator(".student-risk-detail-content")
      .evaluate((element) => {
        const tableScroller = element.querySelector<HTMLElement>(
          ".ant-table-content",
        );
        return {
          detailOverflow: element.scrollWidth > element.clientWidth + 1,
          documentOverflow:
            document.documentElement.scrollWidth >
            document.documentElement.clientWidth + 1,
          tableScrolls: Boolean(
            tableScroller &&
              tableScroller.scrollWidth > tableScroller.clientWidth + 1,
          ),
        };
      });
    expect(overflowState.detailOverflow, `detail width: ${width}`).toBe(false);
    expect(overflowState.documentOverflow, `document width: ${width}`).toBe(false);
    expect(overflowState.tableScrolls, `table width: ${width}`).toBe(true);

    if (width >= 1024) {
      await expect(page.locator(".ant-splitter-panel > .ant-card")).toHaveCount(2);
      await expect(page.getByRole("region", { name: "选择学生" })).toBeVisible();
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
