"use client";

import { useMemo, useState } from "react";
import { CheckIcon, MapPinIcon } from "@/components/icons/ActionIcons";
import { GymCompareModal } from "@/components/GymCompareModal";
import { CyberButton } from "@/components/ui/CyberButton";
import { TerminalWindow } from "@/components/ui/TerminalWindow";
import {
  compareGyms,
  fetchGymsByCoords,
  fetchGymsByPlace,
} from "@/lib/api/gyms";
import { isApiConfigured } from "@/lib/api/client";
import {
  formatDistance,
  formatPriceTier,
  getCurrentCoords,
  isGeolocationAvailable,
  localeDistanceUnit,
  mapsLink,
  type CompareResult,
  type DistanceUnit,
  type Gym,
} from "@/lib/gymFinder";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 6;
const MAX_COMPARE = 3;

function StarRating({ rating }: { rating: number }) {
  // Foursquare rates 0–10; show as 0–5 stars.
  const stars = Math.round((rating / 10) * 5);
  return (
    <span className="text-xs text-primary" aria-label={`${rating} of 10`}>
      {"★".repeat(stars)}
      <span className="text-line">{"★".repeat(5 - stars)}</span>
      <span className="ml-1 text-dim">{rating.toFixed(1)}</span>
    </span>
  );
}

function GymCard({
  gym,
  unit,
  selected,
  disabled,
  onToggleSelect,
}: {
  gym: Gym;
  unit: DistanceUnit;
  selected: boolean;
  disabled: boolean;
  onToggleSelect: () => void;
}) {
  const distance = formatDistance(gym.distanceMeters, unit);
  const price = formatPriceTier(gym.priceTier);

  return (
    <li
      className={cn(
        "flex flex-col rounded-cyber border bg-bg/40 p-3.5 transition-colors",
        selected
          ? "border-primary/60 bg-primary/[0.06]"
          : "border-line hover:border-primary/35",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onToggleSelect}
          disabled={disabled && !selected}
          aria-pressed={selected}
          aria-label={
            selected ? `Remove ${gym.name} from compare` : `Add ${gym.name} to compare`
          }
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium uppercase tracking-wide transition-colors",
            selected
              ? "border-primary bg-primary/15 text-primary"
              : "border-line text-dim hover:border-primary/40 hover:text-heading",
            disabled && !selected && "cursor-not-allowed opacity-40",
          )}
        >
          <span
            className={cn(
              "flex size-4 items-center justify-center rounded-[4px] border",
              selected ? "border-primary bg-primary text-bg" : "border-dim/60",
            )}
          >
            {selected && <CheckIcon className="size-3" />}
          </span>
          {selected ? "Selected" : "Compare"}
        </button>
        {distance && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            <MapPinIcon className="size-3" />
            {distance}
          </span>
        )}
      </div>

      <p className="mt-2.5 text-sm font-semibold leading-snug text-heading">
        {gym.name}
      </p>
      {gym.category && (
        <p className="mt-0.5 text-[11px] text-dim">{gym.category}</p>
      )}

      {(gym.rating !== null || price) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          {gym.rating !== null && <StarRating rating={gym.rating} />}
          {price && <span className="text-xs text-green">{price}</span>}
        </div>
      )}

      {gym.address && (
        <p className="mt-2 line-clamp-2 text-[11px] leading-snug text-dim">
          {gym.address}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
        <a
          href={mapsLink(gym)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-cyber border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] text-primary transition-colors hover:bg-primary/20"
        >
          Directions
        </a>
        {gym.tel && (
          <a
            href={`tel:${gym.tel}`}
            className="rounded-cyber border border-line px-2.5 py-1 text-[11px] text-dim transition-colors hover:text-heading"
          >
            Call
          </a>
        )}
        {gym.website && (
          <a
            href={gym.website}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-cyber border border-line px-2.5 py-1 text-[11px] text-dim transition-colors hover:text-heading"
          >
            Website
          </a>
        )}
      </div>
    </li>
  );
}

