import { describe, expect, it } from "vitest";
import { toolbarApi } from "../../api/client";

describe("toolbarApi", () => {
  it("loads the current user and work reminders", async () => {
    const [user, reminders] = await Promise.all([
      toolbarApi.getCurrentUser(),
      toolbarApi.getWorkReminders(),
    ]);

    expect(user).toMatchObject({
      name: "周欣",
      organization: "上海中心 · 学管组",
      role: { label: "学管" },
    });
    expect(reminders.unreadCount).toBe(3);
    expect(reminders.items.map((item) => item.type)).toEqual([
      "complaintRisk",
      "renewal",
      "assignment",
    ]);
  });

  it("marks a reminder as read and updates the unread count", async () => {
    const summary = await toolbarApi.markReminderRead("reminder-risk-001");

    expect(summary.unreadCount).toBe(2);
    expect(
      summary.items.find((item) => item.id === "reminder-risk-001")?.read,
    ).toBe(true);
  });
});
