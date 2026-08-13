package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.YunkModels.EmployeeIdentity;
import com.weixun.ai.complaint.domain.YunkModels.StudentIdentity;
import java.util.Optional;

public interface IdentityDirectory {
  Optional<StudentIdentity> findStudentByCustomerWechatId(String customerWechatId);

  Optional<EmployeeIdentity> findEmployeeByStaffWechatAccountId(String staffWechatAccountId);
}
