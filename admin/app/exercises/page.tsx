"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ExerciseDetail } from "@/components/ExerciseDetail";
import { fetchExercises, type ExerciseListItem } from "@/lib/api";

const PAGE_SIZE = 24;
const MUSCLES = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "forearms",
  "quadriceps",
  "hamstrings",
  "glutes",
  "calves",
  "abdominals",
  "lats",
  "traps",
];

export default function ExercisesPage() {
  const [rows, setRows] = useState<ExerciseListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchExercises({
        page,
        pageSize: PAGE_SIZE,
        search: query,
        muscle: muscle || undefined,
      });
      setRows(res.exercises);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exercises");
    }
  }, [page, query, muscle]);

  useEffect(() => {
    if (!selectedId) load();
  }, [load, selectedId]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (selectedId) {
    return (
      <AdminShell>
        <ExerciseDetail id={selectedId} onBack={() => setSelectedId(null)} />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl tracking-wider text-heading">
          Exercises <span className="text-dim">({total})</span>
        </h1>
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-40"
            value={muscle}
            onChange={(e) => {
              setPage(1);
              setMuscle(e.target.value);
            }}
          >
            <option value="">All muscles</option>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setPage(1);
              setQuery(search);
            }}
            className="flex gap-2"
          >
            <input
              className="input w-52"
              placeholder="Search name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button type="submit" variant="ghost">
              Search
            </Button>
          </form>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {rows.map((ex) => (
          <button
            key={ex.id}
            onClick={() => setSelectedId(ex.id)}
            className="panel group overflow-hidden text-left transition-transform hover:-translate-y-0.5"
          >
            <div className="aspect-video w-full overflow-hidden bg-black">
              {ex.media[0] ? (
                ex.media[0].type === "VIDEO" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <div className="grid h-full place-items-center text-dim">
                    ▶ video
                  </div>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.media[0].url}
                    alt={ex.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                )
              ) : (
                <div className="grid h-full place-items-center text-xs text-dim">
                  no image
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="line-clamp-1 text-sm font-medium text-heading">
                {ex.name}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {ex.primaryMuscles[0] && (
                  <Badge tone="primary">{ex.primaryMuscles[0]}</Badge>
                )}
                {ex.equipment && <Badge>{ex.equipment}</Badge>}
              </div>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <p className="col-span-full py-8 text-center text-sm text-dim">
            No exercises found.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between text-sm text-dim">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </Button>
          <Button
            variant="ghost"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </AdminShell>
  );
}
