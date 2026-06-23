"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckIcon, PencilIcon } from "@/components/icons/ActionIcons";
import { GoalWeightSlider } from "@/components/nutrition/GoalWeightSlider";
import { WeightGoalChart } from "@/components/nutrition/WeightGoalChart";
import { IconButton } from "@/components/ui/IconButton";
import { useGymStore } from "@/hooks/useGymStore";
import {
  inferNutritionGoal,
  resolveTargetWeightKg,
  type NutritionProfile,
} from "@/lib/nutrition";
import type { WeightUnit } from "@/lib/types";
import { formatBodyWeight, snapWeightKg } from "@/lib/weight";

interface NutritionBodyWeightPanelProps {
  profile: NutritionProfile;
}

export function NutritionBodyWeightPanel({ profile }: NutritionBodyWeightPanelProps) {
  const { data, logBodyWeight, setTargetWeight } = useGymStore();
  const [editingWeight, setEditingWeight] = useState(false);
  const [draftKg, setDraftKg] = useState(profile.weightKg);
  const [editingGoal, setEditingGoal] = useState(false);
  const [draftTargetKg, setDraftTargetKg] = useState(
    resolveTargetWeightKg(profile, data.targetWeightKg),
  );

  const unit: WeightUnit = data.weightUnit ?? "kg";
  const log = data.weightLog ?? [];
  const currentWeightKg = profile.weightKg;
  const targetWeightKg = resolveTargetWeightKg(profile, data.targetWeightKg);
  const goal = useMemo(
    () => inferNutritionGoal(currentWeightKg, targetWeightKg),
    [currentWeightKg, targetWeightKg],
  );

  useEffect(() => {
    if (!editingWeight) {
      setDraftKg(currentWeightKg);
    }
  }, [currentWeightKg, editingWeight]);

  useEffect(() => {
    if (!editingGoal) {
      setDraftTargetKg(targetWeightKg);
    }
  }, [targetWeightKg, editingGoal]);

  const adjustWeight = (delta: number) => {
    setDraftKg((prev) =>
      snapWeightKg(Math.min(200, Math.max(40, prev + delta))),
    );
  };

  const handleEditWeight = () => {
    setDraftKg(currentWeightKg);
    setEditingWeight(true);
  };

  const handleSaveWeight = () => {
    logBodyWeight(draftKg);
    setEditingWeight(false);
  };

  const handleEditGoal = () => {
    setDraftTargetKg(targetWeightKg);
    setEditingGoal(true);
  };

  const handleSaveGoal = () => {
    setTargetWeight(draftTargetKg);
    setEditingGoal(false);
  };

  return (
    <div className="stack-sm rounded-cyber border border-line bg-bg/30 p-[var(--space-panel)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-display text-sm tracking-wide text-heading">Body weight</h3>
        {editingGoal ? (
          <div className="flex items-center gap-1">
            <IconButton
              label="Save goal weight"
              variant="green"
              className="size-7 shadow-[0_0_12px_color-mix(in_srgb,var(--color-green)_50%,transparent)] ring-1 ring-green/40"
              onClick={handleSaveGoal}
            >
              <CheckIcon />
            </IconButton>
            <button
              type="button"
              onClick={() => setEditingGoal(false)}
              className="px-1.5 text-[10px] text-dim hover:text-heading"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleEditGoal}
            className="inline-flex items-center gap-1 rounded-cyber border border-line px-2 py-0.5 text-[10px] text-dim transition-colors hover:border-primary/40 hover:text-primary"
          >
            <span>Goal {formatBodyWeight(targetWeightKg, unit)}</span>
            <PencilIcon className="size-3" />
          </button>
        )}
      </div>

      {editingGoal ? (
        <GoalWeightSlider
          currentWeightKg={currentWeightKg}
          targetWeightKg={draftTargetKg}
          unit={unit}
          idPrefix="nutrition-goal"
          onChange={setDraftTargetKg}
        />
      ) : null}

      <WeightGoalChart
        log={log}
        baselineKg={data.weightBaselineKg}
        currentWeightKg={currentWeightKg}
        targetWeightKg={targetWeightKg}
        goal={goal}
        unit={unit}
        editing={editingWeight}
        draftWeightKg={draftKg}
        onEdit={handleEditWeight}
        onSave={handleSaveWeight}
        onAdjust={adjustWeight}
      />
    </div>
  );
}
