# AI 微信学情助手 Implementation Plan

> **For agentic workers:** Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一个极简、接口就绪的 AI 学情对话前端，跑通四类快捷查询、历史记录与新对话。

**Architecture:** 应用由外壳、助手功能和 API 三个边界组成。浏览器始终调用同一 REST/SSE 契约；模拟模式由 MSW 接管请求，真实模式由环境变量指向后端。

**Tech Stack:** React 19、TypeScript、Vite、Ant Design 6、Ant Design ProComponents 3、Ant Design X 2、MSW、Vitest、Playwright CLI。

**Visual Constraint:** 原型严格使用 Ant Design Pro 与 Ant Design X 官方组件及其默认 token；不自定义主题色、字体、圆角、阴影，也不覆盖官方组件样式。

---

### Task 1: Project and API foundation

**Files:** `package.json`, `src/api/contracts.ts`, `src/api/client.ts`, `src/api/mock/*`

- [ ] 安装依赖并生成 MSW worker。
- [ ] 定义最小查询、消息和结果卡片类型。
- [ ] 实现学生、会话、消息与 SSE 模拟接口。
- [ ] 实现可取消的 REST/SSE 客户端。

### Task 2: Minimal assistant interface

**Files:** `src/app/*`, `src/features/assistant/*`, `src/styles.css`

- [ ] 实现只含三个一级入口的应用外壳。
- [ ] 实现顶部历史记录、新对话及抽屉。
- [ ] 实现四个只保留必要字段的快捷查询。
- [ ] 实现对话流和按问题出现的结果卡片。

### Task 3: Verification

**Files:** `src/**/*.test.ts(x)`, `src/test/setup.ts`

- [ ] 覆盖查询载荷、卡片与关键会话交互。
- [ ] 执行 `pnpm typecheck`, `pnpm test`, `pnpm build`。
- [ ] 使用 Playwright CLI 验收四个流程和 1440/1024/768 布局。
