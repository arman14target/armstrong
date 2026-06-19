"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminShell } from "@/components/AdminShell";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  createAdmin,
  fetchAdmins,
  setAdminDisabled,
  type AdminRole,
  type AdminRow,
} from "@/lib/api";

export default function AdminsPage() {
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<AdminRole>("ADMIN");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await fetchAdmins());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load admins");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await createAdmin(email, password, role);
      setEmail("");
      setPassword("");
      setRole("ADMIN");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  const onToggle = async (a: AdminRow) => {
    try {
      const updated = await setAdminDisabled(a.id, !a.disabled);
      setRows((rs) => rs.map((r) => (r.id === a.id ? { ...r, ...updated } : r)));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    }
  };

  return (
    <AdminShell>
      <h1 className="mb-6 font-heading text-2xl tracking-wider text-heading">
        Admins
      </h1>

      {error && <p className="mb-4 text-sm text-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Staff accounts">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wider text-dim">
                <th className="pb-3 pr-4">Email</th>
                <th className="pb-3 pr-4">Role</th>
                <th className="pb-3 pr-4">Status</th>
                <th className="pb-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id} className="border-t border-line/60">
                  <td className="py-3 pr-4 text-heading">{a.email}</td>
                  <td className="py-3 pr-4">
                    <Badge tone={a.role === "SUPERADMIN" ? "primary" : "neutral"}>
                      {a.role}
                    </Badge>
                  </td>
                  <td className="py-3 pr-4">
                    {a.disabled ? (
                      <Badge tone="danger">Disabled</Badge>
                    ) : (
                      <Badge tone="success">Active</Badge>
                    )}
                  </td>
                  <td className="py-3 text-right">
                    <Button variant="ghost" onClick={() => onToggle(a)}>
                      {a.disabled ? "Enable" : "Disable"}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Add admin">
          <form className="space-y-4" onSubmit={onCreate}>
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim">
                Email
              </span>
              <input
                type="email"
                required
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim">
                Password (min 8)
              </span>
              <input
                type="password"
                required
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs tracking-wide text-dim">
                Role
              </span>
              <select
                className="input"
                value={role}
                onChange={(e) => setRole(e.target.value as AdminRole)}
              >
                <option value="ADMIN">ADMIN — manage users</option>
                <option value="SUPERADMIN">SUPERADMIN — full access</option>
              </select>
            </label>
            <Button type="submit" className="w-full" disabled={creating}>
              {creating ? "Creating…" : "Create admin"}
            </Button>
          </form>
        </Panel>
      </div>
    </AdminShell>
  );
}
