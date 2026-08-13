package com.weixun.ai.complaint.integration;

import com.weixun.ai.complaint.domain.ComplaintRiskConfig;
import com.weixun.ai.complaint.domain.RiskApi.ModelResult;
import com.weixun.ai.complaint.domain.YunkModels.Evidence;
import java.util.List;

public interface RiskModelClient {
  ModelResult analyze(ComplaintRiskConfig config, Evidence focus, List<Evidence> context);

  String modelVersion();
}
