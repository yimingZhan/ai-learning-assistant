import { evaluateComplaintRisk, ROLE_CONFIG } from "./risk-engine.js";
import { sampleStudents } from "./sample-data.js";

const state = {
  role: "manager",
  studentId: sampleStudents[0].id,
  statusOverrides: new Map(),
};

const elements = {
  roleSwitcher: document.querySelector("#role-switcher"),
  studentList: document.querySelector("#student-list"),
  studentSelect: document.querySelector("#student-select"),
  queryInput: document.querySelector("#query-input"),
  queryForm: document.querySelector("#query-form"),
  report: document.querySelector("#report"),
  permissionNote: document.querySelector("#permission-note"),
  dialog: document.querySelector("#evidence-dialog"),
  dialogContent: document.querySelector("#dialog-content"),
  dialogClose: document.querySelector("#dialog-close"),
  toast: document.querySelector("#toast"),
  clock: document.querySelector("#clock"),
};

function currentStudent() {
  const source = sampleStudents.find((student) => student.id === state.studentId);
  const override = state.statusOverrides.get(source.id);
  return override ? { ...source, workflowStatus: override } : source;
}

function levelClass(level) {
  return { 高: "high", 中: "medium", 低: "low", 数据不足: "insufficient" }[level];
}

function severityLabel(severity) {
  return { redline: "红线", p0: "P0", p1: "P1", p2: "P2" }[severity];
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatUpdateTime(value) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date(value));
}

function renderControls() {
  elements.roleSwitcher.innerHTML = Object.entries(ROLE_CONFIG).map(([key, role]) => `
    <button class="role-button ${state.role === key ? "active" : ""}" role="tab" aria-selected="${state.role === key}" data-role="${key}">
      ${role.label}
    </button>
  `).join("");

  elements.studentList.innerHTML = sampleStudents.map((student) => `
    <button class="student-button ${state.studentId === student.id ? "active" : ""}" data-student="${student.id}">
      <strong>${student.name}</strong><span>${student.grade}</span>
    </button>
  `).join("");

  elements.studentSelect.innerHTML = sampleStudents.map((student) => `
    <option value="${student.id}" ${state.studentId === student.id ? "selected" : ""}>${student.name} · ${student.grade}</option>
  `).join("");

  elements.permissionNote.textContent = ROLE_CONFIG[state.role].permission;
}

function renderEvidence(evidence) {
  if (!evidence.length) return `<div class="empty-state">近30天未发现达到预警阈值的异常证据。</div>`;
  return evidence.map((item, index) => `
    <article class="evidence-item" tabindex="0" data-evidence="${item.id}">
      <div class="evidence-rank">0${index + 1}<b>${item.categoryLabel}</b></div>
      <div class="evidence-content">
        <h3>${escapeHtml(item.title)}${item.redacted ? " · 已脱敏" : ""}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="evidence-metrics">
          <span><b>${escapeHtml(item.currentValue)}</b></span>
          <span>${escapeHtml(item.comparison)}</span>
          <span>${escapeHtml(item.source)}</span>
          <span>${item.verified ? "已核实" : "待核实"}</span>
        </div>
      </div>
      <span class="evidence-arrow">↗</span>
    </article>
  `).join("");
}

function renderTimeline(timeline) {
  if (!timeline.length) return `<p class="empty-state">暂无关键风险事件。</p>`;
  return `<div class="timeline">${timeline.map((item) => `
    <article class="timeline-item">
      <time>${escapeHtml(item.displayTime)}</time>
      <h3>${escapeHtml(item.title)}</h3>
      <p>${escapeHtml(item.detail)}</p>
    </article>
  `).join("")}</div>`;
}

function renderActions(actions) {
  return `<div class="action-list">${actions.map((action) => `
    <article class="action-item">
      <div class="action-time">${escapeHtml(action.timing)}</div>
      <div class="action-body">
        <b>${escapeHtml(action.owner)}</b>
        <p>${escapeHtml(action.task)}</p>
        <small>完成标准：${escapeHtml(action.criteria)}</small>
      </div>
    </article>
  `).join("")}</div>`;
}

