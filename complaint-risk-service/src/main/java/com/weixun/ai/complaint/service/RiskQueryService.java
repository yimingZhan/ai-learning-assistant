package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.RiskApi.FullChatMessage;
import com.weixun.ai.complaint.domain.RiskApi.RelatedPerson;
import com.weixun.ai.complaint.domain.RiskApi.RiskEvent;
import com.weixun.ai.complaint.domain.RiskApi.RiskEventGroup;
import com.weixun.ai.complaint.domain.RiskApi.RiskStudent;
import com.weixun.ai.complaint.domain.RiskApi.RiskStudentDetail;
import com.weixun.ai.complaint.domain.RiskApi.RiskStudentPage;
import com.weixun.ai.complaint.domain.RiskApi.ServiceProfile;
import com.weixun.ai.complaint.domain.RiskApi.TextSegment;
import com.weixun.ai.complaint.domain.RiskApi.ThemeCount;
import com.weixun.ai.complaint.domain.RiskApi.WechatEvidence;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import com.weixun.ai.complaint.persistence.RiskQueryRepository;
import com.weixun.ai.complaint.persistence.RiskQueryRepository.EventRow;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RiskQueryService {
  private static final ZoneId BUSINESS_ZONE = ZoneId.of("Asia/Shanghai");
  private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
  private final RiskQueryRepository repository;

  public RiskQueryService(RiskQueryRepository repository) {
    this.repository = repository;
  }

  public RiskStudentPage list(String keyword, String riskLevel, int page, int pageSize) {
    Map<String, List<EventRow>> grouped = repository.allEvents().stream()
        .collect(Collectors.groupingBy(EventRow::studentId, LinkedHashMap::new, Collectors.toList()));
    var students = grouped.values().stream()
        .map(this::toStudent)
        .filter(student -> riskLevel == null || riskLevel.isBlank() || riskLevel.equals(student.riskLevel()))
        .filter(student -> {
          if (keyword == null || keyword.isBlank()) return true;
          String normalized = keyword.toLowerCase(Locale.ROOT);
          return student.studentName().toLowerCase(Locale.ROOT).contains(normalized)
              || student.studentNumber().toLowerCase(Locale.ROOT).contains(normalized);
        })
        .sorted(Comparator.comparingInt((RiskStudent item) -> levelOrder(item.riskLevel()))
            .thenComparing(RiskStudent::latestRiskTime, Comparator.reverseOrder()))
        .toList();
    int safePage = Math.max(1, page);
    int safeSize = Math.min(100, Math.max(1, pageSize));
    int from = Math.min(students.size(), (safePage - 1) * safeSize);
    int to = Math.min(students.size(), from + safeSize);
    return new RiskStudentPage(students.subList(from, to), students.size(), safePage, safeSize);
  }

  public RiskStudentDetail detail(String studentId) {
    List<EventRow> events = repository.eventsForStudent(studentId);
    if (events.isEmpty()) throw new IllegalArgumentException("学生客诉风险记录不存在：" + studentId);
    RiskStudent student = toStudent(events);
    Map<String, List<RiskEvent>> groups = new LinkedHashMap<>();
    for (EventRow event : events) {
      var evidences = repository.evidenceForEvent(event.id()).stream().map(this::toWechatEvidence).toList();
      groups.computeIfAbsent(event.eventDate().toString(), ignored -> new ArrayList<>()).add(
          new RiskEvent(event.id(), event.theme(), event.summary(), event.suggestion(), List.of("wechat"), evidences)
      );
    }
    List<RiskEventGroup> eventGroups = groups.entrySet().stream()
        .map(entry -> new RiskEventGroup(entry.getKey(), entry.getValue()))
        .toList();
    Map<String, Long> themeCounts = events.stream().collect(Collectors.groupingBy(EventRow::theme, LinkedHashMap::new, Collectors.counting()));
    List<ThemeCount> themes = themeCounts.entrySet().stream()
        .map(entry -> new ThemeCount(entry.getKey(), entry.getValue().intValue()))
        .toList();
    EventRow latest = events.getFirst();
    String earliest = events.stream().map(EventRow::earliestAt).min(Comparator.naturalOrder()).orElseThrow()
        .atZone(BUSINESS_ZONE).toLocalDate().toString();
    String latestDate = latest.latestAt().atZone(BUSINESS_ZONE).toLocalDate().toString();
    String aiSummary = events.stream().limit(3).map(EventRow::summary).collect(Collectors.joining("；"));
    return new RiskStudentDetail(
        student, List.of(earliest, latestDate), aiSummary, themes, latest.suggestion(), latestDate,
        eventGroups, "待跟进", events.stream().mapToInt(EventRow::riskScore).max().orElse(0), List.of(),
        new ServiceProfile("-", latest.ownerName(), "-", "-", "-", "-", "-"), List.of(),
        repository.operationLogs(studentId), latest.configVersion(), latest.modelVersion(), "READY"
    );
  }

  public List<FullChatMessage> evidenceContext(String evidenceId) {
    return repository.context(evidenceId, 30).stream().map(this::toFullChatMessage).toList();
  }

  private RiskStudent toStudent(List<EventRow> events) {
    EventRow latest = events.stream().max(Comparator.comparing(EventRow::latestAt)).orElseThrow();
    EventRow highest = events.stream().min(Comparator.comparingInt(event -> levelOrder(event.riskLevel()))).orElseThrow();
    var people = latest.ownerName() == null ? List.<RelatedPerson>of() : List.of(new RelatedPerson(latest.ownerName(), List.of("负责人")));
    return new RiskStudent(
        latest.studentId(), latest.studentName(), latest.studentNumber(), highest.riskLevel(), latest.summary(), events.size(),
        List.of("wechat"), format(latest.latestAt()), latest.ownerName(), people, "READY"
    );
  }

  private WechatEvidence toWechatEvidence(Evidence evidence) {
    List<FullChatMessage> context = repository.context(evidence.id(), 30).stream().map(this::toFullChatMessage).toList();
    String employeeName = evidence.employee() == null ? "-" : evidence.employee().employeeName();
    String role = evidence.employee() == null ? "云客微信" : evidence.employee().employeeRole();
    return new WechatEvidence(
        evidence.id(), "wechat", role, employeeName, format(evidence.occurredAt()),
        List.of(new TextSegment(evidence.contentText(), true)), context
    );
  }

  private FullChatMessage toFullChatMessage(Evidence evidence) {
    boolean customer = "customer".equals(evidence.senderType());
    String sender = customer ? "客户" : evidence.employee() == null ? "员工" : evidence.employee().employeeName();
    String role = customer ? "家长" : evidence.employee() == null ? "员工" : evidence.employee().employeeRole();
    return new FullChatMessage(
        evidence.id(), sender, role, format(evidence.occurredAt()), List.of(new TextSegment(evidence.contentText(), customer))
    );
  }

  private static String format(java.time.Instant instant) {
    return instant.atZone(BUSINESS_ZONE).format(DATE_TIME);
  }

  private static int levelOrder(String level) {
    return switch (level) {
      case "high" -> 0;
      case "medium" -> 1;
      default -> 2;
    };
  }
}
