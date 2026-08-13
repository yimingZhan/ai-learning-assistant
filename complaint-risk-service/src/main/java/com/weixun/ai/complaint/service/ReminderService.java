package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.RiskApi.WorkReminderSummary;
import com.weixun.ai.complaint.persistence.RiskQueryRepository;
import org.springframework.stereotype.Service;

@Service
public class ReminderService {
  private final RiskQueryRepository repository;

  public ReminderService(RiskQueryRepository repository) {
    this.repository = repository;
  }

  public WorkReminderSummary get(String recipientId) {
    var items = repository.reminders(recipientId);
    return new WorkReminderSummary((int) items.stream().filter(item -> !item.read()).count(), items);
  }

  public WorkReminderSummary markRead(String reminderId, String recipientId) {
    repository.markReminderRead(reminderId, recipientId);
    return get(recipientId);
  }
}
