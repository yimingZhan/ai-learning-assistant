import { describe, expect, it } from "vitest";
import { getMockServiceWorkerUrl } from "./serviceWorkerUrl";

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
