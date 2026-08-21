"use client";

import { useState, useTransition } from "react";
import { generarPaso2, ajustarPaso2, guardarPaso2 } from "@/lib/actions/planificacion-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { SyncStatusBadge, BorradorRecuperadoBanner } from "@/components/planificacion/sync-status";
import { useOfflineDraft } from "@/lib/offline/use-offline-draft";
import { SparkleIcon } from "@/components/icons";
import type { MetodologiaActividades, Actividad } from "@/lib/planificacion-types";

const RECURSOS = [
  "Pizarrón", "Computadora", "Internet", "Proyector", "Fotocopias",
  "Libros de texto", "Material de laboratorio", "Instrumentos musicales", "Cancha / patio",
];

export function Paso2Editor({
  planId,
  initialContenido,
  readOnly,
}: {
  planId: string;
  initialContenido: MetodologiaActividades | null;
  readOnly: boolean;
}) {
  const [recursos, setRecursos] = useState<string[]>(
    initialContenido?.recursosDisponibles ?? ["Pizarrón"]
  );
  const [contenido, setContenido] = useState(initialContenido);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { status, borradorRecuperado, descartarBorradorRecuperado } = useOfflineDraft(
    planId,
    "paso2",
    contenido,
    (c) => guardarPaso2(planId, c, false)
  );

  const generar = () => {
    setError(null);
    startTransition(async () => {
      try {
        await generarPaso2(planId, recursos);
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
        await guardarPaso2(planId, contenido, aprobar);
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const toggleRecurso = (r: string) =>
    setRecursos((rs) => (rs.includes(r) ? rs.filter((x) => x !== r) : [...rs, r]));

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
            ¿Qué recursos tenés disponibles en el aula? Con eso, Aulera te propone una metodología y
            actividades de inicio, desarrollo y cierre.
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2">
          {RECURSOS.map((r) => (
            <button
              key={r}
              onClick={() => toggleRecurso(r)}
              className={`rounded-full border px-3.5 py-1.5 text-[12.5px] font-semibold transition-colors ${
                recursos.includes(r)
                  ? "border-primary bg-primary-soft text-primary"
                  : "border-border bg-surface text-text-faint"
              }`}
            >
              {r}
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

  const bloques: { key: "inicio" | "desarrollo" | "cierre"; label: string }[] = [
    { key: "inicio", label: "Inicio" },
    { key: "desarrollo", label: "Desarrollo" },
    { key: "cierre", label: "Cierre" },
  ];

  return (
    <div className="flex flex-col gap-6 pb-20">
      {banner}
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wide text-text-faint">Paso 2 · Metodología y actividades</h2>
        {!readOnly && <SyncStatusBadge status={status} />}
      </div>
      <section className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-text">Metodología recomendada</h2>
          <SuggestionBadge estado={contenido.metodologia.estado} />
        </div>
        <input
          disabled={readOnly}
          value={contenido.metodologia.texto}
          onChange={(e) =>
            setContenido({
              ...contenido,
              metodologia: { ...contenido.metodologia, texto: e.target.value, estado: "editado" },
            })
          }
          className="rounded-[11px] border border-border bg-surface px-3.5 py-2.5 text-sm font-bold outline-none focus:border-primary disabled:opacity-70"
        />
        <p className="text-xs text-text-faint">{contenido.metodologia.motivo}</p>
      </section>

      {bloques.map(({ key, label }) => {
        const act = contenido.actividades[key];
        return (
          <section key={key} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-sm font-extrabold text-text">{label}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoActividad label="Tipo" value={act.tipo} readOnly={readOnly}
                onChange={(v) => updateActividad(setContenido, contenido, key, { tipo: v })} />
              <CampoActividad label="Duración" value={act.duracion} readOnly={readOnly}
                onChange={(v) => updateActividad(setContenido, contenido, key, { duracion: v })} />
            </div>
            <CampoActividad label="Objetivo" value={act.objetivo} readOnly={readOnly} multiline
              onChange={(v) => updateActividad(setContenido, contenido, key, { objetivo: v })} />
            <CampoActividad label="Consigna" value={act.consigna} readOnly={readOnly} multiline
              onChange={(v) => updateActividad(setContenido, contenido, key, { consigna: v })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <CampoActividad label="Modalidad" value={act.modalidad} readOnly={readOnly}
                onChange={(v) => updateActividad(setContenido, contenido, key, { modalidad: v })} />
              <CampoActividad label="Recursos" value={act.recursos} readOnly={readOnly}
                onChange={(v) => updateActividad(setContenido, contenido, key, { recursos: v })} />
            </div>
            <CampoActividad label="Resultado esperado" value={act.resultadoEsperado} readOnly={readOnly} multiline
              onChange={(v) => updateActividad(setContenido, contenido, key, { resultadoEsperado: v })} />

            {act.variantes && (
              <div className="mt-1 flex flex-col gap-3 rounded-xl bg-surface p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wide text-text-faint">
                  Variantes de la actividad — Educación especial
                </span>
                <CampoActividad label="Apoyo" value={act.variantes.apoyo} readOnly={readOnly} multiline
                  onChange={(v) => updateVariante(setContenido, contenido, key, "apoyo", v)} />
                <CampoActividad label="Ampliación" value={act.variantes.ampliacion} readOnly={readOnly} multiline
                  onChange={(v) => updateVariante(setContenido, contenido, key, "ampliacion", v)} />
              </div>
            )}
          </section>
        );
      })}

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
          const actualizado = await ajustarPaso2(planId, mensaje);
          setContenido(actualizado);
          return actualizado.chat[actualizado.chat.length - 1]?.texto ?? "Listo, apliqué el ajuste.";
        }}
      />
    </div>
  );
}

function updateActividad(
  setContenido: (c: MetodologiaActividades) => void,
  contenido: MetodologiaActividades,
  key: "inicio" | "desarrollo" | "cierre",
  patch: Partial<Actividad>
) {
  setContenido({
    ...contenido,
    actividades: { ...contenido.actividades, [key]: { ...contenido.actividades[key], ...patch } },
  });
}

function updateVariante(
  setContenido: (c: MetodologiaActividades) => void,
  contenido: MetodologiaActividades,
  key: "inicio" | "desarrollo" | "cierre",
  variante: "apoyo" | "ampliacion",
  value: string
) {
  const act = contenido.actividades[key];
  if (!act.variantes) return;
  updateActividad(setContenido, contenido, key, { variantes: { ...act.variantes, [variante]: value } });
}

function CampoActividad({
  label, value, onChange, readOnly, multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  readOnly: boolean;
  multiline?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11.5px] font-semibold text-text-faint">{label}</span>
      {multiline ? (
        <textarea
          disabled={readOnly}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-70"
        />
      ) : (
        <input
          disabled={readOnly}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary disabled:opacity-70"
        />
      )}
    </label>
  );
}
