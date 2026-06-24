"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import {
  addGymAmenity,
  addGymPricePlan,
  deleteGym,
  deleteGymAmenity,
  deleteGymPricePlan,
  fetchGym,
  updateGym,
  updateGymPricePlan,
  type GymDetail as GymDetailData,
} from "@/lib/api";

export function GymDetail({
  id,
  onBack,
  onDeleted,
}: {
  id: string;
  onBack: () => void;
  onDeleted: () => void;
}) {
  const [gym, setGym] = useState<GymDetailData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editable basic fields.
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [quietTimes, setQuietTimes] = useState("");

  // New price plan form.
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState("");
  const [planPeriod, setPlanPeriod] = useState("");
  const [newAmenity, setNewAmenity] = useState("");

  const load = useCallback(async () => {
    setError(null);
    try {
      const g = await fetchGym(id);
      setGym(g);
      setName(g.name);
      setWebsite(g.website ?? "");
      setQuietTimes(g.quietTimes ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gym");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setSaving(false);
    }
  };

  const saveBasics = () =>
    run(() =>
      updateGym(id, {
        name: name.trim(),
        website: website.trim() || null,
        quietTimes: quietTimes.trim() || null,
      }),
    );

  const addPlan = () => {
    if (!planName.trim() || !planPrice.trim()) return;
    run(() =>
      addGymPricePlan(id, {
        name: planName.trim(),
        priceText: planPrice.trim(),
        period: planPeriod.trim() || null,
      }),
    ).then(() => {
      setPlanName("");
      setPlanPrice("");
      setPlanPeriod("");
    });
  };

  const addAmenity = () => {
    if (!newAmenity.trim()) return;
    run(() => addGymAmenity(id, newAmenity.trim())).then(() =>
      setNewAmenity(""),
    );
  };

  const removeGym = () => {
    if (!confirm("Delete this gym and all its curated data?")) return;
    run(() => deleteGym(id)).then(onDeleted);
  };

  if (!gym) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
        {error ? (
          <p className="text-sm text-error">{error}</p>
        ) : (
          <p className="text-sm text-dim">Loading…</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back to gyms
        </Button>
        <Button variant="danger" onClick={removeGym} disabled={saving}>
          Delete gym
        </Button>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <Panel title="Details">
        <div className="space-y-3 p-4">
          <p className="text-xs text-dim">
            {gym.address ?? "—"}
            {gym.country ? ` · ${gym.country}` : ""}
            {gym.lastEnrichedAt
              ? ` · enriched ${new Date(gym.lastEnrichedAt).toLocaleDateString()}`
              : " · not yet enriched"}
          </p>
          <label className="block">
            <span className="text-xs text-dim">Name</span>
            <input
              className="input mt-1 w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-dim">Website</span>
            <input
              className="input mt-1 w-full"
              value={website}
              placeholder="https://…"
              onChange={(e) => setWebsite(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs text-dim">Least busy</span>
            <input
              className="input mt-1 w-full"
              value={quietTimes}
              placeholder="e.g. Weekday mornings before 9am"
              onChange={(e) => setQuietTimes(e.target.value)}
            />
          </label>
          <Button onClick={saveBasics} disabled={saving}>
            Save details
          </Button>
        </div>
      </Panel>

      <Panel title={`Price plans (${gym.pricePlans.length})`}>
        <div className="space-y-2 p-4">
          {gym.pricePlans.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-3 rounded-[var(--radius-cyber)] border border-line px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm text-heading">
                  {p.name}{" "}
                  <span className="text-primary">{p.priceText}</span>
                  {p.period ? (
                    <span className="text-dim">/{p.period}</span>
                  ) : null}
                </p>
                <Badge tone={p.source === "admin" ? "primary" : undefined}>
                  {p.source}
                </Badge>
              </div>
              <Button
                variant="danger"
                className="px-2 py-1 text-xs"
                disabled={saving}
                onClick={() => run(() => deleteGymPricePlan(p.id))}
              >
                Remove
              </Button>
            </div>
          ))}
          {gym.pricePlans.length === 0 && (
            <p className="text-sm text-dim">No price plans yet.</p>
          )}

          <div className="mt-2 flex flex-wrap gap-2 border-t border-line pt-3">
            <input
              className="input w-32"
              placeholder="Plan name"
              value={planName}
              onChange={(e) => setPlanName(e.target.value)}
            />
            <input
              className="input w-28"
              placeholder="$29.99"
              value={planPrice}
              onChange={(e) => setPlanPrice(e.target.value)}
            />
            <input
              className="input w-24"
              placeholder="month"
              value={planPeriod}
              onChange={(e) => setPlanPeriod(e.target.value)}
            />
            <Button
              onClick={addPlan}
              disabled={saving || !planName.trim() || !planPrice.trim()}
            >
              Add plan
            </Button>
          </div>
        </div>
      </Panel>

      <Panel title={`Amenities (${gym.amenities.length})`}>
        <div className="space-y-3 p-4">
          <div className="flex flex-wrap gap-2">
            {gym.amenities.map((a) => (
              <span
                key={a.id}
                className="inline-flex items-center gap-1 rounded-full border border-line px-2.5 py-1 text-xs text-heading"
              >
                {a.name}
                <button
                  type="button"
                  className="text-dim hover:text-error"
                  disabled={saving}
                  onClick={() => run(() => deleteGymAmenity(a.id))}
                  aria-label={`Remove ${a.name}`}
                >
                  ×
                </button>
              </span>
            ))}
            {gym.amenities.length === 0 && (
              <p className="text-sm text-dim">No amenities yet.</p>
            )}
          </div>
          <div className="flex gap-2">
            <input
              className="input w-52"
              placeholder="e.g. Swimming Pool"
              value={newAmenity}
              onChange={(e) => setNewAmenity(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addAmenity()}
            />
            <Button onClick={addAmenity} disabled={saving || !newAmenity.trim()}>
              Add
            </Button>
          </div>
        </div>
      </Panel>
    </div>
  );
}
