package com.weixun.ai.complaint;

import com.weixun.ai.complaint.config.ComplaintRiskProperties;
import net.javacrumbs.shedlock.spring.annotation.EnableSchedulerLock;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableSchedulerLock(defaultLockAtMostFor = "20m")
@EnableConfigurationProperties(ComplaintRiskProperties.class)
public class ComplaintRiskApplication {
  public static void main(String[] args) {
    SpringApplication.run(ComplaintRiskApplication.class, args);
  }
}
