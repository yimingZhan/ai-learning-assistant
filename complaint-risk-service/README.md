# 客诉预警后台服务

这是一套代码编排的云客微信客诉预警服务。它承接现有“AI 客诉预警配置”页面，并把配置真正用于聊天拉取、风险分析、事件生成和工作提醒。

## V1 能力边界

- 数据源：云客中的一对一微信文字消息。
- 暂不处理：群聊、语音、图片/OCR、电话外呼、学习数据、服务记录、历史客诉结构化数据。
- 调度：每 30 分钟增量拉取，带 2 小时重叠窗口和 2 分钟安全延迟；每天补偿最近 3 天。
- 结果：生成内部风险事件和工作提醒，不创建审核/工单流程，不直接对外承诺。
- 模型：支持内置仿真模型和 OpenAI-compatible /chat/completions 网关。

## 工作流

1. YunkChatClient 拉取云客消息。
2. IdentityDirectory 把客户微信映射到学生、员工微信映射到员工。
3. 原始消息幂等写入 communication_evidence；无法映射或不支持的数据进入 communication_data_issue。
4. RiskModelClient 根据已发布 Prompt 和上下文输出结构化命中结果。
5. RiskDecisionEngine 应用置信度、时间窗、最少出现次数、分值和强制等级。
6. 同一学生、日期、规则聚合为风险事件，保留证据和修订记录。
7. 高风险写入 notification outbox，再生成负责人/质检工作提醒。
8. 全批次成功后才推进云客 cursor 和 watermark。

云客字段变化只需修改 HttpYunkChatClient 的转换；模型供应商变化只需替换 RiskModelClient。规则和运行策略来自已发布配置，不与第三方字段耦合。

## 本地启动

要求 Java 21+。默认使用本地 H2 文件、仿真云客数据和仿真模型，无需外部依赖：

    ./mvnw spring-boot:run

执行一次完整拉取：

    curl -X POST http://localhost:8080/internal/v1/complaint-risk/jobs/run \
      -H 'Content-Type: application/json' \
      -d '{"runType":"MANUAL"}'

然后可查看：

    curl http://localhost:8080/api/v1/complaint-risks/students
    curl http://localhost:8080/api/v1/complaint-risks/students/risk-student-001
    curl http://localhost:8080/api/v1/work-reminders

前端使用真实 API：

    cd ../ai-assistant-web
    DATA_MODE=api API_BASE_URL=http://localhost:8080 pnpm dev

## PostgreSQL 与 Redis

    docker compose up -d
    DB_URL=jdbc:postgresql://localhost:5432/complaint_risk \
    DB_USERNAME=complaint_risk \
    DB_PASSWORD=complaint_risk \
    ./mvnw spring-boot:run

Redis 已纳入基础设施配置，V1 的正确性依赖数据库 cursor、唯一键、outbox 和 ShedLock，不依赖 Redis 缓存。

## 对接真实云客

环境变量：

    YUNK_MODE=http
    YUNK_BASE_URL=https://your-yunk-gateway.example.com
    YUNK_TOKEN=replace-me
    YUNK_MESSAGES_PATH=/openapi/v1/chat/messages

当前 HTTP 适配器约定平台网关先归一化为包含 items、nextCursor、hasMore 的响应。每个 items 元素包含 tenantId、sourceMessageId、staffWechatAccountId、customerWechatId、conversationId、chatType、senderType、messageType、contentText、sentAt、updatedAt、recalled。

拿到云客正式接口文档后，应只在 HttpYunkChatClient 内增加原始 DTO 和归一化转换。MockIdentityDirectory 同理需要替换为公司的客户/学生、员工账号映射服务。

## 对接模型网关

    MODEL_MODE=openai
    MODEL_BASE_URL=https://your-model-gateway.example.com/v1
    MODEL_API_KEY=replace-me
    MODEL_NAME=gpt-4.1-mini

## 权限中台

服务不维护另一套岗位/数据权限。网关或权限中台鉴权后，可传入 X-User-Id、X-User-Name、X-User-Permissions（逗号分隔）。

当前服务检查的资源动作权限：

- quality:complaint-risk:read
- quality:complaint-risk:run
- ai-config:complaint-risk:edit
- ai-config:complaint-risk:publish

生产环境应由统一网关签名或注入这些可信身份头，不能接受公网客户端自行伪造。

## 测试

    ./mvnw test

