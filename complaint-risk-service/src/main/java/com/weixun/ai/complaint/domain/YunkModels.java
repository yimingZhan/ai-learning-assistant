package com.weixun.ai.complaint.domain;

import java.time.Instant;
import java.util.List;

public final class YunkModels {
  private YunkModels() {}

  public record YunkMessage(
      String tenantId,
      String sourceMessageId,
      String staffWechatAccountId,
      String customerWechatId,
      String conversationId,
      String chatType,
      String senderType,
      String messageType,
      String contentText,
      Instant sentAt,
      Instant updatedAt,
      boolean recalled
  ) {}

  public record YunkMessagePage(
      List<YunkMessage> items,
      String nextCursor,
      boolean hasMore
  ) {}

  public record StudentIdentity(
      String studentId,
      String studentName,
      String studentNumber,
      String ownerId,
      String ownerName
  ) {}

  public record EmployeeIdentity(
      String employeeId,
      String employeeName,
      String employeeRole
  ) {}

  public record Evidence(
      String id,
      String tenantId,
      String sourceMessageId,
      String staffWechatAccountId,
      String customerWechatId,
      String conversationId,
      String senderType,
      String messageType,
      String contentText,
      Instant occurredAt,
      Instant sourceUpdatedAt,
      boolean recalled,
      StudentIdentity student,
      EmployeeIdentity employee,
      String dataStatus,
      String analysisStatus
  ) {}
}
