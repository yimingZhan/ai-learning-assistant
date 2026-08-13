# Vite + Ant Design X Official Template Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 保留 Vite、ProLayout 和现有 REST/SSE 业务接口，将 AI 对话页替换为 Ant Design X 官方 Independent 样板间结构，并接入 X Markdown 与 X SDK。

**Architecture:** 外层继续使用 Ant Design Pro 的 `ProLayout` 作为业务模块导航；页面内部采用官方 Independent 模板的“会话列表 + Bubble.List + Welcome + Sender + Actions”结构。`useXConversations` 管理会话切换，`useXChat` 通过自定义 `AbstractChatProvider` 适配现有 SSE 协议；回复由 `XMarkdown` 渲染，卡片事件继续转换为普通文本，不启用 X Card。CSS 只承担尺寸、滚动和响应式排布，不覆盖组件颜色、背景、边框、圆角、阴影或字体。

**Tech Stack:** React 19、TypeScript 7、Vite 8、Ant Design 6、Ant Design ProComponents 3、Ant Design X 2.9、X Markdown 2.9、X SDK 2.9、MSW、Vitest、Playwright。

---

### Task 1: Add the official Ant Design X runtime packages

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [ ] **Step 1: Install version-aligned packages**

Run:

```bash
pnpm add @ant-design/x-markdown@2.9.0 @ant-design/x-sdk@2.9.0
```

Expected: both packages resolve beside `@ant-design/x@2.9.0` without peer dependency errors.

- [ ] **Step 2: Verify direct dependencies**

Run:

```bash
pnpm list @ant-design/x @ant-design/x-markdown @ant-design/x-sdk antd --depth 0
```

Expected: all three Ant Design X runtime packages are `2.9.0`, and Ant Design remains `6.5.4`.

### Task 2: Adapt the existing SSE service to X SDK

**Files:**
- Create: `src/features/assistant/AssistantChatProvider.ts`
- Modify: `src/api/client.ts`
- Modify: `src/features/assistant/useAssistantChat.ts`
- Test: `src/features/assistant/AssistantPage.test.tsx`

- [ ] **Step 1: Expose the existing message endpoint without changing its contract**

Add a client helper that returns the current REST/SSE URL for a conversation:

```ts
messageEndpoint(conversationId: string) {
  return `${API_BASE}/api/v1/assistant/conversations/${conversationId}/messages`;
}
```

- [ ] **Step 2: Implement the custom official Chat Provider**

Create an `AssistantChatProvider` extending `AbstractChatProvider`. Its `transformLocalMessage` maps `{ text, role, context }` to a user message. Its `transformMessage` parses the existing `AssistantStreamEvent` from `chunk.data`, appends `delta`, stores `card` and `sources`, and leaves the accumulated message intact on `done`.

- [ ] **Step 3: Replace handwritten message state with X SDK hooks**

Use `useXConversations` for server-loaded conversations and `useXChat` for messages. Keep a `NEW_CONVERSATION_KEY`; on the first submission create the server conversation, switch to its key, and call `queueRequest`. For existing conversations call `onRequest`. Load history through async `defaultMessages`, stop through `abort`, and retry through `onReload`.

- [ ] **Step 4: Verify the chat flow**

Run:

```bash
pnpm test -- src/features/assistant/AssistantPage.test.tsx
```

Expected: history loading, natural-language submission, missing-data response, failure fallback, retry, and abort behavior remain testable through the official SDK flow.

### Task 3: Replace the page with the official Independent template structure

**Files:**
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/features/assistant/AssistantReply.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/main.tsx`
- Modify: `src/styles.css`
- Test: `src/features/assistant/AssistantPage.test.tsx`
- Test: `e2e/assistant.spec.ts`

- [ ] **Step 1: Add the official X locale provider**

Wrap the application in:

```tsx
<XProvider locale={xZhCN}>
  <AppShell />
</XProvider>
```

Keep Ant Design's existing locale-only `ConfigProvider`; do not add theme tokens.

- [ ] **Step 2: Use the official template composition**

Render an in-page conversation rail using `Conversations` and its `creation` control. Render the empty state with borderless `Welcome`, messages with `Bubble.List`, assistant feedback with `Actions.Copy` and `Actions.Feedback`, and input with `Sender`. Do not add `Prompts`, because the user removed the shortcut buttons; do not add `Attachments`, speech controls, or X Card before they are required.

- [ ] **Step 3: Render assistant replies with X Markdown**

Convert the existing structured response payload into Markdown text and render it with `XMarkdown`. Preserve score, order, feedback, parent reply, missing-data and source information as ordinary reply text, without Ant Design cards.

- [ ] **Step 4: Keep CSS structural only**

Retain only viewport height, flex/grid dimensions, content width, spacing and overflow rules. Do not author `color`, `background`, `border`, `border-radius`, `box-shadow`, `font-family`, component token overrides, or inline visual styles.

- [ ] **Step 5: Update browser coverage to the new template**

Assert the conversation creation control, history item selection, borderless welcome copy, plain reply, official Sender, copy/feedback controls, and responsive conversation flow. Remove stale assertions for the already-deleted shortcut query modal.

### Task 4: Verify and run the hybrid application

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Document the hybrid stack**

State that Vite remains the build tool, ProLayout remains the application shell, and the assistant page uses the official Ant Design X Independent template structure plus X SDK and X Markdown.

- [ ] **Step 2: Scan for forbidden visual overrides**

Run:

```bash
rg '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|color:|background:|border:|border-radius:|box-shadow:|font-family:' src
```

Expected: no application-authored component appearance override remains.

- [ ] **Step 3: Run the complete verification suite**

Run:

```bash
pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

Expected: type checking, component tests, production build and Playwright scenarios all succeed.

- [ ] **Step 4: Start the Vite project**

Run:

```bash
pnpm dev --host 127.0.0.1
```

Expected: the application is available locally and renders the official Ant Design X template composition with existing mock business data.
