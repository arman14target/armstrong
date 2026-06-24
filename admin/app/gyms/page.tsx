"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { GymDetail } from "@/components/GymDetail";
import { fetchGyms, type GymListItem } from "@/lib/api";

const PAGE_SIZE = 24;

export default function GymsPage() {
  const [rows, setRows] = useState<GymListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchGyms({ page, pageSize: PAGE_SIZE, search: query });
      setRows(res.gyms);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load gyms");
    }
  }, [page, query]);

  useEffect(() => {
    if (!selectedId) load();
  }, [load, selectedId]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (selectedId) {
    return (
      <AdminShell>
        <GymDetail
          id={selectedId}
          onBack={() => setSelectedId(null)}
          onDeleted={() => setSelectedId(null)}
        />
      </AdminShell>
    );
  }

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl tracking-wider text-heading">
          Gyms <span className="text-dim">({total})</span>
        </h1>
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
            placeholder="Search name or address…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="ghost">
            Search
          </Button>
        </form>
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <p className="mb-3 text-xs text-dim">
        Gyms are added automatically when users compare them. Curated price
        plans &amp; amenities (source <Badge tone="primary">admin</Badge>)
        survive re-crawls.
      </p>

      <div className="overflow-hidden rounded-[var(--radius-cyber)] border border-line">
        <table className="w-full text-sm">
          <thead className="bg-black/20 text-left text-xs uppercase tracking-wider text-dim">
            <tr>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2 text-center">Plans</th>
              <th className="px-3 py-2 text-center">Amenities</th>
              <th className="px-3 py-2">Least busy</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((g) => (
              <tr
                key={g.id}
                onClick={() => setSelectedId(g.id)}
                className="cursor-pointer border-t border-line transition-colors hover:bg-primary/5"
              >
                <td className="px-3 py-2 font-medium text-heading">{g.name}</td>
                <td className="max-w-[18rem] truncate px-3 py-2 text-dim">
                  {g.address ?? "—"}
                </td>
                <td className="px-3 py-2 text-center">
                  {g.pricePlanCount > 0 ? (
                    <Badge tone="primary">{g.pricePlanCount}</Badge>
                  ) : (
                    <span className="text-dim">0</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-dim">
                  {g.amenityCount}
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2 text-dim">
                  {g.quietTimes ?? "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-sm text-dim">
                  No gyms yet — they appear after users compare gyms in the app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
