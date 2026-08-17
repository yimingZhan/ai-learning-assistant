# Coze 企微预警总结测试数据

这是一套**完全虚构、仅用于测试**的企微聊天样例。姓名、账号、会话、时间和事件均为合成数据，不对应真实个人。

## 文件

- `wecom_messages.jsonl`：逐条企微原始消息，共 10 个会话；单聊、群聊各 5 个。
- `expected_warnings.json`：每个会话的预期预警结果，仅用于评测，不要传给模型。

## 原始消息字段

| 字段 | 含义 |
| --- | --- |
| `caseId` | 测试案例 ID，用于对照预期结果 |
| `tenantId` | 企业租户 ID |
| `sourceMessageId` | 企微源消息唯一 ID，可作为证据 ID |
| `conversationId` | 会话 ID |
| `chatType` | `single` 单聊 / `group` 群聊 |
| `memberCount` | 群成员数；单聊固定为 2 |
| `staffWechatAccountId` | 负责员工的企微账号 ID |
| `customerWechatId` | 当前外部联系人或当前外部发送人 ID |
| `customerWechatIds` | 会话涉及的全部外部联系人 ID |
| `senderType` | `staff` / `guardian` / `student` / `teacher` |
| `senderId`、`senderName` | 实际发送人 ID、展示名 |
| `messageType` | `text` / `voice` / `image` / `file` |
| `contentText` | 可供模型分析的文本；语音为转写、图片为 OCR 摘要 |
| `sentAt`、`updatedAt` | ISO 8601 时间，时区为东八区 |
| `recalled` | 消息是否撤回 |

字段主体与项目中的 `YunkMessage` 保持一致，`caseId`、`senderId`、`senderName` 是为了方便 Coze 测试新增的辅助字段。

## 建议的 Coze 工作流

1. 文件/HTTP 节点读取 `wecom_messages.jsonl`。
2. 代码节点按 `conversationId` 分组，并按 `sentAt` 升序排序。
3. 循环节点逐会话调用大模型，要求所有结论引用 `sourceMessageId`。
4. 输出结构建议包含：`riskLevel`、`themes`、`summary`、`evidenceIds`、`nextAction`、`insufficientData`。
5. 用 `expected_warnings.json` 做离线评测，重点检查误报、风险升级和“问题已解决”的上下文识别。

## 建议提示词约束

```text
你是教育服务预警分析助手。请基于一个完整会话识别风险，不得脱离上下文只看关键词。
每条结论必须引用真实 sourceMessageId。已明确解决的问题不得判为持续高风险；
撤回消息只能作为弱证据；证据不足时输出 insufficientData=true。
```

