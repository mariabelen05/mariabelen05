"use client";

import { useState, useTransition } from "react";
import { eliminarRecurso, cambiarColorRecurso } from "@/lib/actions/recursos-actions";
import { FileIcon, MoreIcon, ExternalLinkIcon } from "@/components/icons";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { RECURSO_COLOR_PALETTE, RECURSO_COLOR_ORDER, detectRecursoColor } from "@/lib/recurso-colors";
import type { Recurso } from "@prisma/client";

export function RecursoRow({
  recurso,
}: {
  recurso: Recurso & { planificacion: { titulo: string } | null };
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, startTransition] = useTransition();
  const tags = recurso.tags ? (JSON.parse(recurso.tags) as string[]) : [];

  const colorId = detectRecursoColor(recurso);
  const color = RECURSO_COLOR_PALETTE[colorId];

  const elegirColor = (id: string | null) => {
    setMenuOpen(false);
    startTransition(() => cambiarColorRecurso(recurso.id, id));
  };

  return (
    <div
      className="relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-4"
      style={{ borderLeft: `4px solid ${color.accent}` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: color.bg, color: color.accent }}
        >
          <FileIcon className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          {recurso.tipo === "archivo" ? (
            <a
              href={`/api/recursos/${recurso.id}/file`}
              target="_blank"
              rel="noreferrer"
              className="truncate text-[13px] font-bold text-text hover:text-primary"
            >
              {recurso.titulo}
            </a>
          ) : (
            <div className="truncate text-[13px] font-bold text-text">{recurso.titulo}</div>
          )}
          {recurso.planificacion && <div className="truncate text-[11px] text-text-faint">{recurso.planificacion.titulo}</div>}
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-lg p-1 text-text-faint hover:bg-surface hover:text-text"
            aria-label="Más opciones"
          >
            <MoreIcon className="h-4 w-4" />
          </button>
          <ConfirmDeleteButton onDelete={() => eliminarRecurso(recurso.id)} />

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-7 z-20 w-56 rounded-xl border border-border bg-card p-3 shadow-[0_20px_50px_-12px_rgba(30,35,64,0.25)]">
                <div className="mb-2 text-[11.5px] font-bold text-text-faint">Cambiar color</div>
                <div className="grid grid-cols-4 gap-2">
                  {RECURSO_COLOR_ORDER.map((id) => {
                    const c = RECURSO_COLOR_PALETTE[id];
                    return (
                      <button
                        key={id}
                        type="button"
                        title={c.label}
                        onClick={() => elegirColor(id)}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                          colorId === id && recurso.colorOverride ? "border-text" : "border-transparent"
                        }`}
                        style={{ backgroundColor: c.bg }}
                      >
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: c.accent }} />
                      </button>
                    );
                  })}
                </div>
                {recurso.colorOverride && (
                  <button
                    type="button"
                    onClick={() => elegirColor(null)}
                    className="mt-2.5 w-full rounded-lg border border-border px-2.5 py-1.5 text-[11.5px] font-semibold text-text-faint hover:bg-surface"
                  >
                    Usar color automático
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      {recurso.descripcion && <p className="text-xs text-text-faint">{recurso.descripcion}</p>}
      {recurso.url && (
        <a
          href={recurso.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 truncate text-xs font-semibold text-primary"
        >
          <ExternalLinkIcon className="h-3 w-3 shrink-0" />
          {recurso.url}
        </a>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t, i) => (
            <span key={i} className="rounded-full bg-surface px-2 py-0.5 text-[10.5px] font-bold text-text-faint">{t}</span>
          ))}
        </div>
      )}
    </div>
  );
}
