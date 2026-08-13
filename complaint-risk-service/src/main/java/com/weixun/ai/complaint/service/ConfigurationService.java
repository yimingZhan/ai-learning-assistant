package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.PublishRequest;
import com.weixun.ai.complaint.domain.RiskApi.TrialInput;
import com.weixun.ai.complaint.domain.RiskApi.TrialMatch;
import com.weixun.ai.complaint.domain.RiskApi.TrialRequest;
import com.weixun.ai.complaint.domain.RiskApi.TrialResult;
import com.weixun.ai.complaint.domain.RiskApi.Version;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import com.weixun.ai.complaint.integration.RiskModelClient;
import com.weixun.ai.complaint.persistence.ConfigRepository;
import com.weixun.ai.complaint.persistence.WorkflowRepository;
import com.weixun.ai.complaint.service.RequestUserResolver.RequestUser;
import jakarta.annotation.PostConstruct;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import tools.jackson.databind.ObjectMapper;

@Service
public class ConfigurationService {
  private final ConfigRepository repository;
  private final ConfigChecksum checksum;
  private final RiskModelClient modelClient;
  private final WorkflowRepository workflowRepository;
  private final ObjectMapper objectMapper;

  public ConfigurationService(
      ConfigRepository repository,
      ConfigChecksum checksum,
      RiskModelClient modelClient,
      WorkflowRepository workflowRepository,
      ObjectMapper objectMapper
  ) {
    this.repository = repository;
    this.checksum = checksum;
    this.modelClient = modelClient;
    this.workflowRepository = workflowRepository;
    this.objectMapper = objectMapper;
  }

  @PostConstruct
  public void initialize() {
    if (repository.isEmpty()) {
      var initial = ComplaintRiskConfig.initial();
      repository.insertInitial(initial, checksum.calculate(initial));
    }
  }

  public ComplaintRiskConfig get() {
    return repository.currentEditorConfig();
  }

  public ComplaintRiskConfig published() {
    return repository.publishedConfig();
  }

  @Transactional
  public ComplaintRiskConfig saveDraft(ComplaintRiskConfig incoming, RequestUser operator) {
    validate(incoming);
    var current = repository.publishedConfig();
    String draftVersion = current.publishedVersion() + ".draft";
    var draft = incoming.withMetadata(current.publishedVersion(), draftVersion, "saved", operator.name());
    repository.saveDraft(draft, checksum.calculate(draft), operator.name());
    workflowRepository.audit("CONFIG_DRAFT_SAVED", operator.id(), operator.name(), "risk_config", draftVersion, "保存客诉预警草稿");
    return draft;
  }

  @Transactional
  public TrialResult trial(TrialRequest request, RequestUser operator) {
    validate(request.config());
    TrialInput input = request.input() == null
        ? new TrialInput("text", "我现在要求退费，否则就正式投诉你们。", "trial-student")
        : request.input();
    if (!StringUtils.hasText(input.text())) throw new IllegalArgumentException("试运行文本不能为空");
    Instant now = Instant.now();
    var evidence = new Evidence(
        "trial-evidence", "trial", "trial-message", "trial-staff", "trial-customer", "trial-conversation",
        "customer", "text", input.text(), now, now, false,
        new StudentIdentity(input.studentId() == null ? "trial-student" : input.studentId(), "试运行学生", "TRIAL-001", operator.id(), operator.name()),
        new EmployeeIdentity(operator.id(), operator.name(), "质检运营"), "READY", "PENDING"
    );
    var model = modelClient.analyze(request.config(), evidence, List.of(evidence));
    var matches = model.matches().stream()
        .filter(match -> match.matched() && match.confidence() >= request.config().strategy().minimumConfidence())
        .flatMap(match -> request.config().rules().stream().filter(rule -> rule.id().equals(match.ruleId())).limit(1)
            .map(rule -> new TrialMatch(rule.id(), rule.name(), rule.theme(), rule.score(), match.rationale())))
        .toList();
    int score = Math.min(100, matches.stream().mapToInt(TrialMatch::score).sum());
    String forced = model.matches().stream().flatMap(match -> request.config().rules().stream())
        .filter(rule -> rule.enabled() && "high".equals(rule.forceLevel()) && model.matches().stream().anyMatch(match -> match.ruleId().equals(rule.id())))
        .findFirst().map(ComplaintRiskConfig.Rule::forceLevel).orElse(null);
    String level = forced == null ? level(score, request.config()) : forced;
    int confidence = model.matches().stream().mapToInt(match -> match.confidence()).max().orElse(0);
    var result = new TrialResult(
        score, level, confidence, false, matches,
        model.matches().stream().findFirst().map(match -> match.summary()).orElse("未识别到客诉风险。"),
        model.matches().stream().findFirst().map(match -> match.suggestion()).orElse("无需生成风险跟进建议。")
    );
    String configChecksum = checksum.calculate(request.config());
    repository.saveTrial(configChecksum, write(input), write(result), true, operator.name());
    workflowRepository.audit("CONFIG_TRIAL_RUN", operator.id(), operator.name(), "risk_config", request.config().draftVersion(), "客诉预警试运行成功");
    return result;
  }

