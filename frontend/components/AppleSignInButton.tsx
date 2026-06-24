"use client";

import { useTranslation } from "react-i18next";
import { useState } from "react";
import { appleWebSignIn } from "@/lib/appleAuth";
import { isNativePlatform, nativeAppleSignIn } from "@/lib/nativeSocialAuth";

interface AppleSignInButtonProps {
  onToken: (identityToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function AppleSignInButton({
  onToken,
  onError,
  disabled = false,
}: AppleSignInButtonProps) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      // Native iOS uses the system Apple sign-in; web uses the Apple JS popup.
      const token = isNativePlatform()
        ? await nativeAppleSignIn()
        : await appleWebSignIn();
      onToken(token);
    } catch (e) {
      onError?.(
        e instanceof Error ? e.message : t("auth.appleSignInFailed"),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-cyber border border-white/20 bg-black text-sm font-medium text-white transition-colors hover:bg-black/80 disabled:opacity-50"
    >
      <svg width="14" height="16" viewBox="0 0 14 16" fill="currentColor" aria-hidden>
        <path d="M11.7 8.5c0-1.7 1.4-2.5 1.5-2.6-.8-1.2-2-1.3-2.5-1.4-1-.1-2 .6-2.5.6s-1.3-.6-2.2-.6c-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.7.8 0 1.2-.5 2.2-.5s1.3.5 2.2.5c.9 0 1.5-.8 2-1.6.7-.9.9-1.8.9-1.9 0 0-1.8-.7-1.8-2.6zM10 3.3c.5-.6.8-1.3.7-2.1-.7 0-1.5.5-1.9 1-.4.5-.8 1.2-.7 2 .8 0 1.5-.4 1.9-.9z" />
      </svg>
      {busy ? t("auth.signingInEllipsis") : t("auth.continueApple")}
    </button>
  );
}
