"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CyberButton } from "@/components/ui/CyberButton";

interface ImportPlanButtonProps {
  onImport: () => void;
  label?: string;
  className?: string;
}

export function ImportPlanButton({
  onImport,
  label = "Add plan to app",
  className,
}: ImportPlanButtonProps) {
  const router = useRouter();
  const [imported, setImported] = useState(false);

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
      {imported ? "Opening app…" : label}
    </CyberButton>
  );
}
