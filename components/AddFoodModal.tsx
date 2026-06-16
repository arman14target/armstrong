"use client";

import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import { searchFoods, type FoodSearchResult } from "@/lib/foodSearch";
import type { FoodEntry } from "@/lib/nutrition";

/** Wait for typing to pause before querying USDA. */
const SEARCH_DEBOUNCE_MS = 400;

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

export function AddFoodModal({ open, onAdd, onClose }: AddFoodModalProps) {
  const [name, setName] = useState("");
  const [calories, setCalories] = useState("");
  const [proteinG, setProteinG] = useState("");
  const [carbsG, setCarbsG] = useState("");
  const [fatG, setFatG] = useState("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [suggestions, setSuggestions] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRequestId = useRef(0);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setName("");
      setCalories("");
      setProteinG("");
      setCarbsG("");
      setFatG("");
      setErrors({});
      setSuggestions([]);
      setSearching(false);
      setSearchError(null);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
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

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setSearching(false);
      setSearchError(null);
      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setSearching(false);
    setSearchError(null);

    const timeoutId = window.setTimeout(() => {
      setSearching(true);

      void searchFoods(trimmed)
        .then((results) => {
          if (searchRequestId.current !== requestId) {
            return;
          }

          setSuggestions(results);
          setShowSuggestions(results.length > 0);
          setHighlightedIndex(-1);
        })
        .catch((error: unknown) => {
          if (searchRequestId.current !== requestId) {
            return;
          }

          setSuggestions([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : "Food search failed. Try again.",
          );
        })
        .finally(() => {
          if (searchRequestId.current === requestId) {
            setSearching(false);
          }
        });
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [name, open]);

  useEffect(() => {
    return () => {
      if (blurTimeoutRef.current) {
        clearTimeout(blurTimeoutRef.current);
      }
    };
  }, []);

  if (!open) {
    return null;
  }

  const applySuggestion = (result: FoodSearchResult) => {
    setName(result.name);
    setCalories(formatMacro(result.calories));
    setProteinG(formatMacro(result.proteinG));
    setCarbsG(formatMacro(result.carbsG));
    setFatG(formatMacro(result.fatG));
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setErrors({});
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

  const handleNameKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
      return;
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      applySuggestion(suggestions[highlightedIndex]);
      return;
    }

    if (event.key === "Escape") {
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
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
            Search for a meal to auto-fill nutrition, or type any food name and
            enter protein yourself.
          </p>

          <label className="mt-[var(--space-gap-md)] block">
            <FieldLabel required>Food name</FieldLabel>
            <div className="relative">
              <input
                type="text"
                value={name}
                required
                onChange={(event) => {
                  setName(event.target.value);
                  setShowSuggestions(true);
                  if (errors.name) {
                    setErrors((prev) => ({ ...prev, name: false }));
                  }
                }}
                onFocus={() => {
                  if (blurTimeoutRef.current) {
                    clearTimeout(blurTimeoutRef.current);
                  }
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onBlur={() => {
                  blurTimeoutRef.current = setTimeout(() => {
                    setShowSuggestions(false);
                    setHighlightedIndex(-1);
                  }, 150);
                }}
                onKeyDown={handleNameKeyDown}
                placeholder="e.g. Chicken rice bowl"
                autoFocus
                autoComplete="off"
                role="combobox"
                aria-expanded={showSuggestions}
                aria-autocomplete="list"
                aria-controls="food-suggestions-list"
                className={cn(
                  "cyber-input",
                  errors.name && "border-magenta/60",
                )}
                aria-invalid={errors.name}
              />

              {showSuggestions && (searching || suggestions.length > 0) ? (
                <ul
                  id="food-suggestions-list"
                  role="listbox"
                  className="absolute z-10 mt-1 max-h-52 w-full overflow-y-auto rounded-cyber border border-line bg-panel shadow-[var(--shadow-panel)]"
                >
                  {searching ? (
                    <li className="px-3 py-2 text-xs text-dim">Searching...</li>
                  ) : (
                    suggestions.map((result, index) => (
                      <li
                        key={result.id}
                        role="option"
                        aria-selected={index === highlightedIndex}
                      >
                        <button
                          type="button"
                          className={cn(
                            "w-full px-3 py-2 text-left transition-colors hover:bg-cyan/10",
                            index === highlightedIndex && "bg-cyan/10",
                          )}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            applySuggestion(result);
                          }}
                        >
                          <span className="block text-sm text-heading">
                            {result.name}
                          </span>
                          <span className="mt-0.5 block text-[11px] text-dim">
                            {result.calories} kcal · P {result.proteinG}g · C{" "}
                            {result.carbsG}g · F {result.fatG}g ·{" "}
                            {result.servingNote}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
            {errors.name ? (
              <p className="mt-1 text-xs text-magenta" role="alert">
                Enter a name with at least 2 characters.
              </p>
            ) : null}
            {searchError ? (
              <p className="mt-1 text-xs text-dim">{searchError}</p>
            ) : null}
          </label>

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
  );
}
