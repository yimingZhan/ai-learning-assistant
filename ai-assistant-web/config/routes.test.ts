import { describe, expect, it } from "vitest";
import routes from "./routes";

describe("menu routes", () => {
  it("defines AI quality and renewal children", () => {
    expect(routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/quality",
          routes: expect.arrayContaining([
            expect.objectContaining({ path: "/quality/conversation" }),
            expect.objectContaining({
              path: "/quality/employee-complaints",
              component: "./Quality/EmployeeComplaints",
            }),
          ]),
        }),
        expect.objectContaining({
          path: "/renewal",
          routes: expect.arrayContaining([
            expect.objectContaining({
              path: "/renewal/opportunities",
              component: "./Renewal/Opportunities",
            }),
            expect.objectContaining({
              path: "/renewal/diagnosis",
              component: "./Renewal/Diagnosis",
            }),
            expect.objectContaining({
              path: "/renewal/prediction",
              redirect: "/renewal/opportunities",
            }),
          ]),
        }),
        expect.objectContaining({
          path: "/ai-config",
          routes: expect.arrayContaining([
            expect.objectContaining({
              path: "/ai-config/platform-assistant",
              component: "./AIConfig/PlatformAssistant",
            }),
            expect.objectContaining({
              path: "/ai-config/complaint-risk",
              component: "./AIConfig/ComplaintRisk",
            }),
            expect.objectContaining({
              path: "/ai-config/renewal",
              component: "./AIConfig/Renewal",
            }),
          ]),
        }),
      ]),
    );
  });
});
