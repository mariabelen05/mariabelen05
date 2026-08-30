"use client";

import { useState, useTransition } from "react";
import {
  generarPaso3, ajustarPaso3, guardarPaso3, verificarCoherenciaAction,
} from "@/lib/actions/planificacion-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { SyncStatusBadge, BorradorRecuperadoBanner } from "@/components/planificacion/sync-status";
import { useOfflineDraft } from "@/lib/offline/use-offline-draft";
import { SparkleIcon, CheckIcon, AlertIcon, XIcon, PlusIcon } from "@/components/icons";
import type { InstrumentoEvaluacion, CoherenciaReporte } from "@/lib/planificacion-types";

const TIPOS = ["Diagnóstica", "Formativa", "Sumativa"];

export function Paso3Editor({
  planId,
  initialContenido,
  initialCoherencia,
  readOnly,
}: {
  planId: string;
  initialContenido: InstrumentoEvaluacion | null;
  initialCoherencia: CoherenciaReporte | null;
  readOnly: boolean;
}) {
  const [tipos, setTipos] = useState<string[]>(initialContenido?.tiposEvaluacion ?? ["Formativa", "Sumativa"]);
  const [contenido, setContenido] = useState(initialContenido);
  const [coherencia] = useState(initialCoherencia);
  const [pending, startTransition] = useTransition();
  const [checking, startChecking] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { status, borradorRecuperado, descartarBorradorRecuperado } = useOfflineDraft(
    planId,
    "paso3",
    contenido,
    (c) => guardarPaso3(planId, c, false)
  );

  const generar = () => {
    setError(null);
    startTransition(async () => {
      try {
        await generarPaso3(planId, tipos);
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
        await guardarPaso3(planId, contenido, aprobar);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const verificar = () => {
    setError(null);
    startChecking(async () => {
      try {
        await verificarCoherenciaAction(planId);
        window.location.reload();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const toggleTipo = (t: string) =>
    setTipos((ts) => (ts.includes(t) ? ts.filter((x) => x !== t) : [...ts, t]));

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
      {banner}
      <div className="flex flex-col gap-5 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card px-6 py-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-[13px] bg-purple-soft text-purple">
            <SparkleIcon className="h-5 w-5" />
          </div>
          <div className="max-w-md text-sm text-text-faint">
            ¿Qué tipo de evaluación necesitás? Aulera te va a proponer un instrumento coherente con la
            metodología que ya aprobaste.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {TIPOS.map((t) => (
            <button
              key={t}
              onClick={() => toggleTipo(t)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                tipos.includes(t)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text-faint"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <button
          onClick={generar}
          disabled={pending || readOnly}
          className="mx-auto rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          {pending ? "Generando…" : "Generar propuesta con IA"}
        </button>
        {error && <p className="text-center text-xs text-danger">{error}</p>}
      </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-20">
      {banner}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-faint">Paso 3 · Evaluación y coherencia</h2>
        {!readOnly && <SyncStatusBadge status={status} />}
      </div>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text">Instrumento de evaluación</h2>
          <SuggestionBadge estado={contenido.instrumento.estado} />
        </div>
        <input
          disabled={readOnly}
          value={contenido.instrumento.texto}
          onChange={(e) =>
            setContenido({
              ...contenido,
              instrumento: { ...contenido.instrumento, texto: e.target.value, estado: "editado" },
            })
          }
          className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm font-bold outline-none focus:border-primary disabled:opacity-70"
        />
        <p className="text-xs text-text-faint">{contenido.instrumento.motivo}</p>

        <div className="mt-1 flex flex-col gap-2">
          <span className="text-[11.5px] font-semibold text-text-faint">Criterios</span>
          {contenido.criterios.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                disabled={readOnly}
                value={c}
                onChange={(e) => {
                  const next = [...contenido.criterios];
                  next[i] = e.target.value;
                  setContenido({ ...contenido, criterios: next });
                }}
                className="w-full rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-70"
              />
              {!readOnly && (
                <button
                  type="button"
                  onClick={() =>
                    setContenido({ ...contenido, criterios: contenido.criterios.filter((_, idx) => idx !== i) })
                  }
                  aria-label="Quitar criterio"
                  className="shrink-0 rounded-full p-1 text-text-faint hover:bg-danger-soft hover:text-danger"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
          {!readOnly && (
            <button
              type="button"
              onClick={() => setContenido({ ...contenido, criterios: [...contenido.criterios, ""] })}
              className="flex w-fit items-center gap-1.5 rounded-[10px] border border-dashed border-border px-3 py-1.5 text-[12.5px] font-bold text-primary hover:bg-primary-soft"
            >
              <PlusIcon className="h-3.5 w-3.5" /> Agregar
            </button>
          )}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text">Verificación de coherencia pedagógica</h2>
          <button
            onClick={verificar}
            disabled={checking || readOnly}
            className="rounded-full bg-primary-soft px-3.5 py-1.5 text-[12px] font-bold text-primary disabled:opacity-60"
          >
            {checking ? "Analizando…" : coherencia ? "Volver a verificar" : "Verificar coherencia"}
          </button>
        </div>

        {coherencia && (
          <>
            <div className="flex flex-wrap items-center gap-2">
              {coherencia.cadena.map((c, i) => (
                <div key={c.clave} className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold ${
                      c.estado === "ok" ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                    }`}
                    title={c.detalle}
                  >
                    {c.estado === "ok" ? <CheckIcon className="h-3.5 w-3.5" /> : <AlertIcon className="h-3.5 w-3.5" />}
                    {c.label}
                  </div>
                  {i < coherencia.cadena.length - 1 && <div className="h-px w-3 bg-border" />}
                </div>
              ))}
            </div>

            {coherencia.advertencias.length === 0 ? (
              <p className="text-xs text-success">Todo coherente — no encontramos advertencias.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {coherencia.advertencias.map((a, i) => (
                  <div key={i} className="rounded-xl bg-warning-soft p-3">
                    <div className="text-[12.5px] font-bold text-warning">{a.titulo}</div>
                    <div className="text-xs text-text">{a.descripcion}</div>
                  </div>
                ))}
              </div>
            )}
          </>
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
          const actualizado = await ajustarPaso3(planId, mensaje);
          setContenido(actualizado);
          return actualizado.chat[actualizado.chat.length - 1]?.texto ?? "Listo, apliqué el ajuste.";
        }}
      />
    </div>
  );
}
