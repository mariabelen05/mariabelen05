"use client";

import { useRef, useState, useTransition } from "react";
import { subirDocumento } from "@/lib/actions/documentos-actions";
import { UploadIcon } from "@/components/icons";

export function UploadForm({ planificaciones }: { planificaciones: { id: string; titulo: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    startTransition(async () => {
      try {
        await subirDocumento(formData);
        formRef.current?.reset();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card p-5">
      <div className="flex items-center gap-2 text-sm font-bold text-text">
        <UploadIcon className="h-4 w-4 text-purple" />
        Cargar documento
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <input
          type="file"
          name="archivo"
          required
          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt"
          className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
        />
        <select
          name="clasificacion"
          className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]"
          defaultValue=""
        >
          <option value="">Clasificación (opcional)</option>
          <option value="Diseño curricular">Diseño curricular</option>
          <option value="Normativa institucional">Normativa institucional</option>
          <option value="Programa">Programa</option>
          <option value="Otro">Otro</option>
        </select>
        <select
          name="planificacionId"
          className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]"
          defaultValue=""
        >
          <option value="">Sin vincular a una planificación</option>
          {planificaciones.map((p) => (
            <option key={p.id} value={p.id}>{p.titulo}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-bold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {pending ? "Procesando…" : "Subir y procesar"}
      </button>
    </form>
  );
}
