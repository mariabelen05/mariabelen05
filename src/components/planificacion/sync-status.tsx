import type { SyncStatus } from "@/lib/offline/use-offline-draft";

const CONFIG: Record<SyncStatus, { label: string; fg: string; bg: string }> = {
  sincronizado: { label: "Guardado", fg: "text-success", bg: "bg-success-soft" },
  sincronizando: { label: "Sincronizando…", fg: "text-primary", bg: "bg-primary-soft" },
  "guardado-local": { label: "Guardado en este dispositivo — pendiente de sincronizar", fg: "text-warning", bg: "bg-warning-soft" },
  "sin-conexion": { label: "Sin conexión — se guardó localmente", fg: "text-warning", bg: "bg-warning-soft" },
  error: { label: "No se pudo guardar", fg: "text-danger", bg: "bg-danger-soft" },
};

export function SyncStatusBadge({ status }: { status: SyncStatus }) {
  const c = CONFIG[status];
  return (
    <span className={`w-fit rounded-full px-2.5 py-1 text-[11px] font-bold ${c.fg} ${c.bg}`}>
      {c.label}
    </span>
  );
}

export function BorradorRecuperadoBanner({
  onRestaurar,
  onDescartar,
}: {
  onRestaurar: () => void;
  onDescartar: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-warning-soft px-4 py-3">
      <p className="text-xs text-warning">
        Encontramos cambios sin sincronizar de una sesión anterior (probablemente por un corte de
        conexión). ¿Querés recuperarlos?
      </p>
      <div className="flex gap-2">
        <button onClick={onDescartar} className="rounded-full border border-warning px-3 py-1 text-[11px] font-bold text-warning">
          Descartar
        </button>
        <button onClick={onRestaurar} className="rounded-full bg-warning px-3 py-1 text-[11px] font-bold text-white">
          Restaurar
        </button>
      </div>
    </div>
  );
}
