"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  deleteExerciseMedia,
  fetchExercise,
  uploadExerciseMedia,
  type ExerciseDetail as Detail,
} from "@/lib/api";

export function ExerciseDetail({
  id,
  onBack,
}: {
  id: string;
  onBack: () => void;
}) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await fetchExercise(id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load exercise");
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await uploadExerciseMedia(id, file);
      if (fileRef.current) fileRef.current.value = "";
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const onDelete = async (mediaId: string) => {
    if (!window.confirm("Delete this media?")) return;
    try {
      await deleteExerciseMedia(id, mediaId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  };

  if (!data) {
    return (
      <div>
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <p className="mt-4 text-sm text-dim">
          {error ?? "Loading exercise…"}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h1 className="font-heading text-2xl tracking-wider text-heading">
          {data.name}
        </h1>
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Panel
          title={`Media (${data.media.length})`}
          action={
            <label className="cursor-pointer text-xs text-primary hover:underline">
              {uploading ? "Uploading…" : "+ Upload image/video"}
              <input
                ref={fileRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                disabled={uploading}
                onChange={onUpload}
              />
            </label>
          }
        >
          {data.media.length === 0 ? (
            <p className="text-sm text-dim">No media yet. Upload one above.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {data.media.map((m) => (
                <div
                  key={m.id}
                  className="group relative overflow-hidden rounded-[var(--radius-cyber)] border border-line"
                >
                  {m.type === "VIDEO" ? (
                    <video src={m.url} controls className="aspect-video w-full bg-black object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.url}
                      alt={data.name}
                      className="aspect-video w-full bg-black object-cover"
                    />
                  )}
                  <div className="absolute right-1 top-1 flex gap-1">
                    {m.source === "seed" && <Badge tone="neutral">seed</Badge>}
                    <button
                      onClick={() => onDelete(m.id)}
                      className="rounded bg-black/70 px-1.5 text-xs text-error opacity-0 transition-opacity group-hover:opacity-100"
                      title="Delete"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Details">
          <dl className="space-y-2 text-sm">
            <Field label="Equipment" value={data.equipment} />
            <Field label="Level" value={data.level} />
            <Field label="Mechanic" value={data.mechanic} />
            <Field label="Force" value={data.force} />
            <Field label="Category" value={data.category} />
            <div>
              <dt className="text-[11px] uppercase tracking-wider text-dim">
                Primary muscles
              </dt>
              <dd className="mt-1 flex flex-wrap gap-1">
                {data.primaryMuscles.map((m) => (
                  <Badge key={m} tone="primary">
                    {m}
                  </Badge>
                ))}
              </dd>
            </div>
            {data.secondaryMuscles.length > 0 && (
              <div>
                <dt className="text-[11px] uppercase tracking-wider text-dim">
                  Secondary muscles
                </dt>
                <dd className="mt-1 flex flex-wrap gap-1">
                  {data.secondaryMuscles.map((m) => (
                    <Badge key={m}>{m}</Badge>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </Panel>
      </div>

      {data.instructions.length > 0 && (
        <Panel title="Instructions">
          <ol className="list-decimal space-y-2 pl-5 text-sm text-text">
            {data.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </Panel>
      )}
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-[11px] uppercase tracking-wider text-dim">{label}</dt>
      <dd className="text-heading">{value}</dd>
    </div>
  );
}
