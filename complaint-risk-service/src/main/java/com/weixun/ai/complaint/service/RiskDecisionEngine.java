package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.ModelMatch;
import org.springframework.stereotype.Component;

@Component
public class RiskDecisionEngine {
  public Decision decide(ComplaintRiskConfig config, ComplaintRiskConfig.Rule rule, ModelMatch match, int occurrenceCount) {
    if (!rule.enabled() || !match.matched() || match.confidence() < config.strategy().minimumConfidence()) {
      return Decision.ignored();
    }
    if (occurrenceCount < rule.minOccurrences()) return Decision.waiting();
    int score = Math.min(100, rule.score() + Math.max(0, occurrenceCount - rule.minOccurrences()) * 5);
    String level = rule.forceLevel();
    if (level == null || level.isBlank()) {
      var thresholds = config.strategy().thresholds();
      if (score >= thresholds.high()) level = "high";
      else if (score >= thresholds.medium()) level = "medium";
      else if (score >= thresholds.low()) level = "low";
      else level = "none";
    }
    return new Decision(true, false, level, score);
  }

  public record Decision(boolean shouldCreateEvent, boolean waitingForMoreOccurrences, String level, int score) {
    static Decision ignored() {
      return new Decision(false, false, "none", 0);
    }

    static Decision waiting() {
      return new Decision(false, true, "none", 0);
    }
  }
}
