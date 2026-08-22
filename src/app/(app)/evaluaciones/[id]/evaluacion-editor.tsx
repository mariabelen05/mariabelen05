"use client";

import { useState, useTransition } from "react";
import {
  generarContenidoEvaluacionAction, ajustarContenidoEvaluacionAction, guardarContenidoEvaluacionAction,
} from "@/lib/actions/evaluaciones-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { SyncStatusBadge, BorradorRecuperadoBanner } from "@/components/planificacion/sync-status";
import { useOfflineDraft } from "@/lib/offline/use-offline-draft";
import { SparkleIcon } from "@/components/icons";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";

const VACIO: EvaluacionContenido = { texto: "", estado: "editado", chat: [] };

export function EvaluacionEditor({
  evaluacionId,
  initialContenido,
}: {
  evaluacionId: string;
  initialContenido: EvaluacionContenido | null;
}) {
  const [contenido, setContenido] = useState<EvaluacionContenido>(initialContenido ?? VACIO);
  const [generating, startGenerating] = useTransition();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { status, borradorRecuperado, descartarBorradorRecuperado } = useOfflineDraft(
    evaluacionId,
    "contenido",
    contenido,
    (c) => guardarContenidoEvaluacionAction(evaluacionId, c, false)
  );

  const generar = () => {
    setError(null);
    startGenerating(async () => {
      try {
        await generarContenidoEvaluacionAction(evaluacionId);
        window.location.reload();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  const guardar = (aprobar: boolean) => {
    setError(null);
    startTransition(async () => {
      try {
        await guardarContenidoEvaluacionAction(evaluacionId, contenido, aprobar);
        if (aprobar) setContenido((c) => ({ ...c, estado: "aprobado" }));
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

  return (
    <div className="flex flex-col gap-5 pb-24">
      {banner}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {contenido.texto.trim() ? <SuggestionBadge estado={contenido.estado} /> : <span />}
        <SyncStatusBadge status={status} />
      </div>

      <div className="mx-auto w-full max-w-[820px] rounded-2xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(30,35,64,0.35)]">
        <textarea
          value={contenido.texto}
          onChange={(e) => setContenido({ ...contenido, texto: e.target.value, estado: "editado" })}
          placeholder="Escribí acá el contenido de la evaluación — consignas, preguntas, criterios de corrección — con tus propias palabras. También podés pedirle un borrador a Aulera con el botón de abajo, o desde el asistente lateral."
          className="min-h-[60vh] w-full resize-y rounded-2xl border-none bg-transparent p-8 text-[15px] leading-relaxed text-text outline-none placeholder:text-text-faint sm:p-12"
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={generar}
          disabled={generating}
          className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60"
        >
          <SparkleIcon className="h-4 w-4 text-purple" />
          {generating ? "Generando…" : contenido.texto.trim() ? "Regenerar borrador con IA" : "Generar borrador con IA"}
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
          disabled={pending || !contenido.texto.trim()}
          className="ml-auto rounded-[11px] bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Marcar como lista
        </button>
      </div>

      <AssistantPanel
        chat={contenido.chat}
        onAjuste={async (mensaje) => {
          const actualizado = await ajustarContenidoEvaluacionAction(evaluacionId, contenido, mensaje);
          setContenido(actualizado);
          return actualizado.chat[actualizado.chat.length - 1]?.texto ?? "Listo, apliqué el ajuste.";
        }}
      />
    </div>
  );
}
