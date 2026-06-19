"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { CloseIcon, InfoIcon } from "@/components/icons/ActionIcons";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import { cn } from "@/lib/cn";
import {
  getPopularExercises,
  searchExercises,
  type ExerciseSearchResult,
} from "@/lib/exerciseSearch";

/** Wait for typing to pause before querying the exercise catalog. */
const SEARCH_DEBOUNCE_MS = 400;
const MODAL_RESULT_LIMIT = 24;

interface ExerciseSearchModalProps {
  open: boolean;
  initialValue?: string;
  title?: string;
  confirmLabel?: string;
  onConfirm: (name: string) => void;
  onClose: () => void;
}

export function ExerciseSearchModal({
  open,
  initialValue = "",
  title = "Find exercise",
  confirmLabel = "Use exercise",
  onConfirm,
  onClose,
}: ExerciseSearchModalProps) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<ExerciseSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [infoSlug, setInfoSlug] = useState<string | null>(null);
  const searchRequestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    setQuery(initialValue);
    setHighlightedIndex(-1);

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
      setSearching(true);
      setSearchError(null);

      void getPopularExercises(MODAL_RESULT_LIMIT)
        .then((results) => {
          setSuggestions(results);
          setHighlightedIndex(-1);
        })
        .catch((error: unknown) => {
          setSuggestions([]);
          setSearchError(
            error instanceof Error
              ? error.message
              : "Exercise search failed. Try again.",
          );
        })
        .finally(() => {
          setSearching(false);
        });

      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setSearching(false);
    setSearchError(null);

    const timeoutId = window.setTimeout(() => {
      setSearching(true);

      void searchExercises(trimmed, MODAL_RESULT_LIMIT)
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
              : "Exercise search failed. Try again.",
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

  const commit = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    onConfirm(trimmed);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
      commit(suggestions[highlightedIndex].name);
      return;
    }

    commit(trimmedQuery);
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
      className="fixed inset-0 z-[100] flex flex-col bg-bg pt-[var(--safe-top)]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="exercise-search-title"
    >
      <div className="panel-header shrink-0 justify-between border-b border-line">
        <div className="inline-flex min-w-0 items-center">
          <PanelDot />
          <span
            id="exercise-search-title"
            className="ml-[var(--space-inline)] tracking-wide text-cyan"
          >
            {title}
          </span>
        </div>
        <IconButton
          label="Close exercise search"
          variant="ghost"
          className="size-8"
          onClick={onClose}
        >
          <CloseIcon />
        </IconButton>
      </div>

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={handleSubmit}
      >
        <div className="shrink-0 border-b border-line px-[var(--space-page-x)] py-[var(--space-gap-md)]">
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search bodybuilding exercises"
            autoComplete="off"
            enterKeyHint="done"
            className="cyber-input min-h-12 w-full"
            aria-label="Search exercises"
          />
          <p className="mt-2 text-xs text-dim">
            Pick a move below, or type your own name and press Enter.
          </p>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-[var(--space-page-x)] py-[var(--space-gap)]">
          {searching ? (
            <p className="px-1 py-2 text-sm text-dim">Searching...</p>
          ) : searchError ? (
            <p className="px-1 py-2 text-sm text-dim">{searchError}</p>
          ) : suggestions.length > 0 ? (
            <ul className="stack-sm">
              {suggestions.map((result, index) => (
                <li key={result.id}>
                  <div
                    className={cn(
                      "flex items-stretch gap-2 rounded-cyber border border-line bg-panel transition-colors",
                      index === highlightedIndex &&
                        "border-cyan/35 bg-cyan/10",
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 px-3 py-3 text-left hover:bg-cyan/5"
                      onClick={() => commit(result.name)}
                    >
                      <span className="block text-sm text-heading">
                        {result.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-dim">
                        {result.primaryMuscle}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center pr-2">
                      <IconButton
                        label={`About ${result.name}`}
                        variant="ghost"
                        className="size-8"
                        onClick={() => setInfoSlug(result.id)}
                      >
                        <InfoIcon />
                      </IconButton>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-1 py-2 text-sm text-dim">
              No matches — press Enter to use &ldquo;{trimmedQuery}&rdquo;
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
            {confirmLabel}
          </CyberButton>
        </div>
      </form>

      <ExerciseInfoModal
        open={infoSlug !== null}
        slug={infoSlug}
        onClose={() => setInfoSlug(null)}
      />
    </div>
  );
}
