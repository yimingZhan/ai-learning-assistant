package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.config.ComplaintRiskProperties;
import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.BatchResult;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.domain.YunkModels.YunkMessage;
import com.weixun.ai.complaint.integration.IdentityDirectory;
import com.weixun.ai.complaint.integration.RiskModelClient;
import com.weixun.ai.complaint.integration.YunkChatClient;
import com.weixun.ai.complaint.persistence.WorkflowRepository;
import com.weixun.ai.complaint.service.RequestUserResolver.RequestUser;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class RiskWorkflowService {
  private static final Logger log = LoggerFactory.getLogger(RiskWorkflowService.class);
  private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Shanghai");
  private final ComplaintRiskProperties properties;
  private final YunkChatClient yunkClient;
  private final IdentityDirectory identityDirectory;
  private final RiskModelClient modelClient;
  private final ConfigurationService configurationService;
  private final RiskDecisionEngine decisionEngine;
  private final WorkflowRepository repository;

  public RiskWorkflowService(
      ComplaintRiskProperties properties,
      YunkChatClient yunkClient,
      IdentityDirectory identityDirectory,
      RiskModelClient modelClient,
      ConfigurationService configurationService,
      RiskDecisionEngine decisionEngine,
      WorkflowRepository repository
  ) {
    this.properties = properties;
    this.yunkClient = yunkClient;
    this.identityDirectory = identityDirectory;
    this.modelClient = modelClient;
    this.configurationService = configurationService;
    this.decisionEngine = decisionEngine;
    this.repository = repository;
  }

  public BatchResult run(String runType, Instant requestedFrom, Instant requestedTo, RequestUser operator) {
    ComplaintRiskConfig config = configurationService.published();
    Instant now = Instant.now();
    Instant end = requestedTo == null ? now.minusSeconds(properties.safetyDelayMinutes() * 60L) : requestedTo;
    var cursorState = repository.cursor("yunk_wechat", now.minusSeconds(3 * 24 * 3600L));
    Instant start = requestedFrom == null
        ? cursorState.watermark().minusSeconds(properties.overlapHours() * 3600L)
        : requestedFrom;
    Instant compensationFloor = end.minusSeconds(3 * 24 * 3600L);
    if (start.isBefore(compensationFloor)) start = compensationFloor;
    if (!start.isBefore(end)) throw new IllegalArgumentException("拉取开始时间必须早于结束时间");

    String batchId = repository.startBatch(runType == null ? "MANUAL" : runType, start, end, config.publishedVersion());
    int fetched = 0;
    int evidenceCount = 0;
    int eventCount = 0;
    String cursor = cursorState.cursor();
    String lastCursor = cursor;
    try {
      boolean hasMore;
      int pageGuard = 0;
      do {
        var page = yunkClient.fetchMessages(start, end, cursor, properties.pageSize());
        fetched += page.items().size();
        for (var message : page.items()) {
          var result = processMessage(message, config);
          if (result.evidenceChanged()) evidenceCount++;
          eventCount += result.eventsChanged();
        }
        lastCursor = page.nextCursor();
        cursor = page.nextCursor();
        hasMore = page.hasMore();
        if (++pageGuard > 10_000) throw new IllegalStateException("云客分页超过安全上限");
        if (hasMore && (cursor == null || cursor.isBlank())) {
          throw new IllegalStateException("云客返回 hasMore=true 但缺少 nextCursor");
        }
      } while (hasMore);
      if (properties.notificationEnabled()) dispatchNotifications();
      repository.saveCursor("yunk_wechat", lastCursor, end);
      repository.completeBatch(batchId, fetched, evidenceCount, eventCount);
      if (operator != null) {
        repository.audit("RISK_JOB_RUN", operator.id(), operator.name(), "batch_run", batchId,
            "云客微信拉取 " + fetched + " 条，生成/更新 " + eventCount + " 个风险事件");
      }
      return repository.batch(batchId).orElseThrow();
    } catch (Exception error) {
      repository.failBatch(batchId, error.getMessage());
      log.error("客诉预警批次 {} 执行失败", batchId, error);
      throw error instanceof RuntimeException runtime ? runtime : new IllegalStateException("客诉预警执行失败", error);
    }
  }

  public BatchResult getBatch(String id) {
    return repository.batch(id).orElseThrow(() -> new IllegalArgumentException("批次不存在：" + id));
  }

  private ProcessingResult processMessage(YunkMessage message, ComplaintRiskConfig config) {
    var student = identityDirectory.findStudentByCustomerWechatId(message.customerWechatId()).orElse(null);
    var employee = identityDirectory.findEmployeeByStaffWechatAccountId(message.staffWechatAccountId()).orElse(null);
    String dataStatus = dataStatus(message, student != null, employee != null);
    String evidenceId = UUID.nameUUIDFromBytes(
        (message.tenantId() + ":" + message.staffWechatAccountId() + ":" + message.sourceMessageId())
            .getBytes(StandardCharsets.UTF_8)
    ).toString();
    var evidence = new Evidence(
        evidenceId, message.tenantId(), message.sourceMessageId(), message.staffWechatAccountId(),
        message.customerWechatId(), message.conversationId(), message.senderType(), message.messageType(),
        message.contentText(), message.sentAt(), message.updatedAt(), message.recalled(), student, employee,
        dataStatus, "READY".equals(dataStatus) ? "PENDING" : "SKIPPED"
    );
    var upsert = repository.upsertEvidence(evidence);
    if (!"READY".equals(dataStatus)) {
      if (upsert.changed()) repository.recordIssue(upsert.evidence().id(), message.sourceMessageId(), dataStatus, issueDescription(dataStatus));
      return new ProcessingResult(upsert.changed(), 0);
    }
    if (!upsert.changed()) return new ProcessingResult(false, 0);

    Evidence stored = upsert.evidence();
    var context = repository.context(stored, 10);
    var modelResult = modelClient.analyze(config, stored, context);
    int events = 0;
    for (var match : modelResult.matches()) {
      Optional<ComplaintRiskConfig.Rule> matchedRule = config.rules().stream()
          .filter(rule -> rule.id().equals(match.ruleId()))
          .findFirst();
      if (matchedRule.isEmpty() || !match.matched() || match.confidence() < config.strategy().minimumConfidence()) continue;
      var rule = matchedRule.get();
      repository.insertSignal(stored, match, config.publishedVersion(), modelClient.modelVersion());
      int occurrences = repository.signalCount(
          stored.student().studentId(), rule.id(),
          stored.occurredAt().minusSeconds(rule.windowDays() * 24L * 3600L), config.publishedVersion()
      );
      var decision = decisionEngine.decide(config, rule, match, occurrences);
      if (!decision.shouldCreateEvent()) continue;
      LocalDate eventDate = stored.occurredAt().atZone(BUSINESS_ZONE).toLocalDate();
      var change = repository.upsertEvent(
          stored, rule.id(), rule.name(), rule.theme(), eventDate, decision.level(), decision.score(),
          match.confidence(), match.summary(), match.suggestion(), config.publishedVersion(), modelClient.modelVersion()
      );
      events++;
      if ("high".equals(change.currentLevel())) enqueueRecipients(config, change);
    }
    repository.markAnalyzed(stored.id());
    return new ProcessingResult(true, events);
  }

  private void enqueueRecipients(ComplaintRiskConfig config, WorkflowRepository.EventChange change) {
    for (String target : config.strategy().notificationTargets()) {
      if ("owner".equals(target) && change.ownerId() != null) {
        repository.enqueueNotification(change, change.ownerId(), change.ownerName(), config.strategy().dedupeHours());
      }
      if ("quality".equals(target)) {
        repository.enqueueNotification(change, "quality-team", "质检团队", config.strategy().dedupeHours());
      }
    }
  }

  private void dispatchNotifications() {
    for (var item : repository.pendingOutbox()) {
      try {
        repository.eventForNotification(item.eventId()).ifPresent(event -> repository.sendReminder(item, event));
      } catch (Exception error) {
        repository.failOutbox(item.id(), error.getMessage());
      }
    }
  }

  private static String dataStatus(YunkMessage message, boolean studentResolved, boolean employeeResolved) {
    if (!"single".equals(message.chatType())) return "UNSUPPORTED_CHAT_TYPE";
    if (!"text".equals(message.messageType())) return "UNSUPPORTED_MESSAGE_TYPE";
    if (message.recalled()) return "RECALLED";
    if (message.contentText() == null || message.contentText().isBlank()) return "EMPTY_CONTENT";
    if (!studentResolved) return "STUDENT_UNRESOLVED";
    if (!employeeResolved) return "EMPLOYEE_UNRESOLVED";
    return "READY";
  }

  private static String issueDescription(String status) {
    return switch (status) {
      case "UNSUPPORTED_CHAT_TYPE" -> "当前版本仅分析一对一云客微信会话";
      case "UNSUPPORTED_MESSAGE_TYPE" -> "当前版本仅分析文字消息";
      case "RECALLED" -> "消息已撤回，不作为当前风险证据";
      case "EMPTY_CONTENT" -> "消息没有可分析文本";
      case "STUDENT_UNRESOLVED" -> "客户微信未映射到学生";
      case "EMPLOYEE_UNRESOLVED" -> "员工微信账号未映射到员工";
      default -> status;
    };
  }

  private record ProcessingResult(boolean evidenceChanged, int eventsChanged) {}
}
