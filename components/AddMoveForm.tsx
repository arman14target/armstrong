"use client";

import { FormEvent, useState } from "react";
import { PlusIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";

interface AddMoveFormProps {
  onAdd: (name: string) => void;
}

export function AddMoveForm({ onAdd }: AddMoveFormProps) {
  const [name, setName] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    onAdd(trimmed);
    setName("");
  };

  return (
    <TerminalWindow title="Add exercise">
      <form
        className="flex flex-row items-center gap-[var(--space-gap)]"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Bench Press"
          aria-label="Exercise name"
          className="cyber-input min-h-12 min-w-0 flex-1"
        />
        <IconButton type="submit" label="Add exercise" variant="green">
          <PlusIcon className="size-5" />
        </IconButton>
      </form>
    </TerminalWindow>
  );
}
