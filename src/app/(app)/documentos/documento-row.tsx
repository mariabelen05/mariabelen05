"use client";

import { useState, useTransition } from "react";
import { eliminarDocumento, reprocesarDocumento } from "@/lib/actions/documentos-actions";
import { FileIcon } from "@/components/icons";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import type { Documento } from "@prisma/client";

const ESTADO: Record<string, { label: string; fg: string; bg: string }> = {
  PROCESADO: { label: "Procesado", fg: "text-success", bg: "bg-success-soft" },
  PROCESANDO: { label: "Procesando", fg: "text-primary", bg: "bg-primary-soft" },
  ERROR: { label: "Error", fg: "text-danger", bg: "bg-danger-soft" },
};

export function DocumentoRow({
  documento,
}: {
  documento: Documento & { planificacion: { titulo: string } | null };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const estado = ESTADO[documento.estado];

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center gap-3.5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <FileIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setOpen((v) => !v)}>
          <div className="truncate text-[13.5px] font-bold text-text">{documento.nombreArchivo}</div>
          <div className="truncate text-xs text-text-faint">
            {documento.clasificacion ?? "Sin clasificar"}
            {documento.planificacion && ` · ${documento.planificacion.titulo}`}
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${estado.fg} ${estado.bg}`}>
          {estado.label}
        </span>
        {documento.estado === "ERROR" && (
          <button
            disabled={pending}
            onClick={() => startTransition(() => reprocesarDocumento(documento.id))}
            className="shrink-0 text-[11.5px] font-bold text-primary disabled:opacity-50"
          >
            Reintentar
          </button>
        )}
        <ConfirmDeleteButton onDelete={() => eliminarDocumento(documento.id)} />
      </div>

      {open && (
        <div className="mt-3 rounded-xl bg-surface p-3 text-xs text-text">
          {documento.estado === "ERROR" && <p className="text-danger">{documento.errorMensaje}</p>}
          {documento.estado === "PROCESADO" && (
            <p className="whitespace-pre-wrap">{documento.textoExtraido?.slice(0, 1200)}{(documento.textoExtraido?.length ?? 0) > 1200 ? "…" : ""}</p>
          )}
          {documento.estado === "PROCESANDO" && <p className="text-text-faint">Procesando el documento…</p>}
        </div>
      )}
    </div>
  );
}
