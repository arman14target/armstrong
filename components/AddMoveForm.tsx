"use client";

import { useState } from "react";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import { cn } from "@/lib/cn";

interface AddMoveFormProps {
  onAdd: (name: string) => void;
}

export function AddMoveForm({ onAdd }: AddMoveFormProps) {
  const [name, setName] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const addExercise = (nextName: string) => {
    const trimmed = nextName.trim();
    if (!trimmed) {
      return;
    }

    onAdd(trimmed);
    setName("");
  };

  return (
    <>
      <TerminalWindow title="Add exercise">
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className={cn(
            "cyber-input flex min-h-12 w-full items-center text-left",
            name ? "text-heading" : "text-dim",
          )}
        >
          {name.trim() || "e.g. Bench Press"}
        </button>
      </TerminalWindow>

      <ExerciseSearchModal
        open={searchOpen}
        initialValue={name}
        title="Add exercise"
        confirmLabel="Add exercise"
        onConfirm={(nextName) => {
          addExercise(nextName);
          setSearchOpen(false);
        }}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