function renderReport() {
  const student = currentStudent();
  const result = evaluateComplaintRisk(student, state.role);
  const trendMark = result.risk.trend === "上升" ? "↑" : result.risk.trend === "下降" ? "↓" : "→";

  elements.report.innerHTML = `
    <article class="report">
      <section class="risk-hero">
        <div class="risk-stamp ${levelClass(result.risk.level)}">
          <small>COMPLAINT RISK</small>
          <strong>${result.risk.level === "数据不足" ? "?" : result.risk.level}</strong>
          <span>${trendMark} 风险${result.risk.trend}</span>
        </div>
        <div class="risk-summary">
          <p class="student-kicker">${escapeHtml(result.meta.studentId)} · ${escapeHtml(result.meta.grade)} · ${escapeHtml(result.meta.servicePort)}</p>
          <h1>${escapeHtml(result.meta.studentName)}的客诉预警</h1>
          <p>${escapeHtml(result.conclusion)}</p>
        </div>
        <div class="risk-meta">
          <div class="meta-row"><span>当前状态</span><b>${escapeHtml(result.risk.status)}</b></div>
          <div class="meta-row"><span>观察周期</span><b>${result.meta.observationWindow}</b></div>
          <div class="meta-row"><span>成绩趋势</span><b>${result.meta.scoreWindow}</b></div>
          <div class="meta-row"><span>数据完整度</span><b>${result.completeness.label}</b></div>
          <div class="meta-row"><span>数据更新</span><b>${formatUpdateTime(result.meta.updatedAt)}</b></div>
        </div>
      </section>
      <p class="disclaimer">⚑ ${result.risk.disclaimer} · 当前以「${result.meta.role}」身份查看 · ${result.meta.permission}</p>

      <div class="report-grid">
        <section>
          <div class="section-heading"><h2>关键风险依据</h2><span>优先展示 ${result.evidence.length}/${result.evidenceTotal} 条</span></div>
          <div class="evidence-list">${renderEvidence(result.evidence)}</div>
        </section>
        <aside class="side-stack">
          <section>
            <div class="section-heading"><h2>最近风险时间线</h2><span>RECENT SIGNALS</span></div>
            ${renderTimeline(result.timeline)}
          </section>
          <section>
            <div class="section-heading"><h2>建议动作</h2><span>${result.meta.role}视角</span></div>
            ${renderActions(result.actions)}
          </section>
        </aside>
      </div>

      <section class="verification">
        <div class="verification-title"><h2>待人工核实</h2><p>模型没有把握的内容必须由业务人员确认。</p></div>
        <ul>${result.verificationItems.length ? result.verificationItems.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>当前没有新增待核实项。</li>"}</ul>
      </section>

      <div class="report-actions">
        <button class="action-button" data-action="view">查看证据</button>
        <button class="action-button" data-action="verify">标记已核实</button>
        <button class="action-button" data-action="tasks">生成处理待办</button>
        <button class="action-button primary" data-action="escalate">升级主管/质检</button>
        <button class="action-button" data-action="false-positive">标记误报</button>
      </div>
    </article>
  `;

  elements.report.querySelectorAll("[data-evidence]").forEach((node) => {
    node.addEventListener("click", () => openEvidence(node.dataset.evidence, result));
    node.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") openEvidence(node.dataset.evidence, result);
    });
  });

  elements.report.querySelectorAll("[data-action]").forEach((node) => {
    node.addEventListener("click", () => handleAction(node.dataset.action, result));
  });
}