export function GymFinderSection() {
  const unit: DistanceUnit = localeDistanceUnit();

  const [gyms, setGyms] = useState<Gym[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [place, setPlace] = useState("");
  const [searched, setSearched] = useState(false);
  const [page, setPage] = useState(0);

  const [selected, setSelected] = useState<Gym[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareResult, setCompareResult] = useState<CompareResult | null>(null);
  const [compareError, setCompareError] = useState<string | null>(null);

  const isSelected = (id: string) => selected.some((g) => g.id === id);
  const toggleSelect = (gym: Gym) => {
    setSelected((prev) =>
      prev.some((g) => g.id === gym.id)
        ? prev.filter((g) => g.id !== gym.id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, gym],
    );
  };

  const runCompare = async () => {
    setCompareOpen(true);
    setComparing(true);
    setCompareError(null);
    setCompareResult(null);
    try {
      setCompareResult(await compareGyms(selected));
    } catch {
      setCompareError("Couldn't compare these gyms. Please try again.");
    } finally {
      setComparing(false);
    }
  };

  const totalPages = gyms ? Math.ceil(gyms.length / PAGE_SIZE) : 0;
  const pageGyms = useMemo(
    () => (gyms ? gyms.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE) : []),
    [gyms, page],
  );

  if (!isApiConfigured()) {
    return (
      <TerminalWindow title="Gym finder">
        <p className="text-sm leading-relaxed text-dim">
          The gym finder needs the Armstrong backend configured
          (<span className="text-cyan">NEXT_PUBLIC_API_URL</span>). It&apos;s not
          available in this build.
        </p>
      </TerminalWindow>
    );
  }

  const run = async (fn: () => Promise<{ configured: boolean; gyms: Gym[] }>) => {
    setLoading(true);
    setError(null);
    setSearched(true);
    setPage(0);
    setSelected([]);
    try {
      const result = await fn();
      if (!result.configured) {
        setError("Gym search isn't enabled on the server yet. Check back soon.");
        setGyms(null);
        return;
      }
      setGyms(result.gyms);
    } catch {
      setError("Couldn't load nearby gyms. Please try again.");
      setGyms(null);
    } finally {
      setLoading(false);
    }
  };

  const useMyLocation = async () => {
    setError(null);
    try {
      const coords = await getCurrentCoords();
      await run(() => fetchGymsByCoords(coords));
    } catch {
      setError(
        "Couldn't get your location. Allow location access or search by area.",
      );
    }
  };

  const searchPlace = () => {
    if (place.trim() === "") return;
    void run(() => fetchGymsByPlace(place.trim()));
  };

  return (
    <>
    <TerminalWindow title="Gym finder">
      <div className="stack-md">
        <p className="text-sm leading-relaxed text-dim">
          Find gyms near you — compare distance, ratings, and contact info.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          {isGeolocationAvailable() && (
            <CyberButton
              variant="green"
              className="sm:w-auto"
              onClick={useMyLocation}
              disabled={loading}
            >
              <MapPinIcon className="mr-1.5 size-4" />
              Use my location
            </CyberButton>
          )}
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && searchPlace()}
              placeholder="Zip or city"
              className="min-w-0 flex-1 rounded-cyber border border-line bg-bg/40 px-3 py-2 text-sm text-heading placeholder:text-dim/70 focus:border-primary/50 focus:outline-none"
            />
            <CyberButton
              variant="cyan"
              onClick={searchPlace}
              disabled={loading || place.trim() === ""}
            >
              Search
            </CyberButton>
          </div>
        </div>

        {loading && <p className="text-sm text-dim">Searching nearby gyms…</p>}
        {error && (
          <p className="text-sm text-magenta" role="alert">
            {error}
          </p>
        )}

        {!loading && gyms !== null && gyms.length === 0 && (
          <p className="text-sm text-dim">
            No gyms found here. Try a wider area or a nearby city.
          </p>
        )}

        {!loading && gyms !== null && gyms.length > 0 && (
          <>
            <p className="text-[11px] uppercase tracking-wide text-dim">
              {gyms.length} gym{gyms.length === 1 ? "" : "s"} found
            </p>

            <p className="-mt-1 text-[11px] text-dim">
              Select 2–3 gyms to compare prices &amp; amenities.
            </p>

            <ul className="grid gap-2.5 sm:grid-cols-2">
              {pageGyms.map((gym) => (
                <GymCard
                  key={gym.id || gym.name}
                  gym={gym}
                  unit={unit}
                  selected={isSelected(gym.id)}
                  disabled={selected.length >= MAX_COMPARE}
                  onToggleSelect={() => toggleSelect(gym)}
                />
              ))}
            </ul>

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="rounded-cyber border border-line px-3 py-1.5 text-xs text-dim transition-colors enabled:hover:text-heading disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-xs text-dim">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="rounded-cyber border border-line px-3 py-1.5 text-xs text-dim transition-colors enabled:hover:text-heading disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}

        {!loading && !searched && (
          <p className="text-[11px] text-dim">
            Tip: select gyms after searching to compare prices &amp; amenities.
          </p>
        )}

        {/* Spacer so the fixed action bar never hides the last cards. */}
        {selected.length > 0 && <div className="h-16" aria-hidden="true" />}
      </div>
    </TerminalWindow>

    {/* Always-visible action bar while selecting — fixed to the viewport so it's
        reachable on mobile without scrolling. */}
    {selected.length > 0 && (
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/40 bg-panel/95 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2.5 shadow-[0_-8px_24px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
            {selected.map((g) => (
              <span
                key={g.id}
                className="inline-flex max-w-[8rem] items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] text-primary"
              >
                <span className="truncate">{g.name}</span>
                <button
                  type="button"
                  onClick={() => toggleSelect(g)}
                  aria-label={`Remove ${g.name}`}
                  className="shrink-0 text-primary/70 hover:text-primary"
                >
                  ×
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={() => setSelected([])}
              className="text-[11px] text-dim hover:text-heading"
            >
              Clear
            </button>
          </div>
          <CyberButton
            variant="green"
            className="shrink-0"
            onClick={runCompare}
            disabled={selected.length < 2}
          >
            {selected.length < 2 ? "Pick 1 more" : `Compare (${selected.length})`}
          </CyberButton>
        </div>
      </div>
    )}

    <GymCompareModal
      open={compareOpen}
      loading={comparing}
      error={compareError}
      result={compareResult}
      unit={unit}
      onClose={() => setCompareOpen(false)}
    />
    </>
  );
}
