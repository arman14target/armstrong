"use client";

import { Move, SetConfig } from "@/lib/types";
import { PlusIcon, TrashIcon } from "@/components/icons/ActionIcons";
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
  onRestComplete: () => void;
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
}: MoveCardProps) {
  const title = move.name.trim() || "Exercise";

  return (
    <TerminalWindow title={title} bodyClassName="stack-md">
      <header className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <input
          className="cyber-input min-h-11 w-full min-w-0 text-base text-heading"
          value={move.name}
          onChange={(e) => onUpdateName(e.target.value)}
          aria-label="Exercise name"
        />
        <IconButton
          label={`Remove ${title}`}
          variant="danger"
          className="size-10"
          onClick={onDelete}
        >
          <TrashIcon />
        </IconButton>
      </header>

      <div className="stack-sm">
        {move.sets.map((set, index) => (
          <SetRow
            key={set.id}
            index={index}
            setId={set.id}
            restSeconds={set.restSeconds}
            lastWeight={set.lastWeight}
            sessionWeight={sessionWeights[set.id]}
            isCompleted={completedSetIds.includes(set.id)}
            showRestTimer={activeRestSetId === set.id}
            restEndsAt={restEndsAt}
            onRestSecondsChange={(seconds) =>
              onUpdateSet(set.id, { restSeconds: seconds })
            }
            onComplete={(weight, restSeconds) =>
              onCompleteSet(set.id, weight, restSeconds)
            }
            onRestComplete={onRestComplete}
            onDelete={() => onDeleteSet(set.id)}
          />
        ))}
      </div>

      <div className="flex justify-center">
        <IconButton label="Add set" variant="ghost" onClick={onAddSet}>
          <PlusIcon />
        </IconButton>
      </div>
    </TerminalWindow>
  );
}
