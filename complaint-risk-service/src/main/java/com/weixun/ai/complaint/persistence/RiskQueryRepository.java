package com.weixun.ai.complaint.persistence;

import com.weixun.ai.complaint.domain.RiskApi.OperationLog;
import com.weixun.ai.complaint.domain.RiskApi.ReminderStudent;
import com.weixun.ai.complaint.domain.RiskApi.WorkReminder;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class RiskQueryRepository {
  private final JdbcTemplate jdbc;

  public RiskQueryRepository(JdbcTemplate jdbc) {
    this.jdbc = jdbc;
  }

  public List<EventRow> allEvents() {
    return jdbc.query(
        "select * from complaint_risk_event order by latest_risk_at desc",
        this::mapEvent
    );
  }

  public List<EventRow> eventsForStudent(String studentId) {
    return jdbc.query(
        "select * from complaint_risk_event where student_id = ? order by event_date desc, latest_risk_at desc",
        this::mapEvent,
        studentId
    );
  }

  public List<Evidence> evidenceForEvent(String eventId) {
    return jdbc.query(
        "select evidence.* from communication_evidence evidence " +
            "join complaint_risk_event_evidence link on link.evidence_id = evidence.id " +
            "where link.event_id = ? order by evidence.occurred_at",
        this::mapEvidence,
        eventId
    );
  }

  public List<Evidence> context(String evidenceId, int limit) {
    var focus = jdbc.query(
        "select * from communication_evidence where id = ?",
        this::mapEvidence,
        evidenceId
    ).stream().findFirst();
    if (focus.isEmpty()) return List.of();
    var evidence = focus.get();
    return jdbc.query(
        "select * from communication_evidence where conversation_id = ? " +
            "and occurred_at between ? and ? order by occurred_at limit ?",
        this::mapEvidence,
        evidence.conversationId(), evidence.occurredAt().minusSeconds(24 * 3600L),
        evidence.occurredAt().plusSeconds(24 * 3600L), limit
    );
  }

  public List<OperationLog> operationLogs(String studentId) {
    return jdbc.query(
        "select revision.id, revision.revision_type, revision.description, revision.created_at " +
            "from complaint_risk_event_revision revision " +
            "join complaint_risk_event event on event.id = revision.event_id " +
            "where event.student_id = ? order by revision.created_at desc",
        (result, rowNum) -> new OperationLog(
            result.getString("id"), "系统识别", result.getString("revision_type"), "AI客诉预警服务",
            "success", result.getTimestamp("created_at").toInstant().toString(), result.getString("description")
        ),
        studentId
    );
  }

  public List<WorkReminder> reminders(String recipientId) {
    return jdbc.query(
        "select * from work_reminder where recipient_id = ? order by created_at desc limit 50",
        (result, rowNum) -> new WorkReminder(
            result.getString("id"), result.getString("reminder_type"), result.getString("priority"),
            result.getString("title"), result.getString("description"),
            result.getTimestamp("created_at").toInstant().toString(), result.getString("target_path"),
            result.getBoolean("is_read"),
            result.getString("student_id") == null ? null : new ReminderStudent(
                result.getString("student_id"), result.getString("student_name")
            )
        ),
        recipientId
    );
  }

  public void markReminderRead(String reminderId, String recipientId) {
    int changed = jdbc.update(
        "update work_reminder set is_read = true where id = ? and recipient_id = ?",
        reminderId, recipientId
    );
    if (changed == 0) throw new IllegalArgumentException("提醒不存在或无权访问");
  }

  private EventRow mapEvent(ResultSet result, int rowNum) throws SQLException {
    return new EventRow(
        result.getString("id"), result.getString("student_id"), result.getString("student_name"),
        result.getString("student_number"), result.getString("owner_id"), result.getString("owner_name"),
        result.getObject("event_date", LocalDate.class), result.getString("rule_id"), result.getString("rule_name"),
        result.getString("theme"), result.getString("risk_level"), result.getInt("risk_score"),
        result.getInt("confidence"), result.getString("ai_summary"), result.getString("ai_suggestion"),
        result.getTimestamp("earliest_risk_at").toInstant(), result.getTimestamp("latest_risk_at").toInstant(),
        result.getString("config_version"), result.getString("model_version")
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
        result.getTimestamp("source_updated_at").toInstant(), result.getBoolean("recalled"), student, employee,
        result.getString("data_status"), result.getString("analysis_status")
    );
  }

  public record EventRow(
      String id,
      String studentId,
      String studentName,
      String studentNumber,
      String ownerId,
      String ownerName,
      LocalDate eventDate,
      String ruleId,
      String ruleName,
      String theme,
      String riskLevel,
      int riskScore,
      int confidence,
      String summary,
      String suggestion,
      Instant earliestAt,
      Instant latestAt,
      String configVersion,
      String modelVersion
  ) {}
}