  @Transactional
  public ComplaintRiskConfig publish(PublishRequest request, RequestUser operator) {
    validate(request.config());
    String currentChecksum = checksum.calculate(request.config());
    if (!repository.hasSuccessfulTrial(currentChecksum)) {
      throw new IllegalStateException("发布前必须对当前配置成功试运行");
    }
    String version = nextVersion(repository.publishedConfig().publishedVersion());
    var published = request.config().withMetadata(version, version + ".draft", "published", operator.name());
    repository.publish(published, currentChecksum,
        StringUtils.hasText(request.changeNote()) ? request.changeNote() : "更新客诉预警配置", operator.name());
    workflowRepository.audit("CONFIG_PUBLISHED", operator.id(), operator.name(), "risk_config", version, "发布客诉预警配置");
    return published;
  }

  public List<Version> versions() {
    return repository.versions();
  }

  @Transactional
  public ComplaintRiskConfig rollback(String version, RequestUser operator) {
    var target = repository.findByVersion(version).orElseThrow(() -> new IllegalArgumentException("配置版本不存在：" + version));
    String nextVersion = nextVersion(repository.publishedConfig().publishedVersion());
    var published = target.withMetadata(nextVersion, nextVersion + ".draft", "published", operator.name());
    repository.publish(published, checksum.calculate(published), "回滚至 " + version, operator.name());
    workflowRepository.audit("CONFIG_ROLLED_BACK", operator.id(), operator.name(), "risk_config", nextVersion, "回滚至 " + version);
    return published;
  }

  private void validate(ComplaintRiskConfig config) {
    if (config == null) throw new IllegalArgumentException("配置不能为空");
    if (config.rules() == null || config.rules().stream().noneMatch(ComplaintRiskConfig.Rule::enabled)) {
      throw new IllegalArgumentException("至少需启用一条风险规则");
    }
    if (config.strategy() == null || !"30m".equals(config.strategy().runFrequency())) {
      throw new IllegalArgumentException("当前版本仅支持每30分钟运行");
    }
    if (!List.of("wechat").equals(config.strategy().dataSources())
        || config.rules().stream().flatMap(rule -> rule.dataSources().stream()).anyMatch(source -> !"wechat".equals(source))) {
      throw new IllegalArgumentException("当前版本仅支持云客微信文字数据");
    }
    if (config.strategy().crossChannelBonus() != 0) {
      throw new IllegalArgumentException("当前版本不支持跨渠道加分");
    }
    if (config.strategy().highRiskRequiresReview()) {
      throw new IllegalArgumentException("当前版本生成内部预警提醒，不启用人工审核流程");
    }
    var thresholds = config.strategy().thresholds();
    if (!(thresholds.high() > thresholds.medium() && thresholds.medium() > thresholds.low())) {
      throw new IllegalArgumentException("风险阈值必须满足高 > 中 > 低");
    }
  }

  private static String level(int score, ComplaintRiskConfig config) {
    var thresholds = config.strategy().thresholds();
    if (score >= thresholds.high()) return "high";
    if (score >= thresholds.medium()) return "medium";
    if (score >= thresholds.low()) return "low";
    return "none";
  }

  private static String nextVersion(String current) {
    try {
      String number = current.toLowerCase().replace("v", "");
      String[] parts = number.split("\\.");
      return "v" + parts[0] + "." + (Integer.parseInt(parts[1]) + 1);
    } catch (Exception ignored) {
      return "v" + Instant.now().toEpochMilli();
    }
  }

  private String write(Object value) {
    try {
      return objectMapper.writeValueAsString(value);
    } catch (Exception error) {
      throw new IllegalStateException("试运行记录序列化失败", error);
    }
  }
}
