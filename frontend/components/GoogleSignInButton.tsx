"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState } from "react";
import {
  getGoogleClientId,
  loadGoogleIdentityScript,
} from "@/lib/googleAuth";
import { isNativePlatform, nativeGoogleSignIn } from "@/lib/nativeSocialAuth";

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onCredential,
  onError,
  disabled = false,
}: GoogleSignInButtonProps) {
  const { t } = useTranslation();

  // Native (iOS/Android): the GSI web widget is blocked in webviews — use the
  // Capacitor plugin behind a themed button instead.
  if (isNativePlatform()) {
    return (
      <NativeSocialButton
        label={t("auth.continueGoogle")}
        onClick={nativeGoogleSignIn}
        onToken={onCredential}
        onError={onError}
        disabled={disabled}
      />
    );
  }
  return (
    <GoogleWebButton onCredential={onCredential} disabled={disabled} />
  );
}

function GoogleWebButton({
  onCredential,
  disabled,
}: {
  onCredential: (idToken: string) => void;
  disabled: boolean;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const clientId = getGoogleClientId();
    const container = buttonRef.current;
    if (!clientId || !container || disabled) {
      return;
    }
    let cancelled = false;
    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) {
          return;
        }
        container.replaceChildren();
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response) => {
            if (response.credential) {
              onCredentialRef.current(response.credential);
            }
          },
        });
        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          text: "continue_with",
          width: container.offsetWidth || 320,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      window.google?.accounts?.id.cancel();
    };
  }, [disabled]);

  return (
    <div
      ref={buttonRef}
      className="flex min-h-10 w-full justify-center [&>div]:w-full"
      aria-hidden={disabled}
    />
  );
}

/** Shared themed button for the native plugin paths. */
export function NativeSocialButton({
  label,
  onClick,
  onToken,
  onError,
  disabled,
}: {
  label: string;
  onClick: () => Promise<string>;
  onToken: (token: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const [busy, setBusy] = useState(false);
  const handle = async () => {
    setBusy(true);
    try {
      onToken(await onClick());
    } catch (e) {
      onError?.(e instanceof Error ? e.message : t("auth.signInFailed"));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={handle}
      disabled={disabled || busy}
      className="flex h-10 w-full items-center justify-center gap-2 rounded-cyber border border-line bg-surface text-sm font-medium text-heading transition-colors hover:border-primary/40 disabled:opacity-50"
    >
      {busy ? t("auth.signingInEllipsis") : label}
    </button>
  );
}
