"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";

interface ImportPlanButtonProps {
  onImport: () => void;
  label?: string;
  className?: string;
}

export function ImportPlanButton({
  onImport,
  label,
  className,
}: ImportPlanButtonProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [imported, setImported] = useState(false);
  const buttonLabel = label ?? t("planner.import.default");

  const handleImport = () => {
    onImport();
    setImported(true);
    router.push("/app/");
  };

  return (
    <CyberButton
      variant="green"
      className={className}
      onClick={handleImport}
      aria-live="polite"
    >
      {imported ? t("planner.import.opening") : buttonLabel}
    </CyberButton>
  );
}
