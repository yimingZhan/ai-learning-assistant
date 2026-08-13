# Ant Design Pro Template Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use writing-plans to execute this plan task-by-task.

**Goal:** Replace the manually assembled Vite admin shell with the official Ant Design Pro v6 / Umi Max application structure while preserving the existing AI assistant behavior.

**Architecture:** Umi Max owns application startup, route discovery, the ProLayout shell, localization, and runtime initialization. Menu entries are generated from a single route configuration. Feature pages use Ant Design, ProComponents, and Ant Design X instead of custom navigation or page-shell primitives.

**Tech Stack:** React 19, TypeScript, Umi Max 4, Ant Design 6, Ant Design ProComponents, Ant Design X, antd-style, Vitest, Playwright, MSW.

---

## Task 1: Adopt the Ant Design Pro runtime

**Files:**

- Modify: `package.json`
- Modify: `tsconfig.json`
- Create: `config/config.ts`
- Create: `config/defaultSettings.ts`
- Create: `src/app.tsx`
- Create: `src/global.css`
- Delete: `index.html`
- Delete: `vite.config.ts`
- Delete: `src/main.tsx`
- Delete: `src/vite-env.d.ts`
- Delete: `tsconfig.app.json`
- Delete: `tsconfig.node.json`

- [x] Install and configure `@umijs/max`, `cross-env`, and `antd-style`.
- [x] Replace Vite lifecycle scripts with Umi Max lifecycle scripts.
- [x] Configure the standard side-layout defaults and application title.
- [x] Initialize the existing mock worker from the Umi runtime entry.
- [x] Remove the obsolete Vite entry points and manual application shell.

## Task 2: Generate the sidebar from route configuration

**Files:**

- Create: `config/routes.ts`
- Create: `config/routes.test.ts`
- Create: `src/locales/zh-CN.ts`
- Create: `src/locales/zh-CN/menu.ts`

- [x] Register the existing `AI 助手` route.
- [x] Add first-level `AI 质检` and child `AI 会话质检`.
- [x] Add first-level `AI 续费` and child `学生续费预测`.
- [x] Add redirects from each first-level route to its child page.
- [x] Verify the nested paths with a route-configuration unit test.

## Task 3: Create standard page entries

**Files:**

- Create: `src/pages/Assistant/index.tsx`
- Create: `src/pages/Quality/Conversation/index.tsx`
- Create: `src/pages/Renewal/Prediction/index.tsx`
- Create: `src/pages/404.tsx`

- [x] Expose the existing assistant feature through Umi page routing.
- [x] Build both new feature placeholders with `PageContainer`, `ProCard`, and `Result`.
- [x] Add a standard not-found result page.

## Task 4: Align the assistant with the official chatbot composition

**Files:**

- Modify: `src/features/assistant/AssistantPage.tsx`
- Create: `src/features/assistant/AssistantPage.styles.ts`
- Modify: `src/features/assistant/AssistantPage.test.tsx`
- Modify: `src/features/assistant/useAssistantChat.ts`

- [x] Use `PageContainer` and a borderless Ant Design `Card` as the page shell.
- [x] Use `XProvider`, `Conversations`, `Bubble`, `Welcome`, `Sender`, and `Actions` for chat UI.
- [x] Keep styling limited to responsive layout and design-token-based dimensions.
- [x] Preserve conversation history, streaming, retry, copy, and feedback behavior.
- [x] Update component tests to assert the official component structure.

## Task 5: Preserve data modes and developer documentation

**Files:**

- Modify: `.env.example`
- Modify: `src/api/client.ts`
- Modify: `README.md`

- [x] Replace Vite-prefixed environment variables with Umi-compatible variables.
- [x] Keep browser and test fetch URLs valid in mock and API modes.
- [x] Document the Ant Design Pro directory structure and menu configuration source.

## Task 6: Verify the migration

**Files:**

- Modify: `e2e/assistant.spec.ts`
- Modify: `playwright.config.ts`
- Create: `vitest.config.ts`

- [x] Run TypeScript validation.
- [x] Run unit and component tests.
- [x] Produce a successful Umi production build.
- [x] Run browser tests for the assistant and both nested menu paths using Umi's `PORT` environment variable.

This workspace is not a Git repository, so verification checkpoints replace commit checkpoints.
