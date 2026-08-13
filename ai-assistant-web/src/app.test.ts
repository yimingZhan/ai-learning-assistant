import { describe, expect, it } from "vitest";
import defaultSettings from "../config/defaultSettings";

describe("Ant Design Pro runtime", () => {
  it("uses the standard side layout", () => {
    expect(defaultSettings.layout).toBe("side");
    expect(defaultSettings.title).toBe("唯寻 AI");
  });
});
