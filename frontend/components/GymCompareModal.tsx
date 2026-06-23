"use client";

import { useEffect } from "react";
import { CloseIcon } from "@/components/icons/ActionIcons";
import { IconButton } from "@/components/ui/IconButton";
import { PanelDot } from "@/components/ui/PanelDot";
import {
  formatDistance,
  type CompareResult,
  type DistanceUnit,
  type GymComparison,
} from "@/lib/gymFinder";

function GymColumn({
  gym,
  index,
  unit,
  enrichmentEnabled,
}: {
  gym: GymComparison;
  index: number;
  unit: DistanceUnit;
  enrichmentEnabled: boolean;
}) {
  const distance = formatDistance(gym.distanceMeters, unit);
  return (
    <div className="flex min-w-0 flex-col rounded-cyber border border-line bg-bg/40 p-2.5 sm:p-3">
      <div className="flex items-start gap-2">
        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
          {index + 1}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-snug text-heading">
            {gym.name}
          </p>
          <p className="mt-0.5 text-[11px] text-dim">
            {distance ? `${distance} away` : gym.address ? "Nearby" : "—"}
          </p>
        </div>
      </div>

      {/* Price */}
      <p className="mt-3 text-[10px] uppercase tracking-wide text-dim">
        Membership
      </p>
      {gym.pricePlans.length > 0 ? (
        <ul className="mt-1 stack-sm">
          {gym.pricePlans.map((p, i) => (
            <li
              key={`${p.name}-${i}`}
              className="flex items-baseline justify-between gap-2 text-xs"
            >
              <span className="min-w-0 truncate text-dim">{p.name}</span>
              <span className="shrink-0 font-medium text-primary">
                {p.priceText}
                {p.period ? (
                  <span className="text-dim">/{p.period}</span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-dim">
          {enrichmentEnabled ? (
            <>
              Not listed —{" "}
              {gym.website ? (
                <a
                  href={gym.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan hover:text-heading"
                >
                  check site
                </a>
              ) : (
                "check site"
              )}
            </>
          ) : (
            "—"
          )}
        </p>
      )}

      {/* Least busy */}
      <p className="mt-3 text-[10px] uppercase tracking-wide text-dim">
        Least busy
      </p>
      {gym.quietTimes ? (
        <p className="mt-1 text-xs leading-snug text-green">{gym.quietTimes}</p>
      ) : (
        <p className="mt-1 text-xs text-dim">—</p>
      )}

      {/* Amenities */}
      <p className="mt-3 text-[10px] uppercase tracking-wide text-dim">
        Amenities
      </p>
      {gym.amenities.length > 0 ? (
        <ul className="mt-1 flex flex-wrap gap-1">
          {gym.amenities.map((a) => (
            <li
              key={a}
              className="rounded-full border border-green/30 bg-green/10 px-2 py-0.5 text-[10px] text-green"
            >
              {a}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs text-dim">—</p>
      )}

      {gym.website && (
        <a
          href={gym.website}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto pt-3 text-[11px] text-cyan hover:text-heading"
        >
          Visit website →
        </a>
      )}
    </div>
  );
}

export function GymCompareModal({
  open,
  loading,
  error,
  result,
  unit,
  onClose,
}: {
  open: boolean;
  loading: boolean;
  error: string | null;
  result: CompareResult | null;
  unit: DistanceUnit;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const count = result?.gyms.length ?? 0;

  return (
    <div
      className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="gym-compare-title"
    >
      <div
        className="absolute inset-0 bg-bg/85 backdrop-blur-[3px]"
        aria-hidden="true"
        onClick={onClose}
      />
      {/* Full-screen sheet on mobile, centered card on desktop. */}
      <div className="relative flex h-full w-full flex-col overflow-hidden border-primary/30 bg-panel shadow-[var(--shadow-modal)] sm:h-auto sm:max-h-[85vh] sm:max-w-3xl sm:rounded-panel sm:border">
        <div className="panel-header shrink-0 justify-between">
          <div className="inline-flex min-w-0 items-center">
            <PanelDot />
            <span className="ml-[var(--space-inline)] tracking-wide text-primary">
              Compare gyms
            </span>
          </div>
          <IconButton
            label="Close comparison"
            variant="ghost"
            className="size-8"
            onClick={onClose}
          >
            <CloseIcon />
          </IconButton>
        </div>

        <div className="modal-body min-h-0 flex-1 overflow-y-auto">
          <h2 id="gym-compare-title" className="sr-only">
            Gym comparison
          </h2>

          {loading && (
            <div className="flex flex-col items-center gap-3 py-8">
              <span
                className="size-7 animate-spin rounded-full border-2 border-line border-t-primary"
                aria-hidden="true"
              />
              <p className="text-center text-sm text-dim">
                Reading each gym&apos;s website for prices &amp; amenities…
                <br />
                <span className="text-[11px]">
                  This can take up to a minute the first time.
                </span>
              </p>
            </div>
          )}

          {error && !loading && (
            <p className="py-6 text-center text-sm text-magenta" role="alert">
              {error}
            </p>
          )}

          {!loading && !error && result && (
            <>
              {!result.enrichmentEnabled && (
                <p className="mb-3 rounded-cyber border border-line bg-bg/40 px-3 py-2 text-[11px] text-dim">
                  Live pricing &amp; amenities aren&apos;t enabled on the server
                  yet — showing distance and contact only.
                </p>
              )}
              <div
                className="grid gap-2.5"
                style={{
                  gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))`,
                }}
              >
                {result.gyms.map((gym, i) => (
                  <GymColumn
                    key={gym.id}
                    gym={gym}
                    index={i}
                    unit={unit}
                    enrichmentEnabled={result.enrichmentEnabled}
                  />
                ))}
              </div>
              <p className="mt-3 text-[10px] leading-snug text-dim">
                Prices &amp; amenities are auto-gathered from each gym&apos;s
                website and may be incomplete or out of date. Always confirm with
                the gym.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
