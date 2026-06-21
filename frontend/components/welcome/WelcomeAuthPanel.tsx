"use client";

import { useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { CyberButton } from "@/components/ui/CyberButton";
import { WelcomeBackButton } from "@/components/welcome/WelcomeBackButton";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { useAuth } from "@/contexts/AuthContext";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";

interface WelcomeAuthPanelProps {
  onBack: () => void;
  onSuccess: () => void;
}

type AuthMode = "sign-in" | "sign-up";

export function WelcomeAuthPanel({ onBack, onSuccess }: WelcomeAuthPanelProps) {
  const { configured, googleConfigured, appleConfigured, signIn, signUp, signInWithGoogle, signInWithApple } =
    useAuth();
  const { syncAfterAuth } = useGymStore();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const finishAuth = async (userId: string, authMode: AuthMode) => {
    await syncAfterAuth(userId, authMode);
    onSuccess();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const { error: authError, userId } =
        mode === "sign-in"
          ? await signIn(email, password)
          : await signUp(email, password);

      if (authError) {
        setError(authError);
        return;
      }

      if (!userId) {
        setError("Could not start your session. Please try again.");
        return;
      }

      await finishAuth(userId, mode);
      setPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocial = async (
    result: { error: string | null; userId: string | null },
  ) => {
    if (result.error) {
      setError(result.error);
      return;
    }

    if (!result.userId) {
      setError("Could not start your session. Please try again.");
      return;
    }

    await finishAuth(result.userId, "sign-in");
  };

  if (!configured) {
    return (
      <div className="welcome-panel stack-md">
        <WelcomeBackButton onClick={onBack} />
        <WelcomeBrand compact />
        <p className="text-sm text-dim">
          Cloud login is not configured on this build. You can still use Armstrong locally.
        </p>
        <CyberButton variant="cyan" onClick={onSuccess}>
          Continue without account
        </CyberButton>
      </div>
    );
  }

  return (
    <div className="welcome-panel stack-md">
      <div className="welcome-onboarding__toolbar">
        <WelcomeBackButton onClick={onBack} />
        <WelcomeBrand compact />
      </div>

      <div>
        <h2 className="welcome-panel__title">
          {mode === "sign-in" ? "Sign in" : "Create account"}
        </h2>
        <p className="welcome-panel__copy">
          Pick up your saved workouts and diet plan on any device.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-cyber border border-line p-1">
        {(["sign-in", "sign-up"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={cn(
              "rounded-cyber px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors",
              mode === value
                ? "bg-cyan/15 text-cyan"
                : "text-dim hover:text-heading",
            )}
          >
            {value === "sign-in" ? "Sign in" : "Sign up"}
          </button>
        ))}
      </div>

      <form className="stack-md" onSubmit={handleSubmit}>
        <label className="stack-xs">
          <span className="text-xs uppercase tracking-wide text-dim">Email</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="welcome-input"
          />
        </label>

        <label className="stack-xs">
          <span className="text-xs uppercase tracking-wide text-dim">Password</span>
          <input
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="welcome-input"
          />
        </label>

        {error ? <p className="text-sm text-magenta">{error}</p> : null}

        <CyberButton variant="cyan" type="submit" disabled={submitting}>
          {submitting ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}
        </CyberButton>
      </form>

      {googleConfigured || appleConfigured ? (
        <div className="stack-sm">
          <p className="text-center text-xs uppercase tracking-wide text-dim">Or continue with</p>
          <div className="flex flex-col gap-[var(--space-gap)]">
            {googleConfigured ? (
              <GoogleSignInButton
                disabled={submitting}
                onCredential={async (idToken) => {
                  setSubmitting(true);
                  setError(null);
                  try {
                    await handleSocial(await signInWithGoogle(idToken));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            ) : null}
            {appleConfigured ? (
              <AppleSignInButton
                disabled={submitting}
                onToken={async (identityToken) => {
                  setSubmitting(true);
                  setError(null);
                  try {
                    await handleSocial(await signInWithApple(identityToken));
                  } finally {
                    setSubmitting(false);
                  }
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
