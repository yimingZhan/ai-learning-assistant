package com.weixun.ai.complaint.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "complaint-risk")
public record ComplaintRiskProperties(
    boolean schedulerEnabled,
    boolean notificationEnabled,
    int overlapHours,
    int safetyDelayMinutes,
    int pageSize,
    Yunk yunk,
    Model model
) {
  public record Yunk(String mode, String baseUrl, String token, String messagesPath) {}

  public record Model(
      String mode,
      String baseUrl,
      String apiKey,
      String model,
      int timeoutSeconds
  ) {}
}
