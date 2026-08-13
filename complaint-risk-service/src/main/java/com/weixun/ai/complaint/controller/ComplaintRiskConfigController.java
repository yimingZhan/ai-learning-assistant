package com.weixun.ai.complaint.controller;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.PublishRequest;
import com.weixun.ai.complaint.domain.RiskApi.TrialRequest;
import com.weixun.ai.complaint.domain.RiskApi.TrialResult;
import com.weixun.ai.complaint.domain.RiskApi.Version;
import com.weixun.ai.complaint.service.ConfigurationService;
import com.weixun.ai.complaint.service.RequestUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/ai-config/complaint-risk")
public class ComplaintRiskConfigController {
  private final ConfigurationService service;
  private final RequestUserResolver users;

  public ComplaintRiskConfigController(ConfigurationService service, RequestUserResolver users) {
    this.service = service;
    this.users = users;
  }

  @GetMapping
  public ComplaintRiskConfig get(HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_EDIT);
    return service.get();
  }

  @PatchMapping("/draft")
  public ComplaintRiskConfig saveDraft(@RequestBody ComplaintRiskConfig config, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_EDIT);
    return service.saveDraft(config, user);
  }

  @PostMapping("/trial")
  public TrialResult trial(@RequestBody TrialRequest trial, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_EDIT);
    return service.trial(trial, user);
  }

  @PostMapping("/publish")
  public ComplaintRiskConfig publish(@RequestBody PublishRequest publish, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_PUBLISH);
    return service.publish(publish, user);
  }

  @GetMapping("/versions")
  public List<Version> versions(HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_EDIT);
    return service.versions();
  }

  @PostMapping("/versions/{version}/rollback")
  public ComplaintRiskConfig rollback(@PathVariable String version, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.CONFIG_PUBLISH);
    return service.rollback(version, user);
  }
}
