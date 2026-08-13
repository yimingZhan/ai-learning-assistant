package com.weixun.ai.complaint;

import static org.assertj.core.api.Assertions.assertThat;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import com.weixun.ai.complaint.integration.MockRiskModelClient;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class MockRiskModelClientTest {
  private final MockRiskModelClient model = new MockRiskModelClient();

  @Test
  void distinguishesNegatedComplaintFromCurrentIntent() {
    assertThat(analyze("不是要投诉，老师已经解释清楚了。")).isEmpty();
    assertThat(analyze("如果今天还不解决，我就正式投诉你们。"))
        .extracting(match -> match.ruleId())
        .contains("rule-external-escalation");
  }

  private List<com.weixun.ai.complaint.domain.RiskApi.ModelMatch> analyze(String text) {
    Instant now = Instant.now();
    var evidence = new Evidence(
        "evidence", "tenant", "source", "staff", "customer", "conversation", "customer", "text",
        text, now, now, false, new StudentIdentity("student", "学生", "S1", "owner", "负责人"),
        new EmployeeIdentity("owner", "负责人", "学管"), "READY", "PENDING"
    );
    return model.analyze(ComplaintRiskConfig.initial(), evidence, List.of(evidence)).matches();
  }
}
