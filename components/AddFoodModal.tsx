"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import {
  FoodSearchModal,
  type FoodSearchSelection,
} from "@/components/FoodSearchModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import type { FoodSearchResult } from "@/lib/foodSearch";
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

function parseMacroOrZero(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) {
    return 0;
  }

  const parsed = Number.parseFloat(trimmed);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed);
}

function formatMacro(value: number): string {
  return String(Math.round(value));
}

function FieldLabel({
  children,
  required = false,
}: {
  children: string;
  required?: boolean;
}) {
  return (
    <span className="mb-1 block text-xs tracking-wide text-dim uppercase">
      {children}
      {required ? <span className="text-magenta"> *</span> : null}
    </span>
  );
}

function isFoodSearchResult(
  selection: FoodSearchSelection,
): selection is FoodSearchResult {
  return "calories" in selection;
}

export function AddFoodModal({ open, onAdd, onClose }: AddFoodModalProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [foodSearchOpen, setFoodSearchOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setErrors({});
      setFoodSearchOpen(false);
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !foodSearchOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [foodSearchOpen, onClose, open]);

  if (!open) {
    return null;
  }

  const applyFoodSelection = (selection: FoodSearchSelection) => {
    if (isFoodSearchResult(selection)) {
      setName(selection.name);
      setCalories(formatMacro(selection.calories));
      setProteinG(formatMacro(selection.proteinG));
      setCarbsG(formatMacro(selection.carbsG));
      setFatG(formatMacro(selection.fatG));
    } else {
      setName(selection.name.trim());
    }

    setErrors({});
    setFoodSearchOpen(false);
  };

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const proteinValue = Number.parseFloat(proteinG);
    const nextErrors: Record<string, boolean> = {};

    if (trimmedName.length < 2) {
      nextErrors.name = true;
    }
    if (!Number.isFinite(proteinValue) || proteinValue <= 0) {
      nextErrors.proteinG = true;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAdd({
      name: trimmedName,
      calories: parseMacroOrZero(calories),
      proteinG: Math.round(proteinValue),
      carbsG: parseMacroOrZero(carbsG),
      fatG: parseMacroOrZero(fatG),
    });
    onClose();
  };

  return (
    <>
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
              Search for a meal to auto-fill nutrition, or type any food name and
              enter protein yourself.
            </p>

            <div className="mt-[var(--space-gap-md)] block">
              <FieldLabel required>Food name</FieldLabel>
              <button
                type="button"
                onClick={() => setFoodSearchOpen(true)}
                className={cn(
                  "cyber-input flex min-h-12 w-full items-center text-left",
                  name ? "text-heading" : "text-dim",
                  errors.name && "border-magenta/60",
                )}
                aria-invalid={errors.name}
              >
                {name.trim() || "e.g. Chicken rice bowl"}
              </button>
              {errors.name ? (
                <p className="mt-1 text-xs text-magenta" role="alert">
                  Enter a name with at least 2 characters.
                </p>
              ) : null}
            </div>

            <label className="mt-[var(--space-gap)] block">
              <FieldLabel>Calories (kcal)</FieldLabel>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={calories}
                onChange={(event) => setCalories(event.target.value)}
                placeholder="450"
                className="cyber-input"
              />
            </label>

            <div className="mt-[var(--space-gap)] grid grid-cols-3 gap-[var(--space-gap)]">
              <label className="block">
                <FieldLabel required>Protein (g)</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  required
                  value={proteinG}
                  onChange={(event) => {
                    setProteinG(event.target.value);
                    if (errors.proteinG) {
                      setErrors((prev) => ({ ...prev, proteinG: false }));
                    }
                  }}
                  placeholder="30"
                  className={cn(
                    "cyber-input",
                    errors.proteinG && "border-magenta/60",
                  )}
                  aria-invalid={errors.proteinG}
                />
                {errors.proteinG ? (
                  <p className="mt-1 text-xs text-magenta" role="alert">
                    Protein is required.
                  </p>
                ) : null}
              </label>
              <label className="block">
                <FieldLabel>Carbs (g)</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  value={carbsG}
                  onChange={(event) => setCarbsG(event.target.value)}
                  placeholder="0"
                  className="cyber-input"
                />
              </label>
              <label className="block">
                <FieldLabel>Fat (g)</FieldLabel>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
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

      <FoodSearchModal
        open={foodSearchOpen}
        initialValue={name}
        onConfirm={applyFoodSelection}
        onClose={() => setFoodSearchOpen(false)}
      />
    </>
  );
}
