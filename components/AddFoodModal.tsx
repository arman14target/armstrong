"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import type { FoodEntry } from "@/lib/nutrition";

export type FoodEntryInput = Pick<
  FoodEntry,
  "name" | "calories" | "proteinG" | "carbsG" | "fatG"
>;

interface AddFoodModalProps {
  open: boolean;
  onAdd: (entry: FoodEntryInput) => void;
  onClose: () => void;
}

function parseOptionalNumber(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }
  return parsed;
}

export function AddFoodModal({ open, onAdd, onClose }: AddFoodModalProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open) {
      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setErrors({});
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const caloriesValue = Number.parseFloat(calories);
    const nextErrors: Record<string, boolean> = {};

    if (trimmedName.length < 2) {
      nextErrors.name = true;
    }
    if (!Number.isFinite(caloriesValue) || caloriesValue <= 0) {
      nextErrors.calories = true;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAdd({
      name: trimmedName,
      calories: Math.round(caloriesValue),
      proteinG: Math.round(parseOptionalNumber(proteinG)),
      carbsG: Math.round(parseOptionalNumber(carbsG)),
      fatG: Math.round(parseOptionalNumber(fatG)),
    });
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-food-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md overflow-hidden rounded-panel border border-cyan/35 bg-panel shadow-[var(--shadow-modal)]">
        <div className="panel-header justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span className="ml-[var(--space-inline)] tracking-wide text-cyan">
              Log food
            </span>
          </div>
          <IconButton
            label="Close add food"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body">
          <h2
            id="add-food-title"
            className="font-display text-lg tracking-wide text-heading"
          >
            What did you eat?
          </h2>
          <p className="mt-[var(--space-gap)] text-sm leading-relaxed text-dim">
            Add the meal and its nutrition so your daily totals stay accurate.
          </p>

          <label className="mt-[var(--space-gap-md)] block">
            <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
              Food name
            </span>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setName(event.target.value);
                if (errors.name) {
                  setErrors((prev) => ({ ...prev, name: false }));
                }
              }}
              placeholder="e.g. Chicken rice bowl"
              autoFocus
              className={cn("cyber-input", errors.name && "border-magenta/60")}
              aria-invalid={errors.name}
            />
            {errors.name ? (
              <p className="mt-1 text-xs text-magenta" role="alert">
                Enter a name with at least 2 characters.
              </p>
            ) : null}
          </label>

          <label className="mt-[var(--space-gap)] block">
            <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
              Calories (kcal)
            </span>
            <input
              type="number"
              inputMode="decimal"
              value={calories}
              onChange={(event) => {
                setCalories(event.target.value);
                if (errors.calories) {
                  setErrors((prev) => ({ ...prev, calories: false }));
                }
              }}
              placeholder="450"
              className={cn(
                "cyber-input",
                errors.calories && "border-magenta/60",
              )}
              aria-invalid={errors.calories}
            />
            {errors.calories ? (
              <p className="mt-1 text-xs text-magenta" role="alert">
                Enter a valid calorie amount.
              </p>
            ) : null}
          </label>

          <div className="mt-[var(--space-gap)] grid grid-cols-3 gap-[var(--space-gap)]">
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                Protein (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={proteinG}
                onChange={(event) => setProteinG(event.target.value)}
                placeholder="0"
                className="cyber-input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                Carbs (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={carbsG}
                onChange={(event) => setCarbsG(event.target.value)}
                placeholder="0"
                className="cyber-input"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
                Fat (g)
              </span>
              <input
                type="number"
                inputMode="decimal"
                value={fatG}
                onChange={(event) => setFatG(event.target.value)}
                placeholder="0"
                className="cyber-input"
              />
            </label>
          </div>

          <div className="mt-[var(--space-section)] stack-sm">
            <CyberButton variant="green" className="w-full" onClick={handleSubmit}>
              Add to log
            </CyberButton>
            <CyberButton variant="cyan" className="w-full" onClick={onClose}>
              Cancel
            </CyberButton>
          </div>
        </div>
      </div>
    </div>
  );
}
