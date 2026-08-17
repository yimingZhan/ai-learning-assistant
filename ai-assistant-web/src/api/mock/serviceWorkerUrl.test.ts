import { describe, expect, it } from "vitest";
import { getDemoApiBase, getMockServiceWorkerUrl } from "./serviceWorkerUrl";

describe("getMockServiceWorkerUrl", () => {
  it("keeps the worker inside a GitHub project Pages subpath", () => {
    expect(
      getMockServiceWorkerUrl(
        "https://yimingzhan.github.io/ai-learning-assistant/#/quality/conversation",
      ),
    ).toBe(
      "https://yimingzhan.github.io/ai-learning-assistant/mockServiceWorker.js",
    );
  });

  it("keeps the worker at the local development root", () => {
    expect(
      getMockServiceWorkerUrl("http://localhost:8000/#/quality/conversation"),
    ).toBe("http://localhost:8000/mockServiceWorker.js");
  });
});

describe("getDemoApiBase", () => {
  it("uses the local origin at the site root", () => {
    expect(
      getDemoApiBase("http://localhost:8000/#/quality/conversation"),
    ).toBe("http://localhost:8000");
  });

  it("keeps API requests inside a GitHub Pages project scope", () => {
    expect(
      getDemoApiBase(
        "https://yimingzhan.github.io/ai-learning-assistant/#/quality/conversation",
      ),
    ).toBe("https://yimingzhan.github.io/ai-learning-assistant");
  });

  it("removes a static entry filename from the request base", () => {
    expect(
      getDemoApiBase(
        "https://demo.example.com/ai-learning-assistant/index.html#/assistant",
      ),
    ).toBe("https://demo.example.com/ai-learning-assistant");
  });
});
