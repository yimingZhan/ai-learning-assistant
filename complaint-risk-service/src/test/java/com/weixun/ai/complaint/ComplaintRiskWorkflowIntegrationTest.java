package com.weixun.ai.complaint;

import static org.assertj.core.api.Assertions.assertThat;

import com.weixun.ai.complaint.service.ReminderService;
import com.weixun.ai.complaint.service.RequestUserResolver.RequestUser;
import com.weixun.ai.complaint.service.RiskQueryService;
import com.weixun.ai.complaint.service.RiskWorkflowService;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@DirtiesContext
class ComplaintRiskWorkflowIntegrationTest {
  @Autowired RiskWorkflowService workflow;
  @Autowired RiskQueryService queries;
  @Autowired ReminderService reminders;

  @Test
  void pullsYunkWechatAndCreatesEventsWithReminders() {
    var user = new RequestUser(
        "employee-a1024", "周欣",
        List.of("quality:complaint-risk:read", "quality:complaint-risk:run")
    );

    var batch = workflow.run("MANUAL", null, null, user);

    assertThat(batch.status()).isEqualTo("SUCCEEDED");
    assertThat(batch.fetchedCount()).isEqualTo(5);
    assertThat(batch.evidenceCount()).isEqualTo(5);
    assertThat(batch.eventCount()).isEqualTo(2);

    var page = queries.list(null, null, 1, 20);
    assertThat(page.total()).isEqualTo(1);
    assertThat(page.items().getFirst().studentName()).isEqualTo("林家宁");
    assertThat(page.items().getFirst().riskLevel()).isEqualTo("high");
    assertThat(page.items().getFirst().riskSources()).containsExactly("wechat");

    var detail = queries.detail("risk-student-001");
    assertThat(detail.eventGroups()).isNotEmpty();
    assertThat(detail.eventGroups().stream().flatMap(group -> group.events().stream()))
        .extracting(event -> event.theme())
        .contains("投诉升级", "退费倾向");
    assertThat(detail.eventGroups().stream()
        .flatMap(group -> group.events().stream())
        .flatMap(event -> event.evidence().stream())
        .allMatch(evidence -> "wechat".equals(evidence.type()))).isTrue();

    var workReminders = reminders.get("employee-a1024");
    assertThat(workReminders.unreadCount()).isEqualTo(1);
    assertThat(workReminders.items().getFirst().targetPath())
        .isEqualTo("/quality/conversation?studentId=risk-student-001");
  }
}
