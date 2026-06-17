"use client";

import { useState } from "react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useAuth } from "@/contexts/AuthContext";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

interface ProfileSectionProps {
  onAuthSuccess: (userId: string) => Promise<void>;
  onClearData: () => Promise<void>;
}

type AuthMode = "sign-in" | "sign-up";

export function ProfileSection({
  onAuthSuccess,
  onClearData,
}: ProfileSectionProps) {
  const { configured, user, loading, signIn, signUp, signOut } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const authError =
        mode === "sign-in"
          ? await signIn(email, password)
          : await signUp(email, password);

      if (authError) {
        setError(authError);
        return;
      }

      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setError(
          mode === "sign-up"
            ? "Account created. Check your email to confirm, then sign in."
            : "Could not start your session. Please try again.",
        );
        return;
      }

      await onAuthSuccess(session.user.id);
      setPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  const handleClearConfirm = async () => {
    setClearing(true);
    try {
      await onClearData();
      setShowClearModal(false);
      window.location.reload();
    } catch {
      setClearing(false);
    }
  };

  if (loading) {
    return (
      <TerminalWindow title="Profile">
        <p className="text-sm text-dim">Checking your session...</p>
      </TerminalWindow>
    );
  }

  if (!configured) {
    return (
      <TerminalWindow title="Profile">
        <p className="text-sm leading-relaxed text-dim">
          Cloud sync is not configured yet. Add{" "}
          <span className="text-cyan">NEXT_PUBLIC_SUPABASE_URL</span> and{" "}
          <span className="text-cyan">NEXT_PUBLIC_SUPABASE_ANON_KEY</span> to
          your environment to enable login and saved plans.
        </p>
      </TerminalWindow>
    );
  }

  if (user) {
    return (
      <>
        <TerminalWindow title="Your account">
          <div className="stack-md">
            <div>
              <p className="text-xs uppercase tracking-wide text-dim">Signed in as</p>
              <p className="mt-1 text-sm text-heading">{user.email}</p>
            </div>

            <p className="text-sm leading-relaxed text-dim">
              Your workouts, diet, and coach plans are saved to your account so
              you can pick up where you left off on any device.
            </p>

            <div className="flex flex-col gap-[var(--space-gap)] sm:flex-row">
              <CyberButton
                variant="cyan"
                className="w-full sm:w-auto"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? "Signing out..." : "Sign out"}
              </CyberButton>
              <CyberButton
                variant="magenta"
                className="w-full sm:w-auto"
                onClick={() => setShowClearModal(true)}
                disabled={clearing}
              >
                Clear all data
              </CyberButton>
            </div>
          </div>
        </TerminalWindow>

        <ConfirmModal
          open={showClearModal}
          title="Clear everything?"
          message={
            <>
              This will permanently delete all your workout history, diet logs,
              coach plans, and chat history from this device
              {user ? " and your cloud account" : ""}.
              <span className="mt-[var(--space-gap)] block font-semibold text-magenta">
                This action cannot be undone.
              </span>
            </>
          }
          confirmLabel="Yes, clear everything"
          cancelLabel="Keep my data"
          confirming={clearing}
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearModal(false)}
        />
      </>
    );
  }

  return (
    <TerminalWindow title={mode === "sign-in" ? "Sign in" : "Create account"}>
      <div className="stack-md">
        <p className="text-sm leading-relaxed text-dim">
          The app is free to use without an account. Sign in when you want your
          workouts, diet, and plans saved and synced for later.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setMode("sign-in");
              setError(null);
            }}
            className={cn(
              "rounded-cyber border px-3 py-2 text-xs tracking-wide transition-colors",
              mode === "sign-in"
                ? "border-primary/60 text-primary"
                : "border-line text-dim hover:text-heading",
            )}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("sign-up");
              setError(null);
            }}
            className={cn(
              "rounded-cyber border px-3 py-2 text-xs tracking-wide transition-colors",
              mode === "sign-up"
                ? "border-primary/60 text-primary"
                : "border-line text-dim hover:text-heading",
            )}
          >
            Sign up
          </button>
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-1 block text-xs tracking-wide text-dim">Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="cyber-input"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs tracking-wide text-dim">
              Password
            </span>
            <input
              type="password"
              autoComplete={
                mode === "sign-in" ? "current-password" : "new-password"
              }
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="cyber-input"
              placeholder="At least 6 characters"
            />
          </label>

          {error ? (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          ) : null}

          <CyberButton
            type="submit"
            variant="green"
            className="w-full"
            disabled={submitting}
          >
            {submitting
              ? mode === "sign-in"
                ? "Signing in..."
                : "Creating account..."
              : mode === "sign-in"
                ? "Sign in & sync"
                : "Create account & sync"}
          </CyberButton>
        </form>
      </div>
    </TerminalWindow>
  );
}
