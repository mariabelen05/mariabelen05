"use client";

import { useState, useTransition } from "react";
import { generarPaso1, ajustarPaso1, guardarPaso1 } from "@/lib/actions/planificacion-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { SparkleIcon } from "@/components/icons";
import type { ObjetivosContenidos } from "@/lib/planificacion-types";

export function Paso1Editor({
  planId,
  contextoLibre,
  initialContenido,
  readOnly,
}: {
  planId: string;
  contextoLibre: string;
  initialContenido: ObjetivosContenidos | null;
  readOnly: boolean;
}) {
  const [contenido, setContenido] = useState(initialContenido);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const generar = () => {
    setError(null);
    startTransition(async () => {
      try {
        await generarPaso1(planId);
        window.location.reload();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const guardar = (aprobar: boolean) => {
    if (!contenido) return;
    setError(null);
    startTransition(async () => {
      try {
        await guardarPaso1(planId, contenido, aprobar);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  if (!contenido) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-14 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-purple-soft text-purple">
          <SparkleIcon className="h-5 w-5" />
        </div>
        <div className="max-w-md text-sm text-text-faint">
          A partir de lo que contaste — &quot;{contextoLibre.slice(0, 140)}
          {contextoLibre.length > 140 ? "…" : ""}&quot; — Aulera puede proponerte un objetivo general,
          objetivos específicos y unidades de contenido.
        </div>
        <button
          onClick={generar}
          disabled={pending || readOnly}
          className="rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Generando…" : "Generar propuesta con IA"}
        </button>
        {error && <p className="text-xs text-danger">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {!contenido.fuente.basadoEnDocumentos && (
        <p className="rounded-xl bg-warning-soft px-4 py-3 text-xs text-warning">
          Esta propuesta se basa en conocimiento pedagógico general — no hay documentos institucionales
          cargados para esta planificación. No reemplaza el diseño curricular jurisdiccional vigente.
        </p>
      )}

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text">Objetivo general</h2>
          <SuggestionBadge estado={contenido.objetivoGeneral.estado} />
        </div>
        <textarea
          disabled={readOnly}
          value={contenido.objetivoGeneral.texto}
          onChange={(e) =>
            setContenido({
              ...contenido,
              objetivoGeneral: { texto: e.target.value, estado: "editado" },
            })
          }
          rows={3}
          className="resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-70"
        />
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Objetivos específicos</h2>
        {contenido.objetivosEspecificos.map((o, i) => (
          <div key={o.id} className="flex items-start gap-2">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <textarea
              disabled={readOnly}
              value={o.texto}
              onChange={(e) => {
                const next = [...contenido.objetivosEspecificos];
                next[i] = { ...o, texto: e.target.value, estado: "editado" };
                setContenido({ ...contenido, objetivosEspecificos: next });
              }}
              rows={2}
              className="flex-1 resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-primary disabled:opacity-70"
            />
          </div>
        ))}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Unidades de contenido</h2>
        {contenido.unidadesContenido.map((u, i) => (
          <div key={u.id} className="flex flex-col gap-2 rounded-xl bg-surface p-3.5">
            <div className="flex items-center gap-2">
              <input
                disabled={readOnly}
                value={u.titulo}
                onChange={(e) => {
                  const next = [...contenido.unidadesContenido];
                  next[i] = { ...u, titulo: e.target.value };
                  setContenido({ ...contenido, unidadesContenido: next });
                }}
                className="flex-1 rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary disabled:opacity-70"
              />
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
                {u.tag}
              </span>
            </div>
            <ul className="flex flex-col gap-1.5 pl-4">
              {u.subtemas.map((s, j) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-text-faint" />
                  <input
                    disabled={readOnly}
                    value={s.texto}
                    onChange={(e) => {
                      const nextU = [...contenido.unidadesContenido];
                      const nextSub = [...u.subtemas];
                      nextSub[j] = { ...s, texto: e.target.value };
                      nextU[i] = { ...u, subtemas: nextSub };
                      setContenido({ ...contenido, unidadesContenido: nextU });
                    }}
                    className="flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12.5px] outline-none focus:border-border disabled:opacity-70"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      {error && <p className="text-xs text-danger">{error}</p>}

      {!readOnly && (
        <div className="flex flex-wrap gap-3">
          <button
            onClick={generar}
            disabled={pending}
            className="rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60"
          >
            Regenerar con IA
          </button>
          <button
            onClick={() => guardar(false)}
            disabled={pending}
            className="rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60"
          >
            Guardar borrador
          </button>
          <button
            onClick={() => guardar(true)}
            disabled={pending}
            className="ml-auto rounded-[11px] bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Aprobar y continuar →
          </button>
        </div>
      )}

      <AssistantPanel
        chat={contenido.chat}
        disabled={readOnly}
        onAjuste={async (mensaje) => {
          const actualizado = await ajustarPaso1(planId, mensaje);
          setContenido(actualizado);
          return actualizado.chat[actualizado.chat.length - 1]?.texto ?? "Listo, apliqué el ajuste.";
        }}
      />
    </div>
  );
}
