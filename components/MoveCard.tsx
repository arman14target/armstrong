"use client";

import { useEffect, useRef, useState } from "react";
import { Move, SetConfig } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  ChevronDownIcon,
  CloseIcon,
  PlusIcon,
} from "@/components/icons/ActionIcons";
import { SetRow } from "@/components/SetRow";
import { IconButton } from "@/components/ui/IconButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

interface MoveCardProps {
  move: Move;
  sessionWeights: Record<string, number>;
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
    restSeconds: number,
  ) => void;
  onDeleteSet: (setId: string) => void;
  onRestComplete: (setId: string) => void;
  onAllSetsComplete?: () => void;
}

export function MoveCard({
  move,
  sessionWeights,
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
  const [editingName, setEditingName] = useState(false);
  const title = move.name.trim() || "Exercise";
  const allSetsComplete =
    move.sets.length > 0 &&
    move.sets.every((set) => completedSetIds.includes(set.id));
  const [collapsed, setCollapsed] = useState(allSetsComplete);
  const wasAllSetsCompleteRef = useRef(allSetsComplete);

  useEffect(() => {
    if (allSetsComplete) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [allSetsComplete]);

  useEffect(() => {
    if (allSetsComplete && !wasAllSetsCompleteRef.current) {
      onAllSetsComplete?.();
    }

    wasAllSetsCompleteRef.current = allSetsComplete;
  }, [allSetsComplete, onAllSetsComplete]);

  return (
    <TerminalWindow
      title={title}
      bodyClassName="stack-md"
      collapsed={collapsed}
      dotVariant={allSetsComplete ? "green" : "default"}
      editableTitle={{
        value: move.name,
        editing: editingName,
        onChange: onUpdateName,
        onStartEdit: () => setEditingName(true),
        onEndEdit: () => setEditingName(false),
      }}
      headerAction={
        <div className="inline-flex items-center gap-1">
          {allSetsComplete ? (
            <IconButton
              label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
              variant="ghost"
              className="size-8"
              onClick={() => setCollapsed((current) => !current)}
            >
              <span
                className={cn(
                  "inline-flex transition-transform duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
                  collapsed ? "rotate-0" : "rotate-180",
                )}
              >
                <ChevronDownIcon />
              </span>
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
      <div className="stack-sm">
        {move.sets.map((set, index) => {
          const previousSet = index > 0 ? move.sets[index - 1] : undefined;
          const fallbackWeight = previousSet
            ? sessionWeights[previousSet.id] ?? previousSet.lastWeight
            : undefined;

          return (
            <SetRow
              key={set.id}
              index={index}
              setId={set.id}
              restSeconds={set.restSeconds}
              lastWeight={set.lastWeight}
              sessionWeight={sessionWeights[set.id]}
              fallbackWeight={fallbackWeight}
              isCompleted={completedSetIds.includes(set.id)}
              showRestTimer={activeRestSetId === set.id}
              restEndsAt={restEndsAt}
              onRestSecondsChange={(seconds) =>
                onUpdateSet(set.id, { restSeconds: seconds })
              }
              onComplete={(weight, restSeconds) =>
                onCompleteSet(set.id, weight, restSeconds)
              }
              onRestComplete={() => onRestComplete(set.id)}
              onDelete={() => onDeleteSet(set.id)}
            />
          );
        })}
      </div>

      <div className="flex justify-center">
        <IconButton label="Add set" variant="ghost" onClick={onAddSet}>
          <PlusIcon />
        </IconButton>
      </div>
    </TerminalWindow>
  );
}
