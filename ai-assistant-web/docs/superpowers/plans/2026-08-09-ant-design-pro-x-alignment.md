# Ant Design Pro 6 and Ant Design X Alignment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 AI 学情助手原型严格收敛到 Ant Design Pro 6 与 Ant Design X 官方组件和默认视觉，不保留自定义色板或组件外观覆盖。

**Architecture:** 由 ProLayout 和 PageContainer 提供应用壳与页面容器，Ant Design X 提供 AI 会话、欢迎页、历史会话和输入框，ProComponents 与 Ant Design 提供快捷操作、表单、卡片、描述项、折叠面板和反馈。业务请求、状态管理及接口契约保持不变；CSS 只保留页面尺寸、滚动和窄屏排布所需的结构规则。

**Tech Stack:** React 19、TypeScript 7、Vite 8、Ant Design 6、Ant Design ProComponents 3、Ant Design X 2、Vitest、Testing Library。

---

### Task 1: Pin the official Pro 6 component stack

**Files:**
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`

- [x] **Step 1: Add ProComponents v3 for Ant Design 6**

Run: `pnpm add @ant-design/pro-components@3.1.14-6`

Expected: `package.json` records `@ant-design/pro-components` and its peer dependency resolves to the existing `antd@6.5.4` and React 19 installation.

- [x] **Step 2: Verify the dependency graph**

Run: `pnpm list antd @ant-design/pro-components @ant-design/x react --depth 0`

Expected: one direct version for each official UI package, with no peer dependency errors.

### Task 2: Replace the handwritten application shell

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/app/AppShell.tsx`

- [x] **Step 1: Remove all ConfigProvider theme overrides**

Render the locale-only provider so Ant Design and Ant Design X receive the official default tokens:

```tsx
<ConfigProvider locale={zhCN}>
  <AppShell />
</ConfigProvider>
```

- [x] **Step 2: Use ProLayout and PageContainer**

Replace the handwritten `aside`, navigation buttons, header and brand styling with `ProLayout` route configuration and a `PageContainer` carrying the history and new-conversation actions. Keep the existing three navigation entries and current assistant page behavior.

- [x] **Step 3: Run the shell interaction test**

Run: `pnpm test -- src/features/assistant/AssistantPage.test.tsx`

Expected: the assistant empty state renders and the history action remains accessible by its button name.

### Task 3: Replace assistant surfaces with Ant Design X

**Files:**
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/features/assistant/QuickActionBar.tsx`
- Modify: `src/features/assistant/HistoryDrawer.tsx`

- [x] **Step 1: Use Welcome for the empty conversation**

Render `Welcome` with the existing title and description instead of custom empty-state markup.

- [x] **Step 2: Use official controls for quick actions**

Map the four existing query actions to Ant Design `Button` controls in an official `Flex` layout; preserve labels, disabled state, and `onSelect` behavior without custom styles.

- [x] **Step 3: Use Conversations for history**

Map history items to `Conversations.items`, retain date grouping through each item's `group`, and use `activeKey` plus `onActiveChange` for selection.

- [x] **Step 4: Preserve Bubble and Sender behavior**

Keep `Bubble.List` and `Sender` as the only conversation and composer primitives, using their built-in loading and streaming states without CSS overrides.

### Task 4: Replace custom form and result-card markup

**Files:**
- Modify: `src/features/assistant/QuickQueryModal.tsx`
- Modify: `src/features/assistant/ResultCard.tsx`
- Modify: `src/features/assistant/ResultCard.test.tsx`

- [x] **Step 1: Use ModalForm and ProForm fields**

Replace hand-arranged labels, Select, TextArea, modal footer, and submit button with `ModalForm`, `ProFormSelect`, and `ProFormTextArea`; retain student search, required validation, field reset, and query payload construction.

- [x] **Step 2: Use official data-display components**

Render every result inside `ProCard`; use `Typography`, `Descriptions`, `List`, `Input.TextArea`, `Flex`, `Button`, and `Collapse` for content and evidence disclosure. Do not pass custom colors, styles, classNames, token values, or variants that alter official defaults.

- [x] **Step 3: Update component assertions**

Assert the score conclusion and collapsed evidence label, and verify that the editable reply draft still copies its latest value.

- [x] **Step 4: Run focused tests**

Run: `pnpm test -- src/features/assistant/ResultCard.test.tsx src/features/assistant/AssistantPage.test.tsx`

Expected: all result-card and assistant interaction tests pass.

### Task 5: Remove visual overrides and verify the prototype

**Files:**
- Modify: `src/styles.css`

- [x] **Step 1: Delete the custom design system**

Remove every custom color, background, border, shadow, radius, typography, component selector override, hover treatment, and focus treatment. Retain only structural rules for viewport height, flex/grid sizing, content width, overflow, spacing between page regions, and responsive behavior.

- [x] **Step 2: Scan for forbidden visual overrides**

Run: `rg '#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|color:|background:|border:|border-radius:|box-shadow:|font-family:' src`

Expected: no application-authored visual token or component appearance override remains.

- [x] **Step 3: Run the complete verification suite**

Run: `pnpm typecheck && pnpm test && pnpm build`

Expected: TypeScript succeeds, all Vitest suites pass, and Vite produces a production build.

- [x] **Step 4: Review the rendered desktop and narrow layouts**

Start the local preview and inspect the primary assistant workflow at desktop and mobile widths. Confirm ProLayout navigation, PageContainer actions, Welcome, Prompts, Conversations, Bubble, Sender, ModalForm, and ProCard render with official default colors and without clipped controls.
