package com.weixun.ai.complaint.service;

import net.javacrumbs.shedlock.spring.annotation.SchedulerLock;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(prefix = "complaint-risk", name = "scheduler-enabled", havingValue = "true")
public class RiskWorkflowScheduler {
  private final RiskWorkflowService workflowService;

  public RiskWorkflowScheduler(RiskWorkflowService workflowService) {
    this.workflowService = workflowService;
  }

  @Scheduled(cron = "0 */30 * * * *", zone = "Asia/Shanghai")
  @SchedulerLock(name = "complaint-risk-yunk-pull", lockAtMostFor = "PT25M", lockAtLeastFor = "PT1M")
  public void pullYunkWechat() {
    workflowService.run("SCHEDULED", null, null, null);
  }

  @Scheduled(cron = "0 20 3 * * *", zone = "Asia/Shanghai")
  @SchedulerLock(name = "complaint-risk-yunk-compensation", lockAtMostFor = "PT50M")
  public void compensateThreeDays() {
    var end = java.time.Instant.now().minusSeconds(120);
    workflowService.run("COMPENSATION", end.minusSeconds(3 * 24 * 3600L), end, null);
  }
}
