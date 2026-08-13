package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import java.util.Map;
import java.util.Optional;
import org.springframework.stereotype.Component;

@Component
public class MockIdentityDirectory implements IdentityDirectory {
  private static final Map<String, StudentIdentity> STUDENTS = Map.of(
      "customer-wechat-001", new StudentIdentity("risk-student-001", "林家宁", "S2026001", "employee-a1024", "周欣"),
      "customer-wechat-002", new StudentIdentity("risk-student-002", "陈子轩", "S2026002", "employee-b2048", "高兰")
  );
  private static final Map<String, EmployeeIdentity> EMPLOYEES = Map.of(
      "staff-wechat-a1024", new EmployeeIdentity("employee-a1024", "周欣", "升学顾问"),
      "staff-wechat-b2048", new EmployeeIdentity("employee-b2048", "高兰", "服务经理")
  );

  @Override
  public Optional<StudentIdentity> findStudentByCustomerWechatId(String customerWechatId) {
    return Optional.ofNullable(STUDENTS.get(customerWechatId));
  }

  @Override
  public Optional<EmployeeIdentity> findEmployeeByStaffWechatAccountId(String staffWechatAccountId) {
    return Optional.ofNullable(EMPLOYEES.get(staffWechatAccountId));
  }
}
