import { BookmarkHintBanner } from "@/components/BookmarkHintBanner";
import { ParticleNetwork } from "@/components/effects/ParticleNetwork";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="crt-shell relative min-h-dvh">
      <ParticleNetwork />
      <div className="relative z-[2]">{children}</div>
      <BookmarkHintBanner />
    </div>
  );
}
