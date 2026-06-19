"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

const NAV = [
  { href: "/", label: "Dashboard" },
  { href: "/users", label: "Users" },
  { href: "/exercises", label: "Exercises" },
  { href: "/admins", label: "Admins", superadmin: true },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, loading, signOut } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Client-side route guard (static export — no server middleware).
  useEffect(() => {
    if (!loading && !admin) {
      router.replace("/login");
    }
  }, [loading, admin, router]);

  if (loading || !admin) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-dim">
        Loading…
      </div>
    );
  }

  const nav = NAV.filter((n) => !n.superadmin || admin.role === "SUPERADMIN");

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
          <span className="font-heading text-lg tracking-wider text-heading">
            ARMSTRONG<span className="text-primary">_ADMIN</span>
          </span>
          <nav className="flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "rounded-[var(--radius-cyber)] px-3 py-1.5 text-sm transition-colors",
                  pathname === n.href
                    ? "bg-primary/10 text-primary"
                    : "text-dim hover:text-heading",
                )}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-xs text-dim sm:inline">
              {admin.email} · {admin.role}
            </span>
            <Button variant="ghost" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
