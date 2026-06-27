"use client";

import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { CyberButton } from "@/components/ui/CyberButton";

interface NutritionCaloriesHintSheetProps {
  open: boolean;
  onDismiss: () => void;
}

export function NutritionCaloriesHintSheet({
  open,
  onDismiss,
}: NutritionCaloriesHintSheetProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onDismiss();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onDismiss, open]);

  if (!open || !mounted) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-end justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nutrition-calories-hint-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-bg/55 backdrop-blur-[2px]"
        aria-label={t("nutrition.caloriesHintDismiss")}
        onClick={onDismiss}
      />

      <div className="relative w-full max-w-lg rounded-t-[1.35rem] border border-line border-b-0 bg-panel px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[var(--shadow-modal)]">
        <div
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-line/80"
          aria-hidden="true"
        />

        <h2
          id="nutrition-calories-hint-title"
          className="font-display text-base tracking-wide text-heading"
        >
          {t("nutrition.caloriesHintTitle")}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-dim">
          {t("nutrition.caloriesHintBody")}
        </p>

        <CyberButton
          variant="cyan"
          className="mt-5 w-full"
          onClick={onDismiss}
        >
          {t("nutrition.caloriesHintGotIt")}
        </CyberButton>
      </div>
    </div>,
    document.body,
  );
}
