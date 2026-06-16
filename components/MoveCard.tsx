"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { Move, SetConfig } from "@/lib/types";
import { CloseIcon, PlusIcon } from "@/components/icons/ActionIcons";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";
import { SetRestDivider } from "@/components/SetRestDivider";
import { SetRow } from "@/components/SetRow";
import { SwipeToDeleteRow } from "@/components/SwipeToDeleteRow";
import { IconButton } from "@/components/ui/IconButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { formatRestLabel } from "@/lib/formatSetDisplay";

interface MoveCardProps {
  move: Move;
  sessionWeights: Record<string, number>;
  sessionReps: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
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
  onUpdateName,
  onDelete,
  onAddSet,
  onUpdateSet,
  onCompleteSet,
  onDeleteSet,
  onRestComplete,
  onAllSetsComplete,
}: MoveCardProps) {
  const [nameSearchOpen, setNameSearchOpen] = useState(false);
  const title = move.name.trim() || "Exercise";
  const allSetsComplete =
    move.sets.length > 0 &&
    move.sets.every((set) => completedSetIds.includes(set.id));
  const wasAllSetsCompleteRef = useRef(allSetsComplete);
  const defaultRestForNewSet =
    move.sets[move.sets.length - 1]?.restSeconds ?? 90;

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
        dotVariant={allSetsComplete ? "green" : "default"}
        editableTitle={{
          onStartEdit: () => setNameSearchOpen(true),
        }}
        headerAction={
          <IconButton
            label={`Remove ${title}`}
            variant="danger"
            className="size-8"
            onClick={onDelete}
          >
            <CloseIcon />
          </IconButton>
        }
      >
        <div className="set-table">
          <div className="set-table-header" aria-hidden>
            <span>Set</span>
            <span>Previous</span>
            <span>kg</span>
            <span>Reps</span>
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
