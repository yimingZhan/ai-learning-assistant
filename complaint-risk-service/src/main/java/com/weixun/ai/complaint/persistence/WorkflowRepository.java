package com.weixun.ai.complaint.persistence;

import com.weixun.ai.complaint.domain.RiskApi.BatchResult;
import com.weixun.ai.complaint.domain.RiskApi.ModelMatch;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class WorkflowRepository {
  private final JdbcTemplate jdbc;

  public WorkflowRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public record CursorState(String cursor, Instant watermark) {}

  public record EvidenceUpsert(Evidence evidence, boolean changed) {}

  public record EventChange(
      String eventId,
      boolean created,
      String previousLevel,
      String currentLevel,
      String studentId,
      String studentName,
      String ownerId,
      String ownerName,
      String ruleId,
      String summary
  ) {}

  public record OutboxItem(
      String id,
      String eventId,
      String recipientId,
      String recipientName,
      String dedupeKey
  ) {}

  public CursorState cursor(String source, Instant fallbackWatermark) {
    var rows = jdbc.query(
        "select cursor_value, watermark from complaint_risk_ingest_cursor where source = ?",
        (result, rowNum) -> new CursorState(
            result.getString("cursor_value"),
            result.getTimestamp("watermark") == null
                ? fallbackWatermark
                : result.getTimestamp("watermark").toInstant()
        ),
        source
    );
    return rows.stream().findFirst().orElse(new CursorState(null, fallbackWatermark));
  }

  public void saveCursor(String source, String cursor, Instant watermark) {
    int updated = jdbc.update(
        "update complaint_risk_ingest_cursor set cursor_value = ?, watermark = ?, updated_at = ? where source = ?",
        cursor, watermark, Instant.now(), source
    );
    if (updated == 0) {
      jdbc.update(
          "insert into complaint_risk_ingest_cursor (source, cursor_value, watermark, updated_at) values (?, ?, ?, ?)",
          source, cursor, watermark, Instant.now()
      );
    }
  }

  public String startBatch(String runType, Instant start, Instant end, String configVersion) {
    String id = UUID.randomUUID().toString();
    jdbc.update(
        "insert into complaint_risk_batch_run " +
            "(id, run_type, status, window_start, window_end, config_version, started_at) values (?, ?, 'RUNNING', ?, ?, ?, ?)",
        id, runType, start, end, configVersion, Instant.now()
    );
    return id;
  }

  public void completeBatch(String id, int fetched, int evidence, int events) {
    jdbc.update(
        "update complaint_risk_batch_run set status = 'SUCCEEDED', fetched_count = ?, evidence_count = ?, " +
            "event_count = ?, completed_at = ? where id = ?",
        fetched, evidence, events, Instant.now(), id
    );
  }

  public void failBatch(String id, String errorMessage) {
    jdbc.update(
        "update complaint_risk_batch_run set status = 'FAILED', error_message = ?, completed_at = ? where id = ?",
        abbreviate(errorMessage, 1000), Instant.now(), id
    );
  }

  public Optional<BatchResult> batch(String id) {
    return jdbc.query(
        "select * from complaint_risk_batch_run where id = ?",
        this::mapBatch,
        id
    ).stream().findFirst();
  }

  public EvidenceUpsert upsertEvidence(Evidence incoming) {
    var existing = jdbc.query(
        "select * from communication_evidence where tenant_id = ? and staff_wechat_account_id = ? and source_message_id = ?",
        this::mapEvidence,
        incoming.tenantId(), incoming.staffWechatAccountId(), incoming.sourceMessageId()
    ).stream().findFirst();

    if (existing.isPresent()) {
      var current = existing.get();
      boolean changed = !current.sourceUpdatedAt().equals(incoming.sourceUpdatedAt())
          || current.recalled() != incoming.recalled()
          || !java.util.Objects.equals(current.contentText(), incoming.contentText());
      if (changed) {
        jdbc.update(
            "update communication_evidence set content_text = ?, source_updated_at = ?, recalled = ?, " +
                "student_id = ?, student_name = ?, student_number = ?, owner_id = ?, owner_name = ?, " +
                "employee_id = ?, employee_name = ?, employee_role = ?, data_status = ?, analysis_status = ?, last_synced_at = ? " +
                "where id = ?",
            incoming.contentText(), incoming.sourceUpdatedAt(), incoming.recalled(),
            studentValue(incoming, StudentIdentity::studentId),
            studentValue(incoming, StudentIdentity::studentName),
            studentValue(incoming, StudentIdentity::studentNumber),
            studentValue(incoming, StudentIdentity::ownerId),
            studentValue(incoming, StudentIdentity::ownerName),
            employeeValue(incoming, EmployeeIdentity::employeeId),
            employeeValue(incoming, EmployeeIdentity::employeeName),
            employeeValue(incoming, EmployeeIdentity::employeeRole),
            incoming.dataStatus(),
            "READY".equals(incoming.dataStatus()) ? "PENDING" : "SKIPPED",
            Instant.now(), current.id()
        );
        return new EvidenceUpsert(findEvidence(current.id()).orElseThrow(), true);
      }
      jdbc.update("update communication_evidence set last_synced_at = ? where id = ?", Instant.now(), current.id());
      return new EvidenceUpsert(current, false);
    }

    String id = incoming.id() == null ? UUID.randomUUID().toString() : incoming.id();
    jdbc.update(
        "insert into communication_evidence " +
            "(id, tenant_id, source, source_message_id, staff_wechat_account_id, customer_wechat_id, conversation_id, " +
            "chat_type, sender_type, message_type, content_text, occurred_at, source_updated_at, recalled, " +
            "student_id, student_name, student_number, owner_id, owner_name, employee_id, employee_name, employee_role, " +
            "data_status, analysis_status, first_synced_at, last_synced_at) " +
            "values (?, ?, 'yunk_wechat', ?, ?, ?, ?, 'single', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        id, incoming.tenantId(), incoming.sourceMessageId(), incoming.staffWechatAccountId(),
        incoming.customerWechatId(), incoming.conversationId(), incoming.senderType(), incoming.messageType(),
        incoming.contentText(), incoming.occurredAt(), incoming.sourceUpdatedAt(), incoming.recalled(),
        studentValue(incoming, StudentIdentity::studentId),
        studentValue(incoming, StudentIdentity::studentName),
        studentValue(incoming, StudentIdentity::studentNumber),
        studentValue(incoming, StudentIdentity::ownerId),
        studentValue(incoming, StudentIdentity::ownerName),
        employeeValue(incoming, EmployeeIdentity::employeeId),
        employeeValue(incoming, EmployeeIdentity::employeeName),
        employeeValue(incoming, EmployeeIdentity::employeeRole),
        incoming.dataStatus(), "READY".equals(incoming.dataStatus()) ? "PENDING" : "SKIPPED",
        Instant.now(), Instant.now()
    );
    return new EvidenceUpsert(findEvidence(id).orElseThrow(), true);
  }

  public Optional<Evidence> findEvidence(String id) {
    return jdbc.query("select * from communication_evidence where id = ?", this::mapEvidence, id)
        .stream().findFirst();
  }

  public List<Evidence> context(Evidence evidence, int beforeAndAfter) {
    var all = jdbc.query(
        "select * from communication_evidence where conversation_id = ? and occurred_at between ? and ? " +
            "and data_status = 'READY' order by occurred_at",
        this::mapEvidence,
        evidence.conversationId(), evidence.occurredAt().minusSeconds(48 * 3600L),
        evidence.occurredAt().plusSeconds(48 * 3600L)
    );
    if (all.size() <= beforeAndAfter * 2 + 1) return all;
    int index = 0;
    for (int i = 0; i < all.size(); i++) {
      if (all.get(i).id().equals(evidence.id())) index = i;
    }
    int start = Math.max(0, index - beforeAndAfter);
    int end = Math.min(all.size(), index + beforeAndAfter + 1);
    return all.subList(start, end);
  }

  public void markAnalyzed(String evidenceId) {
    jdbc.update("update communication_evidence set analysis_status = 'ANALYZED' where id = ?", evidenceId);
  }

  public void recordIssue(String evidenceId, String sourceMessageId, String type, String description) {
    jdbc.update(
        "insert into communication_data_issue (id, evidence_id, source_message_id, issue_type, description, created_at) " +
            "values (?, ?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), evidenceId, sourceMessageId, type, abbreviate(description, 1000), Instant.now()
    );
  }

  public boolean insertSignal(
      Evidence evidence,
      ModelMatch match,
      String configVersion,
      String modelVersion
  ) {
    try {
      jdbc.update(
          "insert into complaint_risk_signal " +
              "(id, student_id, evidence_id, rule_id, confidence, rationale, summary, suggestion, config_version, model_version, occurred_at, created_at) " +
              "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          UUID.randomUUID().toString(), evidence.student().studentId(), evidence.id(), match.ruleId(),
          match.confidence(), abbreviate(match.rationale(), 2000), abbreviate(match.summary(), 1000),
          abbreviate(match.suggestion(), 2000), configVersion, modelVersion, evidence.occurredAt(), Instant.now()
      );
      return true;
    } catch (DuplicateKeyException ignored) {
      return false;
    }
  }

  public int signalCount(String studentId, String ruleId, Instant windowStart, String configVersion) {
    Integer count = jdbc.queryForObject(
        "select count(distinct evidence_id) from complaint_risk_signal " +
            "where student_id = ? and rule_id = ? and occurred_at >= ? and config_version = ?",
        Integer.class, studentId, ruleId, windowStart, configVersion
    );
    return count == null ? 0 : count;
  }

  public EventChange upsertEvent(
      Evidence evidence,
      String ruleId,
      String ruleName,
      String theme,
      LocalDate eventDate,
      String riskLevel,
      int riskScore,
      int confidence,
      String summary,
      String suggestion,
      String configVersion,
      String modelVersion
  ) {
    var existing = jdbc.query(
        "select * from complaint_risk_event where student_id = ? and event_date = ? and rule_id = ?",
        (result, rowNum) -> new ExistingEvent(
            result.getString("id"), result.getString("risk_level"), result.getTimestamp("earliest_risk_at").toInstant()
        ),
        evidence.student().studentId(), eventDate, ruleId
    ).stream().findFirst();

    String eventId;
    boolean created = existing.isEmpty();
    String previousLevel = existing.map(ExistingEvent::level).orElse(null);
    if (created) {
      eventId = UUID.randomUUID().toString();
      jdbc.update(
          "insert into complaint_risk_event " +
              "(id, student_id, student_name, student_number, owner_id, owner_name, event_date, rule_id, rule_name, theme, " +
              "risk_level, risk_score, confidence, ai_summary, ai_suggestion, risk_sources, earliest_risk_at, latest_risk_at, " +
              "config_version, model_version, created_at, updated_at) " +
              "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'wechat', ?, ?, ?, ?, ?, ?)",
          eventId, evidence.student().studentId(), evidence.student().studentName(), evidence.student().studentNumber(),
          evidence.student().ownerId(), evidence.student().ownerName(), eventDate, ruleId, ruleName, theme,
          riskLevel, riskScore, confidence, abbreviate(summary, 2000), abbreviate(suggestion, 3000),
          evidence.occurredAt(), evidence.occurredAt(), configVersion, modelVersion, Instant.now(), Instant.now()
      );
    } else {
      eventId = existing.get().id();
      jdbc.update(
          "update complaint_risk_event set risk_level = ?, risk_score = ?, confidence = ?, ai_summary = ?, ai_suggestion = ?, " +
              "latest_risk_at = ?, config_version = ?, model_version = ?, updated_at = ? where id = ?",
          riskLevel, riskScore, confidence, abbreviate(summary, 2000), abbreviate(suggestion, 3000),
          evidence.occurredAt(), configVersion, modelVersion, Instant.now(), eventId
      );
    }
    try {
      jdbc.update(
          "insert into complaint_risk_event_evidence (event_id, evidence_id, created_at) values (?, ?, ?)",
          eventId, evidence.id(), Instant.now()
      );
    } catch (DuplicateKeyException ignored) {
      // A repeated overlap pull must not duplicate evidence.
    }
    jdbc.update(
        "insert into complaint_risk_event_revision " +
            "(id, event_id, revision_type, previous_level, current_level, description, created_at) values (?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), eventId, created ? "CREATED" : "EVIDENCE_ADDED",
        previousLevel, riskLevel, created ? "首次生成云客微信风险事件" : "追加云客微信证据并重算", Instant.now()
    );
    return new EventChange(
        eventId, created, previousLevel, riskLevel, evidence.student().studentId(),
        evidence.student().studentName(), evidence.student().ownerId(), evidence.student().ownerName(),
        ruleId, summary
    );
  }

  public void enqueueNotification(EventChange change, String recipientId, String recipientName, int dedupeHours) {
    String dedupeKey = change.studentId() + ":" + change.ruleId() + ":" + recipientId;
    Integer recent = jdbc.queryForObject(
        "select count(*) from notification_outbox where dedupe_key = ? and created_at >= ?",
        Integer.class, dedupeKey, Instant.now().minusSeconds(dedupeHours * 3600L)
    );
    boolean upgraded = change.previousLevel() != null && !"high".equals(change.previousLevel());
    if (recent != null && recent > 0 && !upgraded) return;
    jdbc.update(
        "insert into notification_outbox " +
            "(id, event_id, recipient_id, recipient_name, dedupe_key, status, attempts, available_at, created_at) " +
            "values (?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)",
        UUID.randomUUID().toString(), change.eventId(), recipientId, recipientName, dedupeKey, Instant.now(), Instant.now()
    );
  }

  public List<OutboxItem> pendingOutbox() {
    return jdbc.query(
        "select id, event_id, recipient_id, recipient_name, dedupe_key from notification_outbox " +
            "where status = 'PENDING' and available_at <= ? order by created_at",
        (result, rowNum) -> new OutboxItem(
            result.getString("id"), result.getString("event_id"), result.getString("recipient_id"),
            result.getString("recipient_name"), result.getString("dedupe_key")
        ),
        Instant.now()
    );
  }

  public Optional<EventNotificationView> eventForNotification(String eventId) {
    return jdbc.query(
        "select id, student_id, student_name, rule_name, ai_summary from complaint_risk_event where id = ?",
        (result, rowNum) -> new EventNotificationView(
            result.getString("id"), result.getString("student_id"), result.getString("student_name"),
            result.getString("rule_name"), result.getString("ai_summary")
        ),
        eventId
    ).stream().findFirst();
  }

  public record EventNotificationView(
      String id,
      String studentId,
      String studentName,
      String ruleName,
      String summary
  ) {}

  public void sendReminder(OutboxItem item, EventNotificationView event) {
    jdbc.update(
        "insert into work_reminder " +
            "(id, recipient_id, reminder_type, priority, title, description, target_path, student_id, student_name, is_read, dedupe_key, created_at) " +
            "values (?, ?, 'complaintRisk', 'high', ?, ?, ?, ?, ?, false, ?, ?)",
        UUID.randomUUID().toString(), item.recipientId(), event.studentName() + "客诉风险升至高风险",
        abbreviate(event.ruleName() + "：" + event.summary(), 1000),
        "/quality/conversation?studentId=" + event.studentId(), event.studentId(), event.studentName(),
        item.dedupeKey(), Instant.now()
    );
    jdbc.update(
        "update notification_outbox set status = 'SENT', attempts = attempts + 1, sent_at = ? where id = ?",
        Instant.now(), item.id()
    );
  }

  public void failOutbox(String id, String error) {
    jdbc.update(
        "update notification_outbox set attempts = attempts + 1, last_error = ?, available_at = ? where id = ?",
        abbreviate(error, 1000), Instant.now().plusSeconds(60), id
    );
  }

  public void audit(
      String action,
      String operatorId,
      String operatorName,
      String resourceType,
      String resourceId,
      String summary
  ) {
    jdbc.update(
        "insert into complaint_risk_audit_log " +
            "(id, action, operator_id, operator_name, resource_type, resource_id, request_id, summary, created_at) " +
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), action, operatorId, operatorName, resourceType, resourceId,
        UUID.randomUUID().toString(), abbreviate(summary, 1000), Instant.now()
    );
  }

  private BatchResult mapBatch(ResultSet result, int rowNum) throws SQLException {
    return new BatchResult(
        result.getString("id"), result.getString("status"), result.getInt("fetched_count"),
        result.getInt("evidence_count"), result.getInt("event_count"),
        result.getTimestamp("started_at").toInstant(),
        result.getTimestamp("completed_at") == null ? null : result.getTimestamp("completed_at").toInstant(),
        result.getString("error_message")
    );
  }

  private Evidence mapEvidence(ResultSet result, int rowNum) throws SQLException {
    StudentIdentity student = result.getString("student_id") == null ? null : new StudentIdentity(
        result.getString("student_id"), result.getString("student_name"), result.getString("student_number"),
        result.getString("owner_id"), result.getString("owner_name")
    );
    EmployeeIdentity employee = result.getString("employee_id") == null ? null : new EmployeeIdentity(
        result.getString("employee_id"), result.getString("employee_name"), result.getString("employee_role")
    );
    return new Evidence(
        result.getString("id"), result.getString("tenant_id"), result.getString("source_message_id"),
        result.getString("staff_wechat_account_id"), result.getString("customer_wechat_id"),
        result.getString("conversation_id"), result.getString("sender_type"), result.getString("message_type"),
        result.getString("content_text"), result.getTimestamp("occurred_at").toInstant(),
        result.getTimestamp("source_updated_at").toInstant(), result.getBoolean("recalled"),
        student, employee, result.getString("data_status"), result.getString("analysis_status")
    );
  }

  private static <T> String studentValue(Evidence evidence, java.util.function.Function<StudentIdentity, String> getter) {
    return evidence.student() == null ? null : getter.apply(evidence.student());
  }

  private static String employeeValue(Evidence evidence, java.util.function.Function<EmployeeIdentity, String> getter) {
    return evidence.employee() == null ? null : getter.apply(evidence.employee());
  }

  private static String abbreviate(String value, int max) {
    if (value == null) return "";
    return value.length() <= max ? value : value.substring(0, max);
  }

  private record ExistingEvent(String id, String level, Instant earliest) {}
}
