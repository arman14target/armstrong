"use client";

import { useTranslation } from "react-i18next";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import { searchFoods, type FoodSearchResult } from "@/lib/foodSearch";

/** Wait for typing to pause before querying USDA. */
const SEARCH_DEBOUNCE_MS = 400;
const MODAL_RESULT_LIMIT = 24;

export type FoodSearchSelection =
  | FoodSearchResult
  | {
      name: string;
    };

interface FoodSearchModalProps {
  open: boolean;
  initialValue?: string;
  onConfirm: (selection: FoodSearchSelection) => void;
  onClose: () => void;
}

export function FoodSearchModal({
  open,
  initialValue = "",
  onConfirm,
  onClose,
}: FoodSearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<FoodSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRequestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery(initialValue);
    setSuggestions([]);
    setSearchError(null);
    setHighlightedIndex(-1);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [initialValue, onClose, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const trimmed = query.trim();
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

      void searchFoods(trimmed, MODAL_RESULT_LIMIT)
        .then((results) => {
          if (searchRequestId.current !== requestId) {
            return;
          }

          setSuggestions(results);
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
              : t("nutrition.searchFailed"),
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
  }, [open, query]);

  if (!open) {
    return null;
  }

  const trimmedQuery = query.trim();

  const commitSelection = (selection: FoodSearchSelection) => {
    if (!selection.name.trim()) {
      return;
    }

    onConfirm(selection);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      commitSelection(suggestions[highlightedIndex]);
      return;
    }

    commitSelection({ name: trimmedQuery });
  };

  const handleInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" && suggestions.length > 0) {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length > 0) {
      event.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex flex-col bg-bg pt-[var(--safe-top)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="food-search-title"
    >
      <div className="panel-header shrink-0 justify-between border-b border-line">
        <div className="inline-flex min-w-0 items-center">
          <PanelDot />
          <span
            id="food-search-title"
            className="ml-[var(--space-inline)] tracking-wide text-cyan"
          >
            {t("nutrition.findFood")}
          </span>
        </div>
        <IconButton
          label={t("nutrition.closeFoodSearch")}
          variant="ghost"
          className="size-8"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </div>

      <form className="flex min-h-0 flex-1 flex-col" onSubmit={handleSubmit}>
        <div className="shrink-0 border-b border-line px-[var(--space-page-x)] py-[var(--space-gap-md)]">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={t("nutrition.foodNamePlaceholder")}
            autoComplete="off"
            enterKeyHint="done"
            className="cyber-input min-h-12 w-full"
            aria-label={t("nutrition.searchFoodsAria")}
          />
          <p className="mt-2 text-xs text-dim">
            {t("nutrition.searchFoodHint")}
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-page-x)] py-[var(--space-gap)]">
          {trimmedQuery.length < 2 ? (
            <p className="px-1 py-2 text-sm text-dim">
              {t("nutrition.searchMinChars")}
            </p>
          ) : searching ? (
            <p className="px-1 py-2 text-sm text-dim">{t("common.searching")}</p>
          ) : searchError ? (
            <p className="px-1 py-2 text-sm text-dim">{searchError}</p>
          ) : suggestions.length > 0 ? (
            <ul className="stack-sm">
              {suggestions.map((result, index) => (
                <li key={result.id}>
                  <button
                    type="button"
                    className={cn(
                      "w-full rounded-cyber border border-line bg-panel px-3 py-3 text-left transition-colors hover:border-cyan/35 hover:bg-cyan/5",
                      index === highlightedIndex &&
                        "border-cyan/35 bg-cyan/10",
                    )}
                    onClick={() => commitSelection(result)}
                  >
                    <span className="block text-sm text-heading">
                      {result.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-dim">
                      {t("nutrition.macros.searchResult", {
                        calories: result.calories,
                        proteinG: result.proteinG,
                        carbsG: result.carbsG,
                        fatG: result.fatG,
                        serving: result.servingNote,
                      })}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 py-2 text-sm text-dim">
              {t("nutrition.noMatches", { query: trimmedQuery })}
            </p>
          )}
        </div>

        <div className="shrink-0 border-t border-line px-[var(--space-page-x)] py-[var(--space-gap-md)] pb-[max(var(--space-gap-md),var(--safe-bottom))]">
          <CyberButton
            type="submit"
            variant="green"
            className="w-full min-h-12"
            disabled={!trimmedQuery}
          >
            {t("nutrition.addMyFood")}
          </CyberButton>
        </div>
      </form>
    </div>
  );
}
