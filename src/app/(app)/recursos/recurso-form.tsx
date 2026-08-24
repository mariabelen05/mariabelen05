"use client";

import { useRef, useState, useTransition } from "react";
import { crearRecurso } from "@/lib/actions/recursos-actions";
import { iniciarSubidaDirecta } from "@/lib/actions/upload-actions";
import { subirArchivoDirecto } from "@/lib/upload-direct";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import { ArchiveIcon } from "@/components/icons";

export function RecursoForm({ planificaciones }: { planificaciones: { id: string; titulo: string }[] }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [subiendoDirecto, setSubiendoDirecto] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (formData: FormData) => {
    setError(null);
    const archivo = formData.get("archivo");
    startTransition(async () => {
      try {
        if (archivo instanceof File && archivo.size > 0) {
          setSubiendoDirecto(true);
          const directo = await subirArchivoDirecto(archivo, "recursos", iniciarSubidaDirecta).finally(() =>
            setSubiendoDirecto(false)
          );
          if (directo && "error" in directo) {
            setError(directo.error);
            return;
          }
          if (directo) {
            formData.delete("archivo");
            formData.set("archivoStoragePath", directo.path);
            formData.set("archivoMimeType", archivo.type);
          } else if (archivo.size > MAX_UPLOAD_BYTES) {
            setError(`El archivo pesa demasiado. El tamaño máximo permitido es ${MAX_UPLOAD_LABEL}.`);
            return;
          }
        }
        const resultado = await crearRecurso(formData);
        if (resultado?.error) {
          setError(resultado.error);
          return;
        }
        formRef.current?.reset();
      } catch (e) {
        setError((e as Error).message);
      }
    });
  };

  return (
    <form
      ref={formRef}
      action={onSubmit}
      className="flex flex-col gap-3 rounded-2xl border-[1.5px] border-dashed border-[#D9D7F0] bg-card p-5"
    >
      <div className="flex items-center gap-2 text-sm font-bold text-text">
        <ArchiveIcon className="h-4 w-4 text-purple" /> Nuevo recurso
      </div>
      <input name="titulo" required placeholder="Título" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
      <div className="grid gap-3 sm:grid-cols-2">
        <input type="file" name="archivo" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] file:mr-3 file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white" />
        <input name="url" placeholder="…o pegá un enlace" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <input name="tags" placeholder="Etiquetas separadas por coma" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
        <select name="planificacionId" className="rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px]" defaultValue="">
          <option value="">Sin vincular</option>
          {planificaciones.map((p) => <option key={p.id} value={p.id}>{p.titulo}</option>)}
        </select>
      </div>
      <textarea name="descripcion" rows={2} placeholder="Descripción (opcional)" className="resize-none rounded-[10px] border border-border bg-surface px-3 py-2 text-[13px] outline-none focus:border-primary" />
      {error && <p className="text-xs text-danger">{error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-[10px] bg-primary px-5 py-2.5 text-[13px] font-bold text-white disabled:opacity-60"
      >
        {subiendoDirecto ? "Subiendo archivo…" : pending ? "Guardando…" : "Guardar recurso"}
      </button>
    </form>
  );
}
