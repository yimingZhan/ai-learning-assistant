package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.YunkModels.YunkMessagePage;
import java.time.Instant;

public interface YunkChatClient {
  YunkMessagePage fetchMessages(Instant from, Instant to, String cursor, int pageSize);
}
