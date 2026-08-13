package com.weixun.ai.complaint.controller;

import com.weixun.ai.complaint.domain.RiskApi.CurrentUser;
import com.weixun.ai.complaint.domain.RiskApi.WorkReminderSummary;
import com.weixun.ai.complaint.service.ReminderService;
import com.weixun.ai.complaint.service.RequestUserResolver;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class SessionController {
  private final RequestUserResolver users;
  private final ReminderService reminders;

  public SessionController(RequestUserResolver users, ReminderService reminders) {
    this.users = users;
    this.reminders = reminders;
  }

  @GetMapping("/me")
  public CurrentUser me(HttpServletRequest request) {
    return users.currentUser(request);
  }

  @GetMapping("/work-reminders")
  public WorkReminderSummary reminders(HttpServletRequest request) {
    var user = users.resolve(request);
    return reminders.get(user.id());
  }

  @PatchMapping("/work-reminders/{reminderId}/read")
  public WorkReminderSummary markRead(@PathVariable String reminderId, HttpServletRequest request) {
    var user = users.resolve(request);
    return reminders.markRead(reminderId, user.id());
  }
}
