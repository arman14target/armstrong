"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";
import { WelcomeBackButton } from "@/components/welcome/WelcomeBackButton";
import { WelcomeBrand } from "@/components/welcome/WelcomeBrand";
import { formatCoachError, isGeminiConfigured } from "@/lib/gemini";

interface PlainTextPlanScreenProps {
  title: string;
  prompt: string;
  placeholder: string;
  onSubmit: (text: string) => Promise<void>;
  onSkip: () => void;
  onBack: () => void;
}

export function PlainTextPlanScreen({
  title,
  prompt,
  placeholder,
  onSubmit,
  onSkip,
  onBack,
}: PlainTextPlanScreenProps) {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const configured = isGeminiConfigured();

  const handleDone = async () => {
    setError(null);

    if (!configured) {
      setError(t("welcome.aiNotConfigured"));
      return;
    }

    if (!text.trim()) {
      setError(t("welcome.writePlanOrSkip"));
      return;
    }

    setLoading(true);
    try {
      await onSubmit(text);
    } catch (submitError) {
      setError(formatCoachError(submitError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="welcome-onboarding stack-lg">
      <div className="welcome-onboarding__top">
        <div className="welcome-onboarding__toolbar">
          <WelcomeBackButton onClick={onBack} />
          <WelcomeBrand compact />
        </div>
      </div>

      <div className="welcome-panel stack-md">
        <h2 className="welcome-panel__title">{title}</h2>
        <p className="welcome-panel__copy">{prompt}</p>

        <label className="stack-sm">
          <span className="text-[11px] tracking-wide text-dim uppercase">
            {t("welcome.yourPlanLabel")}
          </span>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
            rows={12}
            spellCheck={false}
            disabled={loading}
            className="cyber-input min-h-60 w-full resize-y font-mono text-xs leading-relaxed sm:text-sm"
          />
        </label>

        {error ? (
          <p className="text-xs text-magenta" role="alert">
            {error}
          </p>
        ) : null}

        <div className="stack-sm">
          <CyberButton
            variant="magenta"
            className="w-full min-h-[3.25rem] text-base"
            onClick={handleDone}
            disabled={loading}
          >
            {loading ? t("welcome.buildingPlan") : t("common.done")}
          </CyberButton>

          <button
            type="button"
            className="welcome-choice__login-link w-full py-2"
            onClick={onSkip}
            disabled={loading}
          >
            {t("common.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
