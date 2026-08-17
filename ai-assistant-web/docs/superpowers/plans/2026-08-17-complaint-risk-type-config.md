# Complaint Risk Type Configuration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing complaint-risk Prompt/rule/runtime configuration with editable risk types, recall keywords, and ordered positive/negative semantic examples while preserving draft, publish, history, and rollback.

**Architecture:** Keep the existing complaint-risk configuration endpoints and version metadata, but reduce the configuration payload to `riskTypes`. Render a single Ant Design Pro table and edit each type in a focused drawer with tag-based keyword input plus separate `Form.List` fields for positive and optional negative examples; keep all persistence in the existing MSW store and do not connect the configuration to static risk events.

**Tech Stack:** React 19, TypeScript, Ant Design 6, Ant Design Pro Components, Umi Max, MSW, Vitest, Testing Library, Playwright.

---

### Task 1: Replace the configuration contract and seed data

**Files:**
- Modify: `src/api/contracts.ts`
- Modify: `src/api/mock/complaintRiskConfig.ts`
- Modify: `src/api/mock/data.ts`
- Modify: `src/api/client.ts`
- Modify: `src/api/mock/handlers.ts`
- Test: `src/api/mock/complaintRiskConfig.test.ts`

- [ ] **Step 1: Write failing tests for the new seed**

Assert that `createInitialComplaintRiskConfig().riskTypes` contains five types, twenty-one keywords, sixteen positive examples, and fifteen negative examples, including the exact supplied examples, and no longer exercises the old trial engine.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `corepack pnpm vitest run src/api/mock/complaintRiskConfig.test.ts`

Expected: FAIL because `riskTypes` does not exist.

- [ ] **Step 3: Add the reduced public contract**

Use the following payload shape and retain the existing version fields:

```ts
export type ComplaintRiskTypeConfig = {
  id: string;
  name: string;
  keywords: string[];
  positiveExamples: string[];
  negativeExamples: string[];
};

export type ComplaintRiskConfig = {
  sceneId: "complaintRisk";
  sceneName: string;
  publishedVersion: string;
  draftVersion: string;
  draftStatus: "published" | "saved";
  updatedAt: string;
  updatedBy: string;
  riskTypes: ComplaintRiskTypeConfig[];
};
```

Remove the complaint-risk Prompt, rule, runtime, and trial contracts, the trial client method, mock endpoint, and trial implementation.

- [ ] **Step 4: Seed the five supplied risk types**

Create stable IDs for `follow-up-timeliness`, `refund-intent`, `service-dissatisfaction`, `learning-effect-doubt`, and `communication-problem`, preserving keyword and positive/negative example order. Make v1.0 contain all five types and v0.9 contain the first two so rollback remains demonstrable.

- [ ] **Step 5: Run the focused test**

Run: `corepack pnpm vitest run src/api/mock/complaintRiskConfig.test.ts`

Expected: PASS.

### Task 2: Build risk-type validation and editing UI

**Files:**
- Create: `src/pages/AIConfig/ComplaintRisk/RiskTypeEditorDrawer.tsx`
- Modify: `src/pages/AIConfig/ComplaintRisk/index.tsx`
- Modify: `src/pages/AIConfig/ComplaintRisk/index.styles.ts`
- Delete: `src/pages/AIConfig/ComplaintRisk/RuleEditorDrawer.tsx`
- Delete: `src/pages/AIConfig/ComplaintRisk/TrialRunDrawer.tsx`
- Delete: `src/pages/AIConfig/ComplaintRisk/meta.ts`
- Test: `src/pages/AIConfig/ComplaintRisk/index.test.tsx`

- [ ] **Step 1: Write failing page and validation tests**

Cover the five initial rows, twenty-one keywords, positive and negative examples, absence of the old tabs and trial action, add/edit/delete, example ordering, and rejection of blank/duplicate type names, keywords, and examples.

- [ ] **Step 2: Run the focused page test and verify failure**

Run: `corepack pnpm vitest run src/pages/AIConfig/ComplaintRisk/index.test.tsx`

Expected: FAIL against the old Prompt/rule/runtime page.

- [ ] **Step 3: Implement normalization and validation**

Trim names, keywords, and examples before save/publish. Require at least one type, unique non-empty names, optional but unique non-empty keywords, at least one unique positive example per type, and no duplicates between positive and negative examples. Compare duplicates using trimmed values.

- [ ] **Step 4: Implement the editor drawer**

Use a tag-based Select for optional keywords and separate `Form.List` fields for positive and optional negative examples. Provide add, remove, move-up, and move-down actions; generate a stable ID only for new types; preserve the ID while editing; remove the list-level example count column; keep edit/delete actions in a no-wrap action group; and prevent saving invalid data through Ant Design form validation.

- [ ] **Step 5: Replace the page body**

Keep the page title, status card, save, publish, version history, and rollback. Render one ProTable with type name, example count, ordered example list, edit, and delete actions. Add a semantic-reference/multi-label information alert and a confirmed delete action. Remove trial state, Prompt tabs, rule state, runtime fields, and old imports.

- [ ] **Step 6: Run the focused page test**

Run: `corepack pnpm vitest run src/pages/AIConfig/ComplaintRisk/index.test.tsx`

Expected: PASS.

### Task 3: Update end-to-end coverage and lifecycle copy

**Files:**
- Modify: `e2e/ai-config.spec.ts`
- Modify: `src/pages/AIConfig/ComplaintRisk/VersionHistoryDrawer.tsx` only if accessible naming needs adjustment

- [ ] **Step 1: Replace the old complaint-risk E2E scenario**

Verify the initial table, add a type with two examples, save the draft, publish with a risk-type-specific change note, and confirm the new version. Update menu and scrolling checks to target the risk-type table instead of the removed tabs and prompts.

- [ ] **Step 2: Keep rollback and responsive coverage**

At 768px width, open version history, roll back v0.9, confirm the new version, close the drawer, and assert document-level horizontal overflow is at most one pixel.

- [ ] **Step 3: Run the E2E file**

Run: `corepack pnpm playwright test e2e/ai-config.spec.ts`

Expected: PASS.

### Task 4: Full verification

**Files:**
- Verify all modified files above

- [ ] **Step 1: Search for removed concepts**

Run: `rg -n 'ComplaintRiskPrompt|ComplaintRiskRule|ComplaintRiskRuntime|ComplaintRiskTrial|Prompt 配置|判断规则|运行策略|配置试跑' src/pages/AIConfig/ComplaintRisk src/api e2e/ai-config.spec.ts`

Expected: no complaint-risk configuration references to removed concepts.

- [ ] **Step 2: Run static and unit checks**

Run: `corepack pnpm typecheck && corepack pnpm test`

Expected: PASS.

- [ ] **Step 3: Run the targeted E2E check**

Run: `corepack pnpm playwright test e2e/ai-config.spec.ts`

Expected: PASS with the existing development server or Playwright web server configuration.
