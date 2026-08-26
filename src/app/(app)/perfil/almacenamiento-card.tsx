import { formatearBytes } from "@/lib/storage-usage";

export function AlmacenamientoCard({ usadoBytes, cuotaBytes }: { usadoBytes: number; cuotaBytes: number }) {
  const porcentaje = Math.min(100, (usadoBytes / cuotaBytes) * 100);
  const color = porcentaje >= 90 ? "bg-danger" : porcentaje >= 70 ? "bg-warning" : "bg-primary";

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h2 className="text-sm font-extrabold text-text">Almacenamiento</h2>
      <p className="mt-1 text-xs text-text-faint">
        Espacio usado por Documentos, Recursos e imágenes de Evaluaciones, compartido entre todas
        las cuentas de Aulera (el plan gratuito de Supabase da 1GB en total para todo el proyecto).
      </p>
      <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.max(porcentaje, porcentaje > 0 ? 2 : 0)}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold text-text">
        {formatearBytes(usadoBytes)} de {formatearBytes(cuotaBytes)} usados ({porcentaje.toFixed(1)}%)
      </p>
      {porcentaje >= 90 && (
        <p className="mt-1 text-xs text-danger">
          Casi sin espacio: las próximas subidas grandes pueden fallar hasta liberar lugar (borrando
          documentos/recursos viejos) o pasar a un plan pago de Supabase.
        </p>
      )}
    </div>
  );
}
