package com.weixun.ai.complaint.persistence;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.Version;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;
import tools.jackson.databind.ObjectMapper;

@Repository
public class ConfigRepository {
  private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
  private final JdbcTemplate jdbc;
  private final ObjectMapper objectMapper;

  public ConfigRepository(JdbcTemplate jdbc, ObjectMapper objectMapper) {
    this.jdbc = jdbc;
    this.objectMapper = objectMapper;
  }

  public boolean isEmpty() {
    return jdbc.queryForObject("select count(*) from complaint_risk_config_version", Integer.class) == 0;
  }

  public void insertInitial(ComplaintRiskConfig config, String checksum) {
    insertVersion(config.publishedVersion(), "CURRENT", checksum, config, "初始发布云客微信客诉预警配置。", true,
        config.updatedBy(), Instant.now(), Instant.now());
  }

  public ComplaintRiskConfig currentEditorConfig() {
    return findByStatus("DRAFT").orElseGet(this::publishedConfig);
  }

  public ComplaintRiskConfig publishedConfig() {
    return findByStatus("CURRENT")
        .orElseThrow(() -> new IllegalStateException("尚未发布客诉预警配置"));
  }

  public Optional<ComplaintRiskConfig> findByVersion(String version) {
    var rows = jdbc.query(
        "select config_json from complaint_risk_config_version where version = ?",
        (result, rowNum) -> readConfig(result.getString("config_json")),
        version
    );
    return rows.stream().findFirst();
  }

  public void saveDraft(ComplaintRiskConfig config, String checksum, String operator) {
    jdbc.update("delete from complaint_risk_config_version where status = 'DRAFT'");
    insertVersion(config.draftVersion(), "DRAFT", checksum, config, "未发布草稿", false,
        operator, Instant.now(), null);
  }

  public boolean hasSuccessfulTrial(String checksum) {
    Integer count = jdbc.queryForObject(
        "select count(*) from complaint_risk_trial_run where config_checksum = ? and success = true",
        Integer.class,
        checksum
    );
    return count != null && count > 0;
  }

  public void saveTrial(
      String checksum,
      String inputJson,
      String resultJson,
      boolean success,
      String operator
  ) {
    jdbc.update(
        "insert into complaint_risk_trial_run " +
            "(id, config_checksum, input_json, result_json, success, created_by, created_at) values (?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), checksum, inputJson, resultJson, success, operator, Instant.now()
    );
    if (success) {
      jdbc.update(
          "update complaint_risk_config_version set trial_succeeded = true where checksum = ?",
          checksum
      );
    }
  }

  public void publish(ComplaintRiskConfig config, String checksum, String changeNote, String operator) {
    jdbc.update("update complaint_risk_config_version set status = 'HISTORY' where status = 'CURRENT'");
    jdbc.update("delete from complaint_risk_config_version where status = 'DRAFT'");
    insertVersion(config.publishedVersion(), "CURRENT", checksum, config, changeNote, true,
        operator, Instant.now(), Instant.now());
  }

  public List<Version> versions() {
    return jdbc.query(
        "select version, status, change_note, published_at, created_at, created_by " +
            "from complaint_risk_config_version where status <> 'DRAFT' order by coalesce(published_at, created_at) desc",
        this::mapVersion
    );
  }

  private Optional<ComplaintRiskConfig> findByStatus(String status) {
    var rows = jdbc.query(
        "select config_json from complaint_risk_config_version where status = ? order by created_at desc",
        (result, rowNum) -> readConfig(result.getString("config_json")),
        status
    );
    return rows.stream().findFirst();
  }

  private void insertVersion(
      String version,
      String status,
      String checksum,
      ComplaintRiskConfig config,
      String changeNote,
      boolean trialSucceeded,
      String operator,
      Instant createdAt,
      Instant publishedAt
  ) {
    jdbc.update(
        "insert into complaint_risk_config_version " +
            "(id, version, status, checksum, config_json, change_note, trial_succeeded, created_by, created_at, published_at) " +
            "values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        UUID.randomUUID().toString(), version, status, checksum, write(config), changeNote,
        trialSucceeded, operator, createdAt, publishedAt
    );
  }

  private Version mapVersion(ResultSet result, int rowNum) throws SQLException {
    Instant instant = result.getTimestamp("published_at") == null
        ? result.getTimestamp("created_at").toInstant()
        : result.getTimestamp("published_at").toInstant();
    return new Version(
        result.getString("version"),
        "CURRENT".equals(result.getString("status")) ? "current" : "history",
        result.getString("change_note"),
        instant.atZone(ZoneId.of("Asia/Shanghai")).format(DISPLAY_TIME),
        result.getString("created_by")
    );
  }

  private String write(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception error) {
      throw new IllegalStateException("配置序列化失败", error);
    }
  }

  private ComplaintRiskConfig readConfig(String json) {
    try {
      return objectMapper.readValue(json, ComplaintRiskConfig.class);
    } catch (Exception error) {
      throw new IllegalStateException("配置反序列化失败", error);
    }
  }
}
