"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { CyberButton } from "@/components/ui/CyberButton";
import { cn } from "@/lib/cn";
import { extractWorkoutFromText } from "@/lib/workoutTextImport";
import { BatchExercisePreset, WorkoutBatch } from "@/lib/workoutBatches";

interface WorkoutBatchEditorProps {
  batch: WorkoutBatch;
  importLabel?: string;
  onImport: (exercises: BatchExercisePreset[]) => void;
  className?: string;
}

const EXAMPLE_TEXT = `Bench press 4x8 @ 80kg, 90s rest
Incline dumbbell press 3x10
Cable fly 3x15
Overhead press 3x8
Plank 3x45 seconds, 30s rest
Tricep pushdown 3x12`;

export function WorkoutBatchEditor({
  batch,
  importLabel,
  onImport,
  className,
}: WorkoutBatchEditorProps) {
  const { t } = useTranslation();
  const resolvedImportLabel = importLabel ?? t("batch.importWorkout");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImport = async () => {
    setError(null);

    if (!text.trim()) {
      setError(t("batch.describeBeforeImport"));
      return;
    }

    setLoading(true);
    try {
      const exercises = await extractWorkoutFromText(text);
      onImport(exercises);
    } catch (importError) {
      setError(
        importError instanceof Error
          ? importError.message
          : t("batch.importFailed"),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cn("stack-md", className)}>
      <div>
        <p className="text-sm font-semibold text-heading">{batch.name}</p>
        <p className="mt-1 text-xs text-dim">{batch.description}</p>
        <p className="mt-[var(--space-gap)] text-xs text-dim">
          {t("batch.plainLanguageHint")}
        </p>
      </div>

      <label className="stack-sm">
        <span className="text-[11px] tracking-wide text-dim uppercase">
          {t("batch.yourProgram")}
        </span>
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={EXAMPLE_TEXT}
          rows={8}
          spellCheck={false}
          disabled={loading}
          className="cyber-input min-h-40 w-full resize-y font-mono text-xs leading-relaxed sm:text-sm"
        />
      </label>

      {error ? (
        <p className="text-xs text-magenta" role="alert">
          {error}
        </p>
      ) : null}

      <CyberButton
        variant="green"
        className="w-full"
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? t("batch.parsing") : resolvedImportLabel}
      </CyberButton>
    </div>
  );
}
