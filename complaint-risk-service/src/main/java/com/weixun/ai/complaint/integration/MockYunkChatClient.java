package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.YunkModels.YunkMessage;
import com.weixun.ai.complaint.domain.YunkModels.YunkMessagePage;
import java.time.Instant;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "complaint-risk.yunk", name = "mode", havingValue = "mock", matchIfMissing = true)
public class MockYunkChatClient implements YunkChatClient {
  @Override
  public YunkMessagePage fetchMessages(Instant from, Instant to, String cursor, int pageSize) {
    if (cursor != null && cursor.startsWith("mock-page-complete")) {
      return new YunkMessagePage(List.of(), null, false);
    }
    Instant base = to.minusSeconds(50 * 60L);
    List<YunkMessage> messages = List.of(
        message("yk-msg-001", "staff-wechat-a1024", "customer-wechat-001", "conv-001",
            "employee", "家长您好，上周的问题我已经同步教研老师，今天会再跟进。", base),
        message("yk-msg-002", "staff-wechat-a1024", "customer-wechat-001", "conv-001",
            "customer", "这个问题一直没人处理，孩子成绩也没有改善。", base.plusSeconds(300)),
        message("yk-msg-003", "staff-wechat-a1024", "customer-wechat-001", "conv-001",
            "customer", "我现在要求退款，不再继续上课，否则就正式投诉你们。", base.plusSeconds(600)),
        message("yk-msg-004", "staff-wechat-b2048", "customer-wechat-002", "conv-002",
            "customer", "不是要投诉，老师已经解释清楚了，谢谢。", base.plusSeconds(900)),
        new YunkMessage(
            "demo-tenant", "yk-msg-005", "staff-wechat-b2048", "customer-wechat-unknown", "conv-003",
            "single", "customer", "text", "反馈太慢了，请尽快联系我。", base.plusSeconds(1200),
            base.plusSeconds(1200), false
        )
    );
    var inWindow = messages.stream()
        .filter(item -> !item.sentAt().isBefore(from) && !item.sentAt().isAfter(to))
        .limit(pageSize)
        .toList();
    return new YunkMessagePage(inWindow, "mock-page-complete:" + to.toEpochMilli(), false);
  }

  private static YunkMessage message(
      String id,
      String staffAccount,
      String customerAccount,
      String conversationId,
      String senderType,
      String content,
      Instant occurredAt
  ) {
    return new YunkMessage(
        "demo-tenant", id, staffAccount, customerAccount, conversationId, "single", senderType,
        "text", content, occurredAt, occurredAt, false
    );
  }
}
