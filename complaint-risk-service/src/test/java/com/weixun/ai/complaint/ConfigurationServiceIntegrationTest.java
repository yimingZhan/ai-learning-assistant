package com.weixun.ai.complaint;

import static org.assertj.core.api.Assertions.assertThat;

import com.weixun.ai.complaint.domain.RiskApi.PublishRequest;
import com.weixun.ai.complaint.domain.RiskApi.TrialInput;
import com.weixun.ai.complaint.domain.RiskApi.TrialRequest;
import com.weixun.ai.complaint.service.ConfigurationService;
import com.weixun.ai.complaint.service.RequestUserResolver.RequestUser;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.annotation.DirtiesContext;

@SpringBootTest
@DirtiesContext
class ConfigurationServiceIntegrationTest {
  @Autowired ConfigurationService configurations;

  @Test
  void requiresCurrentConfigurationTrialAndPublishesVersion() {
    var operator = new RequestUser(
        "employee-a1024", "周欣",
        List.of("ai-config:complaint-risk:edit", "ai-config:complaint-risk:publish")
    );
    var config = configurations.get();

    var trial = configurations.trial(
        new TrialRequest(config, new TrialInput("text", "我要退款，否则就正式投诉你们。", null)),
        operator
    );
    assertThat(trial.riskLevel()).isEqualTo("high");
    assertThat(trial.crossChannelBonusApplied()).isFalse();

    var published = configurations.publish(new PublishRequest(config, "验证云客微信 V1 工作流"), operator);
    assertThat(published.publishedVersion()).isEqualTo("v1.1");
    assertThat(configurations.versions().getFirst().version()).isEqualTo("v1.1");
  }
}
