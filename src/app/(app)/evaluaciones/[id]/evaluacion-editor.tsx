"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  generarContenidoEvaluacionAction, ajustarContenidoEvaluacionAction, guardarContenidoEvaluacionAction,
  subirImagenEvaluacion,
} from "@/lib/actions/evaluaciones-actions";
import { SuggestionBadge } from "@/components/planificacion/step-layout";
import { AssistantPanel } from "@/components/planificacion/assistant-panel";
import { SyncStatusBadge, BorradorRecuperadoBanner } from "@/components/planificacion/sync-status";
import { useOfflineDraft } from "@/lib/offline/use-offline-draft";
import { SparkleIcon, UploadIcon, DownloadIcon, XIcon } from "@/components/icons";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import { segmentarContenido, unirSegmentos, insertarImagenEnSegmentos } from "@/lib/evaluacion-canvas";
import type { EvaluacionContenido } from "@/lib/evaluacion-types";
import { mensajeError } from "@/lib/error-message";

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
  const [uploadingImagen, setUploadingImagen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFocusRef = useRef<{ segmentIndex: number; pos: number } | null>(null);

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
        setError(mensajeError(e, "generar el contenido"));
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
        setError(mensajeError(e, "guardar los cambios"));
      }
    });
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    if (file.size > MAX_UPLOAD_BYTES) {
      setError(`La imagen pesa demasiado. El tamaño máximo permitido es ${MAX_UPLOAD_LABEL}.`);
      return;
    }
    setUploadingImagen(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      const resultado = await subirImagenEvaluacion(evaluacionId, formData);
      if ("error" in resultado) {
        setError(resultado.error);
        return;
      }
      const segmentos = insertarImagenEnSegmentos(segmentarContenido(contenido.texto), lastFocusRef.current, resultado.id);
      setContenido({ ...contenido, texto: unirSegmentos(segmentos), estado: "editado" });
    } catch (err) {
      setError(mensajeError(err, "subir la imagen"));
    } finally {
      setUploadingImagen(false);
    }
  };

  const quitarImagen = (index: number) => {
    const segmentos = segmentarContenido(contenido.texto).filter((_, i) => i !== index);
    setContenido({ ...contenido, texto: unirSegmentos(segmentos), estado: "editado" });
  };

  const actualizarSegmentoTexto = (index: number, valor: string) => {
    const segmentos = segmentarContenido(contenido.texto);
    segmentos[index] = { tipo: "texto", valor };
    setContenido({ ...contenido, texto: unirSegmentos(segmentos), estado: "editado" });
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

  const segmentos = segmentarContenido(contenido.texto);
  const tieneContenido = contenido.texto.trim().length > 0;

  return (
    <div className="flex flex-col gap-5 pb-24">
      {banner}

      <div className="flex flex-wrap items-center justify-between gap-2">
        {tieneContenido ? <SuggestionBadge estado={contenido.estado} /> : <span />}
        <SyncStatusBadge status={status} />
      </div>

      <div className="mx-auto flex w-full max-w-[820px] flex-col gap-3 rounded-2xl border border-border bg-card p-8 shadow-[0_30px_80px_-40px_rgba(30,35,64,0.35)] sm:p-12">
        {segmentos.map((seg, i) =>
          seg.tipo === "imagen" ? (
            <ImagenInsertada
              key={`img-${seg.id}-${i}`}
              evaluacionId={evaluacionId}
              imagenId={seg.id}
              onQuitar={() => quitarImagen(i)}
            />
          ) : (
            <SegmentoTexto
              key={`texto-${i}`}
              valor={seg.valor}
              placeholder={
                segmentos.length === 1
                  ? "Escribí acá el contenido de la evaluación — consignas, preguntas, criterios de corrección — con tus propias palabras. También podés pedirle un borrador a Aulera con el botón de abajo, o desde el asistente lateral."
                  : undefined
              }
              onChange={(v) => actualizarSegmentoTexto(i, v)}
              onFocusInfo={(pos) => {
                lastFocusRef.current = { segmentIndex: i, pos };
              }}
            />
          )
        )}
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={generar}
          disabled={generating}
          className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60"
        >
          <SparkleIcon className="h-4 w-4 text-purple" />
          {generating ? "Generando…" : tieneContenido ? "Regenerar borrador con IA" : "Generar borrador con IA"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          onChange={onFileSelected}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadingImagen}
          className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface disabled:opacity-60"
        >
          <UploadIcon className="h-4 w-4 text-purple" />
          {uploadingImagen ? "Subiendo imagen…" : "Insertar imagen"}
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
          disabled={pending || !tieneContenido}
          className="ml-auto rounded-[11px] bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Marcar como lista
        </button>
      </div>

      {tieneContenido && (
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-text-faint">Descargar:</span>
          <a
            href={`/api/evaluaciones/${evaluacionId}/export?format=pdf`}
            className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface"
          >
            <DownloadIcon className="h-4 w-4" /> PDF
          </a>
          <a
            href={`/api/evaluaciones/${evaluacionId}/export?format=docx`}
            className="flex items-center gap-2 rounded-[11px] border border-border bg-card px-5 py-2.5 text-sm font-bold text-text hover:bg-surface"
          >
            <DownloadIcon className="h-4 w-4" /> Word
          </a>
        </div>
      )}

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

function SegmentoTexto({
  valor,
  onChange,
  onFocusInfo,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  onFocusInfo: (pos: number) => void;
  placeholder?: string;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [valor]);

  return (
    <textarea
      ref={ref}
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      onSelect={(e) => onFocusInfo(e.currentTarget.selectionStart)}
      onClick={(e) => onFocusInfo(e.currentTarget.selectionStart)}
      onKeyUp={(e) => onFocusInfo(e.currentTarget.selectionStart)}
      placeholder={placeholder}
      rows={1}
      className="w-full resize-none overflow-hidden border-none bg-transparent text-[15px] leading-relaxed text-text outline-none placeholder:text-text-faint"
    />
  );
}

function ImagenInsertada({
  evaluacionId,
  imagenId,
  onQuitar,
}: {
  evaluacionId: string;
  imagenId: string;
  onQuitar: () => void;
}) {
  return (
    <div className="group relative w-fit">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/evaluaciones/${evaluacionId}/imagenes/${imagenId}`}
        alt="Imagen insertada en la evaluación"
        className="max-w-full rounded-xl border border-border"
      />
      <button
        type="button"
        onClick={onQuitar}
        aria-label="Quitar imagen"
        className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
      >
        <XIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
