"use client";

import { useEffect, useRef } from "react";
import {
  getGoogleClientId,
  loadGoogleIdentityScript,
} from "@/lib/googleAuth";

interface GoogleSignInButtonProps {
  onCredential: (idToken: string) => void;
  disabled?: boolean;
}

export function GoogleSignInButton({
  onCredential,
  disabled = false,
}: GoogleSignInButtonProps) {
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
            const credential = response.credential;
            if (credential) {
              onCredentialRef.current(credential);
            }
          },
        });

        window.google.accounts.id.renderButton(container, {
          type: "standard",
          theme: "outline",
          size: "large",
          text: "continue_with",
          width: container.offsetWidth || 320,
        });
      })
      .catch(() => {
        // Parent can show a generic error if sign-in never becomes available.
      });

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
