import { BackgroundEffect } from "@/components/BackgroundEffect";
import { BookmarkHintBanner } from "@/components/BookmarkHintBanner";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="crt-shell relative min-h-dvh">
      <BackgroundEffect />
      <div className="relative z-[2]">{children}</div>
      <BookmarkHintBanner />
    </div>
  );
}
