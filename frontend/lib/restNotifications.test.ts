import { beforeEach, describe, expect, it, vi } from "vitest";

const localNotificationsMock = {
  checkPermissions: vi.fn(),
  requestPermissions: vi.fn(),
  schedule: vi.fn(),
  cancel: vi.fn(),
};

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

vi.mock("@capacitor/local-notifications", () => ({
  LocalNotifications: localNotificationsMock,
}));

describe("restNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useRealTimers();
  });

  it("uses setTimeout on web instead of native scheduling", async () => {
    vi.useFakeTimers();
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    const { scheduleRestNotification, cancelRestNotification } = await import(
      "@/lib/restNotifications"
    );

    scheduleRestNotification(
      new Date(Date.now() + 5000).toISOString(),
      "Push — time for your next set",
    );

    expect(localNotificationsMock.schedule).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(4999);
    expect(localNotificationsMock.schedule).not.toHaveBeenCalled();

    cancelRestNotification();
  });

  it("schedules native local notification on Capacitor", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    localNotificationsMock.checkPermissions.mockResolvedValue({
      display: "granted",
    });
    localNotificationsMock.cancel.mockResolvedValue(undefined);
    localNotificationsMock.schedule.mockResolvedValue({ notifications: [] });

    const { scheduleRestNotification, cancelRestNotification } = await import(
      "@/lib/restNotifications"
    );

    const endsAt = new Date(Date.now() + 90_000).toISOString();
    scheduleRestNotification(endsAt, "Leg day — time for your next set");

    await vi.waitFor(() => {
      expect(localNotificationsMock.schedule).toHaveBeenCalledWith({
        notifications: [
          expect.objectContaining({
            id: 9001,
            title: "Rest complete!",
            body: "Leg day — time for your next set",
            schedule: expect.objectContaining({
              at: new Date(endsAt),
              allowWhileIdle: true,
            }),
          }),
        ],
      });
    });

    cancelRestNotification();

    await vi.waitFor(() => {
      expect(localNotificationsMock.cancel).toHaveBeenCalledWith({
        notifications: [{ id: 9001 }],
      });
    });
  });

  it("requests native notification permission", async () => {
    const { Capacitor } = await import("@capacitor/core");
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);

    localNotificationsMock.requestPermissions.mockResolvedValue({
      display: "granted",
    });

    const { requestNotificationPermission } = await import(
      "@/lib/restNotifications"
    );

    await expect(requestNotificationPermission()).resolves.toBe("granted");
    expect(localNotificationsMock.requestPermissions).toHaveBeenCalled();
  });
});
