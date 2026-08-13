package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;

@Component
public class ConfigChecksum {
  private final ObjectMapper objectMapper;

  public ConfigChecksum(ObjectMapper objectMapper) {
    this.objectMapper = objectMapper;
  }

  public String calculate(ComplaintRiskConfig config) {
    try {
      var effective = Map.of(
          "sceneId", config.sceneId(),
          "sceneName", config.sceneName(),
          "prompts", config.prompts(),
          "rules", config.rules(),
          "strategy", config.strategy()
      );
      var digest = MessageDigest.getInstance("SHA-256");
      return HexFormat.of().formatHex(
          digest.digest(objectMapper.writeValueAsBytes(effective))
      );
    } catch (Exception error) {
      throw new IllegalStateException("无法计算配置摘要", error);
    }
  }
}
