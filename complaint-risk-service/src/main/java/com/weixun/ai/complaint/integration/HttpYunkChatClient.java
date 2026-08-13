package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.config.ComplaintRiskProperties;
import com.weixun.ai.complaint.domain.YunkModels.YunkMessage;
import com.weixun.ai.complaint.domain.YunkModels.YunkMessagePage;
import java.time.Instant;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestClient;

@Component
@ConditionalOnProperty(prefix = "complaint-risk.yunk", name = "mode", havingValue = "http")
public class HttpYunkChatClient implements YunkChatClient {
  private final ComplaintRiskProperties properties;
  private final RestClient client;

  public HttpYunkChatClient(ComplaintRiskProperties properties, RestClient.Builder builder) {
    this.properties = properties;
    if (!StringUtils.hasText(properties.yunk().baseUrl())) {
      throw new IllegalArgumentException("YUNK_BASE_URL 未配置");
    }
    this.client = builder
        .baseUrl(properties.yunk().baseUrl())
        .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + properties.yunk().token())
        .build();
  }

  @Override
  public YunkMessagePage fetchMessages(Instant from, Instant to, String cursor, int pageSize) {
    var response = client.get()
        .uri(builder -> {
          var uri = builder.path(properties.yunk().messagesPath())
              .queryParam("startTime", from.toString())
              .queryParam("endTime", to.toString())
              .queryParam("pageSize", pageSize);
          if (StringUtils.hasText(cursor)) uri.queryParam("cursor", cursor);
          return uri.build();
        })
        .retrieve()
        .body(NormalizedYunkResponse.class);
    if (response == null) return new YunkMessagePage(List.of(), null, false);
    return new YunkMessagePage(response.items() == null ? List.of() : response.items(), response.nextCursor(), response.hasMore());
  }

  /**
   * 这是平台内部的云客归一化合同。拿到云客实际文档后，只需在本类中转换原始字段，后续工作流无需调整。
   */
  public record NormalizedYunkResponse(List<YunkMessage> items, String nextCursor, boolean hasMore) {}
}