function openEvidence(id, result) {
  const item = result.allEvidence.find((entry) => entry.id === id) ?? result.evidence[0];
  if (!item) return;
  elements.dialogContent.innerHTML = `
    <span class="dialog-label">${item.categoryLabel} / ${severityLabel(item.severity)}</span>
    <h2>${escapeHtml(item.title)}</h2>
    <p>${escapeHtml(item.summary)}</p>
    ${item.quote ? `<blockquote>“${escapeHtml(item.quote)}”</blockquote>` : `<blockquote>${item.redacted ? "敏感原文已按当前角色权限隐藏。" : "该证据没有可展示的原始文本。"}</blockquote>`}
    <div class="detail-grid">
      <div><small>当前值</small><b>${escapeHtml(item.currentValue)}</b></div>
      <div><small>对比/阈值</small><b>${escapeHtml(item.comparison)}</b></div>
      <div><small>数据来源</small><b>${escapeHtml(item.source)}</b></div>
      <div><small>证据状态</small><b>${item.verified ? "人工已核实" : "AI识别待核实"}</b></div>
      <div><small>置信度</small><b>${escapeHtml(item.confidence)}</b></div>
      <div><small>发生时间</small><b>${formatUpdateTime(item.occurredAt)}</b></div>
    </div>
  `;
  elements.dialog.showModal();
}

function openEvidenceIndex(result) {
  if (!result.allEvidence.length) {
    showToast("当前没有达到预警阈值的异常证据");
    return;
  }
  elements.dialogContent.innerHTML = `
    <span class="dialog-label">完整证据链 / ${result.evidenceTotal} 条</span>
    <h2>${escapeHtml(result.meta.studentName)}的风险证据</h2>
    <p>证据已按「${result.meta.role}」权限处理。点击任一条查看当前值、阈值、来源和原始内容。</p>
    <div class="dialog-evidence-list">
      ${result.allEvidence.map((item, index) => `
        <button type="button" class="dialog-evidence-button" data-dialog-evidence="${item.id}">
          <span>${String(index + 1).padStart(2, "0")} · ${severityLabel(item.severity)}</span>
          <b>${escapeHtml(item.title)}${item.redacted ? " · 已脱敏" : ""}</b>
          <small>${escapeHtml(item.currentValue)} · ${escapeHtml(item.source)}</small>
        </button>
      `).join("")}
    </div>
  `;
  elements.dialogContent.querySelectorAll("[data-dialog-evidence]").forEach((node) => {
    node.addEventListener("click", () => openEvidence(node.dataset.dialogEvidence, result));
  });
  elements.dialog.showModal();
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function handleAction(action, result) {
  if (action === "view") {
    openEvidenceIndex(result);
    return;
  }
  if (action === "verify") {
    state.statusOverrides.set(state.studentId, "人工已核实");
    showToast("已标记为人工核实，状态已更新");
    renderReport();
    return;
  }
  if (action === "tasks") {
    showToast(`已生成 ${result.actions.length} 条处理待办，并按时效排序`);
    return;
  }
  if (action === "escalate") {
    state.statusOverrides.set(state.studentId, "处理中");
    showToast("已升级主管/质检，进入处理中状态");
    renderReport();
    return;
  }
  if (action === "false-positive") {
    state.statusOverrides.set(state.studentId, "已解除");
    showToast("已记录误报反馈，供后续规则优化");
    renderReport();
  }
}

elements.roleSwitcher.addEventListener("click", (event) => {
  const button = event.target.closest("[data-role]");
  if (!button) return;
  state.role = button.dataset.role;
  renderControls();
  renderReport();
});

elements.studentList.addEventListener("click", (event) => {
  const button = event.target.closest("[data-student]");
  if (!button) return;
  state.studentId = button.dataset.student;
  elements.queryInput.value = `${currentStudent().name}最近有没有客诉风险？`;
  renderControls();
  renderReport();
});

elements.studentSelect.addEventListener("change", (event) => {
  state.studentId = event.target.value;
  elements.queryInput.value = `${currentStudent().name}最近有没有客诉风险？`;
  renderControls();
  renderReport();
});

elements.queryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  renderReport();
  showToast("已根据最新字段重新完成分析");
});

elements.dialogClose.addEventListener("click", () => elements.dialog.close());
elements.dialog.addEventListener("click", (event) => {
  if (event.target === elements.dialog) elements.dialog.close();
});

function tickClock() {
  elements.clock.textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

renderControls();
renderReport();
tickClock();
window.setInterval(tickClock, 1000);
