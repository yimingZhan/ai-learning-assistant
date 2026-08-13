# Global Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a fixed 56px global toolbar with route location, contextual AI access, work reminders, help, and current-user controls while keeping the existing side navigation.

**Architecture:** Wrap routed content with an application shell through Umi's `childrenRender`, and place shared toolbar data plus AI surface state in a root React provider. Existing complaint-risk conversations remain scoped per student; other pages use a global assistant drawer, and the full assistant page responds to toolbar focus requests.

**Tech Stack:** React 19, TypeScript, Umi Max, Ant Design Pro, Ant Design X, antd-style, MSW, Vitest, Playwright.

---

### Task 1: Toolbar contracts and mock endpoints

**Files:**
- Modify: `src/api/contracts.ts`
- Modify: `src/api/client.ts`
- Modify: `src/api/mock/data.ts`
- Modify: `src/api/mock/handlers.ts`
- Test: `src/features/globalToolbar/toolbarData.test.ts`

- [ ] Define `CurrentUser`, `WorkReminder`, `WorkReminderSummary`, renewal assistant context, and their exact status/type unions.
- [ ] Add API client methods for current user, reminder summary, and marking a reminder as read.
- [ ] Seed three reminders covering complaint risk, renewal follow-up, and assigned work, with navigable target paths.
- [ ] Add MSW handlers and verify success, unread-count updates, empty results, and request failures.

### Task 2: Shared shell and toolbar state

**Files:**
- Create: `src/features/globalToolbar/GlobalToolbarProvider.tsx`
- Create: `src/features/globalToolbar/AppShell.tsx`
- Create: `src/features/globalToolbar/routeLocation.ts`
- Modify: `src/app.tsx`
- Modify: `config/defaultSettings.ts`
- Test: `src/features/globalToolbar/routeLocation.test.ts`

- [ ] Map supported routes to concise location labels, with the current page as the final non-link label.
- [ ] Implement one provider for user/reminder loading state, AI surface (`drawer`, `embedded`, `page`), selected-student context, open state, and focus requests.
- [ ] Wrap the Umi root with the provider and routed content with `AppShell`.
- [ ] Set the layout header height to 56px and keep the existing side navigation fixed.

### Task 3: Global toolbar UI

**Files:**
- Create: `src/features/globalToolbar/GlobalToolbar.tsx`
- Create: `src/features/globalToolbar/GlobalToolbar.styles.ts`
- Create: `src/features/globalToolbar/WorkReminderPopover.tsx`
- Create: `src/features/globalToolbar/HelpMenu.tsx`
- Create: `src/features/globalToolbar/UserMenu.tsx`
- Test: `src/features/globalToolbar/GlobalToolbar.test.tsx`

- [ ] Render route location on the left and `问 AI`, reminders, help, and current user on the right.
- [ ] Add explicit accessible names, tooltips for icon-only responsive states, `aria-pressed` for AI state, and keyboard-operable menus.
- [ ] Render reminder loading, error/retry, empty, and populated states; mark a reminder read before navigating to its target.
- [ ] Render help topics and account/role/organization information without duplicating primary navigation or student data.
- [ ] Hide text labels below 1200px and move help into the user menu below 768px.

### Task 4: Contextual assistant behavior

**Files:**
- Create: `src/features/globalToolbar/GlobalAssistantDrawer.tsx`
- Create: `src/features/globalToolbar/GlobalAssistantPanel.tsx`
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/pages/Quality/Conversation/index.tsx`
- Modify: `src/pages/Renewal/Prediction/index.tsx`
- Modify: `src/api/mock/data.ts`
- Test: `src/features/globalToolbar/GlobalAssistantDrawer.test.tsx`

- [ ] Make the full assistant page register as the `page` surface and focus its Sender when `问 AI` is clicked.
- [ ] Make the complaint page register as `embedded`; toggle its desktop panel or responsive Drawer from the toolbar while preserving per-student history.
- [ ] Register selected renewal students as renewal context and open a scoped global assistant drawer elsewhere.
- [ ] Support renewal assistant replies in mock mode and keep generic questions unscoped when no student is selected.

### Task 5: Layout integration and verification

**Files:**
- Modify: `src/global.css`
- Modify: `src/features/assistant/AssistantPage.tsx`
- Modify: `src/pages/Quality/Conversation/index.tsx`
- Modify: `e2e/assistant.spec.ts`
- Modify: `e2e/renewal.spec.ts`

- [ ] Replace page-level viewport calculations with shell-relative `height: 100%` so the toolbar never overlaps content.
- [ ] Verify toolbar location labels, AI active state, reminder navigation, account/help menus, and no horizontal overflow at 1440px, 1024px, and 768px.
- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm build`, and targeted Playwright tests; all must pass with no new console errors.
