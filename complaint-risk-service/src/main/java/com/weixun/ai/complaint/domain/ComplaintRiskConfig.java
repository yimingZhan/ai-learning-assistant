package com.weixun.ai.complaint.domain;

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

public record ComplaintRiskConfig(
    String sceneId,
    String sceneName,
    String publishedVersion,
    String draftVersion,
    String draftStatus,
    String updatedAt,
    String updatedBy,
    PromptConfig prompts,
    List<Rule> rules,
    Strategy strategy
) {
  private static final DateTimeFormatter DISPLAY_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

  public record PromptVariable(String key, String label) {}

  public record PromptConfig(
      String systemPrompt,
      String analysisPrompt,
      String suggestionPrompt,
      List<PromptVariable> variables
  ) {}

  public record Rule(
      String id,
      String name,
      String theme,
      String description,
      List<String> dataSources,
      List<String> keywords,
      int windowDays,
      int minOccurrences,
      int score,
      int priority,
      String forceLevel,
      boolean enabled
  ) {}

  public record Thresholds(int high, int medium, int low) {}

  public record Strategy(
      Thresholds thresholds,
      int analysisWindowDays,
      int dedupeHours,
      int minimumConfidence,
      int crossChannelBonus,
      List<String> dataSources,
      boolean highRiskRequiresReview,
      List<String> notificationTargets,
      String runFrequency
  ) {}

  public ComplaintRiskConfig withMetadata(
      String nextPublishedVersion,
      String nextDraftVersion,
      String status,
      String operator
  ) {
    return new ComplaintRiskConfig(
        sceneId,
        sceneName,
        nextPublishedVersion,
        nextDraftVersion,
        status,
        ZonedDateTime.now(ZoneId.of("Asia/Shanghai")).format(DISPLAY_TIME),
        operator,
        prompts,
        rules,
        strategy
    );
  }

  public static ComplaintRiskConfig initial() {
    var variables = List.of(
        new PromptVariable("student_profile", "学生画像"),
        new PromptVariable("assessment_period", "分析周期"),
        new PromptVariable("wechat_messages", "微信聊天（云客）")
    );
    var rules = List.of(
        new Rule(
            "rule-external-escalation",
            "正式投诉或外部升级",
            "投诉升级",
            "识别明确投诉、监管举报、律师介入或公开曝光表达。",
            List.of("wechat"),
            List.of("正式投诉", "投诉你们", "消费者协会", "监管部门", "律师", "曝光"),
            30, 1, 70, 100, "high", true
        ),
        new Rule(
            "rule-refund-intent",
            "明确退费倾向",
            "退费倾向",
            "识别客户明确表达退费、退款或终止服务的当前意向。",
            List.of("wechat"),
            List.of("退费", "退款", "不再继续", "停止服务"),
            30, 1, 50, 90, null, true
        ),
        new Rule(
            "rule-learning-effect",
            "连续质疑学习效果",
            "学习效果质疑",
            "识别近期重复出现的课程效果、成绩或学习进度质疑。",
            List.of("wechat"),
            List.of("没有效果", "没看到效果", "成绩下降", "没有改善", "进度落后"),
            14, 2, 20, 70, null, true
        ),
        new Rule(
            "rule-service-response",
            "服务响应不满",
            "服务响应不满",
            "识别需要反复催促、长时间未回复或问题无人处理。",
            List.of("wechat"),
            List.of("回复太慢", "一直不回复", "反复催", "没人处理", "没有回应"),
            7, 2, 20, 60, null, true
        ),
        new Rule(
            "rule-scheduling",
            "排课问题持续未解决",
            "排课服务不满",
            "识别排课或调课问题在多次沟通后仍未闭环。",
            List.of("wechat"),
            List.of("排课冲突", "调课", "时间不合适", "排课没有解决"),
            14, 2, 40, 50, null, true
        ),
        new Rule(
            "rule-feedback-delay",
            "反馈时效不满",
            "反馈时效不满",
            "识别对课后反馈、学情同步或处理进度时效的明确不满。",
            List.of("wechat"),
            List.of("反馈不及时", "反馈太慢", "没有反馈", "课后反馈"),
            7, 1, 20, 40, null, true
        )
    );
    return new ComplaintRiskConfig(
        "complaintRisk",
        "AI 客诉预警",
        "v1.0",
        "v1.1-draft",
        "published",
        "2026-08-12 09:30",
        "系统初始化",
        new PromptConfig(
            "你是唯寻 AI 客诉风险分析助手。你只能依据系统提供的云客微信文字证据进行判断，必须区分否定、假设、引用、员工转述、历史表达和客户当前真实诉求。禁止虚构事实，禁止代替质检作正式客诉定性。",
            "请结合 {{student_profile}} 和 {{assessment_period}} 内的 {{wechat_messages}}，识别风险主题、关键证据、发生时间和证据来源。每个结论必须引用真实 evidenceId；没有证据时明确说明数据不足。",
            "基于已确认的风险证据生成内部跟进建议，列出负责人、建议完成时间、具体动作和验证标准。不得生成未经确认的对外承诺，并标注‘AI 结果仅供内部核验’。",
            variables
        ),
        rules,
        new Strategy(
            new Thresholds(70, 40, 20),
            30,
            24,
            65,
            0,
            List.of("wechat"),
            false,
            List.of("owner", "quality"),
            "30m"
        )
    );
  }
}
