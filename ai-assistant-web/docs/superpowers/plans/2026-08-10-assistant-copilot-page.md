# Assistant Copilot Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 学情助手改为 Ant Design X 官方“助手式”视觉，并把原本的侧边抽屉形态适配为固定页面。

**Architecture:** 保留现有 `useAssistantChat`、消息渲染、重试与反馈行为；页面壳改为官方 Copilot 的“顶栏 + 单列消息区 + 底部输入区”。历史会话从常驻左栏迁入顶栏 Popover，关闭按钮和抽屉宽度状态不进入页面版实现。

**Tech Stack:** React 19、TypeScript 7、Ant Design 6、Ant Design X 2.9、antd-style、Vitest、Playwright。

---

### Task 1: Lock the page-level copilot behavior with tests

**Files:**
- Modify: `src/features/assistant/AssistantPage.test.tsx`
- Modify: `e2e/assistant.spec.ts`

- [x] **Step 1: Assert the assistant header and welcome prompts**

```ts
expect(screen.getByText("✨ AI 助手")).toBeTruthy();
expect(screen.getByText("我可以帮你：")).toBeTruthy();
expect(screen.getByRole("button", { name: "打开历史会话" })).toBeTruthy();
```

- [x] **Step 2: Open history before selecting a conversation**

```ts
await user.click(screen.getByRole("button", { name: "打开历史会话" }));
const historyItem = await screen.findByRole("listitem", {
  name: "李明近 30 天学习情况",
});
fireEvent.click(historyItem);
```

- [x] **Step 3: Remove the superseded two-surface assertion**

Delete the desktop assertion that compares the former rail and chat backgrounds, because the Copilot page has one fixed assistant surface.

### Task 2: Port the official Copilot structure into the page

**Files:**
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/features/assistant/AssistantPage.styles.ts`

- [x] **Step 1: Replace the permanent conversation rail with the assistant header**

```tsx
<header className={styles.chatHeader}>
  <div className={styles.headerTitle}>✨ AI 助手</div>
  <Space size={0}>
    <Button type="text" aria-label="新对话" icon={<PlusOutlined />} />
    <Popover content={<Conversations />}>
      <Button type="text" aria-label="打开历史会话" icon={<CommentOutlined />} />
    </Popover>
  </Space>
</header>
```

- [x] **Step 2: Render the official welcome card and vertical prompts**

```tsx
<Welcome
  variant="borderless"
  title="👋 你好，我是 AI 学情助手"
  description="查询学生学习情况、订单与老师反馈，或生成家长回复建议。"
  className={styles.chatWelcome}
/>
<Prompts vertical title="我可以帮你：" items={promptItems} />
```

- [x] **Step 3: Keep messages and sender in a centered page column**

Use a 940 px maximum content width for `Bubble.List`, prompts, shortcut buttons, alerts, and `Sender`, while the assistant header spans the whole page.

- [x] **Step 4: Apply the official Copilot tokens**

```ts
chatHeader: css`
  height: 52px;
  border-bottom: 1px solid ${token.colorBorder};
`,
chatWelcome: css`
  padding: 12px 16px;
  border-radius: 12px;
  background: ${token.colorBgTextHover};
`,
chatSend: css`
  padding: ${token.padding}px;
`,
```

### Task 3: Verify interaction and responsive layout

**Files:**
- No source changes expected.

- [x] **Step 1: Run component and type checks**

Run: `pnpm exec vitest run src/features/assistant/AssistantPage.test.tsx && pnpm typecheck`

Expected: seven assistant component tests pass and TypeScript reports no errors.

- [x] **Step 2: Build and inspect the real page**

Run: `pnpm build`

Expected: the Umi production build succeeds; at 1440, 1024, and 768 px, the assistant header, welcome prompts, and Sender remain visible without horizontal overflow.

- [x] **Step 3: Run focused end-to-end checks**

Run: `pnpm exec playwright test e2e/assistant.spec.ts -g "官方会话列表|三档宽度|新对话"`

Expected: history opens from the header, new conversation returns to the Copilot welcome state, and the primary flow remains visible at all three widths.
