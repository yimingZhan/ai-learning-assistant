import test from "node:test";
import assert from "node:assert/strict";
import { evaluateComplaintRisk, getRiskLevelForAllRoles } from "./risk-engine.js";
import { sampleStudents } from "./sample-data.js";

const [highRisk, mediumRisk, lowRisk, insufficient] = sampleStudents;

test("明确换师红线直接判定为高风险", () => {
  const result = evaluateComplaintRisk(highRisk, "manager");
  assert.equal(result.risk.level, "高");
  assert.equal(result.risk.trend, "上升");
  assert.ok(result.evidence.some((item) => item.severity === "redline"));
});

test("无红线但学习和服务异常判定为中风险", () => {
  const result = evaluateComplaintRisk(mediumRisk, "advisor");
  assert.equal(result.risk.level, "中");
  assert.ok(result.evidence.length >= 2);
});

test("数据完整且无异常判定为低风险", () => {
  const result = evaluateComplaintRisk(lowRisk, "planner");
  assert.equal(result.risk.level, "低");
  assert.equal(result.completeness.ratio, 1);
});

test("关键数据缺失时不得判为低风险", () => {
  const result = evaluateComplaintRisk(insufficient, "quality");
  assert.equal(result.risk.level, "数据不足");
  assert.match(result.conclusion, /无法形成可靠/);
});

test("四种角色查询同一学生时风险等级一致", () => {
  const levels = Object.values(getRiskLevelForAllRoles(highRisk));
  assert.deepEqual(new Set(levels), new Set(["高"]));
});

test("规划师看不到针对规划师的跨端口敏感原文，质检可见", () => {
  const planner = evaluateComplaintRisk(highRisk, "planner");
  const quality = evaluateComplaintRisk(highRisk, "quality");
  const plannerEvidence = planner.allEvidence.find((item) => item.id === "signal-planner-style");
  const qualityEvidence = quality.allEvidence.find((item) => item.id === "signal-planner-style");
  assert.equal(plannerEvidence.quote, null);
  assert.equal(plannerEvidence.redacted, true);
  assert.match(qualityEvidence.quote, /push/);
  assert.equal(qualityEvidence.redacted, false);
});

test("高风险动作包含2小时内处置要求", () => {
  const result = evaluateComplaintRisk(highRisk, "manager");
  assert.equal(result.actions[0].timing, "2小时内");
});
