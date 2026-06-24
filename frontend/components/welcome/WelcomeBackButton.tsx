"use client";

import { useTranslation } from "react-i18next";
import { touchNavHandlers } from "@/lib/touchNav";

interface WelcomeBackButtonProps {
  onClick: () => void;
  label?: string;
}

export function WelcomeBackButton({ onClick, label }: WelcomeBackButtonProps) {
  const { t } = useTranslation();

  return (
    <button type="button" className="welcome-back" {...touchNavHandlers(onClick)}>
      <span className="welcome-back__flash" aria-hidden>
        ‹
      </span>
      {label ?? t("common.back")}
    </button>
  );
}
