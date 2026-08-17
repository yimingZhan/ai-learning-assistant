# 唯寻 AI 学情助手

项目基于 Ant Design Pro v6 官方工程结构：

- Umi Max 统一管理启动、路由、ProLayout 和侧边菜单。
- `config/routes.ts` 是页面路由和菜单层级的唯一配置源。
- Ant Design Pro Components 提供页面容器和后台业务组件。
- Ant Design X 官方页面模板负责会话列表、消息气泡、操作栏、欢迎页和输入框。
- Ant Design X SDK 负责多会话、流式消息、停止与重试。
- antd-style 负责仅限尺寸和排布的结构样式。

侧边菜单包含 `AI 助手`、`AI 质检 / AI 客诉预警` 和 `AI 续费 / 学生续费预测`。

## 开发规范

- 一定要严格按照 Ant Design、Ant Design Pro 模板以及 Ant Design 的设计规范去使用组件，不要自己造组件，也不要按照自己的理解去写布局。

## 本地运行

```bash
corepack pnpm install
corepack pnpm dev
```

开发服务使用 MSW 提供本地模拟接口，实际地址以终端输出为准。

## 数据说明

本项目仅用于演示，所有学生、沟通、客诉、续费和 AI 配置数据均为前端内置的模拟数据，不连接云客、数据库、模型网关或其他外部系统。部分页面操作会在当前浏览器会话内更新模拟状态，刷新页面后恢复初始数据。

## 验证

```bash
corepack pnpm typecheck
corepack pnpm test
corepack pnpm test:e2e
corepack pnpm build
```
