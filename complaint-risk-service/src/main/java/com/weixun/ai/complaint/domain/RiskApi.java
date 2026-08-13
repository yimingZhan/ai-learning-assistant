package com.weixun.ai.complaint.domain;

import java.time.Instant;
import java.util.List;

public final class RiskApi {
  private RiskApi() {}

  public record TrialInput(String mode, String text, String studentId) {}

  public record TrialRequest(ComplaintRiskConfig config, TrialInput input) {}

  public record TrialMatch(
      String ruleId,
      String ruleName,
      String theme,
      int score,
      String evidence
  ) {}

  public record TrialResult(
      int riskScore,
      String riskLevel,
      int confidence,
      boolean crossChannelBonusApplied,
      List<TrialMatch> matchedRules,
      String summary,
      String suggestion
  ) {}

  public record Version(
      String version,
      String status,
      String changeNote,
      String publishedAt,
      String publishedBy
  ) {}

  public record PublishRequest(ComplaintRiskConfig config, String changeNote) {}

  public record ModelMatch(
      String ruleId,
      boolean matched,
      int confidence,
      List<String> evidenceIds,
      String rationale,
      String summary,
      String suggestion
  ) {}

  public record ModelResult(String analysisStatus, List<ModelMatch> matches) {}

  public record BatchResult(
      String runId,
      String status,
      int fetchedCount,
      int evidenceCount,
      int eventCount,
      Instant startedAt,
      Instant completedAt,
      String errorMessage
  ) {}

  public record RelatedPerson(String name, List<String> roles) {}

  public record RiskStudent(
      String id,
      String studentName,
      String studentNumber,
      String riskLevel,
      String coreRisk,
      int riskEventCount,
      List<String> riskSources,
      String latestRiskTime,
      String owner,
      List<RelatedPerson> relatedPeople,
      String dataStatus
  ) {}

  public record RiskStudentPage(
      List<RiskStudent> items,
      long total,
      int page,
      int pageSize
  ) {}

  public record TextSegment(String text, boolean highlighted) {}

  public record FullChatMessage(
      String id,
      String sender,
      String role,
      String occurredAt,
      List<TextSegment> content
  ) {}

  public record WechatEvidence(
      String id,
      String type,
      String communicationRole,
      String employee,
      String occurredAt,
      List<TextSegment> excerpt,
      List<FullChatMessage> fullChat
  ) {}

  public record RiskEvent(
      String id,
      String theme,
      String aiSummary,
      String aiSuggestion,
      List<String> riskSources,
      List<WechatEvidence> evidence
  ) {}

  public record RiskEventGroup(String date, List<RiskEvent> events) {}

  public record ServiceProfile(
      String grade,
      String followUpAdvisor,
      String followUpManager,
      String course,
      String serviceMode,
      String guardianContact,
      String serviceStartDate
  ) {}

  public record OperationLog(
      String id,
      String category,
      String operationType,
      String operator,
      String result,
      String operatedAt,
      String remark
  ) {}

  public record ThemeCount(String label, int count) {}

  public record RiskStudentDetail(
      RiskStudent student,
      List<String> assessmentPeriod,
      String aiSummary,
      List<ThemeCount> themes,
      String handlingSuggestion,
      String latestRiskDate,
      List<RiskEventGroup> eventGroups,
      String currentStatus,
      int riskScore,
      List<Object> workflowSteps,
      ServiceProfile serviceProfile,
      List<Object> historyRecords,
      List<OperationLog> operationLogs,
      String configVersion,
      String modelVersion,
      String dataStatus
  ) {}

  public record WorkReminder(
      String id,
      String type,
      String priority,
      String title,
      String description,
      String createdAt,
      String targetPath,
      boolean read,
      ReminderStudent student
  ) {}

  public record ReminderStudent(String id, String name) {}

  public record WorkReminderSummary(int unreadCount, List<WorkReminder> items) {}

  public record CurrentUser(
      String id,
      String name,
      String organization,
      CurrentUserRole role,
      List<String> permissions
  ) {}

  public record CurrentUserRole(String id, String label) {}
}
