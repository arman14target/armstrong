"use client";

import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { GripIcon } from "@/components/icons/ActionIcons";
import { MoveCard } from "@/components/MoveCard";
import { Move, SetConfig } from "@/lib/types";
import { cn } from "@/lib/cn";

interface ExerciseReorderListProps {
  moves: Move[];
  sessionWeights: Record<string, number>;
  sessionReps: Record<string, number>;
  completedSetIds: string[];
  activeRestSetId?: string;
  restEndsAt?: string;
  onUpdateName: (moveId: string, name: string) => void;
  onDelete: (moveId: string) => void;
  onAddSet: (moveId: string) => void;
  onUpdateSet: (moveId: string, setId: string, updates: Partial<SetConfig>) => void;
  onDraftSet?: (moveId: string, setId: string, weight?: number, reps?: number) => void;
  onCompleteSet: (
    moveId: string,
    setId: string,
    weight: number,
    reps: number,
    restSeconds: number,
  ) => void;
  onUncompleteSet: (moveId: string, setId: string) => void;
  onDeleteSet: (moveId: string, setId: string) => void;
  onRestComplete: (setId: string) => void;
  onAllSetsComplete: (moveIndex: number) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  moveRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

export function ExerciseReorderList({
  moves,
  sessionWeights,
  sessionReps,
  completedSetIds,
  activeRestSetId,
  restEndsAt,
  onUpdateName,
  onDelete,
  onAddSet,
  onUpdateSet,
  onDraftSet,
  onCompleteSet,
  onUncompleteSet,
  onDeleteSet,
  onRestComplete,
  onAllSetsComplete,
  onReorder,
  moveRefs,
}: ExerciseReorderListProps) {
  const { t } = useTranslation();
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const dragPointerIdRef = useRef<number | null>(null);

  const finishDrag = useCallback(
    (fromIndex: number, toIndex: number | null) => {
      if (
        toIndex !== null &&
        fromIndex !== toIndex &&
        toIndex >= 0 &&
        toIndex < moves.length
      ) {
        onReorder(fromIndex, toIndex);
      }

      setDraggingIndex(null);
      setDropIndex(null);
      dragPointerIdRef.current = null;
    },
    [moves.length, onReorder],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingIndex === null) {
        return;
      }

      const elements = document.elementsFromPoint(event.clientX, event.clientY);
      const target = elements.find((element) =>
        element.hasAttribute("data-move-index"),
      );

      if (target) {
        const index = Number.parseInt(
          target.getAttribute("data-move-index") ?? "",
          10,
        );
        if (!Number.isNaN(index)) {
          setDropIndex(index);
        }
      }
    },
    [draggingIndex],
  );

  const handlePointerUp = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (draggingIndex === null) {
        return;
      }

      if (dragPointerIdRef.current === event.pointerId) {
        finishDrag(draggingIndex, dropIndex);
      }
    },
    [draggingIndex, dropIndex, finishDrag],
  );

  const startDrag = (index: number, event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragPointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingIndex(index);
    setDropIndex(index);
  };

  const isDragging = draggingIndex !== null;

  return (
    <div
      className={cn("exercise-reorder-list", isDragging && "exercise-reorder-list--dragging")}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {moves.map((move, moveIndex) => {
        const isBeingDragged = draggingIndex === moveIndex;
        const isDropTarget =
          isDragging && dropIndex === moveIndex && draggingIndex !== moveIndex;

        return (
          <div
            key={move.id}
            ref={(element) => {
              if (element) {
                moveRefs.current.set(move.id, element);
              } else {
                moveRefs.current.delete(move.id);
              }
            }}
            data-move-index={moveIndex}
            className={cn(
              "exercise-reorder-item scroll-mt-20",
              isBeingDragged && "exercise-reorder-item--dragging",
              isDropTarget && "exercise-reorder-item--drop-target",
            )}
          >
            {isDropTarget ? (
              <div className="exercise-reorder-drop-line" aria-hidden />
            ) : null}

            <MoveCard
              move={move}
              sessionWeights={sessionWeights}
              sessionReps={sessionReps}
              completedSetIds={completedSetIds}
              activeRestSetId={activeRestSetId}
              restEndsAt={restEndsAt}
              collapsed={isDragging}
              dragHandle={
                <button
                  type="button"
                  className="exercise-drag-handle"
                  aria-label={t("aria.reorderExercise", {
                    name: move.name || t("common.exercise"),
                  })}
                  onPointerDown={(event) => startDrag(moveIndex, event)}
                >
                  <GripIcon className="text-dim" />
                </button>
              }
              onUpdateName={(name) => onUpdateName(move.id, name)}
              onDelete={() => onDelete(move.id)}
              onAddSet={() => onAddSet(move.id)}
              onUpdateSet={(setId, updates) =>
                onUpdateSet(move.id, setId, updates)
              }
              onDraftSet={
                onDraftSet
                  ? (setId, weight, reps) =>
                      onDraftSet(move.id, setId, weight, reps)
                  : undefined
              }
              onCompleteSet={(setId, weight, reps, restSeconds) =>
                onCompleteSet(move.id, setId, weight, reps, restSeconds)
              }
              onUncompleteSet={(setId) => onUncompleteSet(move.id, setId)}
              onDeleteSet={(setId) => onDeleteSet(move.id, setId)}
              onRestComplete={onRestComplete}
              onAllSetsComplete={() => onAllSetsComplete(moveIndex)}
            />
          </div>
        );
      })}
    </div>
  );
}
