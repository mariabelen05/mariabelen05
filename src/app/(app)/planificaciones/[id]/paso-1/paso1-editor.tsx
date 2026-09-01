"use client";

import { useState, useTransition } from "react";
import { generarPaso1, ajustarPaso1, guardarPaso1 } from "@/lib/actions/planificacion-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { BorradorRecuperadoBanner } from "@/components/planificacion/sync-status";
import { AmbientStatusIsland } from "@/components/planificacion/ambient-status-island";
import { useOfflineDraft } from "@/lib/offline/use-offline-draft";
import { SparkleIcon, SearchIcon, XIcon, PlusIcon } from "@/components/icons";
import { HighlightedTextarea, HighlightedInput } from "@/components/highlighted-fields";
import { SortableList } from "@/components/ui/sortable-list";
import { countMatches } from "@/lib/text-highlight";
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
  const [iaPending, startIaTransition] = useTransition();
  const [guardarPending, startGuardarTransition] = useTransition();
  const pending = iaPending || guardarPending;
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const { status, borradorRecuperado, descartarBorradorRecuperado } = useOfflineDraft(
    planId,
    "paso1",
    contenido,
    (c) => guardarPaso1(planId, c, false)
  );

  const generar = () => {
    setError(null);
    startIaTransition(async () => {
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
    startGuardarTransition(async () => {
      try {
        await guardarPaso1(planId, contenido, aprobar);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const banner = borradorRecuperado && (
    <BorradorRecuperadoBanner
      onRestaurar={() => {
        setContenido(borradorRecuperado);
        descartarBorradorRecuperado();
      }}
      onDescartar={descartarBorradorRecuperado}
    />
  );

  if (!contenido) {
    return (
      <div className="flex flex-col gap-4">
        {!readOnly && <AmbientStatusIsland status={status} iaGenerando={iaPending} />}
        {banner}
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
      </div>
    );
  }

  const totalCoincidencias = busqueda.trim()
    ? countMatches(contenido.objetivoGeneral.texto, busqueda) +
      contenido.objetivosEspecificos.reduce((n, o) => n + countMatches(o.texto, busqueda), 0) +
      contenido.unidadesContenido.reduce(
        (n, u) => n + countMatches(u.titulo, busqueda) + u.subtemas.reduce((m, s) => m + countMatches(s.texto, busqueda), 0),
        0
      )
    : 0;

  return (
    <div className="flex flex-col gap-6 pb-20">
      {!readOnly && <AmbientStatusIsland status={status} iaGenerando={iaPending} />}
      {banner}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-faint">Paso 1 · Objetivos y contenidos</h2>
      </div>

      <div className="flex items-center gap-2 rounded-[10px] border border-border bg-surface px-3 py-2 sm:w-80">
        <SearchIcon className="h-4 w-4 shrink-0 text-text-faint" />
        <input
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar dentro del documento…"
          className="w-full bg-transparent text-[13px] outline-none placeholder:text-text-faint"
        />
        {busqueda.trim() && (
          <span className="shrink-0 text-[11px] font-semibold text-text-faint">
            {totalCoincidencias} {totalCoincidencias === 1 ? "coincidencia" : "coincidencias"}
          </span>
        )}
      </div>

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
        <HighlightedTextarea
          highlight={busqueda}
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
        {readOnly ? (
          contenido.objetivosEspecificos.map((o) => (
            <div key={o.id} className="flex items-start gap-2">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <HighlightedTextarea
                highlight={busqueda}
                wrapperClassName="flex-1"
                disabled
                value={o.texto}
                onChange={() => {}}
                rows={2}
                className="resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-primary disabled:opacity-70"
              />
            </div>
          ))
        ) : (
          <SortableList
            items={contenido.objetivosEspecificos}
            getKey={(o) => o.id}
            onReorder={(next) => setContenido({ ...contenido, objetivosEspecificos: next })}
            renderItem={(o, dragHandle) => (
              <div className="flex items-start gap-1.5 bg-card">
                {dragHandle}
                <HighlightedTextarea
                  highlight={busqueda}
                  wrapperClassName="flex-1"
                  value={o.texto}
                  onChange={(e) =>
                    setContenido({
                      ...contenido,
                      objetivosEspecificos: contenido.objetivosEspecificos.map((x) =>
                        x.id === o.id ? { ...x, texto: e.target.value, estado: "editado" } : x
                      ),
                    })
                  }
                  rows={2}
                  className="resize-none rounded-[11px] border border-border bg-surface px-3.5 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() =>
                    setContenido({
                      ...contenido,
                      objetivosEspecificos: contenido.objetivosEspecificos.filter((x) => x.id !== o.id),
                    })
                  }
                  aria-label="Quitar objetivo"
                  className="mt-2 shrink-0 rounded-full p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            )}
          />
        )}
        {!readOnly && (
          <button
            type="button"
            onClick={() =>
              setContenido({
                ...contenido,
                objetivosEspecificos: [
                  ...contenido.objetivosEspecificos,
                  { id: crypto.randomUUID(), texto: "", estado: "editado" },
                ],
              })
            }
            className="flex w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-border px-3 py-1.5 text-[12.5px] font-bold text-primary hover:bg-primary-soft"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Agregar
          </button>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Unidades de contenido</h2>
        {contenido.unidadesContenido.map((u, i) => (
          <div key={u.id} className="flex flex-col gap-2 rounded-xl bg-surface p-3.5">
            <div className="flex items-center gap-2">
              <HighlightedInput
                highlight={busqueda}
                wrapperClassName="flex-1"
                disabled={readOnly}
                value={u.titulo}
                onChange={(e) => {
                  const next = [...contenido.unidadesContenido];
                  next[i] = { ...u, titulo: e.target.value };
                  setContenido({ ...contenido, unidadesContenido: next });
                }}
                className="rounded-lg border border-border bg-card px-3 py-1.5 text-[13px] font-bold outline-none focus:border-primary disabled:opacity-70"
              />
              <span className="shrink-0 rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
                {u.tag}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setContenido({
                      ...contenido,
                      unidadesContenido: contenido.unidadesContenido.filter((_, idx) => idx !== i),
                    })
                  }
                  aria-label="Quitar unidad"
                  className="shrink-0 rounded-full p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5 pl-4">
              {u.subtemas.map((s, j) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-text-faint" />
                  <HighlightedInput
                    highlight={busqueda}
                    wrapperClassName="flex-1"
                    disabled={readOnly}
                    value={s.texto}
                    onChange={(e) => {
                      const nextU = [...contenido.unidadesContenido];
                      const nextSub = [...u.subtemas];
                      nextSub[j] = { ...s, texto: e.target.value };
                      nextU[i] = { ...u, subtemas: nextSub };
                      setContenido({ ...contenido, unidadesContenido: nextU });
                    }}
                    className="rounded-md border border-transparent bg-transparent px-1 py-0.5 text-[12.5px] outline-none focus:border-border disabled:opacity-70"
                  />
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextU = [...contenido.unidadesContenido];
                        nextU[i] = { ...u, subtemas: u.subtemas.filter((_, idx) => idx !== j) };
                        setContenido({ ...contenido, unidadesContenido: nextU });
                      }}
                      aria-label="Quitar contenido"
                      className="shrink-0 rounded-full p-0.5 text-text-faint hover:bg-danger-soft hover:text-danger"
                    >
                      <XIcon className="h-3.5 w-3.5" />
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const nextU = [...contenido.unidadesContenido];
                  nextU[i] = { ...u, subtemas: [...u.subtemas, { id: crypto.randomUUID(), texto: "" }] };
                  setContenido({ ...contenido, unidadesContenido: nextU });
                }}
                className="ml-4 flex w-fit items-center gap-1.5 rounded-[8px] border border-dashed border-border px-2.5 py-1 text-[11.5px] font-bold text-primary hover:bg-primary-soft"
              >
                <PlusIcon className="h-3 w-3" /> Agregar contenido
              </button>
            )}
          </div>
        ))}
        {!readOnly && (
          <button
            type="button"
            onClick={() =>
              setContenido({
                ...contenido,
                unidadesContenido: [
                  ...contenido.unidadesContenido,
                  { id: crypto.randomUUID(), titulo: "", tag: "Conceptual", subtemas: [] },
                ],
              })
            }
            className="flex w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-border px-3 py-1.5 text-[12.5px] font-bold text-primary hover:bg-primary-soft"
          >
            <PlusIcon className="h-3.5 w-3.5" /> Agregar unidad
          </button>
        )}
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
