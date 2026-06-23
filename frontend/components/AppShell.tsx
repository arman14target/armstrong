import { BackgroundEffect } from "@/components/BackgroundEffect";
import { LoginSaveReminderBanner } from "@/components/LoginSaveReminderBanner";
import { NativeAppRouter } from "@/components/NativeAppRouter";
import { SyncConflictModal } from "@/components/SyncConflictModal";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="crt-shell relative min-h-dvh">
      <BackgroundEffect />
      <LoginSaveReminderBanner />
      <SyncConflictModal />
      <NativeAppRouter>
        <div className="relative z-[2]">{children}</div>
      </NativeAppRouter>
    </div>
  );
}
