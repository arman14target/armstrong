import { BackgroundEffect } from "@/components/BackgroundEffect";
import { BookmarkHintBanner } from "@/components/BookmarkHintBanner";
import { LoginSaveReminderBanner } from "@/components/LoginSaveReminderBanner";
import { NativeAppRouter } from "@/components/NativeAppRouter";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="crt-shell relative min-h-dvh">
      <BackgroundEffect />
      <BookmarkHintBanner />
      <LoginSaveReminderBanner />
      <NativeAppRouter>
        <div className="relative z-[2]">{children}</div>
      </NativeAppRouter>
    </div>
  );
}
