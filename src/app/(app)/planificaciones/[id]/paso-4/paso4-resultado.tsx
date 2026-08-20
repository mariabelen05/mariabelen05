"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { finalizarPlanificacion } from "@/lib/actions/planificacion-actions";
import { DownloadIcon, CheckIcon, SearchIcon } from "@/components/icons";
import { countMatches, renderHighlighted } from "@/lib/text-highlight";
import type {
  ObjetivosContenidos, MetodologiaActividades, InstrumentoEvaluacion, CoherenciaReporte,
} from "@/lib/planificacion-types";

export function Paso4Resultado({
  planId,
  finalizada,
  readOnly,
  objetivos,
  metodologia,
  evaluacion,
  coherencia,
}: {
  planId: string;
  finalizada: boolean;
  readOnly: boolean;
  objetivos: ObjetivosContenidos;
  metodologia: MetodologiaActividades;
  evaluacion: InstrumentoEvaluacion;
  coherencia: CoherenciaReporte | null;
}) {
  const [pending, startTransition] = useTransition();
  const [busqueda, setBusqueda] = useState("");
  const router = useRouter();

  const finalizar = () => {
    startTransition(async () => {
      await finalizarPlanificacion(planId);
      router.refresh();
    });
  };

  const totalCoincidencias = busqueda.trim()
    ? countMatches(objetivos.objetivoGeneral.texto, busqueda) +
      objetivos.objetivosEspecificos.reduce((n, o) => n + countMatches(o.texto, busqueda), 0) +
      objetivos.unidadesContenido.reduce((n, u) => n + countMatches(u.titulo, busqueda), 0) +
      countMatches(metodologia.metodologia.texto, busqueda) +
      (["inicio", "desarrollo", "cierre"] as const).reduce(
        (n, k) => n + countMatches(metodologia.actividades[k].consigna, busqueda),
        0
      ) +
      countMatches(evaluacion.instrumento.texto, busqueda) +
      evaluacion.criterios.reduce((n, c) => n + countMatches(c, busqueda), 0)
    : 0;

  return (
    <div className="flex flex-col gap-6 pb-16">
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

      {finalizada ? (
        <div className="flex items-center gap-3 rounded-2xl bg-success-soft px-5 py-4">
          <CheckIcon className="h-5 w-5 shrink-0 text-success" />
          <div className="text-sm font-bold text-success">
            Planificación finalizada. Ya podés descargarla en PDF o Word.
          </div>
        </div>
      ) : (
        <div className="rounded-2xl bg-purple-soft px-5 py-4 text-sm text-purple">
          Revisá el resumen completo. Cuando confirmes, la planificación queda marcada como finalizada
          y disponible para descargar.
        </div>
      )}

      {coherencia && coherencia.advertencias.length > 0 && (
        <div className="rounded-2xl bg-warning-soft px-5 py-4 text-xs text-warning">
          Esta planificación tiene {coherencia.advertencias.length} advertencia(s) de coherencia
          pedagógica sin resolver del paso 3. Podés finalizar igual, pero te recomendamos revisarlas.
        </div>
      )}

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Objetivos y contenidos</h2>
        <p className="text-[13px] text-text">{renderHighlighted(objetivos.objetivoGeneral.texto, busqueda)}</p>
        <ul className="list-inside list-disc text-[13px] text-text-faint">
          {objetivos.objetivosEspecificos.map((o) => (
            <li key={o.id}>{renderHighlighted(o.texto, busqueda)}</li>
          ))}
        </ul>
        <div className="mt-1 flex flex-wrap gap-1.5">
          {objetivos.unidadesContenido.map((u) => (
            <span key={u.id} className="rounded-full bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary">
              {renderHighlighted(u.titulo, busqueda)}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Metodología y actividades</h2>
        <p className="text-[13px] font-bold text-text">{renderHighlighted(metodologia.metodologia.texto, busqueda)}</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {(["inicio", "desarrollo", "cierre"] as const).map((k) => (
            <div key={k} className="rounded-xl bg-surface p-3">
              <div className="text-[11.5px] font-bold uppercase text-text-faint">{metodologia.actividades[k].titulo}</div>
              <p className="text-xs text-text">{renderHighlighted(metodologia.actividades[k].consigna, busqueda)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-5">
        <h2 className="text-sm font-extrabold text-text">Evaluación</h2>
        <p className="text-[13px] font-bold text-text">{renderHighlighted(evaluacion.instrumento.texto, busqueda)}</p>
        <ul className="list-inside list-disc text-[13px] text-text-faint">
          {evaluacion.criterios.map((c, i) => (
            <li key={i}>{renderHighlighted(c, busqueda)}</li>
          ))}
        </ul>
      </section>

      <div className="flex flex-wrap gap-3">
        {!finalizada && !readOnly && (
          <button
            onClick={finalizar}
            disabled={pending}
            className="rounded-[11px] bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
          >
            {pending ? "Finalizando…" : "Confirmar y finalizar planificación"}
          </button>
        )}
        {finalizada && (
          <>
            <a
              href={`/api/planificaciones/${planId}/export?format=pdf`}
              className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-3 text-sm font-bold text-text hover:bg-surface"
            >
              <DownloadIcon className="h-4 w-4" /> Descargar PDF
            </a>
            <a
              href={`/api/planificaciones/${planId}/export?format=docx`}
              className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-3 text-sm font-bold text-text hover:bg-surface"
            >
              <DownloadIcon className="h-4 w-4" /> Descargar Word
            </a>
          </>
        )}
      </div>
    </div>
  );
}
