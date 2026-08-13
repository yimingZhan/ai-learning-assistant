package com.weixun.ai.complaint.service;

import com.weixun.ai.complaint.domain.RiskApi.CurrentUser;
import com.weixun.ai.complaint.domain.RiskApi.CurrentUserRole;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class RequestUserResolver {
  public static final String READ = "quality:complaint-risk:read";
  public static final String RUN = "quality:complaint-risk:run";
  public static final String CONFIG_EDIT = "ai-config:complaint-risk:edit";
  public static final String CONFIG_PUBLISH = "ai-config:complaint-risk:publish";

  public RequestUser resolve(HttpServletRequest request) {
    String id = value(request, "X-User-Id", "employee-a1024");
    String name = value(request, "X-User-Name", "周欣");
    String permissionsHeader = request.getHeader("X-User-Permissions");
    List<String> permissions = StringUtils.hasText(permissionsHeader)
        ? Arrays.stream(permissionsHeader.split(",")).map(String::trim).filter(StringUtils::hasText).toList()
        : List.of(READ, RUN, CONFIG_EDIT, CONFIG_PUBLISH);
    return new RequestUser(id, name, permissions);
  }

  public CurrentUser currentUser(HttpServletRequest request) {
    var user = resolve(request);
    return new CurrentUser(
        user.id(), user.name(), "上海中心 · 学管组", new CurrentUserRole("studentManager", "学管"),
        List.of(
            "assistant.use", "complaintRisk.view", "renewal.view", "renewalConfig.manage", "workReminder.view",
            "platformAssistantConfig.view", "platformAssistantConfig.edit", "platformAssistantConfig.publish",
            "platformAssistantConfig.rollback"
        )
    );
  }

  public void require(RequestUser user, String permission) {
    if (!user.permissions().contains(permission)) {
      throw new SecurityException("缺少权限：" + permission);
    }
  }

  private static String value(HttpServletRequest request, String header, String fallback) {
    return StringUtils.hasText(request.getHeader(header)) ? request.getHeader(header) : fallback;
  }

  public record RequestUser(String id, String name, List<String> permissions) {}
}
