"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Move, SetConfig } from "@/lib/types";
import { CloseIcon, InfoIcon, PlusIcon } from "@/components/icons/ActionIcons";
import { ExerciseInfoModal } from "@/components/ExerciseInfoModal";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";
import { SetRestDivider } from "@/components/SetRestDivider";
import { SetRow } from "@/components/SetRow";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { IconButton } from "@/components/ui/IconButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { formatRestLabel } from "@/lib/formatSetDisplay";
import { findCatalogExerciseByName } from "@/lib/exerciseSearch";
import { isTimeBasedExercise } from "@/lib/timeBasedExercises";

interface MoveCardProps {
  move: Move;
  sessionWeights: Record<string, number>;
  sessionReps: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
  collapsed?: boolean;
  dragHandle?: React.ReactNode;
  onUpdateName: (name: string) => void;
  onDelete: () => void;
  onAddSet: () => void;
  onUpdateSet: (setId: string, updates: Partial<SetConfig>) => void;
  onCompleteSet: (
    setId: string,
    weight: number,
    reps: number,
    restSeconds: number,
  ) => void;
  onUncompleteSet?: (setId: string) => void;
  onDeleteSet: (setId: string) => void;
  onRestComplete: (setId: string) => void;
  onAllSetsComplete?: () => void;
}

export function MoveCard({
  move,
  sessionWeights,
  sessionReps,
  completedSetIds,
  activeRestSetId,
  restEndsAt,
  collapsed = false,
  dragHandle,
  onUpdateName,
  onDelete,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onUncompleteSet,
  onDeleteSet,
  onRestComplete,
  onAllSetsComplete,
}: MoveCardProps) {
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [catalogSlug, setCatalogSlug] = useState<string | null>(null);
  const title = move.name.trim() || "Exercise";
  const timeBased = isTimeBasedExercise(move.name);
  const allSetsComplete =
    move.sets.length > 0 &&
    move.sets.every((set) => completedSetIds.includes(set.id));
  const wasAllSetsCompleteRef = useRef(allSetsComplete);
  const defaultRestForNewSet =
    move.sets[move.sets.length - 1]?.restSeconds ?? 90;

  useEffect(() => {
    let cancelled = false;

    void findCatalogExerciseByName(move.name).then((match) => {
      if (!cancelled) {
        setCatalogSlug(match?.id ?? null);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [move.name]);

  useEffect(() => {
    if (allSetsComplete && !wasAllSetsCompleteRef.current) {
      onAllSetsComplete?.();
    }

    wasAllSetsCompleteRef.current = allSetsComplete;
  }, [allSetsComplete, onAllSetsComplete]);

  return (
    <>
      <TerminalWindow
        title={title}
        bodyClassName="stack-md"
        collapsed={collapsed}
        dotVariant={allSetsComplete ? "green" : "default"}
        editableTitle={{
          onStartEdit: () => setNameSearchOpen(true),
        }}
        headerPrefix={dragHandle}
        headerAction={
          <div className="flex items-center gap-1">
            {catalogSlug ? (
              <IconButton
                label={`About ${title}`}
                variant="ghost"
                className="size-8"
                onClick={() => setInfoOpen(true)}
              >
                <InfoIcon />
              </IconButton>
            ) : null}
            <IconButton
              label={`Remove ${title}`}
              variant="danger"
              className="size-8"
              onClick={onDelete}
            >
              <CloseIcon />
            </IconButton>
          </div>
        }
      >
        <div className="set-table">
          <div className="set-table-header" aria-hidden>
            <span>Set</span>
            <span>Previous</span>
            <span>{timeBased ? "—" : "kg"}</span>
            <span>{timeBased ? "sec" : "Reps"}</span>
            <span />
          </div>

          {move.sets.map((set, index) => {
            const previousSet = index > 0 ? move.sets[index - 1] : undefined;
            const fallbackWeight = previousSet
              ? sessionWeights[previousSet.id] ?? previousSet.lastWeight
              : undefined;
            const fallbackReps = previousSet
              ? sessionReps[previousSet.id] ?? previousSet.lastReps
              : undefined;
            const isLastSet = index === move.sets.length - 1;
            const showRestDivider =
              !isLastSet || activeRestSetId === set.id;

            return (
              <Fragment key={set.id}>
                <SwipeToDeleteRow onDelete={() => onDeleteSet(set.id)}>
                  <SetRow
                    index={index}
                    isTimeBased={timeBased}
                    lastWeight={set.lastWeight}
                    lastReps={set.lastReps}
                    sessionWeight={sessionWeights[set.id]}
                    sessionReps={sessionReps[set.id]}
                    fallbackWeight={fallbackWeight}
                    fallbackReps={fallbackReps}
                    isCompleted={completedSetIds.includes(set.id)}
                    onComplete={(weight, reps) =>
                      onCompleteSet(set.id, weight, reps, set.restSeconds)
                    }
                    onUncomplete={
                      onUncompleteSet
                        ? () => onUncompleteSet(set.id)
                        : undefined
                    }
                  />
                </SwipeToDeleteRow>

                {showRestDivider ? (
                  <SetRestDivider
                    restSeconds={set.restSeconds}
                    isActive={activeRestSetId === set.id}
                    restEndsAt={restEndsAt}
                    onRestSecondsChange={(seconds) =>
                      onUpdateSet(set.id, { restSeconds: seconds })
                    }
                    onRestComplete={() => onRestComplete(set.id)}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onAddSet}
          className="set-add-button"
          aria-label={`Add set with ${formatRestLabel(defaultRestForNewSet)} rest`}
        >
          <PlusIcon />
          <span>Add Set ({formatRestLabel(defaultRestForNewSet)})</span>
        </button>
      </TerminalWindow>

      <ExerciseInfoModal
        open={infoOpen}
        slug={catalogSlug}
        onClose={() => setInfoOpen(false)}
      />

      <ExerciseSearchModal
        open={nameSearchOpen}
        initialValue={move.name}
        title="Rename exercise"
        confirmLabel="Save name"
        onConfirm={(name) => {
          onUpdateName(name);
          setNameSearchOpen(false);
        }}
        onClose={() => setNameSearchOpen(false)}
      />
    </>
  );
}
