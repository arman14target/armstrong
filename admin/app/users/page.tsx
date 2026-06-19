"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import {
  deleteUser,
  fetchUsers,
  setUserDisabled,
  type AppUserRow,
} from "@/lib/api";

const PAGE_SIZE = 20;

export default function UsersPage() {
  const { admin } = useAdminAuth();
  const [rows, setRows] = useState<AppUserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchUsers({ page, pageSize: PAGE_SIZE, search: query });
      setRows(res.users);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    }
  }, [page, query]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggleDisabled = async (u: AppUserRow) => {
    setBusy(u.id);
    try {
      const updated = await setUserDisabled(u.id, !u.disabled);
      setRows((rs) => rs.map((r) => (r.id === u.id ? { ...r, ...updated } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(null);
    }
  };

  const onDelete = async (u: AppUserRow) => {
    if (
      !window.confirm(
        `Permanently delete ${u.email} and all their data? This cannot be undone.`,
      )
    )
      return;
    setBusy(u.id);
    try {
      await deleteUser(u.id);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusy(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const isSuper = admin?.role === "SUPERADMIN";

  return (
    <AdminShell>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl tracking-wider text-heading">
          Users <span className="text-dim">({total})</span>
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
            className="input w-56"
            placeholder="Search email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="ghost">
            Search
          </Button>
        </form>
      </div>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <Panel className="overflow-hidden" >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-dim">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Joined</th>
                <th className="pb-3 pr-4">Activity</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id} className="border-t border-line/60">
                  <td className="py-3 pr-4 text-heading">{u.email}</td>
                  <td className="py-3 pr-4 text-dim">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 pr-4 text-dim">
                    {u._count.dayEntries}w · {u._count.foodEntries}f ·{" "}
                    {u._count.customWorkouts}c
                  </td>
                  <td className="py-3 pr-4">
                    {u.disabled ? (
                      <Badge tone="danger">Disabled</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        disabled={busy === u.id}
                        onClick={() => onToggleDisabled(u)}
                      >
                        {u.disabled ? "Enable" : "Disable"}
                      </Button>
                      {isSuper && (
                        <Button
                          variant="danger"
                          disabled={busy === u.id}
                          onClick={() => onDelete(u)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-dim">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-dim">
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
      </Panel>
      <p className="mt-2 text-[11px] text-dim">
        Activity legend: w = workouts logged, f = food entries, c = custom days.
      </p>
    </AdminShell>
  );
}
