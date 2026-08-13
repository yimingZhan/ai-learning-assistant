package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.ModelMatch;
import com.weixun.ai.complaint.domain.RiskApi.ModelResult;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "complaint-risk.model", name = "mode", havingValue = "mock", matchIfMissing = true)
public class MockRiskModelClient implements RiskModelClient {
  private static final List<String> NEGATION_PREFIXES = List.of("不是要", "没有要", "不会", "不打算", "别误会");

  @Override
  public ModelResult analyze(ComplaintRiskConfig config, Evidence focus, List<Evidence> context) {
    if (!"customer".equals(focus.senderType()) || focus.recalled() || !"text".equals(focus.messageType())) {
      return new ModelResult("SUCCEEDED", List.of());
    }
    String text = focus.contentText() == null ? "" : focus.contentText().toLowerCase(Locale.ROOT);
    List<ModelMatch> matches = new ArrayList<>();
    for (var rule : config.rules()) {
      if (!rule.enabled()) continue;
      var hits = rule.keywords().stream().filter(text::contains).toList();
      if (hits.isEmpty() || isNegated(text, hits)) continue;
      int confidence = Math.min(97, 72 + hits.size() * 7);
      String evidenceText = String.join("、", hits);
      matches.add(new ModelMatch(
          rule.id(), true, confidence, List.of(focus.id()),
          "客户当前表达命中“" + evidenceText + "”，且未处于否定或引用语境。",
          focus.student().studentName() + "在云客微信中表达了" + rule.theme() + "风险。",
          "请" + focus.student().ownerName() + "优先核对原始会话，在4小时内联系客户并记录处理结果。"
      ));
    }
    return new ModelResult("SUCCEEDED", matches);
  }

  private boolean isNegated(String text, List<String> hits) {
    for (String hit : hits) {
      int index = text.indexOf(hit);
      String prefix = text.substring(Math.max(0, index - 6), index);
      if (NEGATION_PREFIXES.stream().anyMatch(prefix::contains)) return true;
    }
    return false;
  }

  @Override
  public String modelVersion() {
    return "mock-semantic-v1";
  }
}
