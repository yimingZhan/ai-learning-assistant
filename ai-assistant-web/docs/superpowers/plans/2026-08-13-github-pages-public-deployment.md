# GitHub Pages Public Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish only the AI assistant project code and code documentation, while excluding local research and spreadsheets, then deploy the mock-data frontend to GitHub Pages.

**Architecture:** Keep the main repository as the single source of truth. A GitHub Actions workflow builds `ai-assistant-web` with its mock API under the repository Pages subpath and uploads `dist` to GitHub Pages; root research files remain local and ignored. Because the repository has only one commit, amend that commit before changing visibility so excluded material is absent from the public branch history.

**Tech Stack:** Git, GitHub Actions, GitHub Pages, Node.js 22, pnpm 10, Umi Max, MSW.

---

### Task 1: Exclude local research material

**Files:**
- Modify: `/.gitignore`
- Untrack while retaining locally: root `AI学情*.md`, `ai学情*.md`, `*.xlsx`

- [ ] **Step 1: Add root-only ignore rules**

```gitignore
/AI学情*.md
/ai学情*.md
/*.xlsx
/*.xls
/*.xlsm
/*.xlsb
/*.ods
```

- [ ] **Step 2: Remove matching files from the Git index only**

```bash
git rm --cached -- '*.xlsx' 'AI学情*.md' 'ai学情*.md'
```

- [ ] **Step 3: Verify research files are local but no longer staged**

```bash
git check-ignore -v -- *.xlsx AI学情*.md ai学情*.md
git diff --cached --name-only
```

Expected: the local files match `.gitignore`, and the staged tree contains no root research Markdown or spreadsheet files.

### Task 2: Make the mock frontend work under the Pages subpath

**Files:**
- Create: `ai-assistant-web/src/api/mock/serviceWorkerUrl.ts`
- Create: `ai-assistant-web/src/api/mock/serviceWorkerUrl.test.ts`
- Modify: `ai-assistant-web/src/app.tsx`

- [ ] **Step 1: Add a worker URL unit test**

```ts
expect(
  getMockServiceWorkerUrl(
    "https://yimingzhan.github.io/ai-learning-assistant/#/quality/conversation",
  ),
).toBe(
  "https://yimingzhan.github.io/ai-learning-assistant/mockServiceWorker.js",
);
```

- [ ] **Step 2: Resolve the worker relative to the application URL**

```ts
export function getMockServiceWorkerUrl(locationHref: string) {
  return new URL("mockServiceWorker.js", locationHref).href;
}
```

- [ ] **Step 3: Pass the resolved URL to MSW**

```ts
await worker.start({
  onUnhandledRequest: "bypass",
  serviceWorker: { url: getMockServiceWorkerUrl(window.location.href) },
});
```

- [ ] **Step 4: Run the frontend tests**

```bash
pnpm --dir ai-assistant-web test
```

Expected: all test files and tests pass.

### Task 3: Add automated Pages deployment

**Files:**
- Create: `.github/workflows/pages.yml`

- [ ] **Step 1: Configure a Pages deployment workflow**

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

The workflow checks out `main`, installs the locked pnpm dependencies, builds with `DATA_MODE=mock` and `API_BASE_URL=/ai-learning-assistant`, uploads `ai-assistant-web/dist`, and deploys it with the official Pages actions.

- [ ] **Step 2: Verify the production build**

```bash
cd ai-assistant-web
DATA_MODE=mock API_BASE_URL=/ai-learning-assistant pnpm build
```

Expected: `dist/index.html` and `dist/mockServiceWorker.js` exist and generated JavaScript contains `/ai-learning-assistant/api/v1`.

### Task 4: Publish a clean public history

**Files:**
- Amend: the repository's single `Initial commit`

- [ ] **Step 1: Amend the only commit**

```bash
git add .gitignore .github ai-assistant-web
git commit --amend --no-edit
```

- [ ] **Step 2: Confirm the amended tree contains only allowed files**

```bash
git ls-tree -r --name-only HEAD
```

Expected: project code and code documentation are present; root research Markdown and spreadsheets are absent.

- [ ] **Step 3: Force-push with lease while the repository is private**

```bash
git push --force-with-lease origin main
```

- [ ] **Step 4: Change repository visibility to public**

Use repository Settings only after the remote tree and one-commit history have been verified clean.

- [ ] **Step 5: Enable GitHub Actions as the Pages source and verify the live site**

Expected: the Pages deployment succeeds and the public URL loads the AI assistant with mocked API responses.
