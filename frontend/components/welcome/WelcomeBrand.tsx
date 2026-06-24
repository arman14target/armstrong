"use client";

import { useTranslation } from "react-i18next";
import { GlitchText } from "@/components/ui/GlitchText";
import { cn } from "@/lib/cn";

interface WelcomeBrandProps {
  className?: string;
  compact?: boolean;
  loading?: boolean;
}

export function WelcomeBrand({
  className,
  compact = false,
  loading = false,
}: WelcomeBrandProps) {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        "welcome-brand",
        compact && "welcome-brand--compact",
        loading && "welcome-brand--loading",
        className,
      )}
    >
      <GlitchText
        text="ARMSTRONG"
        as="span"
        className={cn(
          "welcome-brand__name",
          !compact && !loading && "welcome-brand__name--hero",
        )}
      />
      {!compact ? (
        <p className="welcome-brand__tagline">{t("brand.tagline")}</p>
      ) : null}
    </div>
  );
}
