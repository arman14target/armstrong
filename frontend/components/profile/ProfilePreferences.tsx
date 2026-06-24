"use client";

import { useTranslation } from "react-i18next";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { useGymStore } from "@/hooks/useGymStore";
import { cn } from "@/lib/cn";
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "@/lib/i18n/locales";
import { resolveAppLocale } from "@/lib/i18n/detectLocale";
import type { WeightUnit } from "@/lib/types";

function SegToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-grid auto-cols-fr grid-flow-col gap-1 rounded-cyber border border-line p-0.5"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-[5px] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors",
            value === opt.value
              ? "bg-primary/15 text-primary"
              : "text-dim hover:text-heading",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function ProfilePreferences() {
  const { t } = useTranslation();
  const { data, setWeightUnit, setAdvancedNutrition, setLocale } = useGymStore();
  const unit: WeightUnit = data.weightUnit ?? "kg";
  const advanced = data.advancedNutrition === true;
  const locale = resolveAppLocale(data.locale);

  return (
    <TerminalWindow title={t("profile.preferences")}>
      <div className="stack-md">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm text-heading">{t("profile.language")}</p>
            <p className="mt-0.5 text-xs text-dim">{t("profile.languageHint")}</p>
          </div>
          <label className="shrink-0">
            <span className="sr-only">{t("profile.language")}</span>
            <select
              value={locale}
              onChange={(event) => setLocale(event.target.value as AppLocale)}
              className="cyber-input max-w-[11rem] py-1.5 text-xs"
            >
              {SUPPORTED_LOCALES.map((code) => (
                <option key={code} value={code}>
                  {LOCALE_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-sm text-heading">{t("profile.weightUnit")}</p>
            <p className="mt-0.5 text-xs text-dim">{t("profile.weightUnitHint")}</p>
          </div>
          <SegToggle
            ariaLabel={t("profile.weightUnit")}
            options={[
              { value: "kg", label: "kg" },
              { value: "lb", label: "lb" },
            ]}
            value={unit}
            onChange={(next) => setWeightUnit(next)}
          />
        </div>

        <div className="flex items-start justify-between gap-3 border-t border-line pt-3">
          <div>
            <p className="text-sm text-heading">{t("profile.advancedNutrition")}</p>
            <p className="mt-0.5 text-xs text-dim">
              {t("profile.advancedNutritionHint")}
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={advanced}
              onChange={(event) => setAdvancedNutrition(event.target.checked)}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={cn(
                "relative h-6 w-10 rounded-full border transition-colors",
                advanced
                  ? "border-primary/50 bg-primary/20"
                  : "border-line bg-bg/50",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 size-5 rounded-full bg-heading transition-transform",
                  advanced && "translate-x-4",
                )}
              />
            </span>
          </label>
        </div>
      </div>
    </TerminalWindow>
  );
}
