package com.weixun.ai.complaint.controller;

import com.weixun.ai.complaint.domain.RiskApi.BatchResult;
import com.weixun.ai.complaint.domain.RiskApi.FullChatMessage;
import com.weixun.ai.complaint.domain.RiskApi.RiskStudentDetail;
import com.weixun.ai.complaint.domain.RiskApi.RiskStudentPage;
import com.weixun.ai.complaint.service.RequestUserResolver;
import com.weixun.ai.complaint.service.RiskQueryService;
import com.weixun.ai.complaint.service.RiskWorkflowService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ComplaintRiskController {
  private final RiskQueryService queryService;
  private final RiskWorkflowService workflowService;
  private final RequestUserResolver users;

  public ComplaintRiskController(
      RiskQueryService queryService,
      RiskWorkflowService workflowService,
      RequestUserResolver users
  ) {
    this.queryService = queryService;
    this.workflowService = workflowService;
    this.users = users;
  }

  @GetMapping("/api/v1/complaint-risks/students")
  public RiskStudentPage students(
      @RequestParam(required = false) String keyword,
      @RequestParam(required = false) String riskLevel,
      @RequestParam(defaultValue = "1") int page,
      @RequestParam(defaultValue = "50") int pageSize,
      HttpServletRequest request
  ) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.READ);
    return queryService.list(keyword, riskLevel, page, pageSize);
  }

  @GetMapping("/api/v1/complaint-risks/students/{studentId}")
  public RiskStudentDetail detail(@PathVariable String studentId, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.READ);
    return queryService.detail(studentId);
  }

  @GetMapping("/api/v1/complaint-risks/evidence/{evidenceId}/context")
  public List<FullChatMessage> context(@PathVariable String evidenceId, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.READ);
    return queryService.evidenceContext(evidenceId);
  }

  @PostMapping("/internal/v1/complaint-risk/jobs/run")
  public BatchResult run(@RequestBody(required = false) RunRequest run, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.RUN);
    return workflowService.run(
        run == null || run.runType() == null ? "MANUAL" : run.runType(),
        run == null ? null : run.from(), run == null ? null : run.to(), user
    );
  }

  @GetMapping("/internal/v1/complaint-risk/jobs/{runId}")
  public BatchResult batch(@PathVariable String runId, HttpServletRequest request) {
    var user = users.resolve(request);
    users.require(user, RequestUserResolver.RUN);
    return workflowService.getBatch(runId);
  }

  public record RunRequest(String runType, Instant from, Instant to) {}
}
