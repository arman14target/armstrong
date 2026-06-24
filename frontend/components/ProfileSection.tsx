"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { AppleSignInButton } from "@/components/AppleSignInButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/cn";
import type { SyncAuthMode } from "@/lib/userPlanSync";

interface ProfileSectionProps {
  onAuthSuccess: (userId: string, mode: SyncAuthMode) => Promise<void>;
  onClearData: () => Promise<void>;
  openSignupRequestId?: number;
}

type AuthMode = "sign-in" | "sign-up";

function MailIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function ProfileSection({
  onAuthSuccess,
  onClearData,
  openSignupRequestId = 0,
}: ProfileSectionProps) {
  const { t } = useTranslation();
  const {
    configured,
    googleConfigured,
    appleConfigured,
    user,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithApple,
    signOut,
  } = useAuth();
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    if (openSignupRequestId > 0) {
      setMode("sign-up");
      setError(null);
    }
  }, [openSignupRequestId]);

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
        setError(t("auth.sessionError"));
        return;
      }

      await onAuthSuccess(userId, mode);
      setPassword("");
    } catch {
      setError(t("auth.genericError"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSocialResult = async (result: {
    error: string | null;
    userId: string | null;
  }) => {
    if (result.error) {
      setError(result.error);
      return;
    }
    if (!result.userId) {
      setError(t("auth.sessionError"));
      return;
    }
    await onAuthSuccess(result.userId, "sign-in");
  };

  const handleGoogleCredential = async (idToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await handleSocialResult(await signInWithGoogle(idToken));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleToken = async (identityToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await handleSocialResult(await signInWithApple(identityToken));
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
      <TerminalWindow title={t("profile.title")}>
        <p className="text-sm text-dim">{t("profile.checkingSession")}</p>
      </TerminalWindow>
    );
  }

  if (!configured) {
    return (
      <TerminalWindow title={t("profile.title")}>
        <p className="text-sm leading-relaxed text-dim">
          {t("profile.cloudNotConfiguredIntro")}{" "}
          <span className="text-cyan">NEXT_PUBLIC_API_URL</span>{" "}
          {t("profile.cloudNotConfiguredOutro")}
        </p>
      </TerminalWindow>
    );
  }

  if (user) {
    return (
      <>
        <TerminalWindow title={t("profile.yourAccount")}>
          <div className="stack-md">
            <div>
              <p className="text-xs uppercase tracking-wide text-dim">{t("profile.signedInLabel")}</p>
              <p className="mt-1 text-sm text-heading">{user.email}</p>
            </div>

            <p className="text-sm leading-relaxed text-dim">
              {t("profile.syncedHint")}
            </p>

            <div className="flex flex-col gap-[var(--space-gap)] sm:flex-row">
              <CyberButton
                variant="cyan"
                className="w-full sm:w-auto"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? t("profile.signingOut") : t("auth.signOut")}
              </CyberButton>
              <CyberButton
                variant="magenta"
                className="w-full sm:w-auto"
                onClick={() => setShowClearModal(true)}
                disabled={clearing}
              >
                {t("auth.clearData")}
              </CyberButton>
            </div>
          </div>
        </TerminalWindow>

        <ConfirmModal
          open={showClearModal}
          title={t("profile.clearEverything")}
          message={
            <>
              {t("profile.clearEverythingMessage", {
                cloud: user ? t("profile.clearEverythingCloud") : "",
              })}
              <span className="mt-[var(--space-gap)] block font-semibold text-magenta">
                {t("profile.cannotUndo")}
              </span>
            </>
          }
          confirmLabel={t("profile.clearEverythingConfirm")}
          cancelLabel={t("profile.keepMyData")}
          confirming={clearing}
          onConfirm={handleClearConfirm}
          onCancel={() => setShowClearModal(false)}
        />
      </>
    );
  }

  return (
    <TerminalWindow title={mode === "sign-in" ? t("auth.signIn") : t("profile.createAccountTitle")}>
      <div className="stack-md">
        <p className="text-sm leading-relaxed text-dim">
          {t("profile.freeUseHint")}
        </p>

        <div className="grid grid-cols-2 gap-1 rounded-cyber border border-line p-1">
          {(["sign-in", "sign-up"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setError(null);
              }}
              className={cn(
                "rounded-[4px] px-3 py-2 text-xs font-medium uppercase tracking-wide transition-colors",
                mode === m
                  ? "bg-primary/15 text-primary"
                  : "text-dim hover:text-heading",
              )}
            >
              {m === "sign-in" ? t("auth.signIn") : t("auth.signUp")}
            </button>
          ))}
        </div>

        <form className="stack-md" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span className="auth-field__icon">
              <MailIcon />
            </span>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="auth-field__input"
              placeholder="you@example.com"
            />
          </label>

          <label className="auth-field">
            <span className="auth-field__icon">
              <LockIcon />
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
              className="auth-field__input"
              placeholder={t("profile.passwordPlaceholder")}
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
                ? t("profile.signingIn")
                : t("profile.creatingAccount")
              : mode === "sign-in"
                ? t("profile.signInSync")
                : t("profile.createAccountSync")}
          </CyberButton>
        </form>

        {(googleConfigured || appleConfigured) && (
          <div className="stack-md">
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-line" />
              <span className="text-[11px] uppercase tracking-wide text-dim">
                {t("auth.orContinueWith")}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
            {googleConfigured && (
              <GoogleSignInButton
                onCredential={handleGoogleCredential}
                onError={setError}
                disabled={submitting}
              />
            )}
            {appleConfigured && (
              <AppleSignInButton
                onToken={handleAppleToken}
                onError={setError}
                disabled={submitting}
              />
            )}
          </div>
        )}
      </div>
    </TerminalWindow>
  );
}
