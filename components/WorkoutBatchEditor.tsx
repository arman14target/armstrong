"use client";

import { useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { cn } from "@/lib/cn";
import {
  EXERCISE_LINE_FORMAT_HINT,
  createEmptyExerciseRow,
  getExerciseLineErrorMessage,
  isExerciseRowEmpty,
  normalizeRestInput,
  normalizeSetsInput,
  presetToExerciseRow,
  validateExerciseRow,
  type ExerciseRowInput,
} from "@/lib/parseExerciseLine";
import {
  BatchExercisePreset,
  WorkoutBatch,
} from "@/lib/workoutBatches";

interface ExerciseRowState extends ExerciseRowInput {
  id: string;
}

interface WorkoutBatchEditorProps {
  batch: WorkoutBatch;
  importLabel?: string;
  onImport: (exercises: BatchExercisePreset[]) => void;
  className?: string;
}

function createRowFromPreset(preset: BatchExercisePreset): ExerciseRowState {
  return {
    id: crypto.randomUUID(),
    ...presetToExerciseRow(preset),
  };
}

function createBlankRow(): ExerciseRowState {
  return {
    id: crypto.randomUUID(),
    ...createEmptyExerciseRow(),
  };
}

type ExerciseField = keyof ExerciseRowInput;

const FIELD_PLACEHOLDERS: Record<ExerciseField, string> = {
  name: "chest press",
  sets: "3 sets",
  rest: "1 min",
};

export function WorkoutBatchEditor({
  batch,
  importLabel = "Import all",
  onImport,
  className,
}: WorkoutBatchEditorProps) {
  const [rows, setRows] = useState<ExerciseRowState[]>(() => [
    ...batch.exercises.map(createRowFromPreset),
    createBlankRow(),
  ]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validations = useMemo(
    () => rows.map((row) => validateExerciseRow(row)),
    [rows],
  );

  const filledValidations = validations.filter(
    (_, index) => !isExerciseRowEmpty(rows[index]),
  );
  const allFilledValid = filledValidations.every((validation) => validation.valid);
  const hasAtLeastOneExercise = filledValidations.some(
    (validation) => validation.valid,
  );

  const updateField = (
    rowId: string,
    field: ExerciseField,
    value: string,
  ) => {
    setRows((current) =>
      current.map((row) =>
        row.id === rowId ? { ...row, [field]: value } : row,
      ),
    );
  };

  const markTouched = (rowId: string, field: ExerciseField) => {
    setTouched((current) => ({
      ...current,
      [`${rowId}:${field}`]: true,
    }));
  };

  const handleFieldBlur = (rowId: string, field: ExerciseField) => {
    markTouched(rowId, field);

    setRows((current) =>
      current.map((row) => {
        if (row.id !== rowId) {
          return row;
        }

        if (field === "sets") {
          return { ...row, sets: normalizeSetsInput(row.sets) };
        }

        if (field === "rest") {
          return { ...row, rest: normalizeRestInput(row.rest) };
        }

        return row;
      }),
    );
  };

  const addRow = () => {
    setRows((current) => [...current, createBlankRow()]);
  };

  const removeRow = (rowId: string) => {
    setRows((current) => {
      const next = current.filter((row) => row.id !== rowId);
      return next.length > 0 ? next : [createBlankRow()];
    });
  };

  const shouldShowFieldError = (
    rowIndex: number,
    field: ExerciseField,
    rowId: string,
  ) => {
    const validation = validations[rowIndex];
    if (validation.empty || validation.valid) {
      return false;
    }

    const fieldTouched = touched[`${rowId}:${field}`];
    const rowHasContent = !isExerciseRowEmpty(rows[rowIndex]);

    return submitAttempted || fieldTouched || rowHasContent;
  };

  const handleImportAll = () => {
    setSubmitAttempted(true);
    setTouched((current) => {
      const next = { ...current };
      rows.forEach((row) => {
        next[`${row.id}:name`] = true;
        next[`${row.id}:sets`] = true;
        next[`${row.id}:rest`] = true;
      });
      return next;
    });

    if (!hasAtLeastOneExercise || !allFilledValid) {
      return;
    }

    const exercises = validations
      .map((validation) => validation.parsed)
      .filter((preset): preset is BatchExercisePreset => preset !== undefined);

    onImport(exercises);
  };

  return (
    <div className={cn("stack-md", className)}>
      <div>
        <p className="text-sm font-semibold text-heading">{batch.name}</p>
        <p className="mt-1 text-xs text-dim">{batch.description}</p>
        <p className="mt-[var(--space-gap)] rounded-cyber border border-line/70 bg-bg/40 px-[var(--space-inline)] py-[var(--space-gap)] text-xs text-dim">
          Format: <span className="text-cyan">{EXERCISE_LINE_FORMAT_HINT}</span>
        </p>
      </div>

      <div className="stack-sm">
        {rows.map((row, index) => {
          const validation = validations[index];
          const rowError = getExerciseLineErrorMessage(validation.errors);

          return (
            <div
              key={row.id}
              className="rounded-cyber border border-line/70 bg-bg/40 p-[var(--space-panel)]"
            >
              <div className="mb-[var(--space-gap)] flex items-center justify-between gap-[var(--space-gap)]">
                <span className="text-[11px] tracking-wide text-dim uppercase">
                  Exercise {index + 1}
                </span>
                <IconButton
                  label={`Remove exercise ${index + 1}`}
                  variant="danger"
                  className="size-8"
                  onClick={() => removeRow(row.id)}
                >
                  <TrashIcon />
                </IconButton>
              </div>

              <div className="inline-gap items-center">
                {(["name", "sets", "rest"] as ExerciseField[]).map(
                  (field, fieldIndex) => {
                    const showError = shouldShowFieldError(
                      index,
                      field,
                      row.id,
                    );
                    const fieldError = validation.errors[field];

                    return (
                      <div
                        key={field}
                        className={cn(
                          "inline-flex min-w-0 items-center gap-[var(--space-gap)]",
                          field === "name" ? "flex-1 basis-40" : "shrink-0",
                        )}
                      >
                        {fieldIndex > 0 ? (
                          <span
                            aria-hidden
                            className="text-sm font-semibold text-cyan"
                          >
                            -
                          </span>
                        ) : null}
                        <div className={cn(field === "name" ? "w-full" : "w-28")}>
                          <input
                            type="text"
                            value={row[field]}
                            placeholder={FIELD_PLACEHOLDERS[field]}
                            onChange={(event) =>
                              updateField(row.id, field, event.target.value)
                            }
                            onBlur={() => handleFieldBlur(row.id, field)}
                            spellCheck={false}
                            className={cn(
                              "cyber-input min-h-10 w-full font-mono text-xs sm:text-sm",
                              field !== "name" && "text-center",
                              showError &&
                                fieldError &&
                                "border-magenta/60",
                            )}
                            aria-invalid={showError && Boolean(fieldError)}
                          />
                          {showError && fieldError ? (
                            <p className="mt-1 text-[11px] text-magenta" role="alert">
                              {fieldError}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  },
                )}
              </div>

              {submitAttempted &&
              !validation.empty &&
              !validation.valid &&
              rowError &&
              !validation.errors.name &&
              !validation.errors.sets &&
              !validation.errors.rest ? (
                <p className="mt-[var(--space-gap)] text-xs text-magenta" role="alert">
                  {rowError}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <IconButton label="Add exercise" variant="ghost" onClick={addRow}>
          <PlusIcon />
        </IconButton>
      </div>

      <CyberButton variant="green" className="w-full" onClick={handleImportAll}>
        {importLabel}
      </CyberButton>

      {submitAttempted && !hasAtLeastOneExercise ? (
        <p className="text-center text-xs text-magenta" role="alert">
          Add at least one exercise before importing.
        </p>
      ) : null}
    </div>
  );
}
