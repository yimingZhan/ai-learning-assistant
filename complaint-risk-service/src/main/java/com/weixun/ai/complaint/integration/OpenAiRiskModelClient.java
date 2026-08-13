package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.config.ComplaintRiskProperties;
import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.ModelResult;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import java.util.List;
import java.util.Map;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.ObjectMapper;

@Component
@ConditionalOnProperty(prefix = "complaint-risk.model", name = "mode", havingValue = "openai")
public class OpenAiRiskModelClient implements RiskModelClient {
  private final ComplaintRiskProperties properties;
  private final RestClient client;
  private final ObjectMapper objectMapper;

  public OpenAiRiskModelClient(
      ComplaintRiskProperties properties,
      RestClient.Builder builder,
      ObjectMapper objectMapper
  ) {
    this.properties = properties;
    this.objectMapper = objectMapper;
    if (!StringUtils.hasText(properties.model().baseUrl())) {
      throw new IllegalArgumentException("MODEL_BASE_URL 未配置");
    }
    this.client = builder
        .baseUrl(properties.model().baseUrl())
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.model().apiKey())
        .build();
  }

  @Override
  public ModelResult analyze(ComplaintRiskConfig config, Evidence focus, List<Evidence> context) {
    String payload = buildAnalysisInput(config, focus, context);
    Map<String, Object> request = Map.of(
        "model", properties.model().model(),
        "temperature", 0,
        "response_format", Map.of("type", "json_object"),
        "messages", List.of(
            Map.of("role", "system", "content", config.prompts().systemPrompt()),
            Map.of("role", "user", "content", payload)
        )
    );
    CompletionResponse response = client.post()
        .uri("/chat/completions")
        .body(request)
        .retrieve()
        .body(CompletionResponse.class);
    if (response == null || response.choices() == null || response.choices().isEmpty()) {
      throw new IllegalStateException("模型网关未返回分析结果");
    }
    try {
      String json = stripFence(response.choices().getFirst().message().content());
      return objectMapper.readValue(json, ModelResult.class);
    } catch (Exception error) {
      throw new IllegalStateException("模型结果不符合结构化合同", error);
    }
  }

  private String buildAnalysisInput(ComplaintRiskConfig config, Evidence focus, List<Evidence> context) {
    try {
      return config.prompts().analysisPrompt() + "\n" + config.prompts().suggestionPrompt() + "\n"
          + "请仅返回 JSON：{\"analysisStatus\":\"SUCCEEDED\",\"matches\":[{\"ruleId\":\"...\","
          + "\"matched\":true,\"confidence\":0,\"evidenceIds\":[\"...\"],\"rationale\":\"...\","
          + "\"summary\":\"...\",\"suggestion\":\"...\"}]}\n"
          + "可用规则：" + objectMapper.writeValueAsString(config.rules()) + "\n"
          + "当前证据ID：" + focus.id() + "\n"
          + "会话上下文：" + objectMapper.writeValueAsString(context);
    } catch (Exception error) {
      throw new IllegalStateException("模型请求组装失败", error);
    }
  }

  private static String stripFence(String value) {
    if (value == null) return "";
    return value.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "");
  }

  @Override
  public String modelVersion() {
    return properties.model().model();
  }

  public record CompletionResponse(List<Choice> choices) {}

  public record Choice(Message message) {}

  public record Message(String content) {}
}
